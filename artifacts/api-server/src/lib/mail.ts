import nodemailer from "nodemailer";
import { logger } from "./logger";

export async function sendPasswordResetEmail(to: string, resetToken: string, frontendUrl?: string): Promise<boolean> {
  const baseUrl = frontendUrl || process.env.FRONTEND_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  // Try Resend first if API key is configured
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
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
      if (res.ok) {
        logger.info({ to }, "Password reset email sent via Resend");
        return true;
      }
      const errText = await res.text();
      logger.error({ to, status: res.status, err: errText }, "Resend API error");
    } catch (err) {
      logger.error({ err, to }, "Resend API failed, falling back to SMTP");
    }
  }

  // Fallback to SMTP
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "NetLink ISP <noreply@netlink.pk>";

  if (!user || !pass) {
    logger.warn("SMTP_USER / SMTP_PASS not configured and Resend unavailable — email not sent");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
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
    });

    logger.info({ to }, "Password reset email sent via SMTP");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to send password reset email");
    return false;
  }
}
