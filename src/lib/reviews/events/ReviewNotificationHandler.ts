import { db } from '../../db';
import { Review } from '@prisma/client';
import { NotificationService } from '../../notifications/services/NotificationService';
import { DispatcherService } from '../../notifications/services/DispatcherService';
import { NotificationFactory } from '../../notifications/factories/NotificationFactory';
import {
  NotificationChannel,
  NotificationProvider,
  NotificationType,
} from '../../notifications/types/enums';

export class ReviewNotificationHandler {
  static async handleReviewSubmitted(review: Review): Promise<void> {
    try {
      const startTime = Date.now();

      // 1. Positive Reviews Rule: Rating >= 4: do not create notification jobs
      if (review.rating >= 4) {
        return;
      }

      // 2. Look up Business along with Notification Settings
      const business = await db.business.findUnique({
        where: { id: review.businessId },
        include: {
          notificationSettings: true,
        },
      });

      if (!business) {
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            component: 'ReviewNotificationHandler',
            message: 'Business lookup failed. Business not found.',
            reviewId: review.id,
            businessId: review.businessId,
          })
        );
        return;
      }

      // Business phone check (WhatsApp recipient)
      const recipient = business.whatsappNumber;
      if (!recipient) {
        console.warn(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'warn',
            component: 'ReviewNotificationHandler',
            message: 'Skipping notification: Business has no WhatsApp number configured.',
            reviewId: review.id,
            businessId: business.id,
          })
        );
        return;
      }

      // 3. Evaluate Business Notification Settings with Safe Defaults
      const settings = business.notificationSettings;
      const negativeReviewEnabled = settings ? (settings.negativeReviewEnabled ?? true) : true;
      const callbackEnabled = settings ? ((settings as any).callbackEnabled ?? true) : true;

      if (!negativeReviewEnabled) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            component: 'ReviewNotificationHandler',
            message: 'Skipping notification: negativeReviewEnabled is disabled.',
            reviewId: review.id,
            businessId: business.id,
          })
        );
        return;
      }

      if (review.requestCallback && !callbackEnabled) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            component: 'ReviewNotificationHandler',
            message: 'Skipping notification: callbackEnabled is disabled.',
            reviewId: review.id,
            businessId: business.id,
          })
        );
        return;
      }

      // 4. Determine Notification Type
      const notificationType = review.requestCallback
        ? NotificationType.CALLBACK_REQUEST
        : NotificationType.NEGATIVE_FEEDBACK;

      // 5. Construct generic payload using NotificationFactory
      const messagePayload = NotificationFactory.createMessage(
        notificationType,
        recipient,
        review,
        business
      );

      // 6. Create Notification Job using NotificationService
      const job = await NotificationService.createJob({
        businessId: business.id,
        reviewId: review.id,
        channel: NotificationChannel.WHATSAPP,
        provider: NotificationProvider.META,
        notificationType,
        recipient,
        payload: messagePayload,
      });

      // 7. Structured log of successful job creation
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'ReviewNotificationHandler',
          message: 'Successfully created notification job for review.',
          reviewId: review.id,
          businessId: business.id,
          notificationType,
          notificationJobId: job.id,
          elapsedMs: Date.now() - startTime,
        })
      );

      // 8. Trigger dispatcher automatically in the background
      DispatcherService.dispatch(job.id).catch((err) => {
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            component: 'ReviewNotificationHandler',
            message: 'Failed to trigger dispatcher automatically.',
            jobId: job.id,
            error: err.message || String(err),
          })
        );
      });
    } catch (error: any) {
      // 8. Graceful error isolation
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          component: 'ReviewNotificationHandler',
          message: 'Error in ReviewNotificationHandler.',
          reviewId: review.id,
          businessId: review.businessId,
          error: error.message || String(error),
        })
      );
    }
  }
}
