import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { Readable } from 'stream';
import { db } from '../../db';
import {
  NotificationChannel,
  NotificationProvider,
  NotificationStatus,
  NotificationType,
} from '../types/enums';
import { NotificationService } from '../services/NotificationService';
import handler from '../../../pages/api/webhooks/meta';

function mockRequestResponse(method: string, query: any, headers: any, rawBody: string) {
  const req = Readable.from(Buffer.from(rawBody)) as any;
  req.method = method;
  req.query = query;
  req.headers = headers;

  let statusCode = 200;
  let responseData: any = null;
  const headersSent: any = {};

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    send(body: any) {
      responseData = body;
      return this;
    },
    json(body: any) {
      responseData = body;
      return this;
    },
    setHeader(name: string, value: string) {
      headersSent[name] = value;
      return this;
    },
    getStatusCode() {
      return statusCode;
    },
    getData() {
      return responseData;
    },
  } as any;

  return { req, res };
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

test('Meta Webhook Integration Tests (Phase 5)', async (t) => {
  const business = await db.business.findFirst();
  if (!business) {
    throw new Error('Please seed the database before running tests.');
  }

  // Setup environment variables for signature and token checking
  const originalVerifyToken = process.env.META_VERIFY_TOKEN;
  const originalAppSecret = process.env.META_APP_SECRET;

  process.env.META_VERIFY_TOKEN = 'secret_token';
  process.env.META_APP_SECRET = 'app_secret_key';

  const generateSignature = (payloadStr: string) => {
    return (
      'sha256=' +
      crypto
        .createHmac('sha256', process.env.META_APP_SECRET || '')
        .update(payloadStr)
        .digest('hex')
    );
  };

  await t.test('Test 1: Webhook Verification GET returns challenge when token matches', async () => {
    const { req, res } = mockRequestResponse(
      'GET',
      {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'secret_token',
        'hub.challenge': '11223344',
      },
      {},
      ''
    );

    await handler(req, res);
    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(res.getData(), '11223344');
  });

  await t.test('Test 2: Webhook Verification GET returns 403 when token mismatch', async () => {
    const { req, res } = mockRequestResponse(
      'GET',
      {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': '11223344',
      },
      {},
      ''
    );

    await handler(req, res);
    assert.strictEqual(res.getStatusCode(), 403);
  });

  await t.test('Test 3: POST delivered event updates job status and creates log', async () => {
    const messageId = `wamid.Test3-${Date.now()}`;
    const job = await NotificationService.createJob({
      businessId: business.id,
      channel: NotificationChannel.WHATSAPP,
      provider: NotificationProvider.META,
      notificationType: NotificationType.NEGATIVE_FEEDBACK,
      recipient: '919092334499',
      payload: { test: 'payload' },
    });

    // Manually mark job status to SENT and providerMessageId set to our target
    await db.notificationJob.update({
      where: { id: job.id },
      data: {
        status: NotificationStatus.SENT,
        providerMessageId: messageId,
      },
    });

    const payloadObj = createMetaPayload(messageId, 'delivered');
    const rawBody = JSON.stringify(payloadObj);
    const signature = generateSignature(rawBody);

    const { req, res } = mockRequestResponse(
      'POST',
      {},
      { 'x-hub-signature-256': signature },
      rawBody
    );

    await handler(req, res);
    assert.strictEqual(res.getStatusCode(), 200);

    const updatedJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert.strictEqual(updatedJob?.status, NotificationStatus.DELIVERED);

    const logs = await db.notificationLog.findMany({
      where: { jobId: job.id, newStatus: NotificationStatus.DELIVERED },
    });
    assert.strictEqual(logs.length, 1);
  });

  await t.test('Test 4: POST read event updates job status and creates log', async () => {
    const messageId = `wamid.Test4-${Date.now()}`;
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
      data: {
        status: NotificationStatus.DELIVERED,
        providerMessageId: messageId,
      },
    });

    const payloadObj = createMetaPayload(messageId, 'read');
    const rawBody = JSON.stringify(payloadObj);
    const signature = generateSignature(rawBody);

    const { req, res } = mockRequestResponse(
      'POST',
      {},
      { 'x-hub-signature-256': signature },
      rawBody
    );

    await handler(req, res);
    assert.strictEqual(res.getStatusCode(), 200);

    const updatedJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert.strictEqual(updatedJob?.status, NotificationStatus.READ);
  });

  await t.test('Test 5: POST duplicate delivered event is ignored (idempotency)', async () => {
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
      data: {
        status: NotificationStatus.DELIVERED,
        providerMessageId: messageId,
      },
    });

    // Send delivered webhook again
    const payloadObj = createMetaPayload(messageId, 'delivered');
    const rawBody = JSON.stringify(payloadObj);
    const signature = generateSignature(rawBody);

    const { req, res } = mockRequestResponse(
      'POST',
      {},
      { 'x-hub-signature-256': signature },
      rawBody
    );

    await handler(req, res);
    assert.strictEqual(res.getStatusCode(), 200);

    // Verify no log entry for DELIVERED status transition was added (job remains in original state)
    const logs = await db.notificationLog.findMany({
      where: { jobId: job.id, newStatus: NotificationStatus.DELIVERED },
    });
    assert.strictEqual(logs.length, 0); // No transition log created because state did not change
  });

  await t.test('Test 6: Out-of-order event - READ arrives before DELIVERED (no downgrade)', async () => {
    const messageId = `wamid.Test6-${Date.now()}`;
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
      data: {
        status: NotificationStatus.READ,
        providerMessageId: messageId,
      },
    });

    // Send delivered webhook event
    const payloadObj = createMetaPayload(messageId, 'delivered');
    const rawBody = JSON.stringify(payloadObj);
    const signature = generateSignature(rawBody);

    const { req, res } = mockRequestResponse(
      'POST',
      {},
      { 'x-hub-signature-256': signature },
      rawBody
    );

    await handler(req, res);
    assert.strictEqual(res.getStatusCode(), 200);

    // Verify job is still READ (no downgrade occurred)
    const finalJob = await db.notificationJob.findUnique({ where: { id: job.id } });
    assert.strictEqual(finalJob?.status, NotificationStatus.READ);
  });

  await t.test('Test 7: Unknown providerMessageId - logs warning and returns 200', async () => {
    const payloadObj = createMetaPayload('wamid.nonexistent-id', 'delivered');
    const rawBody = JSON.stringify(payloadObj);
    const signature = generateSignature(rawBody);

    const { req, res } = mockRequestResponse(
      'POST',
      {},
      { 'x-hub-signature-256': signature },
      rawBody
    );

    await handler(req, res);
    assert.strictEqual(res.getStatusCode(), 200);
  });

  await t.test('Test 8: Malformed payload returns 400', async () => {
    const malformedBody = '{"object": "whatsapp", "entry": ';
    const signature = generateSignature(malformedBody);

    const { req, res } = mockRequestResponse(
      'POST',
      {},
      { 'x-hub-signature-256': signature },
      malformedBody
    );

    await handler(req, res);
    assert.strictEqual(res.getStatusCode(), 400);
  });

  await t.test('Test 9: Process the same webhook event twice consecutively (Idempotency check)', async () => {
    const messageId = `wamid.Test9-${Date.now()}`;
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
      data: {
        status: NotificationStatus.SENT,
        providerMessageId: messageId,
      },
    });

    const payloadObj = createMetaPayload(messageId, 'delivered');
    const rawBody = JSON.stringify(payloadObj);
    const signature = generateSignature(rawBody);

    // First POST
    const call1 = mockRequestResponse('POST', {}, { 'x-hub-signature-256': signature }, rawBody);
    await handler(call1.req, call1.res);
    assert.strictEqual(call1.res.getStatusCode(), 200);

    // Second POST
    const call2 = mockRequestResponse('POST', {}, { 'x-hub-signature-256': signature }, rawBody);
    await handler(call2.req, call2.res);
    assert.strictEqual(call2.res.getStatusCode(), 200);

    // Verify only 1 log transition exists for DELIVERED status
    const logs = await db.notificationLog.findMany({
      where: { jobId: job.id, newStatus: NotificationStatus.DELIVERED },
    });
    assert.strictEqual(logs.length, 1);
  });

  await t.test('Test 10: POST Signature Validation - Invalid signature returns 401', async () => {
    const payloadObj = createMetaPayload('wamid.signature-test', 'delivered');
    const rawBody = JSON.stringify(payloadObj);

    const { req, res } = mockRequestResponse(
      'POST',
      {},
      { 'x-hub-signature-256': 'sha256=invalid-signature' },
      rawBody
    );

    await handler(req, res);
    assert.strictEqual(res.getStatusCode(), 401);
  });

  // Restore env variables
  process.env.META_VERIFY_TOKEN = originalVerifyToken;
  process.env.META_APP_SECRET = originalAppSecret;
});
