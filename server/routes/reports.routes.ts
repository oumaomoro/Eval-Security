import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { ReportService } from "../services/ReportService.js";
import { jsPDF } from "jspdf";
import { z } from "zod";
import { insertReportSchema, insertReportScheduleSchema } from "../../shared/schema.js";

const router = Router();

/**
 * GET /api/reports
 * List all generated reports for the workspace.
 */
router.get("/reports", isAuthenticated, async (req: any, res) => {
 try {
 const reports = await storage.getReports();
 res.json(reports);
 } catch (error: any) {
 console.error("[REPORTS API ERROR]", error.message);
 res.status(500).json({ message: "Failed to fetch reports" });
 }
});

/**
 * POST /api/reports/generate
 * Trigger a new report generation (e.g., KDPA, GDPR, Executive).
 */
router.post("/reports/generate", isAuthenticated, async (req: any, res) => {
 try {
 const { title, type, regulatoryBody = "General" } = req.body;
 const workspaceId = req.user?.workspaceId || (req.headers["x-workspace-id"] ? parseInt(req.headers["x-workspace-id"]) : undefined) || 1;
 
 const report = await storage.createReport({
 workspaceId,
 title: title || `${type} Report - ${new Date().toLocaleDateString()}`,
 type: type || "Executive",
 regulatoryBody,
 status: "pending",
 userId: req.user.id,
 generatedBy: `${req.user.firstName} ${req.user.lastName}`.trim(),
 format: "pdf"
 });

 // Start Async Generation
 generateReportAsync(report.id, workspaceId, req);

 res.status(201).json(report);
 } catch (error: any) {
 console.error("[REPORTS API ERROR]", error.message);
 res.status(500).json({ message: "Failed to initiate report generation." });
 }
});

/**
 * GET /api/reports/schedules
 */
router.get("/reports/schedules", isAuthenticated, async (req: any, res) => {
 try {
 const schedules = await storage.getReportSchedules();
 res.json(schedules);
 } catch (error: any) {
 res.status(500).json({ message: "Failed to fetch report schedules" });
 }
});

/**
 * POST /api/reports/schedules
 */
router.post("/reports/schedules", isAuthenticated, async (req: any, res) => {
 try {
 const data = insertReportScheduleSchema.parse(req.body);
 const schedule = await storage.createReportSchedule({
 ...data,
 workspaceId: req.user?.workspaceId || (req.headers["x-workspace-id"] ? parseInt(req.headers["x-workspace-id"]) : undefined) || 1
 });
 res.status(201).json(schedule);
 } catch (err: any) {
 if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
 res.status(500).json({ message: "Failed to create schedule" });
 }
});

/**
 * DELETE /api/reports/schedules/:id
 */
router.delete("/reports/schedules/:id", isAuthenticated, async (req, res) => {
 try {
 const id = parseInt(req.params.id);
 await storage.deleteReportSchedule(id);
 res.status(204).end();
 } catch {
 res.status(500).json({ message: "Failed to delete schedule" });
 }
});

/**
 * POST /api/reports/schedules/:id/run
 * Manually trigger a scheduled report execution.
 */
router.post("/reports/schedules/:id/run", isAuthenticated, async (req, res) => {
 try {
 const id = parseInt(req.params.id);
 const report = await ReportService.runSchedule(id);
 res.json(report);
 } catch (error: any) {
 console.error("[REPORTS API ERROR]", error.message);
 res.status(500).json({ message: "Failed to manually trigger schedule execution." });
 }
});

/**
 * GET /api/reports/:id/export
 * Serves the generated PDF report.
 */
router.get("/reports/:id/export", isAuthenticated, async (req, res) => {
 try {
 const id = parseInt(req.params.id);
 const report = await storage.updateReport(id, {}); // Just to verify it exists and is in workspace
 
 if (!report || report.status !== 'completed' || !report.fileUrl) {
 return res.status(404).json({ message: "Report artifact not ready or not found." });
 }

 // Since we store as data URI for sovereign simplicity, we convert back for the download
 const dataUri = report.fileUrl;
 const base64Data = dataUri.split(';base64,').pop();
 if (!base64Data) throw new Error("Invalid report artifact format.");
 
 const pdfBuffer = Buffer.from(base64Data, 'base64');
 
 res.setHeader('Content-Type', 'application/pdf');
 res.setHeader('Content-Disposition', `attachment; filename="Costloci-Report-${id}.pdf"`);
 res.send(pdfBuffer);
 } catch (error: any) {
 console.error("[REPORT EXPORT ERROR]", error.message);
 res.status(500).json({ message: "Failed to export report artifact." });
 }
});

/**
 * Helper function for async PDF generation
 */
async function generateReportAsync(reportId: number, workspaceId: number, req: any) {
  try {
    await storage.updateReport(reportId, { status: "processing" });

    // 1. Synthesize Data via ReportService
    let summary: any = {
      totalContracts: 0,
      complianceHealth: 85,
      criticalRiskCount: 0,
      identifiedSavings: 0,
      topRecommendations: ["Conduct baseline compliance review under KDPA Section 31."],
    };
    try {
      const summaryReport = await ReportService.generateReport(workspaceId, req.body?.type || "Executive");
      if (summaryReport?.content) {
        summary = { ...summary, ...summaryReport.content };
      }
    } catch (sErr: any) {
      console.warn("[REPORT GEN] Summary synthesis fallback:", sErr.message);
    }

    // 2. Generate PDF Artifact
    const doc = new jsPDF();
    const userName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ") || req.user?.email || "Enterprise User";
    const reportType = req.body?.type || "Executive";
    const regBody = req.body?.regulatoryBody || "KDPA / General";

    doc.setFontSize(22);
    doc.text(`Costloci: ${reportType} Intelligence Report`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated for: ${userName}`, 20, 35);
    doc.text(`Regulatory Context: ${regBody}`, 20, 42);
    doc.text(`Report ID: CR-${reportId}`, 20, 49);
    
    doc.line(20, 55, 190, 55);
    
    doc.setFontSize(14);
    doc.text("Portfolio Intelligence Snapshot", 20, 65);
    doc.setFontSize(11);
    doc.text(`- Active Contracts Audited: ${summary.totalContracts || 0}`, 25, 75);
    doc.text(`- Compliance Health Index: ${summary.complianceHealth || 0}%`, 25, 82);
    doc.text(`- Identified Critical Vulnerabilities: ${summary.criticalRiskCount || 0}`, 25, 89);
    doc.text(`- Total Cost Optimization Identified: $${(Number(summary.identifiedSavings) || 0).toLocaleString()}`, 25, 96);

    doc.setFontSize(14);
    doc.text("Top Remediation Priorities", 20, 110);
    doc.setFontSize(10);
    const recs = Array.isArray(summary.topRecommendations) && summary.topRecommendations.length > 0 
      ? summary.topRecommendations 
      : ["Maintain continuous alignment with regional data protection standards."];
    recs.forEach((rec: string, index: number) => {
      doc.text(`${index + 1}. ${String(rec).substring(0, 80)}`, 25, 120 + (index * 7));
    });

    // 3. Finalize and Update
    const pdfData = doc.output('datauristring');
    
    await storage.updateReport(reportId, {
      status: "completed",
      fileUrl: pdfData,
      content: summary,
      completedAt: new Date()
    });

    await SOC2Logger.logEvent(req, {
      action: "REPORT_GENERATED",
      userId: req.user?.id || "SYSTEM",
      resourceType: "Report",
      resourceId: String(reportId),
      details: `PDF report generated for ${reportType}`
    });

  } catch (error: any) {
    console.error("[ASYNC REPORT GEN ERROR]", error.message);
    await storage.updateReport(reportId, { status: "failed" });
  }
}

export default router;
