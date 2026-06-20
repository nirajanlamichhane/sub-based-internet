import { Injectable, Logger } from "@nestjs/common";
import { env } from "../../config/env";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    const subject = "Reset your password";
    const body = `Reset your password: ${resetUrl}\n\nLink expires in 1 hour.`;

    if (!env.smtpHost) {
      this.logger.warn(`[dev] Password reset for ${email}: ${resetUrl}`);
      return;
    }

    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    });

    await transport.sendMail({
      from: env.smtpFrom,
      to: email,
      subject,
      text: body,
    });
  }

  async sendSmsOtp(phone: string, code: string): Promise<void> {
    if (!env.smsProviderUrl) {
      this.logger.warn(`[dev] SMS OTP for ${phone}: ${code}`);
      return;
    }

    await fetch(env.smsProviderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.smsApiKey ? { Authorization: `Bearer ${env.smsApiKey}` } : {}),
      },
      body: JSON.stringify({ phone, message: `Your Wi-Fi code: ${code}` }),
    });
  }
}
