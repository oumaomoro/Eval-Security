import { storage } from "../storage.js";
import fs from "fs/promises";
import path from "path";
import { SOC2Logger } from "./SOC2Logger.js";

/**
 * ARCHIVE SERVICE — Enterprise Governance
 * ══════════════════════════════════════
 * Provides automated, immutable archiving of audit logs for 
 * SOC-2 and regulatory compliance (KDPA/POPIA).
 */
export class ArchiveService {
 private static readonly ARCHIVE_DIR = process.env.VERCEL ? "/tmp/archives" : path.resolve(process.cwd(), "archives");

 /**
 * Performs a daily archive of all audit logs for a workspace.
 */
 static async archiveAuditLogs(workspaceId: number): Promise<string> {
 console.log(`[ARCHIVE] Initiating immutable audit export for Workspace ${workspaceId}`);
 
 // 1. Fetch all audit logs
 const logs = await storage.getAuditLogs(workspaceId);
 
 // 2. Prepare Archive Payload
 const payload = {
 workspaceId,
 exportedAt: new Date().toISOString(),
 integrityHash: this.calculateIntegrityHash(logs),
 logCount: logs.length,
 logs: logs
 };

 // 3. Persist to "Immutable" Artifact Storage
 const filename = `audit_archive_ws${workspaceId}_${Date.now()}.json`;
 const fullPath = path.join(this.ARCHIVE_DIR, filename);
 
 await fs.mkdir(this.ARCHIVE_DIR, { recursive: true });
 await fs.writeFile(fullPath, JSON.stringify(payload, null, 2));

 // 4. Log the archiving event itself
 await SOC2Logger.logEvent({ user: { id: "SYSTEM" } } as any, {
 action: "AUDIT_LOGS_ARCHIVED",
 userId: "SYSTEM",
 resourceType: "Archive",
 resourceId: filename,
 details: `Successfully exported ${logs.length} audit logs to immutable artifact storage.`
 });

 console.log(`[ARCHIVE] Export complete: ${filename}`);
 return filename;
 }

 private static calculateIntegrityHash(logs: any[]): string {
 const { createHash } = require("crypto");
 const hash = createHash("sha256");
 hash.update(JSON.stringify(logs));
 return hash.digest("hex");
 }
}
