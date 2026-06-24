import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(
        `SMTP Mailer initialized successfully. Host: ${host}:${port}`,
      );
    } else {
      this.logger.warn(
        'SMTP connection details missing (SMTP_HOST, SMTP_USER, SMTP_PASS). Falling back to Console Logger mode.',
      );
    }
  }

  async sendEmailReport(
    to: string[],
    subject: string,
    htmlContent: string,
    attachments: Array<{ filename: string; content: string | Buffer }> = [],
  ): Promise<boolean> {
    const from =
      process.env.SMTP_FROM || '"MetricFlow Reports" <noreply@metricflow.io>';

    if (!this.transporter) {
      this.logger.log('--- [MOCK EMAIL DISPATCH] ---');
      this.logger.log(`From: ${from}`);
      this.logger.log(`To: ${to.join(', ')}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(
        `Body (HTML Preview):\n${htmlContent.substring(0, 500)}...`,
      );
      if (attachments.length > 0) {
        this.logger.log(`Attachments:`);
        attachments.forEach((att) => {
          this.logger.log(
            ` - Filename: ${att.filename} (${att.content.length} chars)`,
          );
        });
      }
      this.logger.log('-----------------------------');
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: to.join(', '),
        subject,
        html: htmlContent,
        attachments,
      });

      this.logger.log(`Email successfully sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to.join(', ')}:`,
        error.stack,
      );
      throw error;
    }
  }
}
