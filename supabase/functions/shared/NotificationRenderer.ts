import { NotificationMessage } from "./providers/interface.ts";

export class NotificationRenderer {
  static render(job: { payload: any }): NotificationMessage {
    if (!job || !job.payload) {
      throw new Error('Invalid NotificationJob: payload is missing.');
    }

    const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;

    return {
      recipient: payload.recipient || '',
      type: payload.type || 'template',
      text: payload.text,
      template: payload.template,
    };
  }
}
