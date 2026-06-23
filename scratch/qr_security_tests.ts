import './env';
import handler from '../src/pages/api/r/[qrCode]';
import { db } from '../src/lib/db';
import { BusinessStatus, QRStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

async function runSecurityTests() {
  console.log('🧪 Starting QR Security Test Suite...');
  
  // Helper to call Next.js resolver handler in-memory
  const callHandler = async (qrCode: string, method: 'GET' | 'POST' = 'GET', body: any = {}) => {
    let statusCode = 200;
    let responseJson: any = null;

    const req = {
      query: { qrCode },
      method,
      body,
      headers: {
        'user-agent': 'CloutSecurityScanner/1.0'
      }
    } as any;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseJson = data;
        return res;
      }
    } as any;

    await handler(req, res);
    return { status: statusCode, json: responseJson };
  };

  let passedCount = 0;
  let totalCount = 0;

  const assert = (name: string, condition: boolean, message: string) => {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] ${name}: ${message}`);
    }
  };

  // --- TEST CATEGORY A: QR ENUMERATION & LEAKAGE ---
  console.log('\n--- Category A: QR Enumeration & Leakage ---');
  
  const activeRes = await callHandler('QR-BELLA');
  assert(
    'Active QR resolves with 200',
    activeRes.status === 200,
    `Expected status 200, got ${activeRes.status}`
  );

  const businessPayload = activeRes.json?.business;
  if (businessPayload) {
    assert(
      'Does NOT leak business passwordHash',
      businessPayload.passwordHash === undefined,
      'Leaked passwordHash!'
    );
    assert(
      'Does NOT leak businessCode',
      businessPayload.businessCode === undefined,
      'Leaked businessCode!'
    );
    assert(
      'Does NOT leak createdByRepId',
      businessPayload.createdByRepId === undefined,
      'Leaked createdByRepId!'
    );
    assert(
      'Does NOT leak createdAt metadata',
      businessPayload.createdAt === undefined,
      'Leaked createdAt!'
    );
    assert(
      'Does NOT leak subscriptions data',
      businessPayload.subscriptions === undefined,
      'Leaked subscriptions!'
    );
  } else {
    assert('Active QR has business payload', false, 'Missing business object');
  }

  // --- TEST CATEGORY B: INVALID QR HANDLING ---
  console.log('\n--- Category B: Invalid QR Handling ---');
  
  const randomRes = await callHandler('QR-999999');
  assert(
    'Random QR returns 404',
    randomRes.status === 404,
    `Expected status 404, got ${randomRes.status}`
  );
  assert(
    'Random QR returns status NOT_FOUND in body',
    randomRes.json?.status === 'NOT_FOUND',
    `Expected status NOT_FOUND, got ${randomRes.json?.status}`
  );

  const malformedRes = await callHandler('QR-SELECT-*-FROM-USER');
  assert(
    'Malformed QR returns 404',
    malformedRes.status === 404,
    `Expected status 404, got ${malformedRes.status}`
  );

  // --- TEST CATEGORY C: BUSINESS STATUS ENFORCEMENT ---
  console.log('\n--- Category C: Business Status Enforcement ---');

  // Test UNASSIGNED QR
  const unassignedRes = await callHandler('QR-000001');
  assert(
    'Unassigned QR returns 400',
    unassignedRes.status === 400,
    `Expected status 400, got ${unassignedRes.status}`
  );
  assert(
    'Unassigned QR returns status UNASSIGNED',
    unassignedRes.json?.status === 'UNASSIGNED',
    `Expected status UNASSIGNED, got ${unassignedRes.json?.status}`
  );

  // Find Cafe Paris business ID
  const cafeParis = await db.business.findUnique({ where: { slug: 'cafe-paris' } });
  if (cafeParis) {
    // 1. Test SUSPENDED status
    console.log('🔄 Setting Cafe Paris status to SUSPENDED for testing...');
    await db.business.update({
      where: { id: cafeParis.id },
      data: { status: BusinessStatus.SUSPENDED }
    });

    const suspendedRes = await callHandler('QR-PARIS');
    assert(
      'Suspended business QR returns 403',
      suspendedRes.status === 403,
      `Expected status 403, got ${suspendedRes.status}`
    );
    assert(
      'Suspended business QR returns status SUSPENDED',
      suspendedRes.json?.status === 'SUSPENDED',
      `Expected status SUSPENDED, got ${suspendedRes.json?.status}`
    );

    // 2. Test EXPIRED status
    console.log('🔄 Setting Cafe Paris status to EXPIRED for testing...');
    await db.business.update({
      where: { id: cafeParis.id },
      data: { status: BusinessStatus.EXPIRED }
    });

    const expiredRes = await callHandler('QR-PARIS');
    assert(
      'Expired business QR returns 403',
      expiredRes.status === 403,
      `Expected status 403, got ${expiredRes.status}`
    );
    assert(
      'Expired business QR returns status EXPIRED',
      expiredRes.json?.status === 'EXPIRED',
      `Expected status EXPIRED, got ${expiredRes.json?.status}`
    );

    // Restore Status
    console.log('🔄 Restoring Cafe Paris status to ACTIVE...');
    await db.business.update({
      where: { id: cafeParis.id },
      data: { status: BusinessStatus.ACTIVE }
    });
  } else {
    console.log('⚠️ Cafe Paris not found in DB, skipping status update checks.');
  }

  // Test INACTIVE/DAMAGED/REPLACED QR status
  const testQr = await db.qRInventory.findFirst({ where: { qrCode: 'QR-000002' } });
  if (testQr) {
    console.log('🔄 Temporarily setting QR-000002 status to DAMAGED...');
    await db.qRInventory.update({
      where: { id: testQr.id },
      data: { status: QRStatus.DAMAGED }
    });

    const damagedRes = await callHandler('QR-000002');
    assert(
      'Damaged QR returns 400',
      damagedRes.status === 400,
      `Expected status 400, got ${damagedRes.status}`
    );
    assert(
      'Damaged QR returns status DAMAGED in payload',
      damagedRes.json?.status === 'DAMAGED',
      `Expected status DAMAGED, got ${damagedRes.json?.status}`
    );

    // Restore Status
    console.log('🔄 Restoring QR-000002 status to UNASSIGNED...');
    await db.qRInventory.update({
      where: { id: testQr.id },
      data: { status: QRStatus.UNASSIGNED }
    });
  }

  // --- TEST CATEGORY D: PUBLIC DATA EXPOSURE ---
  console.log('\n--- Category D: Public Data Exposure ---');
  if (activeRes.status === 200) {
    const keys = Object.keys(activeRes.json);
    const expectedKeys = ['qrCode', 'status', 'business'];
    const hasOnlyExpectedKeys = keys.every(k => expectedKeys.includes(k));
    assert(
      'Root response contains only expected safe keys',
      hasOnlyExpectedKeys,
      `Exposed unexpected root keys: ${keys.join(', ')}`
    );

    const bizKeys = Object.keys(activeRes.json.business);
    const expectedBizKeys = [
      'id', 'name', 'slug', 'industry', 'logoUrl', 
      'googleReviewUrl', 'enableGoogleReviewRedirect', 'enableManagerCallback'
    ];
    const hasOnlyExpectedBizKeys = bizKeys.every(k => expectedBizKeys.includes(k));
    assert(
      'Business payload contains only expected safe keys',
      hasOnlyExpectedBizKeys,
      `Exposed unexpected business keys: ${bizKeys.join(', ')}`
    );
  }

  console.log(`\n📊 QR Security Suite Summary: ${passedCount}/${totalCount} checks passed.`);
  if (passedCount === totalCount) {
    console.log('🎉 ALL QR SECURITY CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ SOME QR SECURITY CHECKS FAILED.');
    process.exit(1);
  }
}

runSecurityTests()
  .catch(err => {
    console.error('❌ Error executing security tests:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
