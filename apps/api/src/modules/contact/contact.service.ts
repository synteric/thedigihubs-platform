import { BadRequestException, Injectable } from '@nestjs/common';
import { SupportTicketPriority } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';

type ContactRequestInput = {
  name: string;
  email: string;
  organization?: string;
  phone?: string;
  subject?: string;
  message: string;
};

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async create(input: ContactRequestInput) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const subject = input.subject?.trim() || 'Public contact request';
    const message = input.message.trim();
    const organization = this.clean(input.organization);
    const phone = this.clean(input.phone);

    if (!name || !email || !message) {
      throw new BadRequestException('Name, email, and message are required');
    }

    const description = [
      message,
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      organization ? `Organization: ${organization}` : null,
      phone ? `Phone: ${phone}` : null,
    ].filter(Boolean).join('\n');

    const ticket = await this.prisma.supportTicket.create({
      data: {
        subject,
        description,
        category: 'Public Contact',
        priority: SupportTicketPriority.NORMAL,
        requesterName: name,
        requesterEmail: email,
      },
    });

    void this.notifications.sendToSupport({
      subject: `TheDigiHubs contact: ${subject}`,
      replyTo: email,
      text: [
        `A new contact request was submitted to TheDigiHubs.`,
        '',
        `Support ticket: ${ticket.reference}`,
        `Name: ${name}`,
        `Email: ${email}`,
        organization ? `Organization: ${organization}` : null,
        phone ? `Phone: ${phone}` : null,
        '',
        `Message:`,
        message,
      ].filter(Boolean).join('\n'),
    });

    void this.notifications.sendEmail({
      to: email,
      subject: `We received your TheDigiHubs message (${ticket.reference})`,
      text: [
        `Hello ${name},`,
        '',
        `Thank you for contacting TheDigiHubs. We received your message and our support team will review it.`,
        '',
        `Reference: ${ticket.reference}`,
        `Subject: ${subject}`,
        '',
        `You can also reach us directly at ${this.notifications.supportEmail()}.`,
        '',
        'TheDigiHubs Support',
      ].join('\n'),
    });

    return {
      id: ticket.id,
      reference: ticket.reference,
      supportEmail: this.notifications.supportEmail(),
    };
  }

  private clean(value?: string) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}
