import { Resend } from "resend";

let resend: any = null;

function getResend() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key || key === 're_123') {
      console.warn("⚠️ [EMAIL_SERVICE] Missing RESEND_API_KEY. Using mock email engine.");
      resend = {
        emails: {
          send: async (options: any) => {
            console.log("🛠️ [MOCK_EMAIL] Sending email to:", options.to);
            return { data: { id: "mock_id" }, error: null };
          }
        }
      };
    } else {
      resend = new Resend(key);
    }
  }
  return resend;
}

export class EmailService {
  /**
   * Send a verification email during registration.
   */
  static async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3200'}/auth/verify?token=${token}`;
      
      const { data, error } = await getResend().emails.send({
        from: "Costloci Governance <onboarding@costloci.com>",
        to: [email],
        subject: "Verify your Costloci Enterprise Identity",
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #020617; color: #f8fafc; border-radius: 12px;">
            <div style="margin-bottom: 32px; border-bottom: 1px solid #1e293b; padding-bottom: 24px;">
              <h1 style="color: #60a5fa; margin: 0; font-size: 24px; letter-spacing: -0.025em;">Costloci Architecture</h1>
              <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Enterprise Governance & Sovereign Intelligence</p>
            </div>
            
            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Identity Verification Required</h2>
            
            <p style="font-size: 16px; line-height: 24px; color: #94a3b8; margin-bottom: 32px;">
              A new enterprise hub has been provisioned for your organization. To activate your access to the DPO Command Center and Insurance Hub, please verify your professional identity.
            </p>
            
            <div style="margin: 40px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(to right, #2563eb, #0891b2); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                Activate Enterprise Hub
              </a>
            </div>
            
            <p style="font-size: 13px; color: #475569; margin-top: 40px;">
              Verification Link (Copy & Paste):<br/>
              <span style="color: #3b82f6; word-break: break-all;">${verificationUrl}</span>
            </p>
            
            <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 12px; color: #475569;">
              <p>© 2026 Costloci Enterprise Engine. All rights reserved.</p>
              <p>This is a security-critical automated message. If you did not authorize this provisioning, notify your InfoSec team immediately.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("[EMAIL_SERVICE] Resend error:", error);
        return false;
      }

      console.log(`[EMAIL_SERVICE] Verification email sent to ${email}. ID: ${data?.id}`);
      return true;
    } catch (error) {
      console.error("[EMAIL_SERVICE] Unexpected error:", error);
      return false;
    }
  }

  /**
   * Send a weekly DPO digest.
   */
  static async sendDPODigest(email: string, data: any): Promise<boolean> {
    // Implementation placeholder for Phase 8
    return true;
  }
}
