import test from 'node:test';
import assert from 'node:assert';
import { db } from '../../db';
import {
  NotificationChannel,
  NotificationProvider,
  NotificationStatus,
  NotificationType,
} from '../types/enums';
import { NotificationProviderFactory } from '../factories/NotificationProviderFactory';
import { NotificationFactory } from '../factories/NotificationFactory';
import { NotificationService } from '../services/NotificationService';
import { DispatcherService } from '../services/DispatcherService';

test('Notification Dispatcher Service Tests (Phase 4)', async (t) => {
  // Setup: Fetch/create a test business
  const business = await db.business.findFirst();
  if (!business) {
    throw new Error('Please seed the database before running tests.');
  }

  // Set up mock provider
  const mockProvider = {
    sendText: async () => ({ success: true, messageId: 'mock-wamid-id' }),
    sendTemplate: async () => ({ success: true, messageId: 'mock-wamid-id' }),
    sendInteractiveTemplate: async () => ({ success: true, messageId: 'mock-wamid-id' }),
    health: async () => ({ status: 'healthy' as const }),
  };

  const originalGetProvider = NotificationProviderFactory.getProvider;

  await t.test('Setup provider mock', () => {
    NotificationProviderFactory.getProvider = () => mockProvider as any;
  });

  await t.test('Test 1: Valid NotificationJob - Dispatches successfully', async () => {
    // Reset mock to success
    mockProvider.sendTemplate = async () => ({ success: true, messageId: 'mock-wamid-id-success' });

    // Create a pending job
    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    const result = await DispatcherService.dispatch(job.id);
    assert.strictEqual(result.success, true);
    assert.ok(result.job);
    assert.strictEqual(result.job.status, NotificationStatus.SENT);
    assert.strictEqual(result.job.providerMessageId, 'mock-wamid-id-success');

    // Verify logs
    const logs = await db.notificationLog.findMany({
      where: { jobId: job.id },
      orderBy: { timestamp: 'asc' },
    });
    // Logs: PENDING -> PROCESSING -> SENT
    assert.strictEqual(logs.length, 3);
    assert.strictEqual(logs[1].newStatus, NotificationStatus.PROCESSING);
    assert.strictEqual(logs[2].newStatus, NotificationStatus.SENT);
  });

  await t.test('Test 2: NotificationJob not found - Returns error', async () => {
    const result = await DispatcherService.dispatch('00000000-0000-0000-0000-000000000000');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'NOT_FOUND');
  });

  await t.test('Test 3: Notification already SENT - Exits safely (Idempotency)', async () => {
    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    // Mark SENT directly
    await db.notificationJob.update({
      where: { id: job.id },
      data: { status: NotificationStatus.SENT },
    });

    const result = await DispatcherService.dispatch(job.id);
    // Should exit safely and return success: true
    assert.strictEqual(result.success, true);

    // Assert status remained SENT
    const finalJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert.strictEqual(finalJob?.status, NotificationStatus.SENT);
  });

  await t.test('Test 4: Concurrent Dispatch - Only one executes', async () => {
    mockProvider.sendTemplate = async () => {
      // Simulate slight network delay to keep job in PROCESSING state
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, messageId: 'concurrent-success-id' };
    };

    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    // Invoke twice simultaneously
    const [res1, res2] = await Promise.all([
      DispatcherService.dispatch(job.id),
      DispatcherService.dispatch(job.id),
    ]);

    // Both should report success (either from sending or from safe idempotency bypass)
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res2.success, true);

    // Verify database job status and retry count
    const finalJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert.strictEqual(finalJob?.status, NotificationStatus.SENT);
    assert.strictEqual(finalJob?.retryCount, 0);

    // Verify logs
    const logs = await db.notificationLog.findMany({
      where: { jobId: job.id },
    });
    // Should contain: PENDING (initial), 1x PROCESSING, 1x SENT
    const sentLogs = logs.filter(l => l.newStatus === NotificationStatus.SENT);
    const processingLogs = logs.filter(l => l.newStatus === NotificationStatus.PROCESSING);
    assert.strictEqual(sentLogs.length, 1);
    assert.strictEqual(processingLogs.length, 1);
  });

  await t.test('Test 5: Provider Timeout - Fails gracefully after timeout', async () => {
    // Configure mock to exceed 10-second timeout
    mockProvider.sendTemplate = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 12000));
      return { success: true, messageId: 'mock-id' };
    }) as any;

    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    const result = await DispatcherService.dispatch(job.id);
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('TIMEOUT'));

    // Check retry count and state
    const finalJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert.strictEqual(finalJob?.status, NotificationStatus.FAILED);
    assert.strictEqual(finalJob?.retryCount, 1);

    // Verify failure log written
    const logs = await db.notificationLog.findMany({
      where: { jobId: job.id, newStatus: NotificationStatus.FAILED },
    });
    assert.strictEqual(logs.length, 1);
    assert.ok(logs[0].errorMessage?.includes('TIMEOUT'));
  });

  await t.test('Test 6: MetaProvider returns API error - Increments retry and fails job', async () => {
    // Reset mock to error return
    mockProvider.sendTemplate = (async () => ({
      success: false,
      error: { code: '100', message: 'API Rate limit exceeded' },
    })) as any;

    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    const result = await DispatcherService.dispatch(job.id);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'API Rate limit exceeded');

    const finalJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert.strictEqual(finalJob?.status, NotificationStatus.FAILED);
    assert.strictEqual(finalJob?.retryCount, 1);

    const logs = await db.notificationLog.findMany({
      where: { jobId: job.id, newStatus: NotificationStatus.FAILED },
    });
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].errorMessage, 'API Rate limit exceeded');
  });

  await t.test('Restore original provider resolver', () => {
    NotificationProviderFactory.getProvider = originalGetProvider;
  });
});
