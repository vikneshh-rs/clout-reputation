import './env';
import { db } from '../src/lib/db';
import { NotificationService } from '../src/lib/notifications/services/NotificationService';
import { DispatcherService } from '../src/lib/notifications/services/DispatcherService';
import { NotificationType, NotificationChannel, NotificationProvider } from '../src/lib/notifications/types/enums';
import { NotificationFactory } from '../src/lib/notifications/factories/NotificationFactory';

async function run() {
  console.log('Finding or creating test business...');
  let business = await db.business.findFirst({
    where: { whatsappNumber: '+918825460719' }
  });
  if (!business) {
    console.log('No business found with whatsappNumber "+918825460719", finding any business...');
    business = await db.business.findFirst();
  }
  
  if (!business) {
    console.error('No business found in the database. Please seed first.');
    return;
  }

  console.log(`Using Business: ${business.name} (ID: ${business.id}, WhatsApp: ${business.whatsappNumber})`);

  // Create a mock review
  const review = {
    id: 'test-review-id',
    rating: 3,
    comment: 'Test negative feedback comment from Antigravity',
    customerName: 'Test customer name',
    customerPhone: '+918825460719'
  } as any;

  console.log('Generating payload using NotificationFactory...');
  const message = NotificationFactory.createMessage(
    NotificationType.NEGATIVE_FEEDBACK,
    '+918825460719',
    review,
    business
  );

  console.log('Payload generated:', JSON.stringify(message, null, 2));

  console.log('Creating notification job in database...');
  const job = await NotificationService.createJob({
    businessId: business.id,
    channel: NotificationChannel.WHATSAPP,
    provider: NotificationProvider.META,
    notificationType: NotificationType.NEGATIVE_FEEDBACK,
    recipient: '+918825460719',
    payload: message,
  });

  console.log(`Created Job ID: ${job.id}. Attempting dispatch...`);
  
  try {
    const result = await DispatcherService.dispatch(job.id);
    console.log('Dispatch execution completed.');
    const updatedJob = await db.notificationJob.findUnique({
      where: { id: job.id }
    });
    console.log('Updated Job details:', JSON.stringify(updatedJob, null, 2));
  } catch (e: any) {
    console.error('Error during dispatch execution:', e.message || e);
  }
}

run().finally(() => db.$disconnect());
