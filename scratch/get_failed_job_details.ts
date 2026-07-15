import './env';
import { db } from '../src/lib/db';

async function run() {
  const jobs = await db.notificationJob.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log('JOBS LIST:', JSON.stringify(jobs, null, 2));
}

run().finally(() => db.$disconnect());
