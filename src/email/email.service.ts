import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as hbs from 'handlebars';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE || 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendMail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>
  ) {
    const template = await this.loadTemplate(templateName, context);
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: template
    });
  }

  private async loadTemplate(
    templateName: string,
    context: Record<string, any>
  ) {
    const filePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
    const templateFile = await fs.readFile(filePath, 'utf-8');
    const compiledTemplate = hbs.compile(templateFile);
    return compiledTemplate(context);
  }
}
