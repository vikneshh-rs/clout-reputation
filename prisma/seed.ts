import { PrismaClient, UserRole, Industry, BusinessStatus, QRAssetStatus, CallbackStatus, SubscriptionStatus, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing existing database records...');

  // Delete in order to satisfy foreign keys
  await prisma.notificationLog.deleteMany({});
  await prisma.notificationJob.deleteMany({});
  await prisma.businessNotificationSettings.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.callbackRequest.deleteMany({});
  await prisma.recoveryRequest.deleteMany({});
  await prisma.funnelEvent.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.qRHistory.deleteMany({});
  await prisma.qRAsset.deleteMany({});
  await prisma.qRScan.deleteMany({});
  await prisma.qRBatch.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🌱 Database cleared. Beginning seed process...');

  // Helper for password hashing
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const repPasswordHash = await bcrypt.hash('rep123', salt);
  const businessPasswordHash = await bcrypt.hash('business123', salt);

  // 1. Create Super Admin User
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Viknesh',
      email: 'admin@cloutation.com',
      username: 'deco-admin',
      passwordHash: adminPasswordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });
  console.log(`✅ Created Super Admin User: ${superAdmin.email}`);

  // Create Representative User (REP)
  const repAdmin = await prisma.user.create({
    data: {
      name: 'Field Agent Dan',
      email: 'rep@cloutation.com',
      username: 'dan',
      passwordHash: repPasswordHash,
      role: UserRole.REP,
    },
  });
  console.log(`✅ Created Representative User: ${repAdmin.email}`);

  // 2. Create Businesses (Bella Italia [Restaurant], Luxe Salon [Salon], Cafe Paris [Cafe])
  const b1 = await prisma.business.create({
    data: {
      name: 'Bella Italia',
      slug: 'bella-italia',
      businessCode: 'CR-000001',
      passwordHash: businessPasswordHash,
      industry: Industry.RESTAURANT,
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ313_placeholder1',
      phone: '+15550212',
      address: '123 Pizza Way, Rome',
      isActive: true,
      status: BusinessStatus.ACTIVE,
      createdByRepId: repAdmin.id,
      notificationSettings: {
        create: {}
      }
    },
  });

  const b2 = await prisma.business.create({
    data: {
      name: 'Luxe Salon',
      slug: 'luxe-salon',
      businessCode: 'CR-000002',
      passwordHash: businessPasswordHash,
      industry: Industry.SALON,
      logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&auto=format&fit=crop',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ313_placeholder2',
      phone: '+15550213',
      address: '456 Beauty Blvd, New York',
      isActive: true,
      status: BusinessStatus.ACTIVE,
      createdByRepId: repAdmin.id,
      notificationSettings: {
        create: {}
      }
    },
  });

  const b3 = await prisma.business.create({
    data: {
      name: 'Cafe Paris',
      slug: 'cafe-paris',
      businessCode: 'CR-000003',
      passwordHash: businessPasswordHash,
      industry: Industry.CAFE,
      logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&auto=format&fit=crop',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ313_placeholder3',
      phone: '+15550214',
      address: '789 Croissant St, Paris',
      isActive: true,
      status: BusinessStatus.ACTIVE,
      createdByRepId: repAdmin.id,
      notificationSettings: {
        create: {}
      }
    },
  });
  console.log('✅ Created Businesses (Bella Italia, Luxe Salon, Cafe Paris) linked to REP Dan');

  // 3. Create Subscriptions
  await prisma.subscription.create({
    data: {
      businessId: b1.id,
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  await prisma.subscription.create({
    data: {
      businessId: b2.id,
      plan: SubscriptionPlan.TRIAL,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  await prisma.subscription.create({
    data: {
      businessId: b3.id,
      plan: SubscriptionPlan.BASIC,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
    },
  });
  console.log('✅ Created Business Subscriptions');

  // 4. Create QRAsset records
  // Create ASSIGNED QRs for seeded businesses
  const qrCodes = ['cqr-A001', 'cqr-A002', 'cqr-A003'];
  const businesses = [b1, b2, b3];

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    const qrCode = qrCodes[i];

    const qrAsset = await prisma.qRAsset.create({
      data: {
        qrCode,
        status: QRAssetStatus.ASSIGNED,
        assignedBusinessId: biz.id,
        assignedBy: repAdmin.id,
        assignedDate: new Date(),
      },
    });

    // Update active QR pointer in Business record
    await prisma.business.update({
      where: { id: biz.id },
      data: {
        assignedQrAssetId: qrAsset.id,
      },
    });

    // Create Assignment Log History
    await prisma.qRHistory.create({
      data: {
        qrAssetId: qrAsset.id,
        businessId: biz.id,
        assignedBy: repAdmin.id,
        assignedAt: new Date(),
      },
    });
  }

  console.log('✅ Seeded QR inventory with active QR codes');

  // 5. Create Reviews
  const reviewsData = [
    // Bella Italia Reviews
    { rating: 5, comment: 'Phenomenal pasta, service was super prompt!', name: 'Alice Smith', phone: null, callback: false, bId: b1.id },
    { rating: 4, comment: 'Lovely atmosphere and great wine list.', name: 'Bob Jones', phone: null, callback: false, bId: b1.id },
    { rating: 2, comment: 'The pizza was burnt and took 40 minutes.', name: 'Charlie Brown', phone: '+15550199', callback: true, bId: b1.id },
    { rating: 5, comment: 'Amazing tiramisu. Will definitely return.', name: 'Diana Prince', phone: null, callback: false, bId: b1.id },
    { rating: 1, comment: 'Hair in my food, manager was very rude!', name: 'Edward Nygma', phone: '+15550123', callback: true, bId: b1.id },

    // Luxe Salon Reviews
    { rating: 5, comment: 'Velvet smooth haircut, the staff was extremely friendly!', name: 'Ian Malcolm', phone: null, callback: false, bId: b2.id },
    { rating: 3, comment: 'Haircut was fine, but wait time was longer than expected.', name: 'Julia Roberts', phone: '+15550987', callback: true, bId: b2.id },

    // Cafe Paris Reviews
    { rating: 5, comment: 'Best croissants outside of France! Fresh coffee too.', name: 'Miles Morales', phone: null, callback: false, bId: b3.id },
  ];

  for (const r of reviewsData) {
    const isPositive = r.rating >= 4;
    const sentiment = isPositive ? 'Positive' : 'Negative';
    let themes = '';
    if (r.comment) {
      const commentLower = r.comment.toLowerCase();
      if (commentLower.includes('food') || commentLower.includes('pasta') || commentLower.includes('croissant') || commentLower.includes('tiramisu') || commentLower.includes('pizza')) {
        themes = 'Food Quality';
      } else if (commentLower.includes('staff') || commentLower.includes('manager') || commentLower.includes('rude') || commentLower.includes('friendly') || commentLower.includes('service')) {
        themes = 'Service';
      } else if (commentLower.includes('atmosphere') || commentLower.includes('decor') || commentLower.includes('wine')) {
        themes = 'Ambience';
      } else if (commentLower.includes('time') || commentLower.includes('wait') || commentLower.includes('delay') || commentLower.includes('slow')) {
        themes = 'Waiting Time';
      }
    }

    const review = await prisma.review.create({
      data: {
        rating: r.rating,
        comment: r.comment,
        customerName: r.name,
        customerPhone: r.phone,
        requestCallback: r.callback,
        callbackStatus: r.callback ? CallbackStatus.PENDING : CallbackStatus.RESOLVED,
        businessId: r.bId,
        sentiment,
        themes: themes || (isPositive ? 'Service' : 'Waiting Time')
      },
    });

    if (r.callback && r.phone && r.name) {
      await prisma.callbackRequest.create({
        data: {
          reviewId: review.id,
          customerName: r.name,
          phoneNumber: r.phone,
          status: CallbackStatus.PENDING,
        },
      });
    }

    // Every rating < 4 automatically creates a Recovery Request
    if (r.rating < 4) {
      const priority = (r.rating <= 2 || r.callback) ? 'HIGH' : 'MEDIUM';
      await prisma.recoveryRequest.create({
        data: {
          businessId: r.bId,
          reviewId: review.id,
          customerName: r.name || 'Anonymous Guest',
          whatsappNumber: r.phone || '+15550000',
          rating: r.rating,
          feedback: r.comment,
          callbackRequested: r.callback,
          status: 'NEW',
          priority: priority as any,
          createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2) // 2 days ago
        }
      });
    }
  }
  console.log(`✅ Seeded ${reviewsData.length} Reviews, CallbackRequests, and RecoveryRequests successfully!`);

  // 5.5 Seed FunnelEvents for analytics
  console.log('🌱 Seeding FunnelEvents...');
  const funnelData = [
    { bId: b1.id, scans: 140, starts: 110, submits: 65, redirects: 35 },
    { bId: b2.id, scans: 95, starts: 70, submits: 45, redirects: 20 },
    { bId: b3.id, scans: 60, starts: 45, submits: 25, redirects: 15 }
  ];

  const funnelEventsToCreate: any[] = [];

  for (const data of funnelData) {
    for (let day = 0; day < 12; day++) {
      const date = new Date(Date.now() - day * 24 * 3600 * 1000);
      const ratio = 1 - (day * 0.04);
      
      const scansCount = Math.max(1, Math.floor(data.scans * ratio / 12));
      const startsCount = Math.max(1, Math.floor(data.starts * ratio / 12));
      const submitsCount = Math.max(1, Math.floor(data.submits * ratio / 12));
      const redirectsCount = Math.max(0, Math.floor(data.redirects * ratio / 12));
      
      const sessionIdBase = `sess-${data.bId.substring(0, 4)}-d${day}`;

      for (let i = 0; i < scansCount; i++) {
        funnelEventsToCreate.push({
          businessId: data.bId,
          stage: 'SCAN',
          timestamp: date,
          reviewSessionId: `${sessionIdBase}-s${i}`
        });
      }
      for (let i = 0; i < startsCount; i++) {
        funnelEventsToCreate.push({
          businessId: data.bId,
          stage: 'START',
          timestamp: date,
          reviewSessionId: `${sessionIdBase}-st${i}`
        });
      }
      for (let i = 0; i < submitsCount; i++) {
        funnelEventsToCreate.push({
          businessId: data.bId,
          stage: 'SUBMIT',
          timestamp: date,
          reviewSessionId: `${sessionIdBase}-sub${i}`
        });
      }
      for (let i = 0; i < redirectsCount; i++) {
        funnelEventsToCreate.push({
          businessId: data.bId,
          stage: 'REDIRECT',
          timestamp: date,
          reviewSessionId: `${sessionIdBase}-r${i}`
        });
      }
    }
  }

  await prisma.funnelEvent.createMany({
    data: funnelEventsToCreate
  });
  console.log('✅ Seeded FunnelEvents successfully!');

  // 6. Seed Activity Logs
  const activityLogs = [
    { uId: superAdmin.id, action: 'Business Onboarded', type: 'BUSINESS', eId: b1.id, meta: JSON.stringify({ name: b1.name, industry: b1.industry }) },
    { uId: superAdmin.id, action: 'Business Onboarded', type: 'BUSINESS', eId: b2.id, meta: JSON.stringify({ name: b2.name, industry: b2.industry }) },
    { uId: superAdmin.id, action: 'Business Onboarded', type: 'BUSINESS', eId: b3.id, meta: JSON.stringify({ name: b3.name, industry: b3.industry }) },
    { uId: repAdmin.id, action: 'QR Code Assigned', type: 'BUSINESS', eId: b1.id, meta: JSON.stringify({ qrCode: 'QR-BELLA', businessId: b1.id }) },
    { uId: repAdmin.id, action: 'QR Code Assigned', type: 'BUSINESS', eId: b2.id, meta: JSON.stringify({ qrCode: 'QR-LUXE', businessId: b2.id }) },
    { uId: repAdmin.id, action: 'QR Code Assigned', type: 'BUSINESS', eId: b3.id, meta: JSON.stringify({ qrCode: 'QR-PARIS', businessId: b3.id }) },
  ];

  for (const log of activityLogs) {
    await prisma.activityLog.create({
      data: {
        userId: log.uId,
        action: log.action,
        entityType: log.type,
        entityId: log.eId,
        metadata: log.meta
      }
    });
  }

  console.log(`✅ Seeded ${activityLogs.length} Activity Logs successfully!`);
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
