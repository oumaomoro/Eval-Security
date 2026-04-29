import { jsPDF } from "jspdf";

export class InvoiceService {
  /**
   * Generates a transaction receipt/invoice PDF for marketplace purchases.
   */
  static async generateMarketplaceInvoice(purchase: any, listing: any): Promise<Buffer> {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Blue-500
    doc.text("Costloci", 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text("Sovereign Governance Marketplace", 20, 32);
    
    // Metadata
    doc.line(20, 40, 190, 40);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice ID: ${purchase.transactionId}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 57);
    
    // Purchase Details
    doc.text("Description", 20, 75);
    doc.text("Amount", 160, 75);
    doc.line(20, 78, 190, 78);
    
    doc.setFontSize(10);
    doc.text(`Clause Template: ${listing.title}`, 20, 88);
    doc.text(`${purchase.amount.toFixed(2)} USD`, 160, 88);
    
    // Summary
    doc.line(20, 110, 190, 110);
    doc.setFontSize(12);
    doc.text("TOTAL", 140, 120);
    doc.text(`${purchase.amount.toFixed(2)} USD`, 160, 120);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("This is an automated receipt for your digital asset purchase.", 20, 270);
    doc.text("Costloci - Optimizing Cyber Costs with Intelligence.", 20, 275);

    return Buffer.from(doc.output("arraybuffer"));
  }

  /**
   * Generates a Monthly Usage Report invoice for enterprise consumption.
   */
  static async generateUsageReport(workspace: any, metrics: any): Promise<Buffer> {
    const doc = new jsPDF();
    
    // Brand Identity
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("COSTLOCI", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("ENTERPRISE USAGE ANALYTICS", 20, 28);
    
    // Entity Info
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFontSize(14);
    doc.text(`Account: ${workspace.name}`, 20, 55);
    doc.setFontSize(10);
    doc.text(`Billing Cycle: ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, 20, 62);
    
    // Metrics Grid
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(20, 75, 170, 60, 'F');
    
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text("OPERATIONAL METRICS", 25, 85);
    doc.line(25, 87, 185, 87);
    
    doc.text(`Contracts Analyzed:`, 25, 97);
    doc.text(`${metrics.contractsCount || 0}`, 160, 97);
    
    doc.text(`Intelligence Queries:`, 25, 107);
    doc.text(`${metrics.aiQueries || 0}`, 160, 107);
    
    doc.text(`Remediation Events:`, 25, 117);
    doc.text(`${metrics.remediationEvents || 0}`, 160, 117);
    
    doc.text(`Active Users:`, 25, 127);
    doc.text(`${metrics.activeUsers || 1}`, 160, 127);
    
    // Savings Summary
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text("Estimated Cost Optimization Value:", 20, 155);
    doc.setFontSize(16);
    doc.text(`$${(metrics.estimatedSavings || 0).toFixed(2)} USD`, 20, 165);
    
    // Footer Legal
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Verified by Costloci Sovereign Autonomics Engine.", 20, 280);
    doc.text(`Timestamp: ${new Date().toISOString()}`, 20, 285);

    return Buffer.from(doc.output("arraybuffer"));
  }
}
