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
    const workspaceId = req.workspaceId;
    
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
      workspaceId: req.workspaceId
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
 * Helper function for async PDF generation
 */
async function generateReportAsync(reportId: number, workspaceId: number, req: any) {
  try {
    await storage.updateReport(reportId, { status: "processing" });

    // 1. Synthesize Data via ReportService
    const summaryReport = await ReportService.generateReport(workspaceId, req.body.type || "Executive");
    const summary = summaryReport.content as any;

    // 2. Generate PDF Artifact
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(`Costloci: ${req.body.type || 'Executive'} Intelligence Report`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated for: ${req.user.firstName} ${req.user.lastName}`, 20, 35);
    doc.text(`Regulatory Context: ${req.body.regulatoryBody || 'N/A'}`, 20, 42);
    doc.text(`Report ID: CR-${reportId}`, 20, 49);
    
    doc.line(20, 55, 190, 55);
    
    doc.setFontSize(14);
    doc.text("Portfolio Intelligence Snapshot", 20, 65);
    doc.setFontSize(11);
    doc.text(`- Active Contracts Audited: ${summary.totalContracts}`, 25, 75);
    doc.text(`- Compliance Health Index: ${summary.complianceHealth}%`, 25, 82);
    doc.text(`- Identified Critical Vulnerabilities: ${summary.criticalRiskCount}`, 25, 89);
    doc.text(`- Total Cost Optimization Identified: $${summary.identifiedSavings.toLocaleString()}`, 25, 96);

    doc.setFontSize(14);
    doc.text("Top Remediation Priorities", 20, 110);
    doc.setFontSize(10);
    summary.topRecommendations.forEach((rec: string, index: number) => {
       doc.text(`${index + 1}. ${rec}`, 25, 120 + (index * 7));
    });

    // 3. Finalize and Update
    const pdfData = doc.output('datauristring');
    
    await storage.updateReport(reportId, {
      status: "completed",
      fileUrl: pdfData,
      content: summary, // Update with synthesized data
      completedAt: new Date()
    });

    await SOC2Logger.logEvent(req, {
      action: "REPORT_GENERATED",
      userId: req.user.id,
      resourceType: "Report",
      resourceId: String(reportId),
      details: `Hardened PDF report generated for ${req.body.type}`
    });

  } catch (error) {
    console.error("[ASYNC REPORT GEN ERROR]", error);
    await storage.updateReport(reportId, { status: "failed" });
  }
}

export default router;
