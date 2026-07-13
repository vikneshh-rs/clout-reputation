import { NotificationType } from '../types/enums';
import { NotificationMessage } from '../types/interfaces';
import { Review, Business } from '@prisma/client';

export class NotificationFactory {
  static createMessage(
    type: NotificationType,
    recipient: string,
    review: Review,
    business: Business
  ): NotificationMessage {
    switch (type) {
      case NotificationType.NEGATIVE_FEEDBACK:
        return {
          recipient,
          type: 'template',
          template: {
            name: 'negative_feedback_alert',
            languageCode: 'en_US',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: business.name },
                  { type: 'text', text: review.customerName || 'Anonymous Guest' },
                  { type: 'text', text: String(review.rating) },
                  { type: 'text', text: review.comment || '' }
                ]
              }
            ]
          }
        };

      case NotificationType.CALLBACK_REQUEST:
        return {
          recipient,
          type: 'template',
          template: {
            name: 'callback_request_alert',
            languageCode: 'en_US',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: review.customerName || 'Anonymous Guest' },
                  { type: 'text', text: review.customerPhone || '' }
                ]
              }
            ]
          }
        };

      case NotificationType.DAILY_SUMMARY:
        return {
          recipient,
          type: 'template',
          template: {
            name: 'daily_summary_alert',
            languageCode: 'en_US',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: business.name },
                  { type: 'text', text: '0' }
                ]
              }
            ]
          }
        };

      case NotificationType.WEEKLY_SUMMARY:
        return {
          recipient,
          type: 'template',
          template: {
            name: 'weekly_summary_alert',
            languageCode: 'en_US',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: business.name },
                  { type: 'text', text: '0' }
                ]
              }
            ]
          }
        };

      case NotificationType.MONTHLY_SUMMARY:
        return {
          recipient,
          type: 'template',
          template: {
            name: 'monthly_summary_alert',
            languageCode: 'en_US',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: business.name },
                  { type: 'text', text: '0' }
                ]
              }
            ]
          }
        };

      default:
        throw new Error(`Unsupported notification type: "${type}"`);
    }
  }
}
