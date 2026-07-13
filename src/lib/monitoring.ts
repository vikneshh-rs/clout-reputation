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
    DELIVERED: 0,
    READ: 0,
    FAILED: 0,
  };

  statusCounts.forEach((group) => {
    counts[group.status] = group._count.id;
  });

  // 2. Fetch average processing time for successful dispatches
  const successfulJobs = await db.notificationJob.findMany({
    where: {
      status: NotificationStatus.SENT,
      processedAt: { not: null },
    },
    select: {
      createdAt: true,
      processedAt: true,
    },
  });

  const avgProcessingTime = successfulJobs.length > 0
    ? Math.round(
        successfulJobs.reduce((acc, job) => acc + (job.processedAt!.getTime() - job.createdAt.getTime()), 0) / successfulJobs.length
      )
    : 0;

  // 3. Fetch logs count for total attempts audit
  const totalAttempts = await db.notificationLog.count();

  // 4. Calculate success and failure rates
  const totalCompleted = counts.SENT + counts.FAILED + counts.DELIVERED + counts.READ;
  const successRate = totalCompleted > 0 ? (counts.SENT / totalCompleted) * 100 : 100;
  const failureRate = totalCompleted > 0 ? (counts.FAILED / totalCompleted) * 100 : 0;

  // 5. Calculate provider-specific metrics
  const providers = Object.values(NotificationProvider);
  const byProvider: ProviderMetrics[] = [];

  for (const provider of providers) {
    const jobs = await db.notificationJob.findMany({
      where: { provider },
      select: {
        status: true,
        createdAt: true,
        processedAt: true,
      },
    });

    const totalJobs = jobs.length;
    if (totalJobs === 0) continue;

    const sentCount = jobs.filter(j => j.status === NotificationStatus.SENT).length;
    const failedCount = jobs.filter(j => j.status === NotificationStatus.FAILED).length;
    
    const times = jobs
      .filter(j => j.processedAt !== null)
      .map(j => j.processedAt!.getTime() - j.createdAt.getTime());
    
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
    permanentlyFailedCount: 0,
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
  const jobs = await db.notificationJob.findMany({
    take: limit,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      status: true,
      notificationType: true,
      channel: true,
      provider: true,
      recipient: true,
      retryCount: true,
      createdAt: true,
      processedAt: true,
      updatedAt: true,
      error: true,
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

  return jobs.map(job => ({
    ...job,
    eventType: job.notificationType, // Backwards compatibility for UI
    processingTimeMs: job.processedAt ? (job.processedAt.getTime() - job.createdAt.getTime()) : null,
    errorMessage: job.error,
  }));
}
