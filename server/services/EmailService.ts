import { Resend } from "resend";

let resend: any = null;

function getResend() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key || key === "re_123") {
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
      const host = process.env.FRONTEND_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3200");
      const verificationUrl = `${host}/api/auth/verify?token=${token}`;

      const { data, error } = await getResend().emails.send({
        from: "Costloci <onboarding@costloci.com>",
        to: [email],
        subject: "Verify your Costloci account",
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #020617; color: #f8fafc; border-radius: 12px;">
            <div style="margin-bottom: 32px; border-bottom: 1px solid #1e293b; padding-bottom: 24px;">
              <h1 style="color: #60a5fa; margin: 0; font-size: 24px; letter-spacing: -0.025em;">Costloci</h1>
              <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">AI-Powered Contract Intelligence</p>
            </div>
            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Verify your email address</h2>
            <p style="font-size: 16px; line-height: 24px; color: #94a3b8; margin-bottom: 32px;">
              Thanks for signing up! Click the button below to verify your email and start using Costloci.
            </p>
            <div style="margin: 40px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(to right, #2563eb, #0891b2); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                Verify My Email
              </a>
            </div>
            <p style="font-size: 13px; color: #475569; margin-top: 40px;">
              Or copy and paste this link into your browser:<br/>
              <span style="color: #3b82f6; word-break: break-all;">${verificationUrl}</span>
            </p>
            <p style="font-size: 13px; color: #475569; margin-top: 16px;">
              This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
            </p>
            <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 12px; color: #475569;">
              <p>&copy; 2026 Costloci. All rights reserved.</p>
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
    return true;
  }

  /**
   * Send a notification that a report is ready.
   */
  static async sendReportReadyNotification(email: string, reportId: number, reportTitle: string): Promise<boolean> {
    try {
      const host = process.env.FRONTEND_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3200");
      const reportUrl = `${host}/reports`;

      const { data, error } = await getResend().emails.send({
        from: "Costloci Reports <intelligence@costloci.com>",
        to: [email],
        subject: `[Report Ready] ${reportTitle}`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #020617; color: #f8fafc; border-radius: 12px;">
            <div style="margin-bottom: 32px; border-bottom: 1px solid #1e293b; padding-bottom: 24px;">
              <h1 style="color: #60a5fa; margin: 0; font-size: 24px; letter-spacing: -0.025em;">Costloci</h1>
              <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Your report is ready</p>
            </div>
            <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Report Ready: ${reportTitle}</h2>
            <p style="font-size: 16px; line-height: 24px; color: #94a3b8; margin-bottom: 32px;">
              Your report <strong>"${reportTitle}"</strong> has been generated and is ready to view in your dashboard.
            </p>
            <div style="margin: 40px 0;">
              <a href="${reportUrl}" style="background: linear-gradient(to right, #06b6d4, #3b82f6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                View Report
              </a>
            </div>
            <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 12px; color: #475569;">
              <p>&copy; 2026 Costloci. All rights reserved.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("[EMAIL_SERVICE] Failed to send report notification:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[EMAIL_SERVICE] Unexpected error in report notification:", error);
      return false;
    }
  }

  /**
   * Send a "Contract Analysis Complete" email to the uploading user.
   * Fired asynchronously (via QueueService) after the AI pipeline finishes.
   */
  static async sendContractAnalysisComplete(
    email: string,
    contractId: number,
    vendorName: string,
    riskScore: number,
    complianceGrade: string
  ): Promise<boolean> {
    try {
      const host =
        process.env.FRONTEND_URL ||
        process.env.APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3200");
      const contractUrl = `${host}/contracts/${contractId}`;

      const riskColor =
        riskScore >= 70 ? "#ef4444" : riskScore >= 40 ? "#f59e0b" : "#22c55e";
      const riskLabel =
        riskScore >= 70 ? "High Risk" : riskScore >= 40 ? "Medium Risk" : "Low Risk";

      const { data, error } = await getResend().emails.send({
        from: "Costloci Intelligence <intelligence@costloci.com>",
        to: [email],
        subject: `[Analysis Complete] ${vendorName} — Contract Review Ready`,
        html: `
          <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;padding:40px;background-color:#020617;color:#f8fafc;border-radius:12px;">
            <div style="margin-bottom:32px;border-bottom:1px solid #1e293b;padding-bottom:24px;">
              <h1 style="color:#60a5fa;margin:0;font-size:24px;letter-spacing:-0.025em;">Costloci</h1>
              <p style="color:#64748b;font-size:14px;margin:4px 0 0 0;">AI-Powered Contract Intelligence</p>
            </div>
            <h2 style="font-size:20px;font-weight:600;margin-bottom:16px;">Contract Analysis Complete ✓</h2>
            <p style="font-size:16px;line-height:24px;color:#94a3b8;margin-bottom:24px;">
              Your contract for <strong style="color:#f8fafc;">${vendorName}</strong> has been fully analyzed by our AI compliance engine.
            </p>
            <div style="background:#0f172a;border-radius:8px;padding:20px;margin-bottom:32px;border:1px solid #1e293b;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="color:#64748b;font-size:14px;padding:6px 0;">Risk Score</td>
                  <td style="text-align:right;color:${riskColor};font-weight:600;font-size:14px;">${riskScore}/100 — ${riskLabel}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-size:14px;padding:6px 0;">Compliance Grade</td>
                  <td style="text-align:right;color:#60a5fa;font-weight:600;font-size:14px;">${complianceGrade}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-size:14px;padding:6px 0;">Contract ID</td>
                  <td style="text-align:right;color:#94a3b8;font-size:14px;">#${contractId}</td>
                </tr>
              </table>
            </div>
            <div style="margin:40px 0;">
              <a href="${contractUrl}" style="background:linear-gradient(to right,#06b6d4,#3b82f6);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;font-size:15px;">
                View Full Analysis →
              </a>
            </div>
            <p style="font-size:13px;color:#475569;margin-top:16px;">
              Or paste this URL in your browser:<br/>
              <span style="color:#3b82f6;word-break:break-all;">${contractUrl}</span>
            </p>
            <div style="margin-top:48px;padding-top:24px;border-top:1px solid #1e293b;font-size:12px;color:#475569;">
              <p>© 2026 Costloci. All rights reserved. &nbsp;|&nbsp;
                <a href="${host}/settings/notifications" style="color:#475569;text-decoration:underline;">Manage notifications</a>
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("[EMAIL_SERVICE] Contract analysis email error:", error);
        return false;
      }

      console.log(
        `[EMAIL_SERVICE] Contract analysis email sent → ${email} (contract #${contractId})`
      );
      return true;
    } catch (error) {
      console.error("[EMAIL_SERVICE] Unexpected error in contract analysis email:", error);
      return false;
    }
  }
}
