import './env';
import { db } from '../src/lib/db';

async function checkS002() {
  try {
    const asset = await db.qRAsset.findUnique({
      where: { qrCode: 'cqr-S002' },
      include: {
        business: {
          include: {
            reviews: {
              orderBy: { createdAt: 'desc' },
              take: 2
            }
          }
        }
      }
    });

    if (!asset || !asset.business) {
      console.log('cqr-S002 business not found');
      return;
    }

    console.log('Business name:', asset.business.name);
    console.log('WhatsApp number:', asset.business.whatsappNumber);
    console.log('Last reviews:');
    asset.business.reviews.forEach(r => {
      console.log(`- ID: ${r.id}, Rating: ${r.rating}, Comment: ${r.comment}`);
    });

    // Check if any notification jobs exist for this business
    const jobs = await db.notificationJob.findMany({
      where: { businessId: asset.business.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('Notification Jobs:', jobs.length);
    jobs.forEach(j => {
      console.log(`- Job ID: ${j.id}, Status: ${j.status}, Type: ${j.notificationType}, Recipient: ${j.recipient}, Error: ${j.error}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await db.$disconnect();
  }
}

checkS002();
