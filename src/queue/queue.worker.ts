import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../email/email.service';

@Processor('emailQueue')
export class EmailWorker extends WorkerHost {
  constructor(private emailService: EmailService) {
    super();
  }

  async process(job: Job) {
    const { to, subject, template, context } = job.data;
    console.log(`📧 Sending email to ${to}...`);
    await this.emailService.sendMail(to, subject, template, context);
    console.log(`✅ Email sent to ${to}`);
  }
}
