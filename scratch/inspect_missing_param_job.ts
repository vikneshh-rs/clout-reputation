import './env';
import { db } from '../src/lib/db';

async function run() {
  const jobId = '31a766ee-69bf-4f97-bee7-c0c64acd5ee3';
  const job = await db.notificationJob.findUnique({
    where: { id: jobId }
  });
  console.log('JOB DETAILS:', JSON.stringify(job, null, 2));
}

run().finally(() => db.$disconnect());
