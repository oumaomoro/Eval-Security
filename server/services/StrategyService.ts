import { storage } from "../storage.js";
import { jsPDF } from "jspdf";
import AdmZip from "adm-zip";
import { stringify } from "csv-stringify/sync";

export class StrategyService {
  /**
   * Generates a complete 'Strategic Pack' ZIP for a workspace.
   */
  static async generateStrategicPack(workspaceId: number): Promise<Buffer> {
    const zip = new AdmZip();

    // 1. Fetch Data
    const [contracts, insurance, risks, logs] = await Promise.all([
      storage.getContracts(),
      storage.getInsurancePolicies(workspaceId),
      storage.getRisks(), // Ideally filtered by workspace
      storage.getAuditLogs(undefined)
    ]);

    const filteredContracts = contracts.filter(c => c.workspaceId === workspaceId);
    const filteredRisks = risks.filter(r => filteredContracts.some(c => c.id === r.contractId));
    
    // 2. Generate Executive Summary PDF
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Costloci Strategic Pack", 20, 20);
    doc.setFontSize(12);
    doc.text(`Workspace ID: ${workspaceId}`, 20, 30);
    doc.text(`Generated At: ${new Date().toISOString()}`, 20, 40);
    
    doc.text("Portfolio Summary:", 20, 60);
    doc.text(`Total Contracts: ${filteredContracts.length}`, 20, 70);
    doc.text(`Insurance Policies: ${insurance.length}`, 20, 80);
    doc.text(`Identified Risks: ${filteredRisks.length}`, 20, 90);
    
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    zip.addFile("Executive_Summary.pdf", pdfBuffer);

    // 3. Contracts CSV
    const csvData = filteredContracts.map(c => ({
      vendor: c.vendorName,
      category: c.category,
      annualCost: c.annualCost,
      status: c.status,
      renewalDate: c.renewalDate
    }));
    zip.addFile("Inventory/Contracts_Inventory.csv", Buffer.from(stringify(csvData, { header: true })));

    // 4. Insurance CSV
    const insuranceCsv = insurance.map(p => ({
      carrier: p.carrierName,
      policy: p.policyNumber,
      aggLimit: p.coverageLimits?.annualAggregate,
      claimRisk: p.claimRiskScore
    }));
    zip.addFile("Inventory/Cyber_Insurance_Summary.csv", Buffer.from(stringify(insuranceCsv, { header: true })));

    // 5. Risks CSV
    const risksCsv = filteredRisks.map(r => ({
      title: r.riskTitle,
      category: r.riskCategory,
      severity: r.severity,
      score: r.riskScore
    }));
    zip.addFile("Evidence/Risk_Register.csv", Buffer.from(stringify(risksCsv, { header: true })));

    // 6. JSON Export (Full AI Details)
    const jsonData = JSON.stringify({
      contracts: filteredContracts,
      insurance,
      risks: filteredRisks,
      auditLogs: logs.slice(0, 100)
    }, null, 2);
    zip.addFile("Data/Full_Compliance_Evidence.json", Buffer.from(jsonData));

    return zip.toBuffer();
  }

  /**
   * Generates, uploads, and returns a signed URL for the Strategic Pack.
   */
  static async generateAndUpload(workspaceId: number, clientId: string): Promise<string> {
    const buffer = await this.generateStrategicPack(workspaceId);
    
    const { adminClient: supabaseAdmin } = await import("./supabase.js");
    const timestamp = Date.now();
    const filePath = `strategic-packs/${clientId}/StrategicPack_${timestamp}.zip`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("contracts")
      .upload(filePath, buffer, {
        contentType: "application/zip",
        upsert: true
      });

    if (uploadError) throw new Error("Strategic Pack upload failed: " + uploadError.message);

    const { data } = supabaseAdmin.storage.from("contracts").getPublicUrl(filePath);
    return data.publicUrl;
  }
}
