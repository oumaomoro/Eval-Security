import { storage } from "../storage.js";
import { InfrastructureIntelligence } from "./InfrastructureIntelligence.js";
import { SOC2Logger } from "./SOC2Logger.js";

/**
 * Cloud Sync Service
 * 
 * Orchestrates the synchronization of cloud infrastructure assets
 * and reconciliation with the platform's inventory.
 */
export class CloudSyncService {
  /**
   * Synchronizes a cloud account by discovering assets and updating the inventory.
   */
  static async syncAccount(cloudAccountId: number) {
    const account = await (storage as any).getCloudAccount(cloudAccountId);
    if (!account) throw new Error("Cloud account not found");

    const workspaceId = account.workspaceId;

    try {
      // Log initiation
      await SOC2Logger.logEvent(null, {
        userId: "SYSTEM",
        action: "INFRASTRUCTURE_SYNC_START",
        resourceId: `account-${cloudAccountId}`,
        details: `Sync started for ${account.provider} in ${account.region}`,
        metadata: { provider: account.provider, region: account.region, severity: "info" }
      });

      // Discovery Phase
      const discoveryResult = await InfrastructureIntelligence.discoverAssets(cloudAccountId, workspaceId);

      // Log completion
      await SOC2Logger.logEvent(null, {
        userId: "SYSTEM",
        action: "INFRASTRUCTURE_SYNC_COMPLETE",
        resourceId: `account-${cloudAccountId}`,
        details: `Sync completed: Found ${discoveryResult.count} assets.`,
        metadata: { assetsFound: discoveryResult.count, severity: "info" }
      });

      // Simulate asset ingestion into the risk engine
      await storage.createInfrastructureLog({
        status: "success",
        component: "CloudSyncService",
        event: "Account Synchronized",
        actionTaken: `Successfully ingested ${discoveryResult.count} assets for ${account.provider} account.`
      });

      return discoveryResult;
    } catch (error: any) {
      console.error(`Sync failed for account ${cloudAccountId}:`, error);
      
      await storage.createInfrastructureLog({
        status: "error",
        component: "CloudSyncService",
        event: "Account Sync Failed",
        actionTaken: `Error: ${error.message}`
      });

      throw error;
    }
  }

  /**
   * Triggers a global sync for all active cloud accounts.
   * Executed periodically via cron job.
   */
  static async syncAllAccounts() {
    console.log("[CloudSyncService] Global sync initiated...");
    try {
      const accounts = await (storage as any).getCloudAccounts();
      if (!accounts || accounts.length === 0) {
        console.log("[CloudSyncService] No active cloud accounts found.");
        return;
      }

      console.log(`[CloudSyncService] Found ${accounts.length} active accounts. Beginning synchronization...`);

      // Using Promise.allSettled to ensure one failure doesn't stop the entire sync process
      const syncPromises = accounts.map((account: any) => this.syncAccount(account.id));
      const results = await Promise.allSettled(syncPromises);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`[CloudSyncService] Global sync complete. Success: ${successful}, Failed: ${failed}`);
    } catch (error: any) {
      console.error("[CloudSyncService] Global sync encountered a critical error:", error.message);
    }
  }
}
