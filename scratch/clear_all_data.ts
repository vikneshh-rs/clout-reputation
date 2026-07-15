import './env';
import { db } from '../src/lib/db';

async function run() {
  console.log('Clearing all database tables...');
  try {
    await db.notificationLog.deleteMany({});
    console.log('Cleared NotificationLogs');
    
    await db.notificationJob.deleteMany({});
    console.log('Cleared NotificationJobs');
    
    await db.callbackRequest.deleteMany({});
    console.log('Cleared CallbackRequests');
    
    await db.recoveryRequest.deleteMany({});
    console.log('Cleared RecoveryRequests');
    
    await db.funnelEvent.deleteMany({});
    console.log('Cleared FunnelEvents');
    
    await db.qRScan.deleteMany({});
    console.log('Cleared QRScans');
    
    await db.qRHistory.deleteMany({});
    console.log('Cleared QRHistories');
    
    await db.activityLog.deleteMany({});
    console.log('Cleared ActivityLogs');
    
    await db.subscription.deleteMany({});
    console.log('Cleared Subscriptions');
    
    await db.businessNotificationSettings.deleteMany({});
    console.log('Cleared BusinessNotificationSettings');
    
    await db.review.deleteMany({});
    console.log('Cleared Reviews');
    
    await db.business.deleteMany({});
    console.log('Cleared Businesses');
    
    await db.qRAsset.deleteMany({});
    console.log('Cleared QRAssets');
    
    await db.qRBatch.deleteMany({});
    console.log('Cleared QRBatches');
    
    await db.user.deleteMany({});
    console.log('Cleared Users');

    console.log('Database successfully cleared!');
  } catch (e: any) {
    console.error('Failed to clear database:', e.message || e);
  }
}

run().finally(() => db.$disconnect());
