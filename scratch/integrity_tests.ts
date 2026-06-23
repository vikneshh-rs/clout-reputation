import './env';
import { db } from '../src/lib/db';

async function runIntegrityTests() {
  console.log('🧪 Starting Database Integrity Test Suite...');

  let passed = 0;
  let total = 0;

  const assert = (name: string, condition: boolean, message: string) => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${name}: ${message}`);
    }
  };

  try {
    // 1. Check for Duplicate QR Codes in QRInventory
    const qrDuplicates = await db.$queryRaw<Array<{ qrCode: string; count: bigint }>>`
      SELECT "qrCode", COUNT(*) as count 
      FROM "QRInventory" 
      GROUP BY "qrCode" 
      HAVING COUNT(*) > 1
    `;
    assert(
      'No duplicate QR codes exist in QRInventory',
      qrDuplicates.length === 0,
      `Found duplicate QR codes: ${JSON.stringify(qrDuplicates)}`
    );

    // 2. Check for Duplicate Business Codes
    const businessCodeDuplicates = await db.$queryRaw<Array<{ businessCode: string; count: bigint }>>`
      SELECT "businessCode", COUNT(*) as count 
      FROM "Business" 
      GROUP BY "businessCode" 
      HAVING COUNT(*) > 1
    `;
    assert(
      'No duplicate business codes exist in Business table',
      businessCodeDuplicates.length === 0,
      `Found duplicate business codes: ${JSON.stringify(businessCodeDuplicates)}`
    );

    // 3. Check for Duplicate Slugs in Business
    const slugDuplicates = await db.$queryRaw<Array<{ slug: string; count: bigint }>>`
      SELECT "slug", COUNT(*) as count 
      FROM "Business" 
      GROUP BY "slug" 
      HAVING COUNT(*) > 1
    `;
    assert(
      'No duplicate slugs exist in Business table',
      slugDuplicates.length === 0,
      `Found duplicate slugs: ${JSON.stringify(slugDuplicates)}`
    );

    // 4. Check for Orphaned Reviews (businessId refers to a non-existent Business)
    const orphanedReviews = await db.$queryRaw<Array<{ id: string; businessId: string }>>`
      SELECT r.id, r."businessId" 
      FROM "Review" r 
      LEFT JOIN "Business" b ON r."businessId" = b.id 
      WHERE b.id IS NULL
    `;
    assert(
      'No orphaned reviews exist (all belong to valid businesses)',
      orphanedReviews.length === 0,
      `Found orphaned reviews: ${JSON.stringify(orphanedReviews)}`
    );

    // 5. Check for Orphaned CallbackRequests (reviewId refers to a non-existent Review)
    const orphanedCallbacks = await db.$queryRaw<Array<{ id: string; reviewId: string }>>`
      SELECT c.id, c."reviewId" 
      FROM "CallbackRequest" c 
      LEFT JOIN "Review" r ON c."reviewId" = r.id 
      WHERE r.id IS NULL
    `;
    assert(
      'No orphaned callback requests exist (all belong to valid reviews)',
      orphanedCallbacks.length === 0,
      `Found orphaned callbacks: ${JSON.stringify(orphanedCallbacks)}`
    );

    // 6. Check for Orphaned Subscriptions (businessId refers to a non-existent Business)
    const orphanedSubscriptions = await db.$queryRaw<Array<{ id: string; businessId: string }>>`
      SELECT s.id, s."businessId" 
      FROM "Subscription" s 
      LEFT JOIN "Business" b ON s."businessId" = b.id 
      WHERE b.id IS NULL
    `;
    assert(
      'No orphaned subscriptions exist (all belong to valid businesses)',
      orphanedSubscriptions.length === 0,
      `Found orphaned subscriptions: ${JSON.stringify(orphanedSubscriptions)}`
    );

    // 7. Check for Orphaned AssignmentLogs (referencing invalid User, QRInventory or Business)
    const orphanedAssignmentLogs = await db.$queryRaw<Array<{ id: string }>>`
      SELECT a.id 
      FROM "AssignmentLog" a
      LEFT JOIN "QRInventory" q ON a."qrInventoryId" = q.id
      LEFT JOIN "Business" b ON a."businessId" = b.id
      LEFT JOIN "User" u ON a."assignedBy" = u.id
      WHERE q.id IS NULL OR b.id IS NULL OR u.id IS NULL
    `;
    assert(
      'No orphaned assignment logs exist',
      orphanedAssignmentLogs.length === 0,
      `Found orphaned assignment logs: ${JSON.stringify(orphanedAssignmentLogs)}`
    );

    // 8. Check for Orphaned QRScans (referencing invalid Business)
    const orphanedQrScans = await db.$queryRaw<Array<{ id: string }>>`
      SELECT qs.id 
      FROM "QRScan" qs
      LEFT JOIN "Business" b ON qs."businessId" = b.id
      WHERE b.id IS NULL
    `;
    assert(
      'No orphaned QR scans exist',
      orphanedQrScans.length === 0,
      `Found orphaned QR scans: ${JSON.stringify(orphanedQrScans)}`
    );

    // 9. Verify Business createdByRepId matches an existing User if set
    const businessInvalidRep = await db.$queryRaw<Array<{ id: string; createdByRepId: string }>>`
      SELECT id, "createdByRepId"
      FROM "Business"
      WHERE "createdByRepId" IS NOT NULL 
        AND "createdByRepId" NOT IN (SELECT id FROM "User")
    `;
    assert(
      'All business creators (createdByRepId) match valid user records',
      businessInvalidRep.length === 0,
      `Found invalid createdByRepId records: ${JSON.stringify(businessInvalidRep)}`
    );

    // 10. Verify QRInventory assignedBusinessId matches an existing Business if set
    const qrInvalidBusiness = await db.$queryRaw<Array<{ id: string; assignedBusinessId: string }>>`
      SELECT id, "assignedBusinessId"
      FROM "QRInventory"
      WHERE "assignedBusinessId" IS NOT NULL 
        AND "assignedBusinessId" NOT IN (SELECT id FROM "Business")
    `;
    assert(
      'All QR inventory business assignments (assignedBusinessId) match valid business records',
      qrInvalidBusiness.length === 0,
      `Found invalid assignedBusinessId records: ${JSON.stringify(qrInvalidBusiness)}`
    );

    console.log(`\n📊 Data Integrity Summary: ${passed}/${total} checks passed.`);
    if (passed === total) {
      console.log('🎉 DATABASE DATA INTEGRITY CHECKS PASSED SUCCESSFULLY!');
    } else {
      console.log('⚠️ DATABASE INTEGRITY ISSUES FOUND!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Data integrity test execution failed:', error);
    process.exit(1);
  }
}

runIntegrityTests()
  .catch(err => {
    console.error('❌ Unexpected runner failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
