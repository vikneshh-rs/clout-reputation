import './env';
import { createReview } from '../src/lib/data';
import { db } from '../src/lib/db';

async function run() {
  // 1. Submit review for McDonald's (which will trigger alert to +919092334499)
  const mcd = await db.business.findFirst({
    where: { name: { contains: "McDonald" } }
  });
  
  if (mcd) {
    console.log(`Submitting 3-star review for McDonald's (ID: ${mcd.id})...`);
    const r1 = await createReview({
      rating: 3,
      comment: 'Staff behaviour was not good at McDonald\'s. Please check.',
      customerName: 'Real Customer (Jithu)',
      customerPhone: '+919092334499',
      requestCallback: false,
      businessId: mcd.id
    });
    console.log('McDonald\'s review submitted:', r1.id);
  } else {
    console.warn('McDonald\'s business not found.');
  }

  // 2. Submit review for Cloutation (which will trigger alert to +918825460719)
  const clout = await db.business.findFirst({
    where: { name: { contains: "Cloutation" } }
  });

  if (clout) {
    console.log(`Submitting 2-star review with callback request for Cloutation (ID: ${clout.id})...`);
    const r2 = await createReview({
      rating: 2,
      comment: 'Service quality needs improvement at Cloutation. I need a callback.',
      customerName: 'Real Customer (Viknesh)',
      customerPhone: '+918825460719',
      requestCallback: true,
      businessId: clout.id
    });
    console.log('Cloutation review submitted:', r2.id);
  } else {
    console.warn('Cloutation business not found.');
  }
}

run().finally(() => db.$disconnect());
