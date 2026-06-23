import './env';
import { db } from '../src/lib/db';
import { 
  getSuperAdminStats, 
  getBusinessAnalytics, 
  getReviewsByBusiness 
} from '../src/lib/data';
import { BusinessStatus, QRStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

async function runPerfTests() {
  console.log('🧪 Starting Performance Test Suite...');
  
  const BIZ_COUNT = 100;
  const bizPrefix = 'PERF-Biz-';
  const qrPrefix = 'PERF-QR-';
  
  // Find creator User (REP) to associate with creation
  const repUser = await db.user.findFirst({ where: { role: 'REP' } });
  if (!repUser) {
    throw new Error('No REP user found. Seed the DB first.');
  }

  // Pre-generate business details
  const businessesData: any[] = [];
  const qrCodesData: any[] = [];
  
  for (let i = 1; i <= BIZ_COUNT; i++) {
    const numStr = String(i).padStart(3, '0');
    businessesData.push({
      name: `${bizPrefix}${numStr}`,
      slug: `perf-biz-${numStr}`,
      businessCode: `CR-PERF${numStr}`,
      passwordHash: 'dummyhash',
      industry: 'RESTAURANT',
      createdByRepId: repUser.id,
      status: BusinessStatus.ACTIVE
    });
    
    qrCodesData.push({
      qrCode: `${qrPrefix}${numStr}`,
      status: QRStatus.ASSIGNED,
    });
  }

  console.log(`Step 1: Seeding ${BIZ_COUNT} businesses...`);
  
  // Clean up any old runs just in case
  await cleanupData(bizPrefix, qrPrefix);

  try {
    // Insert Businesses
    await db.business.createMany({ data: businessesData });
    const insertedBusinesses = await db.business.findMany({
      where: { name: { startsWith: bizPrefix } },
      select: { id: true, name: true }
    });
    
    const bizMap = new Map(insertedBusinesses.map(b => [b.name, b.id]));

    // Insert Subscriptions and QRs
    const subscriptionsData: any[] = [];
    const qrInventoryToCreate: any[] = [];
    const assignmentLogsToCreate: any[] = [];

    for (let i = 1; i <= BIZ_COUNT; i++) {
      const numStr = String(i).padStart(3, '0');
      const bizName = `${bizPrefix}${numStr}`;
      const bizId = bizMap.get(bizName)!;
      
      subscriptionsData.push({
        businessId: bizId,
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      qrInventoryToCreate.push({
        qrCode: `${qrPrefix}${numStr}`,
        status: QRStatus.ASSIGNED,
        assignedBusinessId: bizId,
        assignedBy: repUser.id,
        assignedAt: new Date()
      });
    }

    await db.subscription.createMany({ data: subscriptionsData });
    await db.qRInventory.createMany({ data: qrInventoryToCreate });

    // Retrieve inserted QRs to create assignment logs
    const insertedQrs = await db.qRInventory.findMany({
      where: { qrCode: { startsWith: qrPrefix } }
    });

    for (const qr of insertedQrs) {
      assignmentLogsToCreate.push({
        qrInventoryId: qr.id,
        businessId: qr.assignedBusinessId!,
        assignedBy: repUser.id,
        action: 'ASSIGNED'
      });
    }
    await db.assignmentLog.createMany({ data: assignmentLogsToCreate });

    console.log(`✅ Seeded ${BIZ_COUNT} businesses, subscriptions, and QR codes.`);

    // Helper for timing functions
    const timeQuery = async (fn: () => Promise<any>, runs = 3) => {
      let totalTime = 0;
      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        await fn();
        totalTime += (performance.now() - start);
      }
      return parseFloat((totalTime / runs).toFixed(2));
    };

    const targetBizId = insertedBusinesses[0].id;
    const targetQrCode = `${qrPrefix}001`;

    const runBenchmark = async (label: string) => {
      console.log(`\n⏱️ Measuring query latency: ${label}...`);
      
      const adminStats = await timeQuery(() => getSuperAdminStats());
      const bizAnalytics = await timeQuery(() => getBusinessAnalytics(targetBizId, '30d'));
      const bizReviews = await timeQuery(() => getReviewsByBusiness(targetBizId, {}));
      
      const qrResolve = await timeQuery(() => 
        db.qRInventory.findUnique({
          where: { qrCode: targetQrCode },
          include: { business: true }
        })
      );
      
      const reviewSubmit = await timeQuery(async () => {
        const rev = await db.review.create({
          data: {
            rating: 5,
            comment: 'Performance benchmark review',
            businessId: targetBizId
          }
        });
        // cleanup immediately
        await db.review.delete({ where: { id: rev.id } });
      }, 1); // Only run once to avoid DB overhead

      return {
        label,
        adminStats,
        bizAnalytics,
        bizReviews,
        qrResolve,
        reviewSubmit
      };
    };

    // 1. Benchmark at 0 reviews
    const results0 = await runBenchmark('0 Reviews (Baseline)');

    // 2. Seed 1,000 reviews (10 per business)
    console.log('\nSeeding 1,000 reviews...');
    const reviews1k: any[] = [];
    for (let i = 0; i < 1000; i++) {
      const bizIndex = i % BIZ_COUNT;
      const bizName = `${bizPrefix}${String(bizIndex + 1).padStart(3, '0')}`;
      const bizId = bizMap.get(bizName)!;
      reviews1k.push({
        rating: (i % 5) + 1,
        comment: `Automated performance test review comment #${i}`,
        customerName: `Customer #${i}`,
        customerPhone: `+1555000${i}`,
        businessId: bizId,
        createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000) // last 15 days
      });
    }
    await db.review.createMany({ data: reviews1k });
    console.log('✅ 1,000 reviews seeded.');

    const results1k = await runBenchmark('1,000 Reviews');

    // 3. Seed 9,000 more reviews (so total 10,000 reviews)
    console.log('\nSeeding 9,000 additional reviews (total 10,000)...');
    // Chunking to avoid Postgres limit on parameters or memory limits
    const CHUNK_SIZE = 3000;
    for (let c = 0; c < 9000; c += CHUNK_SIZE) {
      const reviewsChunk: any[] = [];
      for (let i = 0; i < CHUNK_SIZE; i++) {
        const totalIdx = c + i;
        const bizIndex = totalIdx % BIZ_COUNT;
        const bizName = `${bizPrefix}${String(bizIndex + 1).padStart(3, '0')}`;
        const bizId = bizMap.get(bizName)!;
        reviewsChunk.push({
          rating: (totalIdx % 5) + 1,
          comment: `Automated performance test review comment #${totalIdx + 1000}`,
          customerName: `Customer #${totalIdx + 1000}`,
          customerPhone: `+1555900${totalIdx}`,
          businessId: bizId,
          createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
        });
      }
      await db.review.createMany({ data: reviewsChunk });
    }
    console.log('✅ Total 10,000 reviews seeded.');

    const results10k = await runBenchmark('10,000 Reviews');

    // Format results table
    console.log('\n📊 PERFORMANCE LATENCY RESULTS (in milliseconds):');
    console.log('========================================================================================');
    console.log('| Query Scenario             | 0 Reviews (Baseline) | 1,000 Reviews | 10,000 Reviews |');
    console.log('========================================================================================');
    console.log(`| Super Admin Dashboard Stats | ${results0.adminStats.toFixed(2).padEnd(20)} | ${results1k.adminStats.toFixed(2).padEnd(13)} | ${results10k.adminStats.toFixed(2).padEnd(14)} |`);
    console.log(`| Business Analytics (30d)   | ${results0.bizAnalytics.toFixed(2).padEnd(20)} | ${results1k.bizAnalytics.toFixed(2).padEnd(13)} | ${results10k.bizAnalytics.toFixed(2).padEnd(14)} |`);
    console.log(`| Business Reviews Feed      | ${results0.bizReviews.toFixed(2).padEnd(20)} | ${results1k.bizReviews.toFixed(2).padEnd(13)} | ${results10k.bizReviews.toFixed(2).padEnd(14)} |`);
    console.log(`| QR Code Resolution Check   | ${results0.qrResolve.toFixed(2).padEnd(20)} | ${results1k.qrResolve.toFixed(2).padEnd(13)} | ${results10k.qrResolve.toFixed(2).padEnd(14)} |`);
    console.log(`| Customer Review Submit     | ${results0.reviewSubmit.toFixed(2).padEnd(20)} | ${results1k.reviewSubmit.toFixed(2).padEnd(13)} | ${results10k.reviewSubmit.toFixed(2).padEnd(14)} |`);
    console.log('========================================================================================');

  } finally {
    console.log('\n🧹 Cleaning up performance test database records...');
    await cleanupData(bizPrefix, qrPrefix);
    console.log('✅ Performance test cleanup completed successfully.');
  }
}

async function cleanupData(bizPrefix: string, qrPrefix: string) {
  // Delete reviews, scans, subscriptions, QRs, and businesses generated
  const perfBusinesses = await db.business.findMany({
    where: { name: { startsWith: bizPrefix } },
    select: { id: true }
  });
  const bizIds = perfBusinesses.map(b => b.id);

  if (bizIds.length > 0) {
    await db.callbackRequest.deleteMany({ where: { review: { businessId: { in: bizIds } } } });
    await db.review.deleteMany({ where: { businessId: { in: bizIds } } });
    await db.qRScan.deleteMany({ where: { businessId: { in: bizIds } } });
    await db.assignmentLog.deleteMany({ where: { businessId: { in: bizIds } } });
    await db.subscription.deleteMany({ where: { businessId: { in: bizIds } } });
    await db.qRInventory.deleteMany({ where: { assignedBusinessId: { in: bizIds } } });
  }

  // Delete QRs that start with the prefix but might not have been assigned
  await db.qRInventory.deleteMany({ where: { qrCode: { startsWith: qrPrefix } } });
  
  // Delete businesses
  await db.business.deleteMany({ where: { name: { startsWith: bizPrefix } } });
}

runPerfTests()
  .catch(err => {
    console.error('❌ Performance benchmark test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
