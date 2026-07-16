import './env';
import { db } from '../src/lib/db';

async function run() {
  const jobId = 'f996c89b-e187-40e7-a2c4-f395aa8bbc64';
  const job = await db.notificationJob.findUnique({
    where: { id: jobId }
  });
  console.log('JOB DETAILS:', JSON.stringify(job, null, 2));
}

run().finally(() => db.$disconnect());
