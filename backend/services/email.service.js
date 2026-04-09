import { Resend } from 'resend';
import { supabase } from './supabase.service.js';

const RESEND_KEY = process.env.RESEND_API_KEY;
export const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

if (!resend) {
  console.warn('⚠️  [EmailService] RESEND_API_KEY is missing. Emails will be queued but NOT dispatched.');
}

export const EmailService = {
  async sendRenewalAlert(email, contractDetails) {
    const subject = `Upcoming Renewal: ${contractDetails.vendor_name}`;
    const html = `
      <h2>Contract Renewal Notice</h2>
      <p>Your contract with <strong>${contractDetails.vendor_name}</strong> is scheduled to renew on <strong>${contractDetails.renewal_date}</strong>.</p>
      <p>Total Annual Value: $${contractDetails.annual_cost?.toLocaleString(undefined) || 'N/A'}</p>
      <p>Review the compliance parameters strictly in your Costloci Dashboard.</p>
    `;

    return this.queueEmail(email, subject, html);
  },
  async sendWelcomeEmail(email, fullName) {
    const { WELCOME_EMAIL_TEMPLATE } = await import('./email.templates.js');
    return this.queueEmail(email, 'Welcome to Costloci! 🚀', WELCOME_EMAIL_TEMPLATE(fullName));
  },

  async sendPasswordResetEmail(email, resetLink) {
    const { PASSWORD_RESET_TEMPLATE } = await import('./email.templates.js');
    return this.queueEmail(email, 'Reset Your Costloci Password 🔐', PASSWORD_RESET_TEMPLATE(resetLink));
  },

  async sendAutoProvisionWelcome(email) {
    const html = `
      <h2>Welcome to Costloci! 🚀</h2>
      <p>We received your contract via email and have automatically provisioned a secure account for you.</p>
      <p>Your contract is actively being analyzed. Once complete, you will receive an alert.</p>
      <p><strong>Next Steps:</strong> You will receive a separate password-reset email shortly. Click the link in that email to set a secure password and claim your Dashboard.</p>
      <p>Alternatively, you can access your account anytime using the 'Forgot Password' flow at <a href="https://costloci.com/login">costloci.com/login</a>.</p>
    `;
    return this.queueEmail(email, 'Welcome to Costloci! Your account is ready.', html);
  },

  async sendOnboardingDay3(email, fullName) {
    const { DAY_3_ONBOARDING_TEMPLATE } = await import('./email.templates.js');
    return this.queueEmail(email, 'How to Analyze Your First Contract 🎥', DAY_3_ONBOARDING_TEMPLATE(fullName));
  },

  async sendOnboardingDay7(email, fullName) {
    const { DAY_7_DEMO_TEMPLATE } = await import('./email.templates.js');
    return this.queueEmail(email, 'Join Our Exclusive Live Demo 🛠️', DAY_7_DEMO_TEMPLATE(fullName));
  },

  async sendOnboardingDay12(email, fullName) {
    const { DAY_12_TRIAL_TEMPLATE } = await import('./email.templates.js');
    return this.queueEmail(email, 'Final Call: Your Trial is Ending Soon ⏳', DAY_12_TRIAL_TEMPLATE(fullName));
  },

  async sendActivationNudge(email, fullName) {
    const { DAY_3_ACTIVATION_TEMPLATE } = await import('./email.templates.js');
    return this.queueEmail(email, 'Unlock Your hidden savings 💸', DAY_3_ACTIVATION_TEMPLATE(fullName));
  },

  async sendDpoComplianceAlert(email, dpoName, contractVendor, riskLevel, actionRequired) {
    const { DPO_ALERTS_TEMPLATE } = await import('./email.templates.js');
    const subject = `⚠️ Compliance Alert: ${contractVendor} (${riskLevel})`;
    return this.queueEmail(email, subject, DPO_ALERTS_TEMPLATE(dpoName, contractVendor, riskLevel, actionRequired));
  },

  async sendInvoiceEmail(email, pdfUrl) {
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <div style="background:#0f172a;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;font-size:20px;margin:0">COSTLOCI</h1>
          <p style="color:#94a3b8;margin:4px 0 0">Enterprise Legal Intelligence</p>
        </div>
        <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
          <h2 style="color:#1e293b">Your Invoice is Ready</h2>
          <p style="color:#475569">A professional invoice has been generated for your recent transaction.</p>
          <a href="${pdfUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">Download Invoice (PDF)</a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">If you have any questions, contact finance@Costloci.com</p>
        </div>
      </div>
    `;
    return this.queueEmail(email, 'Your Costloci Invoice', html);
  },

  async sendOverageBillingAlert(email, fullName, amountUSD, contractCount) {
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <div style="background:#0f172a;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;font-size:20px;margin:0">COSTLOCI</h1>
          <p style="color:#94a3b8;margin:4px 0 0">Billing Notice</p>
        </div>
        <div style="padding:24px;background:#fff9f0;border:1px solid #fed7aa;border-radius:0 0 12px 12px">
          <h2 style="color:#9a3412">AI Usage Overage Invoice</h2>
          <p>Hi ${fullName || 'there'},</p>
          <p>Your organization has been charged <strong>$${amountUSD.toFixed(2)}</strong> for <strong>${contractCount}</strong> contract analysis overages in the previous billing cycle.</p>
          <p>A PayPal invoice has been sent to this email. Please settle it at your earliest convenience to maintain uninterrupted access.</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">Questions? Contact finance@Costloci.com</p>
        </div>
      </div>
    `;
    return this.queueEmail(email, `💳 Costloci Overage Invoice: $${amountUSD.toFixed(2)}`, html);
  },

  async queueEmail(to, subject, html, autoProcess = true) {
    console.log(`[EmailService] Queueing email to ${to}: ${subject}`);
    const { data, error } = await supabase
      .from('email_queue')
      .insert({ "to": to, subject, html, status: 'pending', next_attempt: new Date().toISOString() })
      .select('id')
      .single();

    if (error) {
      console.error('[EmailService] Failed to queue email:', error);
      throw error;
    }

    // Automatically trigger queue processing for seamless delivery
    if (autoProcess) {
      // In serverless (Vercel), we MUST await the process to ensure the Lambda doesn't exit prematurely.
      await this.processQueue().catch(e => console.error('[EmailService] Auto-process failed:', e));
    }

    return data;
  },

  async processQueue() {
    console.log('[EmailService] Processing queued emails...');
    const { data: pending, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_attempt', new Date().toISOString())
      .limit(10); // Batch size to respect free tiers

    if (error) {
      console.error('[EmailService] Queue fetch error:', error);
      return { success: false, error: error.message };
    }

    if (!pending || pending.length === 0) {
      return { success: true, processed: 0 };
    }

    let processedCount = 0;
    for (const email of pending) {
      try {
        // Always dispatch via real Resend — no mock key bypass
          await resend.emails.send({
            from: 'Costloci <alerts@Costloci.com>',
            to: email.to,
            subject: email.subject,
            html: email.html
          });
          await supabase.from('email_queue').update({ status: 'sent' }).eq('id', email.id);
        processedCount++;
      } catch (dispatchErr) {
        console.error(`[EmailService] Dispatch failed for ${email.id}:`, dispatchErr.message);
        const attempts = (email.attempts || 0) + 1;
        let status = 'pending';
        let next_attempt = new Date(Date.now() + Math.pow(2, attempts) * 60000).toISOString(); // Exponential backoff in minutes

        if (attempts >= 5) { // Max 5 retries
          status = 'failed';
        }

        await supabase.from('email_queue').update({ attempts, status, next_attempt }).eq('id', email.id);
      }
    }

    return { success: true, processed: processedCount };
  }
};
