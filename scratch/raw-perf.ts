import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
const db = new PrismaClient();

async function runRawAudit() {
  console.log("--- Raw Prisma query performance ---");
  const testQr = 'cqr-S002';

  // Warm-up
  await db.qRAsset.findUnique({ where: { qrCode: testQr } });

  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await db.qRAsset.findUnique({
      where: { qrCode: testQr },
      select: {
        qrCode: true,
        status: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
    const end = performance.now();
    times.push(end - start);
    console.log(`Query ${i + 1}: ${(end - start).toFixed(2)}ms`);
  }

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`Average query time: ${average.toFixed(2)}ms`);
}

runRawAudit().catch(console.error);
