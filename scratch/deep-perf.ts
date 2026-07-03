import { performance } from 'perf_hooks';

async function runDeepPerf() {
  console.log("=== STARTING DEEP PERFORMANCE ANALYSIS ===");

  // 1. Measure Prisma Client Import & Initialization
  const initStart = performance.now();
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  const initEnd = performance.now();
  console.log(`1. Prisma Client Import & Instantiation took: ${(initEnd - initStart).toFixed(2)}ms`);

  // 2. Measure Connection Acquisition + First Query (Cold Start Query)
  const query1Start = performance.now();
  await db.$queryRaw`SELECT 1`;
  const query1End = performance.now();
  console.log(`2. First Query (Engine Load + Connection Acquisition) took: ${(query1End - query1Start).toFixed(2)}ms`);

  // 3. Measure Subsequent Query (Warm Query - Connection Pool Active)
  const query2Start = performance.now();
  await db.$queryRaw`SELECT 1`;
  const query2End = performance.now();
  console.log(`3. Subsequent Warm Query took: ${(query2End - query2Start).toFixed(2)}ms`);

  // 4. Run EXPLAIN ANALYZE on standard QRAsset query
  console.log("\n4. Running EXPLAIN ANALYZE on QR Code lookup...");
  const testQr = 'cqr-S002';
  try {
    const explainResult = await db.$queryRawUnsafe<any[]>(
      `EXPLAIN ANALYZE SELECT * FROM "qr_assets" WHERE "qr_code" = $1`,
      testQr
    );
    console.log("EXPLAIN ANALYZE result:");
    console.log(explainResult.map(r => r['QUERY PLAN']).join('\n'));
  } catch (err: any) {
    console.error("Failed to run EXPLAIN:", err.message || err);
  }

  // 5. Measure actual QR code search query
  const qrQueryStart = performance.now();
  await db.qRAsset.findUnique({
    where: { qrCode: testQr }
  });
  const qrQueryEnd = performance.now();
  console.log(`\n5. Actual QRAsset findUnique query took: ${(qrQueryEnd - qrQueryStart).toFixed(2)}ms`);
}

runDeepPerf().catch(console.error);
