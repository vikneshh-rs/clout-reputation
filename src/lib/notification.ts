import { db } from './db';
import { Review, Business, NotificationStatus, NotificationProvider, NotificationType, NotificationChannel } from '@prisma/client';

/**
 * Reusable notification service to manage evaluation, idempotency,
 * and creation of notification jobs based on business preferences.
 */

/**
 * Calculates if current time is inside business quiet hours and returns the next delivery date
 * if quiet hours are active, otherwise returns null.
 */
export function getQuietHoursSchedule(settings: any): Date | null {
  if (!settings.quietHoursStart || !settings.quietHoursEnd) {
    return null;
  }

  const tz = settings.timezone || 'UTC';
  const now = new Date();
  
  // Format current date in target timezone
  let tzString;
  try {
    tzString = now.toLocaleString("en-US", { timeZone: tz });
  } catch (e) {
    tzString = now.toLocaleString("en-US", { timeZone: 'UTC' });
  }
  
  const tzDate = new Date(tzString);
  const currentHour = tzDate.getHours();
  const currentMinute = tzDate.getMinutes();
  const currentTimeVal = currentHour * 60 + currentMinute;

  const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
  const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
  const startTimeVal = startH * 60 + startM;
  const endTimeVal = endH * 60 + endM;

  let insideQuietHours = false;
  if (startTimeVal <= endTimeVal) {
    insideQuietHours = currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal;
  } else {
    // Overnight quiet hours, e.g., 22:00 to 08:00
    insideQuietHours = currentTimeVal >= startTimeVal || currentTimeVal <= endTimeVal;
  }

  if (insideQuietHours) {
    const scheduled = new Date(tzDate);
    scheduled.setHours(endH, endM, 0, 0);
    if (currentTimeVal >= startTimeVal) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    // Return the calculated scheduled time
    return scheduled;
  }

  return null;
}

/**
 * Evaluates whether a notification should be created for a review based on business preferences.
 */
export async function shouldCreateNotification(review: Review): Promise<{ shouldCreate: boolean; settings?: any; business?: any }> {
  // Currently, negative reviews (rating < 4) qualify for a notification.
  const isNegative = review.rating < 4;
  if (!isNegative) {
    return { shouldCreate: false };
  }

  // Load business along with notification settings
  const business = await db.business.findUnique({
    where: { id: review.businessId },
    include: {
      notificationSettings: true,
    },
  });

  if (!business) {
    return { shouldCreate: false };
  }

  // Fetch or default notification settings
  const settings = business.notificationSettings || {
    negativeReviewEnabled: true,
    whatsappEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'UTC',
  };

  const isEnabled = settings.negativeReviewEnabled && (settings.whatsappEnabled || settings.emailEnabled || settings.smsEnabled);
  return { shouldCreate: isEnabled, settings, business };
}

/**
 * Centralized service function to evaluate and create a pending notification job.
 * Enforces database unique constraint idempotency.
 */
export async function createNotification(review: Review) {
  try {
    const evaluation = await shouldCreateNotification(review);
    if (!evaluation.shouldCreate || !evaluation.business) {
      console.log(`[NotificationService] SKIPPED: Evaluation criteria not met for review ${review.id} (Rating: ${review.rating}).`);
      return null;
    }

    const { business, settings } = evaluation;

    // Determine channels
    const channels: { channel: NotificationChannel; provider: NotificationProvider; recipient: string }[] = [];
    
    if (settings.whatsappEnabled) {
      if (!business.whatsappNumber) {
        console.log(`[NotificationService] SKIPPED: Business "${business.name}" (ID: ${business.id}) has WhatsApp alerts enabled, but has not configured a WhatsApp number.`);
      } else {
        channels.push({
          channel: NotificationChannel.WHATSAPP,
          provider: NotificationProvider.META,
          recipient: business.whatsappNumber,
        });
      }
    }

    // Future channel slots (email / sms) can be appended here dynamically
    if (channels.length === 0) {
      console.log(`[NotificationService] SKIPPED: No active and configured channels found for business "${business.name}" (ID: ${business.id}).`);
      return null;
    }

    // Build the payload using the secure APP_URL env
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const payload = {
      businessName: business.name,
      customerName: review.customerName || 'Anonymous Guest',
      rating: review.rating,
      comment: review.comment || '',
      reviewId: review.id,
      dashboardUrl: `${appUrl}/dashboard`,
      createdAt: review.createdAt.toISOString(),
    };

    const createdJobs = [];
    for (const chan of channels) {
      try {
        const job = await db.notificationJob.create({
          data: {
            status: NotificationStatus.PENDING,
            retryCount: 0,
            channel: chan.channel,
            notificationType: NotificationType.NEGATIVE_FEEDBACK,
            provider: chan.provider,
            recipient: chan.recipient,
            payload: payload as any,
            reviewId: review.id,
            businessId: business.id,
          },
        });

        console.log(`[NotificationService] Created pending job ${job.id} (Channel: ${chan.channel}) for review ${review.id}`);
        createdJobs.push(job);
      } catch (err: any) {
        // Catch P2002 Unique constraint violation (idempotency key protection)
        if (err.code === 'P2002') {
          console.warn(`[NotificationService] Idempotency duplicate blocked. Job already exists for review ${review.id}, channel ${chan.channel}`);
        } else {
          console.error(`[NotificationService] Failed to create job:`, err);
        }
      }
    }

    return createdJobs;
  } catch (error) {
    console.error(`[NotificationService] Error creating notification for review ${review.id}:`, error);
    return null;
  }
}
