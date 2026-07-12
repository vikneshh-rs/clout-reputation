import { db } from '../src/lib/db';
import { performance } from 'perf_hooks';
import { QRAssetStatus } from '@prisma/client';

async function runMeasure() {
  console.log("=== DB PERFORMANCE DETAILED MEASUREMENT ===");

  // 1. Prisma Connection Warmup
  console.log("Warming up database connection...");
  const startWarm = performance.now();
  await db.$queryRaw`SELECT 1`;
  const endWarm = performance.now();
  console.log(`Warmup (SELECT 1) took: ${(endWarm - startWarm).toFixed(2)}ms\n`);

  // 1b. Table row counts
  console.log("Checking table row counts...");
  const businessCount = await db.business.count();
  const qrAssetCount = await db.qRAsset.count();
  const qrScanCount = await db.qRScan.count();
  console.log(`Row counts - Business: ${businessCount}, QRAsset: ${qrAssetCount}, QRScan: ${qrScanCount}\n`);

  // 2. Measure findUnique QR Asset (uses index, standard casing)
  console.log("Query 1: findUnique qRAsset (case-sensitive index)");
  const startQ1 = performance.now();
  const q1 = await db.qRAsset.findUnique({
    where: { qrCode: "cqr-S001" },
    select: {
      qrCode: true,
      status: true,
      business: {
        select: { id: true, name: true }
      }
    }
  });
  const endQ1 = performance.now();
  console.log(`Query 1 took: ${(endQ1 - startQ1).toFixed(2)}ms (found: ${q1 ? 'Yes' : 'No'})\n`);

  // 3. Measure raw SQL equivalent query execution time
  console.log("Query 2: Raw SQL SELECT from qr_assets");
  const startRaw = performance.now();
  const rawResult = await db.$queryRawUnsafe(`
    SELECT q."qr_code", q."status", b."id", b."name"
    FROM "qr_assets" q
    LEFT JOIN "Business" b ON q."assigned_business_id" = b."id"
    WHERE q."qr_code" = $1
    LIMIT 1
  `, "cqr-S001");
  const endRaw = performance.now();
  console.log(`Raw SQL took: ${(endRaw - startRaw).toFixed(2)}ms\n`);

  // 4. Run EXPLAIN ANALYZE on the query
  console.log("Query 3: EXPLAIN ANALYZE of the SELECT query");
  const explain: any = await db.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT q."qr_code", q."status", b."id", b."name"
    FROM "qr_assets" q
    LEFT JOIN "Business" b ON q."assigned_business_id" = b."id"
    WHERE q."qr_code" = 'cqr-S001'
    LIMIT 1
  `);
  console.log("Explain output:");
  explain.forEach((row: any) => console.log(row['QUERY PLAN']));
  console.log("");
}

runMeasure()
  .catch(console.error)
  .finally(() => db.$disconnect());
