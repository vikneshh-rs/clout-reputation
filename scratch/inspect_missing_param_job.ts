import './env';
import { db } from '../src/lib/db';

async function run() {
  const jobId = '0a3208a1-503f-40cb-b73c-f944522d9baa';
  const job = await db.notificationJob.findUnique({
    where: { id: jobId }
  });
  console.log('JOB DETAILS:', JSON.stringify(job, null, 2));
}

run().finally(() => db.$disconnect());
