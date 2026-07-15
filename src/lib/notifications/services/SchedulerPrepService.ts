import { db } from '../../db';
import { NotificationService } from './NotificationService';
import { SummaryService } from './SummaryService';
import { NotificationFactory } from '../factories/NotificationFactory';
import {
  NotificationChannel,
  NotificationProvider,
  NotificationType
} from '../types/enums';

export class SchedulerPrepService {
  static async runWeeklySummaryScheduler(): Promise<void> {
    const businesses = await db.business.findMany({
      where: {
        isActive: true,
        whatsappNumber: { not: null }
      }
    });

    for (const business of businesses) {
      if (!business.whatsappNumber) continue;

      const summaryData = await SummaryService.calculateWeeklySummary(business.id);
      const payload = NotificationFactory.createWeeklySummary(
        business.whatsappNumber,
        summaryData
      );

      await NotificationService.createJob({
        businessId: business.id,
        channel: NotificationChannel.WHATSAPP,
        provider: NotificationProvider.META,
        notificationType: NotificationType.WEEKLY_SUMMARY,
        recipient: business.whatsappNumber,
        payload
      });
    }
  }

  static async runMonthlySummaryScheduler(): Promise<void> {
    const businesses = await db.business.findMany({
      where: {
        isActive: true,
        whatsappNumber: { not: null }
      }
    });

    for (const business of businesses) {
      if (!business.whatsappNumber) continue;

      const summaryData = await SummaryService.calculateMonthlySummary(business.id);
      const payload = NotificationFactory.createMonthlySummary(
        business.whatsappNumber,
        summaryData
      );

      await NotificationService.createJob({
        businessId: business.id,
        channel: NotificationChannel.WHATSAPP,
        provider: NotificationProvider.META,
        notificationType: NotificationType.MONTHLY_SUMMARY,
        recipient: business.whatsappNumber,
        payload
      });
    }
  }

  static async runGoogleReplyReminderScheduler(): Promise<void> {
    const businesses = await db.business.findMany({
      where: {
        isActive: true,
        whatsappNumber: { not: null }
      }
    });

    for (const business of businesses) {
      if (!business.whatsappNumber) continue;

      const reminderData = await SummaryService.prepareGoogleReplyReminder(business.id);
      const payload = NotificationFactory.createGoogleReplyReminder(
        business.whatsappNumber,
        reminderData
      );

      await NotificationService.createJob({
        businessId: business.id,
        channel: NotificationChannel.WHATSAPP,
        provider: NotificationProvider.META,
        notificationType: NotificationType.DAILY_SUMMARY,
        recipient: business.whatsappNumber,
        payload
      });
    }
  }
}
