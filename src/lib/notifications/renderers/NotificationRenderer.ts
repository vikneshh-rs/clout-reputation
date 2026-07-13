import { NotificationMessage } from '../types/interfaces';

export class NotificationRenderer {
  static render(job: { payload: any }): NotificationMessage {
    if (!job || !job.payload) {
      throw new Error('Invalid NotificationJob: payload is missing.');
    }

    const payload = job.payload as any;

    return {
      recipient: payload.recipient || '',
      type: payload.type || 'template',
      text: payload.text,
      template: payload.template,
    };
  }
}
