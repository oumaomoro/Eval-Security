import { storage } from "../server/storage";
import { storageContext } from "../server/services/storageContext";

async function checkState() {
  console.log("🔍 Database Sync Verification...");

  // Mock workspace context for retrieval
  storageContext.run({ workspaceId: 1 }, async () => {
    try {
      const contracts = await storage.getContracts();
      const insurance = await storage.getInsurancePolicies();
      const risks = await storage.getRisks();
      const usage = await storage.getUsageEvents(1);

      console.log(`✅ Contracts Found: ${contracts.length}`);
      contracts.forEach(c => console.log(`   - [${c.id}] ${c.vendorName} (${c.status})`));

      console.log(`✅ Insurance Policies: ${insurance.length}`);
      insurance.forEach(p => console.log(`   - [${p.id}] ${p.carrierName} - Score: ${p.claimRiskScore}`));

      console.log(`✅ Risks Identified: ${risks.length}`);
      console.log(`✅ Usage Events: ${usage.length}`);

      if (contracts.length > 0 && insurance.length > 0) {
        console.log("\n🚀 DB SYNC STATUS: VERIFIED.");
      } else {
        console.warn("\n⚠️ DB SYNC STATUS: DEGRADED (Check Table Provisioning).");
      }
    } catch (err: any) {
      console.error("❌ Sync Check Failed:", err.message);
    }
  });
}

checkState();
