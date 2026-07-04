import { logger } from "./logger";

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn("RESEND_API_KEY not configured — password reset email not sent");
    return false;
  }

  const baseUrl = process.env.FRONTEND_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.SMTP_FROM || "NetLink ISP <noreply@netlink.pk>",
        to,
        subject: "Password Reset - NetLink ISP",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Use the button below to set a new password:</p>
            <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
            <p style="margin-top: 24px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ to, status: res.status, err }, "Resend API error");
      return false;
    }

    logger.info({ to }, "Password reset email sent via Resend");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to send password reset email");
    return false;
  }
}
