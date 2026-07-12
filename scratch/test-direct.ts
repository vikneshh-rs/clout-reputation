import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

// Override DATABASE_URL with DIRECT_URL
const directUrl = process.env.DIRECT_URL || "postgresql://postgres.spvnbpysslrbhcmmutdp:SriSurjithjithuviknesh@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";
process.env.DATABASE_URL = directUrl;

const db = new PrismaClient({
  log: ['query']
});

async function runMeasure() {
  console.log("=== DB PERFORMANCE DIRECT CONNECTION MEASUREMENT ===");

  // 1. Prisma Connection Warmup
  console.log("Warming up database connection...");
  const startWarm = performance.now();
  await db.$queryRaw`SELECT 1`;
  const endWarm = performance.now();
  console.log(`Warmup (SELECT 1) took: ${(endWarm - startWarm).toFixed(2)}ms\n`);

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

  // 3. Run Query 1 again to test connection reuse latency
  console.log("Query 1 (Repeated): findUnique qRAsset");
  const startQ1_rep = performance.now();
  const q1_rep = await db.qRAsset.findUnique({
    where: { qrCode: "cqr-S001" },
    select: {
      qrCode: true,
      status: true,
      business: {
        select: { id: true, name: true }
      }
    }
  });
  const endQ1_rep = performance.now();
  console.log(`Query 1 (Repeated) took: ${(endQ1_rep - startQ1_rep).toFixed(2)}ms (found: ${q1_rep ? 'Yes' : 'No'})\n`);

  // 4. Measure raw SQL
  console.log("Query 2: Raw SQL SELECT");
  for (let i = 1; i <= 3; i++) {
    const startRaw = performance.now();
    const rawResult = await db.$queryRawUnsafe(`
      SELECT q."qr_code", q."status", b."id", b."name"
      FROM "qr_assets" q
      LEFT JOIN "Business" b ON q."assigned_business_id" = b."id"
      WHERE q."qr_code" = 'cqr-S001'
      LIMIT 1
    `);
    const endRaw = performance.now();
    console.log(`Raw SQL Run ${i} took: ${(endRaw - startRaw).toFixed(2)}ms`);
  }
}

runMeasure()
  .catch(console.error)
  .finally(() => db.$disconnect());
