import { Router } from "express";
import { storage } from "../storage.js";
import { Resend } from "resend";
import { SOC2Logger } from "../services/SOC2Logger.js";

const router = Router();

// Ensure Resend falls back to missing if not provided so it doesn't crash on init
const resend = new Resend(process.env.RESEND_API_KEY || "missing");

/**
 * Enterprise Report Scheduler Cron
 * Protected by CRON_SECRET for secure Vercel/System invocation.
 */
router.post("/process-schedules", async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET || "dev_cron_secret";
    
    // Verify Authorized Invocation
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CRON] Unauthorized attempt to trigger schedule processing.");
      return res.status(401).json({ message: "Unauthorized Trigger" });
    }

    console.log("[CRON] Initiating Report Scheduler Pipeline...");
    
    // Fetch active schedules
    const now = new Date();
    const schedules = await storage.getReportSchedules();
    const dueSchedules = schedules.filter(s => s.isActive && (!s.nextRun || new Date(s.nextRun) <= now));

    if (dueSchedules.length === 0) {
       console.log("[CRON] No schedules are due for processing.");
       return res.status(200).json({ processed: 0, message: "No schedules due." });
    }

    console.log(`[CRON] Found ${dueSchedules.length} due schedules. Processing...`);

    let processedCount = 0;
    
    // Process each schedule sequentially to avoid overwhelming AI/DB
    for (const schedule of dueSchedules) {
      try {
        console.log(`[CRON] Executing Schedule ${schedule.id} (${schedule.title})`);
        
        // 1. Generate Report
        const reportTitle = `${schedule.title} - ${now.toISOString().split('T')[0]}`;
        const newReport = await storage.createReport({
           workspaceId: schedule.workspaceId,
           title: reportTitle,
           type: schedule.type,
           regulatoryBody: schedule.regulatoryBodies?.[0] || 'General',
           status: "completed",
           format: "pdf"
        });

        // Log to SOC2
        await SOC2Logger.logEvent(req, {
           action: "REPORT_SCHEDULED_GENERATION",
           userId: "SYSTEM_CRON",
           resourceType: "Report",
           resourceId: String(newReport.id),
           details: `Automated report generated via Schedule ${schedule.id}`
        });

        // 2. Dispatch Email
        // Get Workspace Admins to notify ensuring workspaceId isn't null
        const admins = schedule.workspaceId 
           ? (await storage.getWorkspaceMembers(schedule.workspaceId)).filter(m => m.workspaceRole === "admin" || m.workspaceRole === "owner")
           : [];
        
        if (admins.length > 0 && process.env.RESEND_API_KEY) {
           await resend.emails.send({
              from: "Costloci Intelligence <intelligence@costloci.com>",
              to: admins.map(a => a.email),
              subject: `[Costloci] Scheduled Intelligence: ${reportTitle}`,
              html: `
                <h2>Costloci Strategic Report Automated Dispatch</h2>
                <p>Your scheduled report <strong>${schedule.title}</strong> has finished generating.</p>
                <p><strong>Configuration:</strong> ${schedule.frequency.toUpperCase()} - ${schedule.regulatoryBodies?.join(', ') || 'Global'}</p>
                <p>Login to your Sovereign Dashboard to download the complete PDF evidence pack.</p>
              `
           });
        }

        // 3. Increment Next Run Date
        const nextRun = new Date(now);
        if (schedule.frequency === 'daily') nextRun.setDate(nextRun.getDate() + 1);
        else if (schedule.frequency === 'weekly') nextRun.setDate(nextRun.getDate() + 7);
        else if (schedule.frequency === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1);
        else if (schedule.frequency === 'quarterly') nextRun.setMonth(nextRun.getMonth() + 3);

        await storage.updateReportSchedule(schedule.id, {
           lastRun: now,
           nextRun: nextRun
        });

        processedCount++;
      } catch (err: any) {
        console.error(`[CRON] Schedule ${schedule.id} Failed:`, err);
        // Do not crash the entire loop, let other schedules process
      }
    }

    res.json({
       processed: processedCount,
       totalSelected: dueSchedules.length,
       message: "Schedule sweep completed successfully."
    });

  } catch (error: any) {
    console.error("[CRON] Fatal Schedule Pipeline Error:", error);
    res.status(500).json({ message: "Fatal error in processing pipeline." });
  }
});

export default router;
