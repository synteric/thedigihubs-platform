import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const DEFAULT_SUPPORT_EMAIL = 'support@thedigihubs.com';

type SupportNotification = {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

type EmailNotification = SupportNotification & {
  to: string | string[];
};

type DeliveryResult = {
  sent: boolean;
  to: string | string[];
  provider?: 'resend' | 'smtp';
  id?: string;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: Transporter | null | undefined;

  constructor(private readonly config: ConfigService) {}

  supportEmail() {
    return this.config.get<string>('SUPPORT_EMAIL')?.trim()
      || this.config.get<string>('CONTACT_EMAIL')?.trim()
      || this.config.get<string>('PLATFORM_ADMIN_EMAIL')?.trim()
      || DEFAULT_SUPPORT_EMAIL;
  }

  async sendToSupport(input: SupportNotification) {
    return this.sendEmail({
      ...input,
      to: this.supportEmail(),
    });
  }

  async sendEmail(input: EmailNotification): Promise<DeliveryResult> {
    if (this.deliveryDisabled()) {
      this.logger.warn(`Mail delivery is disabled. Notification was not sent to ${this.formatRecipients(input.to)}.`);
      return { sent: false, to: input.to };
    }

    const provider = this.config.get<string>('EMAIL_PROVIDER')?.trim().toLowerCase();
    const resendApiKey = this.config.get<string>('RESEND_API_KEY')?.trim();

    if (provider === 'resend') {
      if (!resendApiKey) {
        this.logger.error('EMAIL_PROVIDER is set to resend but RESEND_API_KEY is missing.');
        return { sent: false, to: input.to, provider: 'resend' };
      }
      return this.sendViaResend(input, resendApiKey);
    }

    if (resendApiKey && provider !== 'smtp') {
      return this.sendViaResend(input, resendApiKey);
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`Mail is not configured. Notification was recorded in app data but not sent to ${this.formatRecipients(input.to)}.`);
      return { sent: false, to: input.to };
    }

    return this.sendViaSmtp(input, transporter);
  }

  private async sendViaSmtp(input: EmailNotification, transporter: Transporter): Promise<DeliveryResult> {
    try {
      await transporter.sendMail({
        from: this.mailFrom(),
        to: input.to,
        replyTo: input.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html || this.textToHtml(input.text),
      });
      return { sent: true, to: input.to, provider: 'smtp' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown mail error';
      this.logger.error(`Notification could not be sent to ${this.formatRecipients(input.to)}: ${message}`);
      return { sent: false, to: input.to, provider: 'smtp' };
    }
  }

  private async sendViaResend(input: EmailNotification, apiKey: string): Promise<DeliveryResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.mailFrom(),
          to: Array.isArray(input.to) ? input.to : [input.to],
          reply_to: input.replyTo,
          subject: input.subject,
          text: input.text,
          html: input.html || this.textToHtml(input.text),
        }),
      });

      const payload = await response.json().catch(() => undefined) as { id?: string; message?: string; name?: string } | undefined;
      if (!response.ok) {
        this.logger.error(`Resend notification failed for ${this.formatRecipients(input.to)}: ${response.status} ${payload?.message || payload?.name || response.statusText}`);
        return { sent: false, to: input.to, provider: 'resend' };
      }

      return { sent: true, to: input.to, provider: 'resend', id: payload?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Resend error';
      this.logger.error(`Resend notification could not be sent to ${this.formatRecipients(input.to)}: ${message}`);
      return { sent: false, to: input.to, provider: 'resend' };
    }
  }

  private mailFrom() {
    return this.config.get<string>('MAIL_FROM')?.trim() || `TheDigiHubs <${DEFAULT_SUPPORT_EMAIL}>`;
  }

  private deliveryDisabled() {
    const value = this.config.get<string>('NOTIFICATION_DELIVERY_ENABLED')?.trim().toLowerCase();
    return value === 'false' || value === '0' || value === 'off';
  }

  private getTransporter() {
    if (this.transporter !== undefined) return this.transporter;

    const host = this.config.get<string>('MAIL_HOST')?.trim();
    if (!host) {
      this.transporter = null;
      return this.transporter;
    }

    const port = Number(this.config.get<string>('MAIL_PORT') || 587);
    const user = this.config.get<string>('MAIL_USER')?.trim();
    const pass = this.config.get<string>('MAIL_PASSWORD')?.trim();
    const secure = this.config.get<string>('MAIL_SECURE') === 'true' || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }

  private formatRecipients(to: string | string[]) {
    return Array.isArray(to) ? to.join(', ') : to;
  }

  private textToHtml(text: string) {
    return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0b1744;">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
