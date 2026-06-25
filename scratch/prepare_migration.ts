import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Preparing database for enum migration by clearing legacy QR assets...');
  
  // 1. Delete all assignment logs which reference QRInventory and Business
  const logsCount = await prisma.assignmentLog.deleteMany({});
  console.log(`Deleted ${logsCount.count} assignment logs.`);

  // 2. Delete all QR batches
  const batchesCount = await prisma.qRBatch.deleteMany({});
  console.log(`Deleted ${batchesCount.count} QR batches.`);

  // 3. Delete all QRInventory records
  const qrCount = await prisma.qRInventory.deleteMany({});
  console.log(`Deleted ${qrCount.count} QR inventory records.`);

  // 4. Set all business statuses to 'ACTIVE'
  const bizCount = await prisma.$executeRawUnsafe(`UPDATE "Business" SET "status" = 'ACTIVE'`);
  console.log(`Updated ${bizCount} businesses to ACTIVE.`);

  console.log('Database preparation complete.');
}

main()
  .catch(err => {
    console.error('Error preparing database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
