import { db } from './db';
import { NotificationStatus, NotificationProvider, NotificationType } from '@prisma/client';

/**
 * Health monitoring and analytics metrics helper service for the Notification Engine.
 */

export interface ProviderMetrics {
  provider: NotificationProvider;
  totalJobs: number;
  sentCount: number;
  failedCount: number;
  averageTimeMs: number;
}

export interface NotificationMetricsSummary {
  queueLength: number;
  pendingCount: number;
  failedCount: number;
  permanentlyFailedCount: number;
  sentCount: number;
  totalAttempts: number;
  averageProcessingTimeMs: number;
  successRate: number;
  failureRate: number;
  byProvider: ProviderMetrics[];
}

/**
 * Calculates operational metrics for the notification dashboard.
 */
export async function getNotificationMetrics(): Promise<NotificationMetricsSummary> {
  // 1. Fetch overall queue status counts
  const statusCounts = await db.notificationJob.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const counts: Record<NotificationStatus, number> = {
    PENDING: 0,
    PROCESSING: 0,
    SENT: 0,
    FAILED: 0,
    PERMANENTLY_FAILED: 0,
  };

  statusCounts.forEach((group) => {
    counts[group.status] = group._count.id;
  });

  // 2. Fetch average processing time for successful dispatches
  const timeAggregate = await db.notificationJob.aggregate({
    where: {
      status: NotificationStatus.SENT,
      processingTimeMs: { not: null },
    },
    _avg: {
      processingTimeMs: true,
    },
    _count: {
      id: true,
    },
  });

  const avgProcessingTime = timeAggregate._avg.processingTimeMs 
    ? Math.round(timeAggregate._avg.processingTimeMs) 
    : 0;

  // 3. Fetch logs count for total attempts audit
  const totalAttempts = await db.notificationLog.count();

  // 4. Calculate success and failure rates
  const totalCompleted = counts.SENT + counts.FAILED + counts.PERMANENTLY_FAILED;
  const successRate = totalCompleted > 0 ? (counts.SENT / totalCompleted) * 100 : 100;
  const failureRate = totalCompleted > 0 ? ((counts.FAILED + counts.PERMANENTLY_FAILED) / totalCompleted) * 100 : 0;

  // 5. Calculate provider-specific metrics
  const providers = Object.values(NotificationProvider);
  const byProvider: ProviderMetrics[] = [];

  for (const provider of providers) {
    const jobs = await db.notificationJob.findMany({
      where: { provider },
      select: {
        status: true,
        processingTimeMs: true,
      },
    });

    const totalJobs = jobs.length;
    if (totalJobs === 0) continue;

    const sentCount = jobs.filter(j => j.status === NotificationStatus.SENT).length;
    const failedCount = jobs.filter(j => j.status === NotificationStatus.FAILED || j.status === NotificationStatus.PERMANENTLY_FAILED).length;
    
    const times = jobs
      .map(j => j.processingTimeMs)
      .filter((t): t is number => t !== null && t !== undefined);
    
    const averageTimeMs = times.length > 0 
      ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) 
      : 0;

    byProvider.push({
      provider,
      totalJobs,
      sentCount,
      failedCount,
      averageTimeMs,
    });
  }

  return {
    queueLength: counts.PENDING + counts.PROCESSING,
    pendingCount: counts.PENDING,
    failedCount: counts.FAILED,
    permanentlyFailedCount: counts.PERMANENTLY_FAILED,
    sentCount: counts.SENT,
    totalAttempts,
    averageProcessingTimeMs: avgProcessingTime,
    successRate: parseFloat(successRate.toFixed(1)),
    failureRate: parseFloat(failureRate.toFixed(1)),
    byProvider,
  };
}

/**
 * Retrieves audit trails and delivery history for dashboard display.
 */
export async function getRecentDeliveries(limit = 15) {
  return db.notificationJob.findMany({
    take: limit,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      status: true,
      notificationType: true,
      eventType: true,
      provider: true,
      recipient: true,
      retryCount: true,
      processingTimeMs: true,
      updatedAt: true,
      errorMessage: true,
      reviewId: true,
      logs: {
        orderBy: { timestamp: 'desc' },
        select: {
          attemptNumber: true,
          previousStatus: true,
          newStatus: true,
          errorMessage: true,
          timestamp: true,
        },
      },
    },
  });
}
