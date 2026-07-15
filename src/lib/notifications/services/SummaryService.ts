import { db } from '../../db';
import {
  WeeklySummaryTemplate,
  MonthlySummaryTemplate,
  GoogleReplyReminderTemplate
} from '../types/interfaces';

export class SummaryService {
  static async calculateWeeklySummary(businessId: string): Promise<WeeklySummaryTemplate> {
    const business = await db.business.findUnique({
      where: { id: businessId }
    });
    if (!business) {
      throw new Error(`Business with ID ${businessId} not found`);
    }

    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const reviews = await db.review.findMany({
      where: {
        businessId,
        createdAt: { gte: startDate }
      }
    });

    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    const negativeReviews = reviews.filter(r => r.rating < 4).length;
    const callbackRequests = reviews.filter(r => r.requestCallback).length;

    return {
      business,
      positiveReviews,
      negativeReviews,
      callbackRequests
    };
  }

  static async calculateMonthlySummary(businessId: string): Promise<MonthlySummaryTemplate> {
    const business = await db.business.findUnique({
      where: { id: businessId }
    });
    if (!business) {
      throw new Error(`Business with ID ${businessId} not found`);
    }

    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const reviews = await db.review.findMany({
      where: {
        businessId,
        createdAt: { gte: startDate }
      }
    });

    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    const negativeReviews = reviews.filter(r => r.rating < 4).length;
    const callbackRequests = reviews.filter(r => r.requestCallback).length;

    return {
      business,
      positiveReviews,
      negativeReviews,
      callbackRequests
    };
  }

  static async prepareGoogleReplyReminder(businessId: string): Promise<GoogleReplyReminderTemplate> {
    const business = await db.business.findUnique({
      where: { id: businessId }
    });
    if (!business) {
      throw new Error(`Business with ID ${businessId} not found`);
    }

    return {
      business
    };
  }
}
