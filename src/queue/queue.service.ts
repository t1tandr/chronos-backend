import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('emailQueue') private emailQueue: Queue) {}

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>
  ) {
    await this.emailQueue.add('sendEmail', { to, subject, template, context });
  }

  async scheduleEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
    delayMs: number
  ) {
    await this.emailQueue.add(
      'sendEmail',
      { to, subject, template, context },
      { delay: delayMs }
    );
  }
}
