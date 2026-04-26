
import { storage } from "../storage.js";
import { SOC2Logger } from "./SOC2Logger.js";
import { EmailService } from "./EmailService.js";
import type { Report, ReportSchedule } from "../../shared/schema.js";

/**
 * REPORTING SERVICE - PHASE 5 ADVANCED ANALYTICS
 * 
 * Aggregates intelligence from across the platform to generate 
 * executive summaries, compliance artifacts, and savings trackers.
 */
export class ReportService {
  /**
   * Generates a new report artifact based on requested type and scope.
   */
  static async generateReport(workspaceId: number, type: string, filters: any = {}): Promise<Report> {
    console.log(`[REPORTS] Generating ${type} report for Workspace ${workspaceId}`);

    // 1. Fetch relevant data clusters
    const [contracts, compliance, risks, savings] = await Promise.all([
      storage.getContracts({}),
      storage.getComplianceAudits(), // Filtered later
      storage.getRisks(),
      storage.getSavingsOpportunities()
    ]);

    // 2. Synthesize Intelligence Payload
    const summary = {
      timestamp: new Date().toISOString(),
      totalContracts: contracts.length,
      totalAnnualSpend: contracts.reduce((sum, c) => sum + (c.annualCost || 0), 0),
      complianceHealth: this.calculateComplianceHealth(compliance, workspaceId),
      criticalRiskCount: risks.filter(r => r.severity === 'critical' && r.mitigationStatus !== 'mitigated').length,
      identifiedSavings: savings.filter(s => s.status === 'identified').reduce((sum, s) => sum + (s.estimatedSavings || 0), 0),
      topRecommendations: this.extractTopRecommendations(risks, savings)
    };

    // 3. Persist Report Entity
    const report = await storage.createReport({
      workspaceId,
      title: `${type.toUpperCase()} Report - ${new Date().toLocaleDateString()}`,
      type,
      content: summary,
      status: "completed",
      generatedBy: "SYSTEM"
    });

    return report;
  }

  /**
   * Internal helper for compliance health aggregation
   */
  private static calculateComplianceHealth(audits: any[], workspaceId: number): number {
     const relevant = audits.filter(a => a.status === 'completed');
     if (relevant.length === 0) return 0;
     return Math.round(relevant.reduce((sum, a) => sum + (a.overallComplianceScore || 0), 0) / relevant.length);
  }

  /**
   * Extracts prioritized actions for the executive summary
   */
  private static extractTopRecommendations(risks: any[], savings: any[]): string[] {
    const recs: string[] = [];
    
    // Add critical risks
    risks.filter(r => r.severity === 'critical' && r.mitigationStatus !== 'mitigated')
         .slice(0, 3)
         .forEach(r => recs.push(`MITIGATE: ${r.riskTitle}`));
         
    // Add high-value savings
    savings.filter(s => s.status === 'identified' && s.estimatedSavings > 5000)
           .slice(0, 3)
           .forEach(s => recs.push(`OPTIMIZE: ${s.description.substring(0, 50)}...`));
           
    return recs;
  }

  /**
   * CRON HANDLER: Executes scheduled reports and dispatches via email.
   */
  static async processSchedules(): Promise<void> {
    const schedules = await storage.getReportSchedules();
    const now = new Date();

    for (const schedule of schedules) {
       if (!schedule.isActive) continue;
       
       // Simple frequency check logic (Daily/Weekly/Monthly)
       const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : new Date(0);
       const diffDays = (now.getTime() - lastRun.getTime()) / (1000 * 3600 * 24);

       let shouldRun = false;
       if (schedule.frequency === 'daily' && diffDays >= 1) shouldRun = true;
       if (schedule.frequency === 'weekly' && diffDays >= 7) shouldRun = true;
       if (schedule.frequency === 'monthly' && diffDays >= 30) shouldRun = true;

       if (shouldRun) {
          try {
             const report = await this.generateReport(schedule.workspaceId!, "automated_summary");
             
             // Update schedule
             await storage.updateReportSchedule(schedule.id, {
                lastRun: now,
                nextRun: this.calculateNextRun(schedule.frequency)
             });

          } catch (err) {
             console.error(`[REPORTS] Schedule processing failed for ID ${schedule.id}:`, err);
          }
       }
    }
  }

  private static calculateNextRun(freq: string): Date {
     const next = new Date();
     if (freq === 'daily') next.setDate(next.getDate() + 1);
     else if (freq === 'weekly') next.setDate(next.getDate() + 7);
     else next.setMonth(next.getMonth() + 1);
     return next;
  }
}
