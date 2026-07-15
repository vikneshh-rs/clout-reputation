import './env';
import { db } from '../src/lib/db';

async function run() {
  console.log('Deleting all businesses...');
  try {
    const res = await db.business.deleteMany({});
    console.log(`Successfully deleted ${res.count} businesses.`);
  } catch (e: any) {
    console.error('Failed to delete businesses:', e.message || e);
  }
}

run().finally(() => db.$disconnect());
