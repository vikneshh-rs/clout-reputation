import crypto from 'crypto';
import { db } from '../src/lib/db';
import { createReview } from '../src/lib/data';
import {
  NotificationChannel,
  NotificationProvider,
  NotificationStatus,
  NotificationType,
} from '../src/lib/notifications/types/enums';
import { NotificationProviderFactory } from '../src/lib/notifications/factories/NotificationProviderFactory';
import { NotificationService } from '../src/lib/notifications/services/NotificationService';
import { DispatcherService } from '../src/lib/notifications/services/DispatcherService';
import { MetaWebhookService } from '../src/lib/notifications/services/MetaWebhookService';

async function waitForJob(reviewId: string) {
  for (let i = 0; i < 25; i++) {
    const jobs = await db.notificationJob.findMany({
      where: { reviewId },
    });
    if (jobs.length > 0) {
      return jobs;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return [];
}

function createMetaPayload(messageId: string, status: string, errorCode?: number) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1234567890',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: '1234567890',
              },
              statuses: [
                {
                  id: messageId,
                  status: status,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  recipient_id: '919092334499',
                  conversation: {
                    id: 'conv-123',
                    origin: {
                      type: 'utility',
                    },
                  },
                  pricing: {
                    billable: true,
                    pricing_model: 'CBP',
                    category: 'utility',
                  },
                  errors: errorCode ? [{ code: errorCode, title: 'Error occurred' }] : undefined,
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
}

async function runVerification() {
  console.log('=== STARTING END-TO-END PRODUCTION VERIFICATION ===\n');

  // Create a dedicated verification business
  const business = await db.business.create({
    data: {
      name: `Verification Business ${Date.now()}`,
      slug: `verification-slug-${Date.now()}`,
      businessCode: `CR-V${Math.floor(Math.random() * 1000000)}`,
      passwordHash: 'dummy',
      whatsappNumber: '919092334499',
      notificationSettings: {
        create: {
          negativeReviewEnabled: true,
        },
      },
    },
  });

  const results: any[] = [];
  const metrics: any = {};

  // Mock Provider Setup
  const mockProvider = {
    sendText: async () => ({ success: true, messageId: 'mock-wamid-id' }),
    sendTemplate: async () => ({ success: true, messageId: 'mock-wamid-id' }),
    sendInteractiveTemplate: async () => ({ success: true, messageId: 'mock-wamid-id' }),
    health: async () => ({ status: 'healthy' as const }),
  };

  const originalGetProvider = NotificationProviderFactory.getProvider;
  NotificationProviderFactory.getProvider = () => mockProvider as any;

  try {
    // --- TEST CASE 1: Negative Review ---
    console.log('Running Test Case 1: Negative Review...');
    const t1Start = performance.now();
    const r1 = await createReview({
      rating: 2,
      comment: 'Food was cold and service was slow.',
      customerName: 'Alice Cold',
      customerPhone: '1111111111',
      requestCallback: false,
      businessId: business.id,
    });
    metrics.reviewSubmissionTimeMs = Math.round(performance.now() - t1Start);

    assert(r1.id, 'Review should be saved');

    const t1Jobs = await waitForJob(r1.id);
    assert(t1Jobs.length === 1, 'Notification job should be created');
    const job = t1Jobs[0];
    assert(job.status === NotificationStatus.PENDING, 'Job should be PENDING');

    // Dispatch
    const t1DispatchStart = performance.now();
    const d1Result = await DispatcherService.dispatch(job.id);
    metrics.dispatcherTimeMs = Math.round(performance.now() - t1DispatchStart);

    assert(d1Result.success, 'Dispatcher should succeed');
    const dispatchedJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert(dispatchedJob?.status === NotificationStatus.SENT, 'Job status should be SENT');
    assert(dispatchedJob.providerMessageId, 'providerMessageId should be populated');

    // Webhook delivered
    const t1WebStart = performance.now();
    const payloadDelivered = createMetaPayload(dispatchedJob.providerMessageId!, 'delivered');
    const w1Result = await MetaWebhookService.process(payloadDelivered);
    metrics.webhookProcessingTimeMs = Math.round(performance.now() - t1WebStart);
    assert(w1Result.success, 'Webhook process delivered should succeed');

    let updatedJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert(updatedJob?.status === NotificationStatus.DELIVERED, 'Status should be DELIVERED');

    // Webhook read
    const payloadRead = createMetaPayload(dispatchedJob.providerMessageId!, 'read');
    const w2Result = await MetaWebhookService.process(payloadRead);
    assert(w2Result.success, 'Webhook process read should succeed');

    updatedJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert(updatedJob?.status === NotificationStatus.READ, 'Status should be READ');

    // Log check
    const logs = await db.notificationLog.findMany({ where: { jobId: job.id } });
    const logStates = logs.map((l) => l.newStatus);
    assert(logStates.includes(NotificationStatus.PROCESSING), 'Log must contain PROCESSING');
    assert(logStates.includes(NotificationStatus.SENT), 'Log must contain SENT');
    assert(logStates.includes(NotificationStatus.DELIVERED), 'Log must contain DELIVERED');
    assert(logStates.includes(NotificationStatus.READ), 'Log must contain READ');

    results.push({ name: 'Test Case 1: Negative Review Lifecycle', status: 'PASS' });
  } catch (err: any) {
    console.error('FAIL: Test Case 1 failed:', err.message);
    results.push({ name: 'Test Case 1: Negative Review Lifecycle', status: 'FAIL', error: err.message });
  }

  try {
    // --- TEST CASE 2: Negative Review with Callback ---
    console.log('Running Test Case 2: Negative Review with Callback...');
    const r2 = await createReview({
      rating: 1,
      comment: 'Need a callback.',
      customerName: 'Rahul Kumar',
      customerPhone: '919999999999',
      requestCallback: true,
      businessId: business.id,
    });

    assert(r2.id, 'Review saved');
    const t2Jobs = await waitForJob(r2.id);
    assert(t2Jobs.length === 1, 'Job created');
    assert(t2Jobs[0].notificationType === NotificationType.CALLBACK_REQUEST, 'Job type should be CALLBACK_REQUEST');

    const payload = t2Jobs[0].payload as any;
    const bodyParameters = payload.template?.components?.[0]?.parameters;
    const paramTexts = bodyParameters.map((p: any) => p.text);
    assert(paramTexts.includes('Rahul Kumar'), 'Payload must include customer name');
    assert(paramTexts.includes('919999999999'), 'Payload must include customer phone');

    results.push({ name: 'Test Case 2: Callback Request Job Details', status: 'PASS' });
  } catch (err: any) {
    console.error('FAIL: Test Case 2 failed:', err.message);
    results.push({ name: 'Test Case 2: Callback Request Job Details', status: 'FAIL', error: err.message });
  }

  try {
    // --- TEST CASE 3: Positive Review ---
    console.log('Running Test Case 3: Positive Review...');
    const r3 = await createReview({
      rating: 5,
      comment: 'Loved the food!',
      customerName: 'Happy Customer',
      customerPhone: '1112223333',
      requestCallback: false,
      businessId: business.id,
    });

    assert(r3.id, 'Review saved');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const t3Jobs = await db.notificationJob.findMany({ where: { reviewId: r3.id } });
    assert(t3Jobs.length === 0, 'No NotificationJob should be created for positive review');

    results.push({ name: 'Test Case 3: Positive Review Bypass', status: 'PASS' });
  } catch (err: any) {
    console.error('FAIL: Test Case 3 failed:', err.message);
    results.push({ name: 'Test Case 3: Positive Review Bypass', status: 'FAIL', error: err.message });
  }

  try {
    // --- TEST CASE 4: Dispatcher Idempotency ---
    console.log('Running Test Case 4: Dispatcher Idempotency...');
    mockProvider.sendTemplate = async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { success: true, messageId: 'idem-msg-id' };
    };

    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    const [res1, res2] = await Promise.all([
      DispatcherService.dispatch(job.id),
      DispatcherService.dispatch(job.id),
    ]);

    assert(res1.success && res2.success, 'Both should succeed/exit safely');

    const logs = await db.notificationLog.findMany({ where: { jobId: job.id } });
    const sentLogs = logs.filter((l) => l.newStatus === NotificationStatus.SENT);
    assert(sentLogs.length === 1, 'Only one sent transition log should be written');

    results.push({ name: 'Test Case 4: Dispatcher Idempotency Lock', status: 'PASS' });
  } catch (err: any) {
    console.error('FAIL: Test Case 4 failed:', err.message);
    results.push({ name: 'Test Case 4: Dispatcher Idempotency Lock', status: 'FAIL', error: err.message });
  }

  try {
    // --- TEST CASE 5: Webhook Idempotency ---
    console.log('Running Test Case 5: Webhook Idempotency...');
    const messageId = `wamid.Test5-${Date.now()}`;
    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    await db.notificationJob.update({
      where: { id: job.id },
      data: { status: NotificationStatus.SENT, providerMessageId: messageId },
    });

    const payload = createMetaPayload(messageId, 'delivered');

    // Run twice
    const w1 = await MetaWebhookService.process(payload);
    const w2 = await MetaWebhookService.process(payload);

    assert(w1.success && w2.success, 'Both webhook runs should report success');

    const logs = await db.notificationLog.findMany({
      where: { jobId: job.id, newStatus: NotificationStatus.DELIVERED },
    });
    assert(logs.length === 1, 'Only one DELIVERED transition log should exist');

    results.push({ name: 'Test Case 5: Webhook Idempotency Check', status: 'PASS' });
  } catch (err: any) {
    console.error('FAIL: Test Case 5 failed:', err.message);
    results.push({ name: 'Test Case 5: Webhook Idempotency Check', status: 'FAIL', error: err.message });
  }

  try {
    // --- TEST CASE 6: Provider Failure ---
    console.log('Running Test Case 6: Provider Failure...');
    mockProvider.sendTemplate = async () => ({ success: false, error: 'API Error' });

    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    const result = await DispatcherService.dispatch(job.id);
    assert(!result.success, 'Dispatcher should report failure');

    const finalJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert(finalJob?.status === NotificationStatus.FAILED, 'Job status should be FAILED');
    assert(finalJob?.retryCount === 1, 'Retry count should be 1');

    results.push({ name: 'Test Case 6: Provider Failure Handling', status: 'PASS' });
  } catch (err: any) {
    console.error('FAIL: Test Case 6 failed:', err.message);
    results.push({ name: 'Test Case 6: Provider Failure Handling', status: 'FAIL', error: err.message });
  }

  try {
    // --- TEST CASE 7: Provider Timeout ---
    console.log('Running Test Case 7: Provider Timeout...');
    mockProvider.sendTemplate = async () => {
      await new Promise((resolve) => setTimeout(resolve, 11000));
      return { success: true };
    };

    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    const result = await DispatcherService.dispatch(job.id);
    assert(!result.success, 'Dispatcher should fail due to timeout');

    const finalJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert(finalJob?.status === NotificationStatus.FAILED, 'Job status should be FAILED');
    assert(finalJob?.retryCount === 1, 'Retry count should be 1');

    results.push({ name: 'Test Case 7: Provider Timeout Protection', status: 'PASS' });
  } catch (err: any) {
    console.error('FAIL: Test Case 7 failed:', err.message);
    results.push({ name: 'Test Case 7: Provider Timeout Protection', status: 'FAIL', error: err.message });
  }

  try {
    // --- TEST CASE 8: Malformed Webhook ---
    console.log('Running Test Case 8: Malformed Webhook...');
    const result = await MetaWebhookService.process({});
    assert(!result.success, 'Malformed webhook should fail');

    results.push({ name: 'Test Case 8: Malformed Webhook Rejection', status: 'PASS' });
  } catch (err: any) {
    console.error('FAIL: Test Case 8 failed:', err.message);
    results.push({ name: 'Test Case 8: Malformed Webhook Rejection', status: 'FAIL', error: err.message });
  }

  // Restore Factory
  NotificationProviderFactory.getProvider = originalGetProvider;

  console.log('\n=== END-TO-END VERIFICATION COMPLETED ===');
  console.log('Test Summary:');
  console.log(JSON.stringify(results, null, 2));
  console.log('\nMeasured Metrics:');
  console.log(JSON.stringify(metrics, null, 2));
}

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

runVerification().catch((e) => {
  console.error('Fatal crash during verification execution:', e);
});
