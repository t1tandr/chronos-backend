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
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Changed from EMAIL_PASS to EMAIL_PASSWORD to match .env
      },
      debug: true // Add debug option to see detailed logs
    });

    // Verify connection configuration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter error:', error);
      } else {
        // console.log('Email server is ready to send messages');
      }
    });
  }

  async sendMail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>
  ) {
    try {
      const template = await this.loadTemplate(templateName, context);
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html: template
      });
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private async loadTemplate(
    templateName: string,
    context: Record<string, any>
  ) {
    try {
      const templatesDir = path.join(__dirname, 'templates');
      const filePath = path.join(templatesDir, `${templateName}.hbs`);
      console.log('Loading template from:', filePath);

      const templateFile = await fs.readFile(filePath, 'utf-8');
      const compiledTemplate = hbs.compile(templateFile);
      return compiledTemplate(context);
    } catch (error) {
      console.error('Error loading template:', error);
      throw error;
    }
  }
}
