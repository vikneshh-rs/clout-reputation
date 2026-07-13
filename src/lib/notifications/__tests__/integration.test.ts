import test from 'node:test';
import assert from 'node:assert';
import { db } from '../../db';
import { createReview } from '../../data';
import { ReviewNotificationHandler } from '../../reviews/events/ReviewNotificationHandler';
import { NotificationType, NotificationStatus } from '../types/enums';
import { NotificationService } from '../services/NotificationService';

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

test('Review & Notification Integration Tests (Phase 3)', async (t) => {
  await t.test('Test Case 1: 5★ Review - No notification job created', async () => {
    const biz = await db.business.create({
      data: {
        name: `Biz Case 1 ${Date.now()}`,
        slug: `biz-case-1-${Date.now()}`,
        businessCode: `CR-T1-${Math.floor(Math.random() * 1000000)}`,
        passwordHash: 'dummy',
        whatsappNumber: '919092334499',
        notificationSettings: {
          create: {
            negativeReviewEnabled: true,
          },
        },
      },
    });

    const review = await createReview({
      rating: 5,
      comment: 'Excellent!',
      customerName: 'Alice Test',
      customerPhone: '1111111111',
      requestCallback: false,
      businessId: biz.id,
    });

    assert.ok(review.id);
    
    // For "no job created", we wait a flat 1.5 seconds to be safe
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const jobs = await db.notificationJob.findMany({
      where: { reviewId: review.id },
    });
    assert.strictEqual(jobs.length, 0);
  });

  await t.test('Test Case 2: 3★ Review, Callback = FALSE - NEGATIVE_FEEDBACK job created', async () => {
    const biz = await db.business.create({
      data: {
        name: `Biz Case 2 ${Date.now()}`,
        slug: `biz-case-2-${Date.now()}`,
        businessCode: `CR-T2-${Math.floor(Math.random() * 1000000)}`,
        passwordHash: 'dummy',
        whatsappNumber: '919092334499',
        notificationSettings: {
          create: {
            negativeReviewEnabled: true,
          },
        },
      },
    });

    const review = await createReview({
      rating: 3,
      comment: 'Average service',
      customerName: 'Bob Test',
      customerPhone: '2222222222',
      requestCallback: false,
      businessId: biz.id,
    });

    assert.ok(review.id);
    
    const jobs = await waitForJob(review.id);
    assert.strictEqual(jobs.length, 1);
    assert.strictEqual(jobs[0].notificationType, NotificationType.NEGATIVE_FEEDBACK);
    assert.strictEqual(jobs[0].status, NotificationStatus.PENDING);

    const logs = await db.notificationLog.findMany({
      where: { jobId: jobs[0].id },
    });
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].newStatus, NotificationStatus.PENDING);
  });

  await t.test('Test Case 3: 2★ Review, Callback = TRUE - CALLBACK_REQUEST job created with details', async () => {
    const biz = await db.business.create({
      data: {
        name: `Biz Case 3 ${Date.now()}`,
        slug: `biz-case-3-${Date.now()}`,
        businessCode: `CR-T3-${Math.floor(Math.random() * 1000000)}`,
        passwordHash: 'dummy',
        whatsappNumber: '919092334499',
        notificationSettings: {
          create: {
            negativeReviewEnabled: true,
          },
        },
      },
    });

    const review = await createReview({
      rating: 2,
      comment: 'Please callback',
      customerName: 'Charlie Test',
      customerPhone: '3333333333',
      requestCallback: true,
      businessId: biz.id,
    });

    assert.ok(review.id);
    
    const jobs = await waitForJob(review.id);
    assert.strictEqual(jobs.length, 1);
    assert.strictEqual(jobs[0].notificationType, NotificationType.CALLBACK_REQUEST);
    assert.strictEqual(jobs[0].status, NotificationStatus.PENDING);

    const payload = jobs[0].payload as any;
    assert.ok(payload);
    const bodyParameters = payload.template?.components?.[0]?.parameters;
    assert.ok(bodyParameters);
    const paramTexts = bodyParameters.map((p: any) => p.text);
    assert.ok(paramTexts.includes('Charlie Test'));
    assert.ok(paramTexts.includes('3333333333'));
  });

  await t.test('Test Case 4: NotificationService throws exception - review still saved successfully', async () => {
    const biz = await db.business.create({
      data: {
        name: `Biz Case 4 ${Date.now()}`,
        slug: `biz-case-4-${Date.now()}`,
        businessCode: `CR-T4-${Math.floor(Math.random() * 1000000)}`,
        passwordHash: 'dummy',
        whatsappNumber: '919092334499',
        notificationSettings: {
          create: {
            negativeReviewEnabled: true,
          },
        },
      },
    });

    const originalCreateJob = NotificationService.createJob;
    NotificationService.createJob = async () => {
      throw new Error('Database connection failed during notification creation');
    };

    try {
      const review = await createReview({
        rating: 1,
        comment: 'Crash test',
        customerName: 'Crash Test User',
        customerPhone: '4444444444',
        requestCallback: false,
        businessId: biz.id,
      });

      assert.ok(review.id);
      assert.strictEqual(review.rating, 1);
    } finally {
      NotificationService.createJob = originalCreateJob;
    }
  });

  await t.test('Test Case 5: Business has negativeReviewEnabled = false - no job created', async () => {
    const biz = await db.business.create({
      data: {
        name: `Biz Case 5 ${Date.now()}`,
        slug: `biz-case-5-${Date.now()}`,
        businessCode: `CR-T5-${Math.floor(Math.random() * 1000000)}`,
        passwordHash: 'dummy',
        whatsappNumber: '919092334499',
        notificationSettings: {
          create: {
            negativeReviewEnabled: false,
          },
        },
      },
    });

    const review = await createReview({
      rating: 1,
      comment: 'Disliked service',
      customerName: 'Dan Test',
      customerPhone: '5555555555',
      requestCallback: false,
      businessId: biz.id,
    });

    assert.ok(review.id);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const jobs = await db.notificationJob.findMany({
      where: { reviewId: review.id },
    });
    assert.strictEqual(jobs.length, 0);
  });

  await t.test('Test Case 6: BusinessNotificationSettings missing - safe defaults applied, job created', async () => {
    const biz = await db.business.create({
      data: {
        name: `Biz Case 6 ${Date.now()}`,
        slug: `biz-case-6-${Date.now()}`,
        businessCode: `CR-T6-${Math.floor(Math.random() * 1000000)}`,
        passwordHash: 'dummy',
        whatsappNumber: '919092334499',
      },
    });

    const review = await createReview({
      rating: 2,
      comment: 'No settings comment',
      customerName: 'Edward Test',
      customerPhone: '6666666666',
      requestCallback: false,
      businessId: biz.id,
    });

    assert.ok(review.id);
    
    const jobs = await waitForJob(review.id);
    assert.strictEqual(jobs.length, 1);
    assert.strictEqual(jobs[0].notificationType, NotificationType.NEGATIVE_FEEDBACK);
  });

  await t.test('Test Case 7: Business lookup fails - review saved, skipped gracefully', async () => {
    const biz = await db.business.create({
      data: {
        name: `Biz Case 7 ${Date.now()}`,
        slug: `biz-case-7-${Date.now()}`,
        businessCode: `CR-T7-${Math.floor(Math.random() * 1000000)}`,
        passwordHash: 'dummy',
        whatsappNumber: '919092334499',
      },
    });

    const originalFindUnique = db.business.findUnique;
    db.business.findUnique = (() => Promise.resolve(null)) as any;

    try {
      const review = await createReview({
        rating: 1,
        comment: 'Invalid business ID',
        customerName: 'Fred Test',
        customerPhone: '7777777777',
        requestCallback: false,
        businessId: biz.id,
      });

      assert.ok(review.id);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const jobs = await db.notificationJob.findMany({
        where: { reviewId: review.id },
      });
      assert.strictEqual(jobs.length, 0);
    } finally {
      db.business.findUnique = originalFindUnique;
    }
  });
});
