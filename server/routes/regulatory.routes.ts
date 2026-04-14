import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { AutonomicRescanner } from "../services/Rescanner";

const router = Router();

/**
 * GET /api/regulatory-alerts/live
 * Returns the real-time jurisdictional sync status for the dashboard.
 */
router.get("/api/regulatory-alerts/live", isAuthenticated, async (_req, res) => {
  try {
    const alerts = await storage.getRegulatoryAlerts();
    
    // 1. Calculate Overall Health
    // Ratio of completed 'scanned' alerts vs 'pending'
    const totalAlerts = alerts.length;
    const scannedAlerts = alerts.filter((a: any) => a.status === 'scanned').length;
    const overallHealth = totalAlerts > 0 ? Math.round((scannedAlerts / totalAlerts) * 100) : 100;

    // 2. Map Active Regions based on detected standards
    // Mapping rules for Phase 9
    const regionMap: Record<string, string> = {
      "KDPA": "Kenya/East Africa",
      "GDPR": "European Union",
      "POPIA": "South Africa",
      "CBK": "Financial Systems (Kenya)",
      "NRB": "Nairobi Metropolitan"
    };

    const standards = Array.from(new Set(alerts.map((a: any) => a.standard)));
    const activeRegions = standards.map((std: any) => ({
      region: regionMap[std] || `${std} Jurisdiction`,
      status: alerts.find((a: any) => a.standard === std && a.status === 'pending_rescan') ? "syncing" : "synced",
      drift: alerts.find((a: any) => a.standard === std && a.status === 'pending_rescan') ? 15 : 0
    })).slice(0, 3); // Top 3 results for UI parity

    // 3. Extract Recent Shifts (the actual audit trail)
    const recentShifts = alerts
      .filter((a: any) => a.status === 'scanned')
      .slice(0, 2)
      .map((a: any) => ({
        time: new Date(a.publishedDate || "").toLocaleTimeString(),
        law: a.alertTitle,
        resolution: "Autonomic Sweep Balanced"
      }));

    res.json({
      overallHealth,
      activeRegions: activeRegions.length > 0 ? activeRegions : [{ region: "Global Base", status: "synced", drift: 0 }],
      recentShifts
    });
  } catch (error: any) {
    console.error("[REGULATORY API ERROR]", error);
    res.status(500).json({ message: "Failed to fetch live jurisdictional telemetry." });
  }
});

/**
 * POST /api/regulatory-alerts/trigger-rescan
 * Triggers an autonomic background rescan for a specific standard.
 */
router.post("/api/regulatory-alerts/trigger-rescan", isAuthenticated, async (req: any, res: any) => {
  try {
    const { standard, alertTitle } = req.body;
    if (!standard) return res.status(400).json({ message: "standard is required" });
    
    // Fire and forget the background job
    AutonomicRescanner.triggerRescanJob(standard, alertTitle || `Manual Rescan for ${standard}`).catch(err => {
      console.error("[RESCAN TRIGGER ERROR]", err);
    });

    res.json({ message: "Autonomic rescan sequence initiated." });
  } catch (error: any) {
    console.error("[RESCAN API ERROR]", error);
    res.status(500).json({ message: "Failed to initiate rescan." });
  }
});

export default router;
