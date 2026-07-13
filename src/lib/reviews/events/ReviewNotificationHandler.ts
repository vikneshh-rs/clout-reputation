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
      // LOG 2
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'ReviewNotificationHandler',
          message: 'Entering ReviewNotificationHandler',
          reviewId: review.id,
        })
      );

      // Load Business and settings
      const business = await db.business.findUnique({
        where: { id: review.businessId },
        include: {
          notificationSettings: true,
        },
      });

      if (!business) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'warn',
            component: 'ReviewNotificationHandler',
            message: 'Early exit: Business not found',
            reviewId: review.id,
            businessId: review.businessId,
          })
        );
        return;
      }

      // LOG 3
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'ReviewNotificationHandler',
          message: 'Business loaded',
          reviewId: review.id,
          businessId: business.id,
        })
      );

      // LOG 4
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'ReviewNotificationHandler',
          message: 'Business notification settings loaded',
          reviewId: review.id,
          businessId: business.id,
          hasSettings: !!business.notificationSettings,
        })
      );

      // LOG 5
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'ReviewNotificationHandler',
          message: `Review rating = ${review.rating}`,
          reviewId: review.id,
          rating: review.rating,
        })
      );

      // Check rating eligibility
      if (review.rating >= 4) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            component: 'ReviewNotificationHandler',
            message: 'Early exit: Rating not eligible',
            reviewId: review.id,
            rating: review.rating,
          })
        );
        return;
      }

      // Business phone check (WhatsApp recipient)
      const recipient = business.whatsappNumber;
      if (!recipient) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'warn',
            component: 'ReviewNotificationHandler',
            message: 'Early exit: WhatsApp number missing',
            reviewId: review.id,
            businessId: business.id,
          })
        );
        return;
      }

      // Evaluate Business Notification Settings
      const settings = business.notificationSettings;
      const negativeReviewEnabled = settings ? (settings.negativeReviewEnabled ?? true) : true;
      const callbackEnabled = settings ? ((settings as any).callbackEnabled ?? true) : true;

      if (!negativeReviewEnabled) {
        console.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            component: 'ReviewNotificationHandler',
            message: 'Early exit: Notification disabled',
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
            message: 'Early exit: Callback disabled',
            reviewId: review.id,
            businessId: business.id,
          })
        );
        return;
      }

      // Determine Notification Type
      const notificationType = review.requestCallback
        ? NotificationType.CALLBACK_REQUEST
        : NotificationType.NEGATIVE_FEEDBACK;

      // LOG 6
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'ReviewNotificationHandler',
          message: 'Notification type selected',
          reviewId: review.id,
          notificationType,
        })
      );

      // Construct payload
      const messagePayload = NotificationFactory.createMessage(
        notificationType,
        recipient,
        review,
        business
      );

      // LOG 7
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'ReviewNotificationHandler',
          message: 'Creating NotificationJob',
          reviewId: review.id,
        })
      );

      const job = await NotificationService.createJob({
        businessId: business.id,
        reviewId: review.id,
        channel: NotificationChannel.WHATSAPP,
        provider: NotificationProvider.META,
        notificationType,
        recipient,
        payload: messagePayload,
      });

      // LOG 8
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'ReviewNotificationHandler',
          message: 'NotificationJob created',
          reviewId: review.id,
          notificationJobId: job.id,
        })
      );

      // LOG 9
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'ReviewNotificationHandler',
          message: 'Dispatcher started',
          reviewId: review.id,
          notificationJobId: job.id,
        })
      );

      try {
        await DispatcherService.dispatch(job.id);
      } catch (err: any) {
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            component: 'ReviewNotificationHandler',
            message: 'Early exit: Exception thrown',
            jobId: job.id,
            error: err.message || String(err),
          })
        );
      }
    } catch (error: any) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          component: 'ReviewNotificationHandler',
          message: 'Early exit: Exception thrown',
          reviewId: review.id,
          businessId: review.businessId,
          error: error.message || String(error),
        })
      );
    }
  }
}
