import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Checking QR inventory tables in the database...');
  try {
    const qrCount = await prisma.qRInventory.count();
    console.log(`✅ QRInventory table exists! Total records: ${qrCount}`);
    
    const logCount = await prisma.assignmentLog.count();
    console.log(`✅ AssignmentLog table exists! Total records: ${logCount}`);
  } catch (error: any) {
    console.error('❌ Table check failed. You might need to run database migrations:', error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
