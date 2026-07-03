import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function checkDb() {
  const count = await db.qRAsset.count();
  console.log(`Total QR assets in DB: ${count}`);
  const firstFive = await db.qRAsset.findMany({ take: 5 });
  console.log("First 5 QR assets:", firstFive);
}

checkDb().catch(console.error);
