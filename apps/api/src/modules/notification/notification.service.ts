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
    const to = this.supportEmail();
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`Mail is not configured. Support notification queued only in app data for ${to}.`);
      return { sent: false, to };
    }

    try {
      await transporter.sendMail({
        from: this.mailFrom(),
        to,
        replyTo: input.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { sent: true, to };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown mail error';
      this.logger.error(`Support notification could not be sent to ${to}: ${message}`);
      return { sent: false, to };
    }
  }

  private mailFrom() {
    return this.config.get<string>('MAIL_FROM')?.trim() || `TheDigiHubs <${DEFAULT_SUPPORT_EMAIL}>`;
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
}
