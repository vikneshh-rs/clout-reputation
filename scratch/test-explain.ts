import { db } from '../src/lib/db';

async function runExplain() {
  // Explain exact match query
  console.log("=== EXPLAIN EXACT MATCH ===");
  const explainExact: any = await db.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT q."qr_code", q."status", b."id"
    FROM "qr_assets" q
    INNER JOIN "Business" b ON q."assigned_business_id" = b."id"
    WHERE q."qr_code" = 'cqr-S001'
    LIMIT 1
  `);
  explainExact.forEach((row: any) => console.log(row['QUERY PLAN']));

  // Explain OR query (case-insensitive fallback included)
  console.log("\n=== EXPLAIN OR LOWER ===");
  const explainOr: any = await db.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT q."qr_code", q."status", b."id"
    FROM "qr_assets" q
    INNER JOIN "Business" b ON q."assigned_business_id" = b."id"
    WHERE q."qr_code" = 'cqr-S001' OR LOWER(q."qr_code") = LOWER('cqr-S001')
    LIMIT 1
  `);
  explainOr.forEach((row: any) => console.log(row['QUERY PLAN']));
}

runExplain()
  .catch(console.error)
  .finally(() => db.$disconnect());
