
import { jsPDF } from "jspdf";
import fs from "fs";

async function generateFiles() {
  const doc1 = new jsPDF();
  doc1.text("Master Services Agreement - Vendor A", 10, 10);
  doc1.text("This agreement governs the provision of cybersecurity services.", 10, 20);
  doc1.text("Annual Cost: $12,000", 10, 30);
  doc1.text("Data Residency: All data shall be stored within Kenya.", 10, 40);
  fs.writeFileSync('contract_a.pdf', Buffer.from(doc1.output('arraybuffer')));

  const doc2 = new jsPDF();
  doc2.text("Data Processing Agreement - Vendor B", 10, 10);
  doc2.text("This DPA ensures compliance with KDPA 2019.", 10, 20);
  doc2.text("Data Breach Notification: Within 72 hours of discovery.", 10, 30);
  fs.writeFileSync('contract_b.pdf', Buffer.from(doc2.output('arraybuffer')));

  console.log("✅ Real PDFs generated: contract_a.pdf, contract_b.pdf");
}

generateFiles().catch(console.error);
