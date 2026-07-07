import { db } from './db';
import { Review, Business, NotificationStatus, NotificationProvider, NotificationType, NotificationEvent } from '@prisma/client';

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
  const evaluation = await shouldCreateNotification(review);
  if (!evaluation.shouldCreate || !evaluation.business) {
    return null;
  }

  const { business, settings } = evaluation;

  // Determine channels
  const channels: { type: NotificationType; provider: NotificationProvider; recipient: string }[] = [];
  
  if (settings.whatsappEnabled && business.whatsappNumber) {
    channels.push({
      type: NotificationType.WHATSAPP,
      provider: NotificationProvider.TWILIO, // twilio sandbox by default in development
      recipient: business.whatsappNumber,
    });
  }

  // Future channel slots (email / sms) can be appended here dynamically
  if (channels.length === 0) {
    console.log(`[NotificationService] No active channels or recipients set for business: ${business.id}. Skipping.`);
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

  // Check if quiet hours apply and compute schedule time
  const scheduledFor = getQuietHoursSchedule(settings);

  const createdJobs = [];
  for (const channel of channels) {
    try {
      const job = await db.notificationJob.create({
        data: {
          status: NotificationStatus.PENDING,
          retryCount: 0,
          notificationType: channel.type,
          eventType: NotificationEvent.NEGATIVE_REVIEW,
          provider: channel.provider,
          recipient: channel.recipient,
          payload: payload as any,
          reviewId: review.id,
          businessId: business.id,
          scheduledFor,
        },
      });

      console.log(`[NotificationService] Created pending job ${job.id} (Type: ${channel.type}) for review ${review.id}`);
      createdJobs.push(job);
    } catch (err: any) {
      // Catch P2002 Unique constraint violation (idempotency key protection)
      if (err.code === 'P2002') {
        console.warn(`[NotificationService] Idempotency duplicate blocked. Job already exists for review ${review.id}, type ${channel.type}`);
      } else {
        console.error(`[NotificationService] Failed to create job:`, err);
      }
    }
  }

  return createdJobs;
}
