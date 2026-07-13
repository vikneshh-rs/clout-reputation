import './env';
import generateBatchHandler from '../src/pages/api/super-admin/generate-qr-batch';
import inventoryHandler from '../src/pages/api/super-admin/inventory';
import repAssignHandler from '../src/pages/api/rep/assign';
import customerQrHandler from '../src/pages/api/r/[qrCode]';
import customerCtaHandler from '../src/pages/api/r/cta';
import customerCallbackHandler from '../src/pages/api/r/callback';
import businessAnalyticsHandler from '../src/pages/api/business/analytics';
import superAdminBusinessesHandler from '../src/pages/api/super-admin/businesses';

import { db } from '../src/lib/db';
import jwt from 'jsonwebtoken';
import { CallbackStatus, BusinessStatus } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-cloutation-jwt-key-change-this-in-production';
const COOKIE_NAME = 'cloutation_session';

function generateToken(role: 'SUPER_ADMIN' | 'REP' | 'BUSINESS', userId: string, username: string) {
  const payload = {
    userId,
    email: `${username.toLowerCase()}@cloutation.com`,
    username,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60
  };
  return jwt.sign(payload, JWT_SECRET);
}

async function runUatTests() {
  console.log('🧪 Starting End-To-End UAT Test Suite...');

  // Helper to execute NextApiRequest handlers in-memory
  const callApi = async (
    handler: any, 
    options: { 
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      query?: any;
      body?: any;
      token?: string | null;
    }
  ) => {
    let statusCode = 200;
    let jsonBody: any = null;
    let headers: Record<string, string> = {
      host: 'localhost:3000',
      origin: 'http://localhost:3000'
    };

    if (options.token) {
      headers['cookie'] = `${COOKIE_NAME}=${options.token}`;
    }

    const req = {
      method: options.method,
      query: options.query || {},
      body: options.body || {},
      headers
    } as any;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonBody = data;
        return res;
      }
    } as any;

    await handler(req, res);
    return { status: statusCode, json: jsonBody };
  };

  // 0. Find existing Admin and Rep in the seeded DB
  const adminUser = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const repUser = await db.user.findFirst({ where: { role: 'REP', username: 'dan' } });

  if (!adminUser || !repUser) {
    throw new Error('Required seed users (SUPER_ADMIN or REP dan) are missing from DB. Run npx prisma db seed first.');
  }

  const tokens = {
    ADMIN: generateToken('SUPER_ADMIN', adminUser.id, adminUser.username),
    REP: generateToken('REP', repUser.id, repUser.username)
  };

  let testPassed = 0;
  let testTotal = 0;
  const assert = (name: string, condition: boolean, message: string) => {
    testTotal++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      testPassed++;
    } else {
      console.log(`❌ [FAIL] ${name}: ${message}`);
    }
  };

  // -------------------------------------------------------------
  // WORKFLOW A: Super Admin Generates QR Batch and Downloads
  // -------------------------------------------------------------
  console.log('\n--- Workflow A: Super Admin QR Generation & Inventory ---');
  
  const prefix = 'UAT';
  const startNumber = 100;
  const endNumber = 104;
  const quantity = 5;

  const wfARes = await callApi(generateBatchHandler, {
    method: 'POST',
    token: tokens.ADMIN,
    body: { prefix, startNumber, endNumber }
  });

  assert(
    'Workflow A: QR Batch generated with status 201',
    wfARes.status === 201,
    `Expected 201, got ${wfARes.status} (${wfARes.json?.error})`
  );

  // Check inventory
  const wfAInvRes = await callApi(inventoryHandler, {
    method: 'GET',
    token: tokens.ADMIN,
    query: { search: 'cqr-UAT' }
  });

  assert(
    'Workflow A: QR codes present in inventory',
    wfAInvRes.status === 200 && wfAInvRes.json?.inventory?.length === quantity,
    `Expected 5 QR codes, got ${wfAInvRes.json?.inventory?.length}`
  );

  // -------------------------------------------------------------
  // WORKFLOW B: REP Onboards Business and Assigns QR code
  // -------------------------------------------------------------
  console.log('\n--- Workflow B: REP Business Onboarding & QR Assignment ---');

  const uatBizName = 'UAT Bakery Shop';
  const assignRes = await callApi(repAssignHandler, {
    method: 'POST',
    token: tokens.REP,
    body: {
      action: 'ASSIGN',
      qrCode: 'cqr-UAT100',
      businessDetails: {
        name: uatBizName,
        industry: 'CAFE',
        password: 'password123',
        plan: 'PRO',
        phone: '+15559876',
        address: '100 UAT Lane'
      }
    }
  });

  assert(
    'Workflow B: Business onboarded & QR assigned with status 200',
    assignRes.status === 200,
    `Expected 200, got ${assignRes.status} (${assignRes.json?.error})`
  );

  // Verify business created and QR status
  const uatBiz = await db.business.findUnique({ where: { name: uatBizName } });
  assert(
    'Workflow B: Business record exists in database',
    uatBiz !== null,
    'Business was not created'
  );

  const uatQr = await db.qRAsset.findFirst({ where: { qrCode: 'cqr-UAT100' } });
  assert(
    'Workflow B: QR Code set to ASSIGNED',
    uatQr?.status === 'ASSIGNED' && uatQr.assignedBusinessId === uatBiz?.id,
    `Expected ASSIGNED, got status: ${uatQr?.status}`
  );

  // Verify QRHistory
  const assignLog = await db.qRHistory.findFirst({
    where: { qrAssetId: uatQr?.id, businessId: uatBiz?.id }
  });
  assert(
    'Workflow B: Assignment Log was created',
    assignLog !== null,
    'Assignment log missing'
  );

  const bizToken = uatBiz ? generateToken('BUSINESS', uatBiz.id, uatBiz.name) : '';

  // -------------------------------------------------------------
  // WORKFLOW C: Customer Submits Positive Review & Clicks Google CTA
  // -------------------------------------------------------------
  console.log('\n--- Workflow C: Customer Positive Review & Google CTA ---');

  // Customer scans
  const scanRes = await callApi(customerQrHandler, {
    method: 'GET',
    query: { qrCode: 'cqr-UAT100' }
  });
  assert(
    'Workflow C: Customer scan resolves with 200',
    scanRes.status === 200,
    `Expected 200, got ${scanRes.status}`
  );

  // Submit positive review (5 stars)
  const posReviewRes = await callApi(customerQrHandler, {
    method: 'POST',
    query: { qrCode: 'cqr-UAT100' },
    body: { rating: 5, comment: 'Simply fantastic pastries!' }
  });

  assert(
    'Workflow C: Positive review saved successfully',
    posReviewRes.status === 200,
    `Expected 200, got ${posReviewRes.status}`
  );

  const posReviewId = posReviewRes.json?.id;

  // Track CTA Click
  const ctaClickRes = await callApi(customerCtaHandler, {
    method: 'POST',
    body: { reviewId: posReviewId, action: 'click' }
  });

  assert(
    'Workflow C: Google CTA click logged with status 200',
    ctaClickRes.status === 200,
    `Expected 200, got ${ctaClickRes.status}`
  );

  const dbPosReview = await db.review.findUnique({ where: { id: posReviewId } });
  assert(
    'Workflow C: DB logs cta views/clicks',
    dbPosReview?.googleCtaClicked === true && dbPosReview.redirectedToGoogle === true,
    'Google click details missing'
  );

  // -------------------------------------------------------------
  // WORKFLOW D: Customer Submits Negative Review & Creates Callback
  // -------------------------------------------------------------
  console.log('\n--- Workflow D: Customer Negative Review & Callback ---');

  // Submit negative review (2 stars)
  const negReviewRes = await callApi(customerQrHandler, {
    method: 'POST',
    query: { qrCode: 'cqr-UAT100' },
    body: { rating: 2, comment: 'Burnt cookies, very disappointed.' }
  });

  assert(
    'Workflow D: Negative review saved successfully',
    negReviewRes.status === 200,
    `Expected 200, got ${negReviewRes.status}`
  );

  const negReviewId = negReviewRes.json?.id;

  // Submit callback request
  const callbackRes = await callApi(customerCallbackHandler, {
    method: 'POST',
    body: {
      reviewId: negReviewId,
      customerName: 'Alice UAT',
      phoneNumber: '+15558888'
    }
  });

  assert(
    'Workflow D: Callback request created successfully',
    callbackRes.status === 200,
    `Expected 200, got ${callbackRes.status}`
  );

  const callbackRecord = await db.callbackRequest.findFirst({
    where: { reviewId: negReviewId }
  });

  assert(
    'Workflow D: Callback request exists in DB with PENDING status',
    callbackRecord !== null && callbackRecord.status === CallbackStatus.PENDING,
    `Expected PENDING, got: ${callbackRecord?.status}`
  );

  // -------------------------------------------------------------
  // WORKFLOW E: Business Owner Dashboard Loading
  // -------------------------------------------------------------
  console.log('\n--- Workflow E: Business Owner Dashboard Loading ---');

  const bizAnalyticsRes = await callApi(businessAnalyticsHandler, {
    method: 'GET',
    token: bizToken,
    query: { period: '30d' }
  });

  assert(
    'Workflow E: Business analytics API resolves with 200',
    bizAnalyticsRes.status === 200,
    `Expected 200, got ${bizAnalyticsRes.status}`
  );

  assert(
    'Workflow E: Analytics data contains correct reviews count',
    bizAnalyticsRes.json?.analytics?.totalReviews === 2,
    `Expected 2 reviews, got ${bizAnalyticsRes.json?.analytics?.totalReviews}`
  );

  // -------------------------------------------------------------
  // WORKFLOW F: Super Admin Suspends Business
  // -------------------------------------------------------------
  console.log('\n--- Workflow F: Super Admin Business Suspension ---');

  if (uatBiz) {
    const suspendRes = await callApi(superAdminBusinessesHandler, {
      method: 'PUT',
      token: tokens.ADMIN,
      body: {
        action: 'status',
        id: uatBiz.id,
        status: BusinessStatus.INACTIVE
      }
    });

    assert(
      'Workflow F: Business suspended by Super Admin with status 200',
      suspendRes.status === 200,
      `Expected 200, got ${suspendRes.status}`
    );

    // Customer scans QR code
    const suspendedScanRes = await callApi(customerQrHandler, {
      method: 'GET',
      query: { qrCode: 'cqr-UAT100' }
    });

    assert(
      'Workflow F: Scanning suspended business QR returns 403',
      suspendedScanRes.status === 403,
      `Expected 403, got ${suspendedScanRes.status}`
    );
    assert(
      'Workflow F: Scan returns error INACTIVE',
      suspendedScanRes.json?.status === 'INACTIVE',
      `Expected INACTIVE error, got ${suspendedScanRes.json?.status}`
    );

    // Customer attempts to submit review
    const blockedReviewRes = await callApi(customerQrHandler, {
      method: 'POST',
      query: { qrCode: 'cqr-UAT100' },
      body: { rating: 5, comment: 'Spam' }
    });

    assert(
      'Workflow F: Review submission blocked with status 403',
      blockedReviewRes.status === 403,
      `Expected 403, got ${blockedReviewRes.status}`
    );
  }

  // -------------------------------------------------------------
  // CLEANUP UAT RECORDS
  // -------------------------------------------------------------
  console.log('\n🧹 Cleaning up UAT records...');
  if (uatBiz) {
    await db.callbackRequest.deleteMany({ where: { review: { businessId: uatBiz.id } } });
    await db.review.deleteMany({ where: { businessId: uatBiz.id } });
    await db.qRScan.deleteMany({ where: { businessId: uatBiz.id } });
    await db.qRHistory.deleteMany({ where: { businessId: uatBiz.id } });
    await db.subscription.deleteMany({ where: { businessId: uatBiz.id } });
    await db.qRAsset.deleteMany({ where: { assignedBusinessId: uatBiz.id } });
    await db.business.delete({ where: { id: uatBiz.id } });
  }
  
  // Delete the batch and codes generated in UAT
  await db.qRAsset.deleteMany({
    where: {
      qrCode: {
        startsWith: 'cqr-UAT10'
      }
    }
  });
  await db.qRBatch.deleteMany({ where: { batchName: 'Batch UAT (100-104)' } });

  console.log(`\n📊 UAT Summary: ${testPassed}/${testTotal} workflows passed.`);
  if (testPassed === testTotal) {
    console.log('🎉 ALL UAT WORKFLOW CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ SOME UAT CHECKS FAILED.');
    process.exit(1);
  }
}

runUatTests()
  .catch(err => {
    console.error('❌ Error executing UAT tests:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
