import test from 'node:test';
import assert from 'node:assert';
import { db } from '../../db';
import {
  NotificationChannel,
  NotificationProvider,
  NotificationStatus,
  NotificationType,
} from '../types/enums';
import { NotificationFactory } from '../factories/NotificationFactory';
import { NotificationProviderFactory } from '../factories/NotificationProviderFactory';
import { NotificationService } from '../services/NotificationService';

test('Notification Unit & Integration Tests', async (t) => {
  // Fetch any existing business for foreign key constraints
  const business = await db.business.findFirst();
  if (!business) {
    throw new Error('No business found in the database. Please seed the database first.');
  }

  await t.test('NotificationProviderFactory returns MetaProvider', () => {
    const provider = NotificationProviderFactory.getProvider(NotificationProvider.META);
    assert.ok(provider);
    assert.strictEqual(typeof provider.sendText, 'function');
  });

  await t.test('NotificationProviderFactory throws for unsupported provider', () => {
    assert.throws(() => {
      NotificationProviderFactory.getProvider('UNSUPPORTED' as any);
    });
  });

  await t.test('NotificationFactory creates template objects cleanly', () => {
    const mockReview = {
      id: 'rev-1',
      rating: 2,
      comment: 'Too salty',
      customerName: 'Alice',
      customerPhone: '1234567890',
      requestCallback: false,
      callbackStatus: 'PENDING',
      redirectedToGoogle: false,
      googleCtaViewed: false,
      googleCtaClicked: false,
      sentiment: 'Negative',
      themes: 'Food Quality',
      createdAt: new Date(),
      businessId: 'biz-1'
    } as any;

    const mockBusiness = {
      id: 'biz-1',
      name: 'Bella Italia',
      slug: 'bella-italia',
      businessCode: 'CR-000001',
      passwordHash: '',
      industry: 'RESTAURANT',
      logoUrl: null,
      googleReviewUrl: null,
      phone: null,
      address: null,
      description: null,
      contactPerson: null,
      category: null,
      website: null,
      googleMapsUrl: null,
      isActive: true,
      status: 'ACTIVE',
      deletedAt: null,
      enableGoogleReviewRedirect: true,
      enableManagerCallback: true,
      whatsappNumber: '1234567890',
      createdByRepId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedQrAssetId: null
    } as any;

    // 1. Negative Feedback Alert
    const message = NotificationFactory.createMessage(
      NotificationType.NEGATIVE_FEEDBACK,
      '1234567890',
      mockReview,
      mockBusiness
    );

    assert.strictEqual(message.recipient, '1234567890');
    assert.strictEqual(message.type, 'template');
    assert.strictEqual(message.template?.name, 'negative_feedback_alert');
    
    const params = message.template?.components?.[0].parameters || [];
    assert.strictEqual(params.length, 3);
    assert.strictEqual(params[0].text, 'Bella Italia');
    assert.strictEqual(params[1].text, '2');
    assert.strictEqual(params[2].text, 'Too salty');

    // Ensure dashboardUrl is not present anywhere in the message payload
    const serialized = JSON.stringify(message);
    assert.ok(!serialized.includes('dashboardUrl'));
    assert.ok(!serialized.includes('http'));

    // 2. Callback Request Alert
    const cbMessage = NotificationFactory.createMessage(
      NotificationType.CALLBACK_REQUEST,
      '1234567890',
      mockReview,
      mockBusiness
    );

    assert.strictEqual(cbMessage.recipient, '1234567890');
    assert.strictEqual(cbMessage.type, 'template');
    assert.strictEqual(cbMessage.template?.name, 'callback_request_alert');

    const cbParams = cbMessage.template?.components?.[0].parameters || [];
    assert.strictEqual(cbParams.length, 5);
    assert.strictEqual(cbParams[0].text, 'Bella Italia');
    assert.strictEqual(cbParams[1].text, 'Alice');
    assert.strictEqual(cbParams[2].text, '1234567890');
    assert.strictEqual(cbParams[3].text, '2');
    assert.strictEqual(cbParams[4].text, 'Too salty');

    // 3. Weekly Summary Builder
    const weeklyMessage = NotificationFactory.createWeeklySummary('1234567890', {
      business: mockBusiness,
      positiveReviews: 12,
      negativeReviews: 3,
      callbackRequests: 2
    });
    assert.strictEqual(weeklyMessage.template?.name, 'weekly_review_summary');
    const weeklyParams = weeklyMessage.template?.components?.[0].parameters || [];
    assert.strictEqual(weeklyParams.length, 4);
    assert.strictEqual(weeklyParams[0].text, 'Bella Italia');
    assert.strictEqual(weeklyParams[1].text, '12');
    assert.strictEqual(weeklyParams[2].text, '3');
    assert.strictEqual(weeklyParams[3].text, '2');

    // 4. Monthly Summary Builder
    const monthlyMessage = NotificationFactory.createMonthlySummary('1234567890', {
      business: mockBusiness,
      positiveReviews: 45,
      negativeReviews: 8,
      callbackRequests: 5
    });
    assert.strictEqual(monthlyMessage.template?.name, 'monthly_review_summary');
    const monthlyParams = monthlyMessage.template?.components?.[0].parameters || [];
    assert.strictEqual(monthlyParams.length, 4);
    assert.strictEqual(monthlyParams[0].text, 'Bella Italia');
    assert.strictEqual(monthlyParams[1].text, '45');
    assert.strictEqual(monthlyParams[2].text, '8');
    assert.strictEqual(monthlyParams[3].text, '5');

    // 5. Google Reply Reminder Builder
    const reminderMessage = NotificationFactory.createGoogleReplyReminder('1234567890', {
      business: mockBusiness
    });
    assert.strictEqual(reminderMessage.template?.name, 'reply_google_reviews_alert');
    const reminderParams = reminderMessage.template?.components?.[0].parameters || [];
    assert.strictEqual(reminderParams.length, 1);
    assert.strictEqual(reminderParams[0].text, 'Bella Italia');
  });

  await t.test('NotificationService Job Lifecycle Transitions', async () => {
    const payload = { test: 'data' };
    const metadata = { traceId: '12345' };

    // 1. Create Job
    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload,
      metadata,
    });

    assert.ok(job.id);
    assert.strictEqual(job.status, NotificationStatus.PENDING);
    assert.strictEqual(job.recipient, '919092334499');
    assert.strictEqual(job.retryCount, 0);

    // Verify initial log was created
    const initialLogs = await db.notificationLog.findMany({
      where: { jobId: job.id },
    });
    assert.strictEqual(initialLogs.length, 1);
    assert.strictEqual(initialLogs[0].newStatus, NotificationStatus.PENDING);

    // 2. Mark Processing
    const processingJob = await NotificationService.markProcessing(job.id);
    assert.strictEqual(processingJob.status, NotificationStatus.PROCESSING);

    // Verify transition log
    const processingLogs = await db.notificationLog.findMany({
      where: { jobId: job.id },
      orderBy: { timestamp: 'desc' },
    });
    assert.strictEqual(processingLogs.length, 2);
    assert.strictEqual(processingLogs[0].previousStatus, NotificationStatus.PENDING);
    assert.strictEqual(processingLogs[0].newStatus, NotificationStatus.PROCESSING);

    // 3. Mark Sent
    const sentJob = await NotificationService.markSent(job.id, 'meta-msg-id-xyz', { sentTime: 'noon' });
    assert.strictEqual(sentJob.status, NotificationStatus.SENT);
    assert.strictEqual(sentJob.providerMessageId, 'meta-msg-id-xyz');
    assert.ok(sentJob.processedAt);
    
    // Check metadata merging
    const mergedMeta = sentJob.metadata as any;
    assert.strictEqual(mergedMeta.traceId, '12345');
    assert.strictEqual(mergedMeta.sentTime, 'noon');

    // 4. Mark Delivered
    const deliveredJob = await NotificationService.markDelivered(job.id);
    assert.strictEqual(deliveredJob.status, NotificationStatus.DELIVERED);

    // 5. Mark Read
    const readJob = await NotificationService.markRead(job.id);
    assert.strictEqual(readJob.status, NotificationStatus.READ);

    // 6. Mark Failed
    const failedJob = await NotificationService.markFailed(job.id, 'Rate limit exceeded');
    assert.strictEqual(failedJob.status, NotificationStatus.FAILED);
    assert.strictEqual(failedJob.error, 'Rate limit exceeded');

    // 7. Increment Retry
    const retriedJob = await NotificationService.incrementRetry(job.id);
    assert.strictEqual(retriedJob.retryCount, 1);

    // 8. Query pending jobs
    const pendingJobs = await NotificationService.getPendingJobs(10);
    assert.ok(Array.isArray(pendingJobs));
  });
});
