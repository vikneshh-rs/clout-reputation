import { NotificationType } from '../types/enums';
import {
  NotificationMessage,
  NegativeFeedbackTemplate,
  CallbackRequestTemplate,
  WeeklySummaryTemplate,
  MonthlySummaryTemplate,
  GoogleReplyReminderTemplate
} from '../types/interfaces';
import { Review, Business } from '@prisma/client';
import { NotificationTemplates } from '../constants/templates';

export class NotificationFactory {
  static createMessage(
    type: NotificationType,
    recipient: string,
    review: Review,
    business: Business
  ): NotificationMessage {
    switch (type) {
      case NotificationType.NEGATIVE_FEEDBACK:
        return this.createNegativeFeedbackAlert(recipient, { review, business });

      case NotificationType.CALLBACK_REQUEST:
        return this.createCallbackRequestAlert(recipient, { review, business });

      case NotificationType.DAILY_SUMMARY:
        // Fallback for daily summary to google reply reminder
        return this.createGoogleReplyReminder(recipient, { business });

      case NotificationType.WEEKLY_SUMMARY:
        return this.createWeeklySummary(recipient, {
          business,
          positiveReviews: 0,
          negativeReviews: 0,
          callbackRequests: 0
        });

      case NotificationType.MONTHLY_SUMMARY:
        return this.createMonthlySummary(recipient, {
          business,
          positiveReviews: 0,
          negativeReviews: 0,
          callbackRequests: 0
        });

      default:
        throw new Error(`Unsupported notification type: "${type}"`);
    }
  }

  static createNegativeFeedbackAlert(
    recipient: string,
    data: NegativeFeedbackTemplate
  ): NotificationMessage {
    return {
      recipient,
      type: 'template',
      template: {
        name: NotificationTemplates.NEGATIVE_FEEDBACK,
        languageCode: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: data.business.name },
              { type: 'text', text: String(data.review.rating) },
              { type: 'text', text: data.review.comment || 'No comment provided' }
            ]
          }
        ]
      }
    };
  }

  static createCallbackRequestAlert(
    recipient: string,
    data: CallbackRequestTemplate
  ): NotificationMessage {
    return {
      recipient,
      type: 'template',
      template: {
        name: NotificationTemplates.CALLBACK_REQUEST,
        languageCode: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: data.business.name },
              { type: 'text', text: data.review.customerName || 'Anonymous Guest' },
              { type: 'text', text: data.review.customerPhone || 'No phone provided' },
              { type: 'text', text: String(data.review.rating) },
              { type: 'text', text: data.review.comment || 'No comment provided' }
            ]
          }
        ]
      }
    };
  }

  static createWeeklySummary(
    recipient: string,
    data: WeeklySummaryTemplate
  ): NotificationMessage {
    return {
      recipient,
      type: 'template',
      template: {
        name: NotificationTemplates.WEEKLY_SUMMARY,
        languageCode: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: data.business.name },
              { type: 'text', text: String(data.positiveReviews) },
              { type: 'text', text: String(data.negativeReviews) },
              { type: 'text', text: String(data.callbackRequests) }
            ]
          }
        ]
      }
    };
  }

  static createMonthlySummary(
    recipient: string,
    data: MonthlySummaryTemplate
  ): NotificationMessage {
    return {
      recipient,
      type: 'template',
      template: {
        name: NotificationTemplates.MONTHLY_SUMMARY,
        languageCode: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: data.business.name },
              { type: 'text', text: String(data.positiveReviews) },
              { type: 'text', text: String(data.negativeReviews) },
              { type: 'text', text: String(data.callbackRequests) }
            ]
          }
        ]
      }
    };
  }

  static createGoogleReplyReminder(
    recipient: string,
    data: GoogleReplyReminderTemplate
  ): NotificationMessage {
    return {
      recipient,
      type: 'template',
      template: {
        name: NotificationTemplates.GOOGLE_REPLY_REMINDER,
        languageCode: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: data.business.name }
            ]
          }
        ]
      }
    };
  }
}
