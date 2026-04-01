import { Resend } from 'resend';
import { supabase } from './supabase.service.js';

export const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

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

  async queueEmail(to, subject, html) {
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
    
    // Automatically trigger queue processing asynchronously for seamless delivery
    this.processQueue().catch(e => console.error('[EmailService] Auto-process failed:', e));
    
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
         if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_mock_key') {
            // Mock processing
            console.log(`[EmailService] Mock dispatch for queued email ${email.id}`);
            await supabase.from('email_queue').update({ status: 'sent' }).eq('id', email.id);
         } else {
            // Real dispatch
            await resend.emails.send({
               from: 'Costloci <alerts@costloci.com>',
               to: email.to,
               subject: email.subject,
               html: email.html
            });
            await supabase.from('email_queue').update({ status: 'sent' }).eq('id', email.id);
         }
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
