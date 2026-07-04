import { logger } from "./logger";

export async function sendSms(phone: string, message: string): Promise<void> {
  logger.info({ phone, message: message.substring(0, 50) }, "[MOCK SMS] Would send SMS");
}

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  logger.info({ phone, message: message.substring(0, 50) }, "[MOCK WhatsApp] Would send WhatsApp message");
}

export async function sendOtpNotification(phone: string, otp: string): Promise<void> {
  const message = `Your NetLink ISP verification code is: ${otp}. Valid for 10 minutes.`;
  process.stdout.write(`\n[DEV MODE] OTP generated for ${phone}: ${otp}\n\n`);
  await sendSms(phone, message);
}

export async function sendPaymentOverdueNotification(phone: string, name: string, packageName: string): Promise<void> {
  const message = `Dear ${name}, your NetLink ISP subscription (${packageName}) is overdue. Please make payment to restore service.`;
  await sendSms(phone, message);
  await sendWhatsApp(phone, message);
}

export async function sendExpiryReminderNotification(phone: string, name: string, packageName: string, daysLeft: number): Promise<void> {
  const message = `Dear ${name}, your NetLink ISP subscription (${packageName}) expires in ${daysLeft} day(s). Please renew to avoid interruption.`;
  await sendSms(phone, message);
  await sendWhatsApp(phone, message);
}
