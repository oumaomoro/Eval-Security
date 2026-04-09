import PDFDocument from 'pdfkit';
import { supabase } from './supabase.service.js';
import { EmailService } from './email.service.js';
import fs from 'fs';
import path from 'path';

/**
 * Invoice Service: Generates professional, high-fidelity PDF invoices and manages their delivery.
 */
export class InvoiceService {
  
  /**
   * Generates a PDF invoice for a user/organization.
   */
  static async generateInvoicePDF(invoiceData) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `invoice_${invoiceData.id || Date.now()}.pdf`;
    const tmpPath = path.join(process.cwd(), 'uploads', filename);
    const stream = fs.createWriteStream(tmpPath);

    return new Promise((resolve, reject) => {
      doc.pipe(stream);

      // ── DESIGN: HIGH-TECH BRANDING ──────────────────────────────────────────
      // Header Gradient/Bar
      doc.rect(0, 0, 600, 100).fill('#0f172a');
      
      doc.fillColor('#ffffff')
         .fontSize(24)
         .text('CYBER‑OPTIMIZE', 50, 35, { characterSpacing: 2 });
      
      doc.fontSize(10)
         .text('Enterprise Legal & Compliance Intelligence', 50, 65);

      doc.fillColor('#94a3b8')
         .text('Invoice No:', 400, 35)
         .fillColor('#ffffff')
         .text(invoiceData.id.substring(0, 8).toUpperCase(), 400, 50, { align: 'right' });

      // ── CONTENT ─────────────────────────────────────────────────────────────
      doc.moveDown(5);
      doc.fillColor('#1e293b').fontSize(18).text('INVOICE', 50, 130);
      
      doc.fontSize(10).fillColor('#64748b').text('Billed To:', 50, 160);
      doc.fillColor('#1e293b').fontSize(12).text(invoiceData.customer_name || 'Valued Partner', 50, 175);
      doc.fontSize(10).text(invoiceData.customer_email, 50, 190);

      // Table Header
      doc.rect(50, 230, 500, 25).fill('#f1f5f9');
      doc.fillColor('#475569').text('Description', 60, 238);
      doc.text('Amount', 450, 238, { align: 'right' });

      // Line Items
      let y = 265;
      invoiceData.items.forEach(item => {
        doc.fillColor('#1e293b').text(item.description, 60, y);
        doc.text(`$${item.amount.toFixed(2)}`, 450, y, { align: 'right' });
        y += 25;
      });

      // Total
      doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke('#e2e8f0');
      doc.fontSize(14).fillColor('#0f172a').text('Total', 60, y + 30);
      doc.text(`$${invoiceData.total.toFixed(2)} USD`, 450, y + 30, { align: 'right' });

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('Thank you for choosing Cyber‑Optimize. This is a computer-generated document.', 50, 750, { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve({ filename, path: tmpPath }));
      stream.on('error', reject);
    });
  }

  /**
   * Finalizes the invoice: Saves to DB, Uploads to Storage, and Emails the user.
   */
  static async finalizeAndSend(invoiceData, userId, organizationId) {
    try {
      // 1. Generate PDF
      const { filename, path: pdfPath } = await this.generateInvoicePDF(invoiceData);
      const fileBuffer = fs.readFileSync(pdfPath);

      // 2. Upload to Supabase Storage (Bucket: invoices)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(`${organizationId || userId}/${filename}`, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(`${organizationId || userId}/${filename}`);

      // 3. Record in Database
      const { data: invoiceRecord } = await supabase.from('invoices').insert([{
        user_id: userId,
        organization_id: organizationId,
        amount: invoiceData.total,
        status: 'paid',
        pdf_url: publicUrl,
        billing_month: new Date().toISOString().substring(0, 7)
      }]).select().single();

      // 4. Dispatch Email via Resend
      await EmailService.sendInvoiceEmail(invoiceData.customer_email, publicUrl);

      // Cleanup local file
      fs.unlinkSync(pdfPath);

      return invoiceRecord;
    } catch (err) {
      console.error('[InvoiceService] Critical Failure:', err.message);
      throw err;
    }
  }
}
