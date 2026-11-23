
import { jsPDF } from "jspdf";
import fs from "fs";

async function test() {
  const doc = new jsPDF();
  doc.text("Cybersecurity Contract E2E Test", 10, 10);
  doc.text("This is a simulated contract for automated verification.", 10, 20);
  doc.text("Clause 1: Data residency must be in Kenya (KDPA 2019 compliance).", 10, 30);
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync('test_contract_real.pdf', buffer);
  console.log(" PDF generated successfully.");
}

test().catch(console.error);
