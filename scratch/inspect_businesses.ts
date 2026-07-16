import './env';
import { db } from '../src/lib/db';

async function run() {
  console.log('Inspecting businesses "McDonald\'s" and "Cloutation"...');
  
  const mcd = await db.business.findFirst({
    where: { name: { contains: "McDonald" } },
    include: { notificationSettings: true }
  });
  
  const clout = await db.business.findFirst({
    where: { name: { contains: "Cloutation" } },
    include: { notificationSettings: true }
  });

  console.log('MCDONALD\'S RECORD:', JSON.stringify(mcd, null, 2));
  console.log('CLOUTATION RECORD:', JSON.stringify(clout, null, 2));
}

run().finally(() => db.$disconnect());
