import './env';
import { PrismaClient } from '@prisma/client';

async function run() {
  console.log('test_db_conn: process.env.DATABASE_URL =', process.env.DATABASE_URL);
  console.log('test_db_conn: process.env.DIRECT_URL =', process.env.DIRECT_URL);
  console.log('Testing pooler database URL...');
  try {
    const prismaPool = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    const res = await prismaPool.business.findFirst();
    console.log('Pooler connection succeeded!', res?.name);
    await prismaPool.$disconnect();
  } catch (e: any) {
    console.error('Pooler connection failed:', e.message || e);
  }

  console.log('Testing direct database URL...');
  try {
    const prismaDirect = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DIRECT_URL
        }
      }
    });
    const res = await prismaDirect.business.findFirst();
    console.log('Direct connection succeeded!', res?.name);
    await prismaDirect.$disconnect();
  } catch (e: any) {
    console.error('Direct connection failed:', e.message || e);
  }
}

run();
