import { db } from '../../db';
import {
  NotificationChannel,
  NotificationProvider,
  NotificationStatus,
  NotificationType,
} from '../types/enums';

export class NotificationService {
  private static logLifecycle(
    jobId: string,
    transition: string,
    meta?: Record<string, any>
  ) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        component: 'NotificationLifecycle',
        jobId,
        transition,
        ...meta,
      })
    );
  }

  static async createJob(data: {
    businessId: string;
    reviewId?: string | null;
    channel: NotificationChannel;
    provider: NotificationProvider;
    notificationType: NotificationType;
    recipient: string;
    payload: any;
    metadata?: any;
  }) {
    const job = await db.notificationJob.create({
      data: {
        businessId: data.businessId,
        reviewId: data.reviewId || null,
        channel: data.channel,
        provider: data.provider,
        notificationType: data.notificationType,
        recipient: data.recipient,
        payload: data.payload,
        metadata: data.metadata || null,
        status: NotificationStatus.PENDING,
        retryCount: 0,
      },
    });

    this.logLifecycle(job.id, 'CREATED', {
      channel: job.channel,
      provider: job.provider,
      type: job.notificationType,
      recipient: job.recipient,
    });

    // Create initial audit log
    await db.notificationLog.create({
      data: {
        jobId: job.id,
        provider: job.provider,
        attemptNumber: 0,
        previousStatus: NotificationStatus.PENDING,
        newStatus: NotificationStatus.PENDING,
        channel: job.channel,
        notificationType: job.notificationType,
      },
    });

    return job;
  }

  static async markProcessing(jobId: string) {
    const job = await db.notificationJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new Error(`NotificationJob with ID ${jobId} not found.`);
    }

    const previousStatus = job.status;
    const updatedJob = await db.notificationJob.update({
      where: { id: jobId },
      data: {
        status: NotificationStatus.PROCESSING,
      },
    });

    this.logLifecycle(jobId, 'PROCESSING', {
      previousStatus,
    });

    await db.notificationLog.create({
      data: {
        jobId,
        provider: job.provider,
        attemptNumber: job.retryCount,
        previousStatus,
        newStatus: NotificationStatus.PROCESSING,
        channel: job.channel,
        notificationType: job.notificationType,
      },
    });

    return updatedJob;
  }

  static async markSent(
    jobId: string,
    providerMessageId?: string,
    metadata?: any
  ) {
    const job = await db.notificationJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new Error(`NotificationJob with ID ${jobId} not found.`);
    }

    const previousStatus = job.status;
    const updatedJob = await db.notificationJob.update({
      where: { id: jobId },
      data: {
        status: NotificationStatus.SENT,
        providerMessageId: providerMessageId || null,
        processedAt: new Date(),
        metadata: metadata ? { ...(job.metadata as any || {}), ...metadata } : job.metadata,
      },
    });

    this.logLifecycle(jobId, 'SENT', {
      previousStatus,
      providerMessageId,
    });

    await db.notificationLog.create({
      data: {
        jobId,
        provider: job.provider,
        attemptNumber: job.retryCount,
        previousStatus,
        newStatus: NotificationStatus.SENT,
        providerResponse: metadata || null,
        channel: job.channel,
        notificationType: job.notificationType,
      },
    });

    return updatedJob;
  }

  static async markDelivered(jobId: string, metadata?: any) {
    const job = await db.notificationJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new Error(`NotificationJob with ID ${jobId} not found.`);
    }

    const previousStatus = job.status;
    const updatedJob = await db.notificationJob.update({
      where: { id: jobId },
      data: {
        status: NotificationStatus.DELIVERED,
        metadata: metadata ? { ...(job.metadata as any || {}), ...metadata } : job.metadata,
      },
    });

    this.logLifecycle(jobId, 'DELIVERED', {
      previousStatus,
    });

    await db.notificationLog.create({
      data: {
        jobId,
        provider: job.provider,
        attemptNumber: job.retryCount,
        previousStatus,
        newStatus: NotificationStatus.DELIVERED,
        providerResponse: metadata || null,
        channel: job.channel,
        notificationType: job.notificationType,
      },
    });

    return updatedJob;
  }

  static async markRead(jobId: string, metadata?: any) {
    const job = await db.notificationJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new Error(`NotificationJob with ID ${jobId} not found.`);
    }

    const previousStatus = job.status;
    const updatedJob = await db.notificationJob.update({
      where: { id: jobId },
      data: {
        status: NotificationStatus.READ,
        metadata: metadata ? { ...(job.metadata as any || {}), ...metadata } : job.metadata,
      },
    });

    this.logLifecycle(jobId, 'READ', {
      previousStatus,
    });

    await db.notificationLog.create({
      data: {
        jobId,
        provider: job.provider,
        attemptNumber: job.retryCount,
        previousStatus,
        newStatus: NotificationStatus.READ,
        providerResponse: metadata || null,
        channel: job.channel,
        notificationType: job.notificationType,
      },
    });

    return updatedJob;
  }

  static async markFailed(jobId: string, error: string, metadata?: any) {
    const job = await db.notificationJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new Error(`NotificationJob with ID ${jobId} not found.`);
    }

    const previousStatus = job.status;
    const updatedJob = await db.notificationJob.update({
      where: { id: jobId },
      data: {
        status: NotificationStatus.FAILED,
        error,
        processedAt: new Date(),
        metadata: metadata ? { ...(job.metadata as any || {}), ...metadata } : job.metadata,
      },
    });

    this.logLifecycle(jobId, 'FAILED', {
      previousStatus,
      error,
    });

    await db.notificationLog.create({
      data: {
        jobId,
        provider: job.provider,
        attemptNumber: job.retryCount,
        previousStatus,
        newStatus: NotificationStatus.FAILED,
        errorMessage: error,
        providerResponse: metadata || null,
        channel: job.channel,
        notificationType: job.notificationType,
      },
    });

    return updatedJob;
  }

  static async incrementRetry(jobId: string) {
    const job = await db.notificationJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new Error(`NotificationJob with ID ${jobId} not found.`);
    }

    const updatedJob = await db.notificationJob.update({
      where: { id: jobId },
      data: {
        retryCount: {
          increment: 1,
        },
      },
    });

    return updatedJob;
  }

  static async getPendingJobs(limit = 50) {
    return db.notificationJob.findMany({
      where: {
        status: NotificationStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }
}
