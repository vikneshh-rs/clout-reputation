import { db } from './db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  User,
  Business,
  Review,
  CallbackRequest,
  Subscription,
  ActivityLog,
  QRScan,
  QRAsset,
  QRHistory,
  QRBatch,
  UserRole,
  Industry,
  BusinessStatus,
  QRAssetStatus,
  CallbackStatus,
  SubscriptionStatus,
  SubscriptionPlan,
  RecoveryStatus,
  RecoveryPriority,
  RecoveryRequest,
  FunnelStage,
  FunnelEvent
} from '@prisma/client';

// Caching variables for user/business profile lookups
const userCache = new Map<string, { data: any; timestamp: number }>();
const businessCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds


// Helper to generate a unique 8-character uppercase alphanumeric QR Code (e.g. QRYX7P2R)
export function generateUniqueCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'QR-';
  for (let i = 0; i < length - 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// In-Memory Mock Data Store (seeded with the same data as prisma/seed.ts)
export let mockBusinesses: Business[] = [
  { id: 'b1', name: 'Bella Italia', slug: 'bella-italia', businessCode: 'CR-000001', passwordHash: '', industry: Industry.RESTAURANT, logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop', googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ313_placeholder1', phone: '+15550212', address: '123 Pizza Way, Rome', isActive: true, status: BusinessStatus.ACTIVE, deletedAt: null, enableGoogleReviewRedirect: true, enableManagerCallback: true, createdByRepId: 'u-rep1', createdAt: new Date(), updatedAt: new Date(), description: 'Authentic Italian cuisine in the heart of Rome.', contactPerson: 'Giovanni Rossi', category: 'Restaurant', website: 'https://bellaitalia.com', googleMapsUrl: 'https://maps.google.com/?cid=bella-italia', assignedQrAssetId: 'inv-b1' },
  { id: 'b2', name: 'Luxe Salon', slug: 'luxe-salon', businessCode: 'CR-000002', passwordHash: '', industry: Industry.SALON, logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&auto=format&fit=crop', googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ313_placeholder2', phone: '+15550213', address: '456 Beauty Blvd, New York', isActive: true, status: BusinessStatus.ACTIVE, deletedAt: null, enableGoogleReviewRedirect: true, enableManagerCallback: true, createdByRepId: 'u-rep1', createdAt: new Date(), updatedAt: new Date(), description: 'Premium hair and beauty treatments.', contactPerson: 'Sarah Jenkins', category: 'Salon', website: 'https://luxesalon.com', googleMapsUrl: 'https://maps.google.com/?cid=luxe-salon', assignedQrAssetId: 'inv-b2' },
  { id: 'b3', name: 'Cafe Paris', slug: 'cafe-paris', businessCode: 'CR-000003', passwordHash: '', industry: Industry.CAFE, logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&auto=format&fit=crop', googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ313_placeholder3', phone: '+15550214', address: '789 Croissant St, Paris', isActive: true, status: BusinessStatus.ACTIVE, deletedAt: null, enableGoogleReviewRedirect: true, enableManagerCallback: true, createdByRepId: 'u-rep2', createdAt: new Date(), updatedAt: new Date(), description: 'Fresh croissants and specialty coffee.', contactPerson: 'Jean-Luc Picard', category: 'Cafe', website: 'https://cafeparis.com', googleMapsUrl: 'https://maps.google.com/?cid=cafe-paris', assignedQrAssetId: 'inv-b3' },
];

export let mockUsers: User[] = [
  { id: 'u-admin', name: 'Viknesh', email: 'admin@cloutation.com', username: 'deco-admin', passwordHash: '', role: UserRole.SUPER_ADMIN, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'u-rep1', name: 'Field Agent Dan', email: 'rep@cloutation.com', username: 'dan', passwordHash: '', role: UserRole.REP, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'u-rep2', name: 'Rahul', email: 'rahul@cloutation.com', username: 'rahul', passwordHash: '', role: UserRole.REP, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'u-rep3', name: 'Karthik', email: 'karthik@cloutation.com', username: 'karthik', passwordHash: '', role: UserRole.REP, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

export let mockSubscriptions: Subscription[] = [
  { id: 'sub-b1', businessId: 'b1', plan: SubscriptionPlan.PRO, status: SubscriptionStatus.ACTIVE, startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), createdAt: new Date(), updatedAt: new Date() },
  { id: 'sub-b2', businessId: 'b2', plan: SubscriptionPlan.TRIAL, status: SubscriptionStatus.ACTIVE, startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), createdAt: new Date(), updatedAt: new Date() },
  { id: 'sub-b3', businessId: 'b3', plan: SubscriptionPlan.BASIC, status: SubscriptionStatus.ACTIVE, startDate: new Date(), endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), createdAt: new Date(), updatedAt: new Date() },
];

let mockReviews: Review[] = Array.from({ length: 27 }).map((_, index) => {
  const ratings = [5, 4, 2, 1, 5, 4, 5, 3, 4];
  const bIndex = index % 3;
  const rating = ratings[index % ratings.length];

  return {
    id: `rev-${index}`,
    rating: rating,
    comment: rating <= 2 ? 'Need improvements, waited too long.' : 'Excellent experience, highly recommend!',
    customerName: `Customer ${index + 1}`,
    customerPhone: rating <= 2 ? `+1555010${index}` : null,
    requestCallback: rating <= 2,
    callbackStatus: rating <= 2 ? CallbackStatus.PENDING : CallbackStatus.RESOLVED,
    redirectedToGoogle: rating >= 4 && index % 2 === 0,
    googleCtaViewed: rating >= 4,
    googleCtaClicked: rating >= 4 && index % 2 === 0,
    businessId: `b${bIndex + 1}`,
    createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000), // Day-by-day increments
    sentiment: rating >= 4 ? 'Positive' : 'Negative',
    themes: rating <= 2 ? 'Waiting Time' : rating === 3 ? 'Pricing' : 'Food Quality',
  };
});

let mockCallbackRequests: CallbackRequest[] = [];

function seedMockCallbackRequests() {
  if (mockCallbackRequests.length > 0) return;
  mockReviews.forEach((r, idx) => {
    if (r.requestCallback && r.customerPhone && r.customerName) {
      const statusOptions = [CallbackStatus.PENDING, CallbackStatus.CONTACTED, CallbackStatus.RESOLVED];
      const status = statusOptions[idx % statusOptions.length];
      mockCallbackRequests.push({
        id: `cb-${r.id}`,
        reviewId: r.id,
        customerName: r.customerName,
        phoneNumber: r.customerPhone,
        status,
        createdAt: r.createdAt
      });
      r.callbackStatus = status;
    }
  });
}
seedMockCallbackRequests();

let mockRecoveryRequests: RecoveryRequest[] = [];
let mockFunnelEvents: FunnelEvent[] = [];

function seedMockRecoveryRequests() {
  if (mockRecoveryRequests.length > 0) return;
  mockReviews.forEach((r) => {
    if (r.rating < 4) {
      const isHigh = r.rating <= 2 || r.requestCallback;
      mockRecoveryRequests.push({
        id: `rr-${r.id}`,
        businessId: r.businessId,
        reviewId: r.id,
        customerName: r.customerName || 'Anonymous Guest',
        whatsappNumber: r.customerPhone || '+15550000',
        rating: r.rating,
        feedback: r.comment || '',
        callbackRequested: r.requestCallback,
        status: RecoveryStatus.NEW,
        priority: isHigh ? RecoveryPriority.HIGH : RecoveryPriority.MEDIUM,
        internalNotes: null,
        resolvedById: null,
        resolvedAt: null,
        createdAt: r.createdAt,
        updatedAt: r.createdAt
      });
    }
  });
}
seedMockRecoveryRequests();

function seedMockFunnelEvents() {
  if (mockFunnelEvents.length > 0) return;
  
  ['b1', 'b2', 'b3'].forEach((bId) => {
    for (let day = 0; day < 15; day++) {
      const date = new Date(Date.now() - day * 24 * 3600 * 1000);
      const ratio = 1 - day * 0.05;
      
      const scans = Math.max(2, Math.floor(15 * ratio));
      const starts = Math.max(1, Math.floor(11 * ratio));
      const submits = Math.max(1, Math.floor(7 * ratio));
      const redirects = Math.max(0, Math.floor(4 * ratio));
      
      const sessionIdBase = `sess-${bId}-d${day}`;
      
      for (let i = 0; i < scans; i++) {
        mockFunnelEvents.push({
          id: `mfe-scan-${bId}-${day}-${i}`,
          businessId: bId,
          stage: FunnelStage.SCAN,
          timestamp: date,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
          deviceType: 'Mobile',
          qrAssetCode: 'QR-CODE',
          reviewSessionId: `${sessionIdBase}-${i}`
        });
      }
      
      for (let i = 0; i < starts; i++) {
        mockFunnelEvents.push({
          id: `mfe-start-${bId}-${day}-${i}`,
          businessId: bId,
          stage: FunnelStage.START,
          timestamp: date,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
          deviceType: 'Mobile',
          qrAssetCode: 'QR-CODE',
          reviewSessionId: `${sessionIdBase}-${i}`
        });
      }
      
      for (let i = 0; i < submits; i++) {
        mockFunnelEvents.push({
          id: `mfe-submit-${bId}-${day}-${i}`,
          businessId: bId,
          stage: FunnelStage.SUBMIT,
          timestamp: date,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
          deviceType: 'Mobile',
          qrAssetCode: 'QR-CODE',
          reviewSessionId: `${sessionIdBase}-${i}`
        });
      }
      
      for (let i = 0; i < redirects; i++) {
        mockFunnelEvents.push({
          id: `mfe-redirect-${bId}-${day}-${i}`,
          businessId: bId,
          stage: FunnelStage.REDIRECT,
          timestamp: date,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
          deviceType: 'Mobile',
          qrAssetCode: 'QR-CODE',
          reviewSessionId: `${sessionIdBase}-${i}`
        });
      }
    }
  });
}
seedMockFunnelEvents();

let mockScans: QRScan[] = [];

// Seed mock scans spread over the last 30 days
function seedMockScans() {
  if (mockScans.length > 0) return;
  const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  ];

  // Seed Bella Italia (b1) - around 75 scans
  for (let i = 0; i < 75; i++) {
    const scannedAt = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - Math.random() * 12 * 3600000);
    mockScans.push({
      id: `scan-b1-${i}`,
      businessId: 'b1',
      qrCode: 'QR-BELLA',
      userAgent: userAgents[i % userAgents.length],
      scannedAt,
      createdAt: scannedAt
    });
  }

  // Seed Luxe Salon (b2) - around 35 scans
  for (let i = 0; i < 35; i++) {
    const scannedAt = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - Math.random() * 12 * 3600000);
    mockScans.push({
      id: `scan-b2-${i}`,
      businessId: 'b2',
      qrCode: 'QR-LUXE',
      userAgent: userAgents[i % userAgents.length],
      scannedAt,
      createdAt: scannedAt
    });
  }

  // Seed Cafe Paris (b3) - around 20 scans
  for (let i = 0; i < 20; i++) {
    const scannedAt = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - Math.random() * 12 * 3600000);
    mockScans.push({
      id: `scan-b3-${i}`,
      businessId: 'b3',
      qrCode: 'QR-PARIS',
      userAgent: userAgents[i % userAgents.length],
      scannedAt,
      createdAt: scannedAt
    });
  }
}
seedMockScans();

let mockQrAssets: any[] = [];
export let mockQrHistory: any[] = [];
let mockQrBatches: any[] = [
  {
    id: 'batch-1',
    batchName: 'Print Batch #1',
    startSerial: 'cqr-A001',
    endSerial: 'cqr-A100',
    quantity: 100,
    generatedBy: 'u-admin',
    generatedAt: new Date()
  }
];

function seedMockInventory() {
  if (mockQrAssets.length > 0) return;

  const qrCodes = [
    'cqr-A001',
    'cqr-A002',
    'cqr-A003'
  ];

  mockBusinesses.forEach((biz, idx) => {
    const invId = `inv-${biz.id}`;
    mockQrAssets.push({
      id: invId,
      qrCode: qrCodes[idx],
      status: QRAssetStatus.ASSIGNED,
      assignedBusinessId: biz.id,
      assignedBy: biz.createdByRepId,
      assignedDate: biz.createdAt,
      revokedDate: null,
      createdAt: biz.createdAt,
      updatedAt: biz.createdAt
    });

    mockQrHistory.push({
      id: `log-${biz.id}`,
      qrAssetId: invId,
      businessId: biz.id,
      assignedBy: biz.createdByRepId,
      assignedAt: biz.createdAt,
      revokedAt: null
    });
  });
}
seedMockInventory();

export let mockLogs: ActivityLog[] = [
  { id: 'log-1', userId: 'u-admin', action: 'Business Onboarded', entityType: 'BUSINESS', entityId: 'b1', metadata: JSON.stringify({ name: 'Bella Italia' }), createdAt: new Date(Date.now() - 3600000) },
  { id: 'log-2', userId: 'u-rep1', action: 'QR Code Assigned', entityType: 'BUSINESS', entityId: 'b1', metadata: JSON.stringify({ qrCode: 'QR-BELLA' }), createdAt: new Date(Date.now() - 7200050) },
  { id: 'log-3', userId: 'u-rep1', action: 'QR Code Assigned', entityType: 'BUSINESS', entityId: 'b2', metadata: JSON.stringify({ qrCode: 'QR-LUXE' }), createdAt: new Date(Date.now() - 10800000) }
];

// Initialize password hashes for mock users and businesses
let bcryptInitialized = false;
async function initializeMockPasswords() {
  if (bcryptInitialized) return;
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const repHash = await bcrypt.hash('rep123', salt);
  const bizHash = await bcrypt.hash('business123', salt);

  mockUsers.forEach(u => {
    if (u.role === UserRole.SUPER_ADMIN) u.passwordHash = adminHash;
    else if (u.role === UserRole.REP) u.passwordHash = repHash;
  });

  mockBusinesses.forEach(b => {
    b.passwordHash = bizHash;
  });

  bcryptInitialized = true;
}

// Check if PostgreSQL database is configured
function isDbConfigured(): boolean {
  const dbUrl = process.env.DATABASE_URL || '';
  return dbUrl !== '' && !dbUrl.includes('placeholder');
}

// Run a query with fallback
export async function runQuery<T>(dbQuery: () => Promise<T>, mockQuery: () => Promise<T>): Promise<T> {
  if (!isDbConfigured()) {
    await initializeMockPasswords();
    return mockQuery();
  }
  try {
    return await dbQuery();
  } catch (error) {
    console.warn('⚠️ Database connection failed. Running in Mock Demo Mode.', error);
    await initializeMockPasswords();
    return mockQuery();
  }
}

// ==========================================
// DATA ACCESS FUNCTIONS
// ==========================================

export async function getUserByUsername(username: string) {
  return runQuery(
    async () => {
      return await db.user.findUnique({
        where: { username }
      });
    },
    async () => {
      return mockUsers.find(u => u.username && u.username.toLowerCase() === username.toLowerCase()) || null;
    }
  );
}

export async function getUserById(id: string) {
  const cached = userCache.get(id);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  const result = await runQuery(
    async () => {
      return await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
        }
      });
    },
    async () => {
      const user = mockUsers.find(u => u.id === id);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role
      };
    }
  );
  if (result) {
    userCache.set(id, { data: result, timestamp: now });
  }
  return result;
}

export async function getBusinessByName(name: string) {
  return runQuery(
    async () => {
      return await db.business.findUnique({
        where: { name }
      });
    },
    async () => {
      return mockBusinesses.find(b => b.name && b.name.toLowerCase() === name.toLowerCase()) || null;
    }
  );
}

export async function getBusinessById(id: string) {
  const cached = businessCache.get(id);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  const result = await runQuery(
    async () => {
      return await db.business.findUnique({
        where: { id },
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          qrAssets: {
            where: { status: 'ASSIGNED' },
            take: 1
          }
        }
      });
    },
    async () => {
      const biz = mockBusinesses.find(b => b.id === id);
      if (!biz) return null;
      const subscriptions = mockSubscriptions.filter(s => s.businessId === id);
      const qrAssets = mockQrAssets.filter(q => q.assignedBusinessId === id && q.status === 'ASSIGNED');
      return { ...biz, subscriptions, qrAssets };
    }
  );
  if (result) {
    businessCache.set(id, { data: result, timestamp: now });
  }
  return result;
}

export async function createUser(data: { name: string; email?: string | null; username: string; passwordHash: string; role: UserRole }) {
  return runQuery(
    async () => {
      return await db.user.create({ data });
    },
    async () => {
      const newUser = {
        id: `u-${Math.random().toString(36).substring(2, 9)}`,
        name: data.name,
        email: data.email || null,
        username: data.username,
        passwordHash: data.passwordHash,
        role: data.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);
      return newUser;
    }
  );
}

// Super Admin Analytics Counters
export async function getSuperAdminStats() {
  return runQuery(
    async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        totalBusinesses,
        activeBusinesses,
        totalReps,
        activeReps,
        totalReviews,
        avgRatingResult,
        activeSubscriptions,
        expiredSubscriptions,
        assignedQRs,
        unassignedQRs,
        reviewsThisMonth,
        businessesThisMonth,
        callbacksThisMonth,
        googleRedirectClicksThisMonth,
        recoveryRequestsCount,
        resolvedRecoveryRequestsCount
      ] = await Promise.all([
        db.business.count({ where: { deletedAt: null } }),
        db.business.count({ where: { deletedAt: null, status: BusinessStatus.ACTIVE } }),
        db.user.count({ where: { role: UserRole.REP } }),
        db.user.count({ where: { role: UserRole.REP, isActive: true } }),
        db.review.count(),
        db.review.aggregate({ _avg: { rating: true } }),
        db.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
        db.subscription.count({ where: { status: SubscriptionStatus.EXPIRED } }),
        db.qRAsset.count({ where: { status: QRAssetStatus.ASSIGNED } }),
        db.qRAsset.count({ where: { status: QRAssetStatus.FREE } }),
        db.review.count({ where: { createdAt: { gte: startOfMonth } } }),
        db.business.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
        db.callbackRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
        db.review.count({
          where: {
            createdAt: { gte: startOfMonth },
            googleCtaClicked: true
          }
        }),
        db.recoveryRequest.count(),
        db.recoveryRequest.count({ where: { status: 'RESOLVED' } })
      ]);

      const averagePlatformRating = avgRatingResult._avg.rating
        ? parseFloat(avgRatingResult._avg.rating.toFixed(2))
        : 0;

      const recoveryResolutionRate = recoveryRequestsCount > 0 
        ? parseFloat(((resolvedRecoveryRequestsCount / recoveryRequestsCount) * 100).toFixed(1))
        : 0.0;

      return {
        totalBusinesses,
        activeBusinesses,
        totalReps,
        activeReps,
        totalReviews,
        averagePlatformRating,
        activeSubscriptions,
        expiredSubscriptions,
        assignedQRs,
        unassignedQRs,
        reviewsThisMonth,
        businessesThisMonth,
        callbacksThisMonth,
        googleRedirectClicksThisMonth,
        recoveryRequestsCount,
        resolvedRecoveryRequestsCount,
        recoveryResolutionRate
      };
    },
    async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const totalBusinesses = mockBusinesses.filter(b => b.deletedAt === null).length;
      const activeBusinesses = mockBusinesses.filter(b => b.deletedAt === null && b.status === BusinessStatus.ACTIVE).length;
      const totalReps = mockUsers.filter(u => u.role === UserRole.REP).length;
      const activeReps = mockUsers.filter(u => u.role === UserRole.REP && u.isActive).length;
      const totalReviews = mockReviews.length;

      const totalRating = mockReviews.reduce((acc, r) => acc + r.rating, 0);
      const averagePlatformRating = totalReviews > 0 ? parseFloat((totalRating / totalReviews).toFixed(2)) : 0;

      const activeSubscriptions = mockSubscriptions.filter(s => s.status === SubscriptionStatus.ACTIVE).length;
      const expiredSubscriptions = mockSubscriptions.filter(s => s.status === SubscriptionStatus.EXPIRED).length;

      const assignedQRs = mockQrAssets.filter(q => q.status === QRAssetStatus.ASSIGNED).length;
      const unassignedQRs = mockQrAssets.filter(q => q.status === QRAssetStatus.FREE).length;

      const reviewsThisMonth = mockReviews.filter(r => r.createdAt >= startOfMonth).length;
      const businessesThisMonth = mockBusinesses.filter(b => b.createdAt >= startOfMonth && b.deletedAt === null).length;
      const callbacksThisMonth = mockCallbackRequests.filter(c => c.createdAt >= startOfMonth).length;
      const googleRedirectClicksThisMonth = mockReviews.filter(r => r.createdAt >= startOfMonth && r.googleCtaClicked).length;

      const recoveryRequestsCount = mockRecoveryRequests.length;
      const resolvedRecoveryRequestsCount = mockRecoveryRequests.filter(rr => rr.status === RecoveryStatus.RESOLVED).length;
      const recoveryResolutionRate = recoveryRequestsCount > 0 
        ? parseFloat(((resolvedRecoveryRequestsCount / recoveryRequestsCount) * 100).toFixed(1))
        : 0.0;

      return {
        totalBusinesses,
        activeBusinesses,
        totalReps,
        activeReps,
        totalReviews,
        averagePlatformRating,
        activeSubscriptions,
        expiredSubscriptions,
        assignedQRs,
        unassignedQRs,
        reviewsThisMonth,
        businessesThisMonth,
        callbacksThisMonth,
        googleRedirectClicksThisMonth,
        recoveryRequestsCount,
        resolvedRecoveryRequestsCount,
        recoveryResolutionRate
      };
    }
  );
}

// Listing operations
export async function getAllBusinesses(includeDeleted = false) {
  return runQuery(
    async () => {
      const businesses = await db.business.findMany({
        where: includeDeleted ? {} : { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          createdByRep: {
            select: { id: true, name: true }
          },
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          qrAssets: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // Compute download stats for each business dynamically
      const mapped = await Promise.all(businesses.map(async (biz) => {
        const logs = await db.activityLog.findMany({
          where: { action: 'QR_DOWNLOAD', entityType: 'BUSINESS', entityId: biz.id },
          orderBy: { createdAt: 'desc' }
        });
        return {
          ...biz,
          totalDownloads: logs.length,
          lastDownloadDate: logs.length > 0 ? logs[0].createdAt.toISOString() : null
        };
      }));

      return mapped;
    },
    async () => {
      return mockBusinesses
        .filter(b => includeDeleted || b.isActive)
        .map(b => {
          const rep = mockUsers.find(u => u.id === b.createdByRepId) || null;
          const subscriptions = mockSubscriptions.filter(s => s.businessId === b.id);
          const qrAssets = mockQrAssets.filter(q => q.assignedBusinessId === b.id);
          const logs = mockLogs.filter(log => log.action === 'QR_DOWNLOAD' && log.entityType === 'BUSINESS' && log.entityId === b.id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          
          return {
            ...b,
            createdByRep: rep ? { id: rep.id, name: rep.name } : null,
            subscriptions,
            qrAssets,
            totalDownloads: logs.length,
            lastDownloadDate: logs.length > 0 ? logs[0].createdAt.toISOString() : null
          };
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  );
}

export async function getAllUsers() {
  return runQuery(
    async () => {
      return await db.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
    },
    async () => {
      return [...mockUsers].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  );
}

export function computeNextQrCode(latestCode: string): string {
  const match = latestCode.match(/^cqr-([A-Z]+)(\d+)$/i);
  if (!match) {
    return 'cqr-A001';
  }

  const letter = match[1].toUpperCase();
  const numStr = match[2];
  const num = parseInt(numStr, 10);
  const nextNum = num + 1;
  const padLength = Math.max(3, numStr.length);

  if (nextNum > 999 && letter.length === 1) {
    const letterCode = letter.charCodeAt(0);
    const nextLetter = String.fromCharCode(letterCode + 1);
    return `cqr-${nextLetter}${String(1).padStart(padLength, '0')}`;
  }

  return `cqr-${letter}${String(nextNum).padStart(padLength, '0')}`;
}

export async function onboardBusiness(data: {
  name: string;
  passwordHash: string;
  industry: Industry;
  phone?: string | null;
  address?: string | null;
  googleReviewUrl?: string | null;
  plan?: string;
  createdByRepId: string;
  description?: string | null;
  contactPerson?: string | null;
  category?: string | null;
  website?: string | null;
  googleMapsUrl?: string | null;
  logoUrl?: string | null;
  qrCode?: string | null;
}) {
  return runQuery(
    async () => {
      let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existing = await db.business.findUnique({ where: { slug } });
      if (existing) slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

      return await db.$transaction(async (tx) => {
        const latestBiz = await tx.business.findFirst({
          orderBy: { businessCode: 'desc' },
          select: { businessCode: true }
        });
        let nextNumber = 1;
        if (latestBiz && latestBiz.businessCode) {
          const match = latestBiz.businessCode.match(/^CR-(\d+)$/);
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }
        const businessCode = `CR-${String(nextNumber).padStart(6, '0')}`;

        const business = await tx.business.create({
          data: {
            name: data.name,
            slug,
            businessCode,
            passwordHash: data.passwordHash,
            industry: data.industry,
            phone: data.phone || null,
            address: data.address || null,
            googleReviewUrl: data.googleReviewUrl || null,
            description: data.description || null,
            contactPerson: data.contactPerson || null,
            category: data.category || null,
            website: data.website || null,
            googleMapsUrl: data.googleMapsUrl || null,
            logoUrl: data.logoUrl || null,
            status: BusinessStatus.ACTIVE,
            createdByRepId: data.createdByRepId
          }
        });

        // 1. Locate / Create QR Asset to assign
        let qrAsset = null;

        if (data.qrCode) {
          qrAsset = await tx.qRAsset.findUnique({
            where: { qrCode: data.qrCode }
          });
          if (!qrAsset) {
            throw new Error(`Manual QR Code "${data.qrCode}" does not exist in inventory.`);
          }
          if (qrAsset.status === QRAssetStatus.ASSIGNED) {
            throw new Error(`Manual QR Code "${data.qrCode}" is already assigned.`);
          }
        } else {
          // Auto assign the first available FREE QR asset
          qrAsset = await tx.qRAsset.findFirst({
            where: { status: QRAssetStatus.FREE },
            orderBy: { qrCode: 'asc' }
          });

          if (!qrAsset) {
            // Generate the next sequential cqr-XXXX code dynamically
            const latestRecord = await tx.qRAsset.findFirst({
              where: { qrCode: { startsWith: 'cqr-' } },
              orderBy: { qrCode: 'desc' }
            });
            const nextCode = latestRecord ? computeNextQrCode(latestRecord.qrCode) : 'cqr-A001';
            qrAsset = await tx.qRAsset.create({
              data: {
                qrCode: nextCode,
                status: QRAssetStatus.FREE
              }
            });
          }
        }

        // 2. Mark QR Asset as ASSIGNED
        const updatedQr = await tx.qRAsset.update({
          where: { id: qrAsset.id },
          data: {
            status: QRAssetStatus.ASSIGNED,
            assignedBusinessId: business.id,
            assignedDate: new Date(),
            assignedBy: data.createdByRepId
          }
        });

        // 3. Save assignedQrAssetId on Business
        await tx.business.update({
          where: { id: business.id },
          data: {
            assignedQrAssetId: updatedQr.id
          }
        });

        // 4. Create History log entry
        await tx.qRHistory.create({
          data: {
            qrAssetId: updatedQr.id,
            businessId: business.id,
            assignedBy: data.createdByRepId,
            assignedAt: new Date()
          }
        });

        let dbPlan: SubscriptionPlan = SubscriptionPlan.TRIAL;
        let endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // default 14 days

        if (data.plan === 'TRIAL_14') {
          dbPlan = SubscriptionPlan.TRIAL;
          endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        } else if (data.plan === 'TRIAL_28') {
          dbPlan = SubscriptionPlan.TRIAL;
          endDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
        } else if (data.plan === 'UNLIMITED') {
          dbPlan = SubscriptionPlan.PRO;
          endDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
        } else if (data.plan === 'TRIAL') {
          dbPlan = SubscriptionPlan.TRIAL;
          endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (data.plan === 'BASIC') {
          dbPlan = SubscriptionPlan.BASIC;
          endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        } else if (data.plan === 'PRO') {
          dbPlan = SubscriptionPlan.PRO;
          endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }

        const subscription = await tx.subscription.create({
          data: {
            businessId: business.id,
            plan: dbPlan,
            status: SubscriptionStatus.ACTIVE,
            endDate
          }
        });

        return { business: { ...business, qrAssets: [updatedQr] }, subscription };
      });
    },
    async () => {
      const businessId = `b-${Math.random().toString(36).substring(2, 9)}`;
      let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const codes = mockBusinesses
        .map(b => b.businessCode)
        .filter(code => code && code.startsWith('CR-'));
      let nextNumber = 1;
      if (codes.length > 0) {
        codes.sort();
        const latestCode = codes[codes.length - 1];
        const match = latestCode.match(/^CR-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const businessCode = `CR-${String(nextNumber).padStart(6, '0')}`;

      // Create QR Asset
      let qrAsset = null;
      if (data.qrCode) {
        qrAsset = mockQrAssets.find(q => q.qrCode === data.qrCode);
        if (!qrAsset) {
          throw new Error(`Manual QR Code "${data.qrCode}" does not exist in inventory.`);
        }
        if (qrAsset.status === QRAssetStatus.ASSIGNED) {
          throw new Error(`Manual QR Code "${data.qrCode}" is already assigned.`);
        }
      } else {
        qrAsset = mockQrAssets.find(q => q.status === QRAssetStatus.FREE);
        if (!qrAsset) {
          const latestRecord = mockQrAssets
            .filter(q => q.qrCode.startsWith('cqr-'))
            .sort((a, b) => b.qrCode.localeCompare(a.qrCode))[0];
          const nextCode = latestRecord ? computeNextQrCode(latestRecord.qrCode) : 'cqr-A001';
          qrAsset = {
            id: `inv-${Math.random().toString(36).substring(2, 9)}`,
            qrCode: nextCode,
            status: QRAssetStatus.FREE,
            assignedBusinessId: null,
            assignedBy: null,
            assignedDate: null,
            revokedDate: null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockQrAssets.push(qrAsset);
        }
      }

      qrAsset.status = QRAssetStatus.ASSIGNED;
      qrAsset.assignedBusinessId = businessId;
      qrAsset.assignedBy = data.createdByRepId;
      qrAsset.assignedDate = new Date();

      const newBiz = {
        id: businessId,
        name: data.name,
        slug,
        businessCode,
        passwordHash: data.passwordHash,
        industry: data.industry,
        logoUrl: data.logoUrl || null,
        googleReviewUrl: data.googleReviewUrl || null,
        phone: data.phone || null,
        address: data.address || null,
        description: data.description || null,
        contactPerson: data.contactPerson || null,
        category: data.category || null,
        website: data.website || null,
        googleMapsUrl: data.googleMapsUrl || null,
        isActive: true,
        status: BusinessStatus.ACTIVE,
        deletedAt: null,
        enableGoogleReviewRedirect: true,
        enableManagerCallback: true,
        createdByRepId: data.createdByRepId,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedQrAssetId: qrAsset.id
      };

      mockQrHistory.push({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        qrAssetId: qrAsset.id,
        businessId,
        assignedBy: data.createdByRepId,
        assignedAt: new Date(),
        revokedAt: null
      });

      let dbPlan: SubscriptionPlan = SubscriptionPlan.TRIAL;
      let endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // default 14 days

      if (data.plan === 'TRIAL_14') {
        dbPlan = SubscriptionPlan.TRIAL;
        endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      } else if (data.plan === 'TRIAL_28') {
        dbPlan = SubscriptionPlan.TRIAL;
        endDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      } else if (data.plan === 'UNLIMITED') {
        dbPlan = SubscriptionPlan.PRO;
        endDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
      } else if (data.plan === 'TRIAL') {
        dbPlan = SubscriptionPlan.TRIAL;
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (data.plan === 'BASIC') {
        dbPlan = SubscriptionPlan.BASIC;
        endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      } else if (data.plan === 'PRO') {
        dbPlan = SubscriptionPlan.PRO;
        endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }

      const newSub = {
        id: `sub-${businessId}`,
        businessId,
        plan: dbPlan,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockBusinesses.push(newBiz);
      mockSubscriptions.push(newSub);
      return { business: { ...newBiz, qrAssets: [qrAsset] }, subscription: newSub };
    }
  );
}

export async function updateBusinessDetails(
  id: string,
  data: {
    name?: string;
    googleReviewUrl?: string | null;
    phone?: string | null;
    address?: string | null;
    enableGoogleReviewRedirect?: boolean;
    enableManagerCallback?: boolean;
    logoUrl?: string | null;
    description?: string | null;
    contactPerson?: string | null;
    category?: string | null;
    website?: string | null;
    googleMapsUrl?: string | null;
    status?: BusinessStatus;
  }
) {
  return runQuery(
    async () => {
      return await db.business.update({
        where: { id },
        data
      });
    },
    async () => {
      const biz = mockBusinesses.find(b => b.id === id);
      if (biz) {
        if (data.name !== undefined) biz.name = data.name;
        if (data.googleReviewUrl !== undefined) biz.googleReviewUrl = data.googleReviewUrl;
        if (data.phone !== undefined) biz.phone = data.phone;
        if (data.address !== undefined) biz.address = data.address;
        if (data.enableGoogleReviewRedirect !== undefined) biz.enableGoogleReviewRedirect = data.enableGoogleReviewRedirect;
        if (data.enableManagerCallback !== undefined) biz.enableManagerCallback = data.enableManagerCallback;
        if (data.logoUrl !== undefined) biz.logoUrl = data.logoUrl;
        if (data.description !== undefined) biz.description = data.description;
        if (data.contactPerson !== undefined) biz.contactPerson = data.contactPerson;
        if (data.category !== undefined) biz.category = data.category;
        if (data.website !== undefined) biz.website = data.website;
        if (data.googleMapsUrl !== undefined) biz.googleMapsUrl = data.googleMapsUrl;
        if (data.status !== undefined) biz.status = data.status;
        biz.updatedAt = new Date();
      }
      return biz || null;
    }
  );
}

export async function updateBusinessStatus(id: string, status: BusinessStatus, adminId: string) {
  return runQuery(
    async () => {
      const updated = await db.business.update({
        where: { id },
        data: { status }
      });

      let action = 'Business Activated';
      if (status === BusinessStatus.INACTIVE) action = 'Business Deactivated';
      if (status === BusinessStatus.PENDING) action = 'Business Onboarding Pending';

      await db.activityLog.create({
        data: {
          userId: adminId,
          action,
          entityType: 'BUSINESS',
          entityId: id,
        }
      });

      return updated;
    },
    async () => {
      const biz = mockBusinesses.find(b => b.id === id);
      if (biz) {
        biz.status = status;
        biz.updatedAt = new Date();
      }

      let action = 'Business Activated';
      if (status === BusinessStatus.INACTIVE) action = 'Business Deactivated';
      if (status === BusinessStatus.PENDING) action = 'Business Onboarding Pending';

      mockLogs.push({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        userId: adminId,
        action,
        entityType: 'BUSINESS',
        entityId: id,
        metadata: null,
        createdAt: new Date()
      });

      return biz || null;
    }
  );
}

export async function softDeleteBusiness(id: string) {
  return runQuery(
    async () => {
      return await db.business.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });
    },
    async () => {
      const biz = mockBusinesses.find(b => b.id === id);
      if (biz) {
        biz.isActive = false;
        biz.deletedAt = new Date();
        biz.updatedAt = new Date();
      }
      return biz || null;
    }
  );
}

export async function restoreBusiness(id: string) {
  return runQuery(
    async () => {
      return await db.business.update({
        where: { id },
        data: {
          isActive: true,
          deletedAt: null
        }
      });
    },
    async () => {
      const biz = mockBusinesses.find(b => b.id === id);
      if (biz) {
        biz.isActive = true;
        biz.deletedAt = null;
        biz.updatedAt = new Date();
      }
      return biz || null;
    }
  );
}

export async function deleteUser(id: string) {
  return runQuery(
    async () => {
      return await db.user.delete({
        where: { id }
      });
    },
    async () => {
      const deletedUser = mockUsers.find(u => u.id === id) || { id, name: '', email: '', passwordHash: '', username: '', role: UserRole.REP, isActive: true, createdAt: new Date(), updatedAt: new Date() };
      mockUsers = mockUsers.filter(u => u.id !== id);
      return deletedUser;
    }
  );
}

export async function logActivity(
  userId: string | null,
  action: string,
  entityType?: string | null,
  entityId?: string | null,
  metadata?: any
) {
  const metaStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;
  return runQuery(
    async () => {
      return await db.activityLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          metadata: metaStr,
        },
      });
    },
    async () => {
      const newLog: ActivityLog = {
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        userId,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metaStr,
        createdAt: new Date(),
      };
      mockLogs.push(newLog);
      return newLog;
    }
  );
}

export async function getRecentActivities(businessId?: string | null) {
  return runQuery(
    async () => {
      if (businessId) {
        return await db.activityLog.findMany({
          where: {
            OR: [
              { userId: businessId },
              { AND: [{ entityType: 'BUSINESS' }, { entityId: businessId }] }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
      }

      return await db.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    },
    async () => {
      if (businessId) {
        return [...mockLogs]
          .filter(log => {
            if (log.userId === businessId) return true;
            if (log.entityType === 'BUSINESS' && log.entityId === businessId) return true;
            return false;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 20);
      }
      return [...mockLogs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);
    }
  );
}

// ==========================================
// QR SCANS & CLIENT SERVICES
// ==========================================

export async function recordQrScan(data: { businessId: string; qrCode: string; userAgent: string | null }) {
  return runQuery(
    async () => {
      // 5-minute deduplication check
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existing = await db.qRScan.findFirst({
        where: {
          qrCode: data.qrCode,
          userAgent: data.userAgent || null,
          scannedAt: { gte: fiveMinutesAgo }
        }
      });

      if (existing) return existing;

      return await db.qRScan.create({ data });
    },
    async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existing = mockScans.find(
        s => s.qrCode === data.qrCode &&
          s.userAgent === data.userAgent &&
          s.scannedAt >= fiveMinutesAgo
      );

      if (existing) return existing;

      const newScan: QRScan = {
        id: `scan-${Math.random().toString(36).substring(2, 9)}`,
        businessId: data.businessId,
        qrCode: data.qrCode,
        userAgent: data.userAgent || null,
        scannedAt: new Date(),
        createdAt: new Date()
      };
      mockScans.push(newScan);
      return newScan;
    }
  );
}

// helper to calculate start date for dashboard period filters
function getPeriodStartDate(period: string): Date {
  const now = new Date();
  if (period === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === '90d') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  if (period === '180d') return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  if (period === '365d') return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30d
}



export async function getSuperAdminAnalytics() {
  return runQuery(
    async () => {
      const [scans, businesses, totalCallbacks] = await Promise.all([
        db.qRScan.findMany(),
        db.business.findMany({
          where: { isActive: true },
          include: { reviews: true }
        }),
        db.callbackRequest.count()
      ]);

      return computeSuperAnalytics(scans, businesses, totalCallbacks);
    },
    async () => {
      const scans = [...mockScans];
      const businesses = mockBusinesses.filter(b => b.isActive).map(b => {
        const reviews = mockReviews.filter(rev => rev.businessId === b.id);
        return { ...b, reviews };
      });
      const totalCallbacks = mockCallbackRequests.length;

      return computeSuperAnalytics(scans, businesses, totalCallbacks);
    }
  );
}

function computeSuperAnalytics(scans: QRScan[], businesses: any[], totalCallbacks: number) {
  const totalPlatformScans = scans.length;
  const totalPlatformRestaurants = businesses.length; // Keep standard key name for safety

  let totalPlatformReviews = 0;
  const bizScanMap: Record<string, number> = {};
  businesses.forEach(b => {
    bizScanMap[b.id] = 0;
    totalPlatformReviews += (b.reviews || []).length;
  });

  scans.forEach(s => {
    if (bizScanMap[s.businessId] !== undefined) {
      bizScanMap[s.businessId]++;
    }
  });

  const restaurantStats = businesses.map(b => {
    const reviews = b.reviews || [];
    const positiveReviews = reviews.filter((rev: any) => rev.rating >= 4).length;
    const googleCtaClicks = reviews.filter((rev: any) => rev.googleCtaClicked).length;
    const redirectRate = positiveReviews > 0 ? parseFloat(((googleCtaClicks / positiveReviews) * 100).toFixed(1)) : 0;
    const scansCount = bizScanMap[b.id] || 0;
    const avgRating = reviews.length > 0
      ? parseFloat((reviews.reduce((acc: number, rev: any) => acc + rev.rating, 0) / reviews.length).toFixed(1))
      : 0;
    const conversionRate = scansCount > 0 ? parseFloat(((reviews.length / scansCount) * 100).toFixed(1)) : 0;

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      scansCount,
      reviewsCount: reviews.length,
      redirectRate,
      averageRating: avgRating,
      conversionRate
    };
  });

  const topRestaurantsByScans = [...restaurantStats].sort((a, b) => b.scansCount - a.scansCount).slice(0, 5);
  const topRestaurantsByRating = [...restaurantStats].filter(r => r.reviewsCount > 0).sort((a, b) => b.averageRating - a.averageRating).slice(0, 5);
  const topRestaurantsByReviews = [...restaurantStats].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 5);
  const topRestaurantsByConversion = [...restaurantStats].filter(r => r.scansCount > 0).sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 5);

  const dailyScansMap: Record<string, number> = {};
  const dailyReviewsMap: Record<string, number> = {};

  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dailyScansMap[dateStr] = 0;
    dailyReviewsMap[dateStr] = 0;
  }

  scans.forEach(s => {
    const dateStr = s.scannedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (dailyScansMap[dateStr] !== undefined) {
      dailyScansMap[dateStr]++;
    }
  });

  businesses.forEach(b => {
    const reviews = b.reviews || [];
    reviews.forEach((rev: any) => {
      const dateStr = rev.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (dailyReviewsMap[dateStr] !== undefined) {
        dailyReviewsMap[dateStr]++;
      }
    });
  });

  const dailyScansTrend = Object.entries(dailyScansMap).map(([date, count]) => ({ date, count }));
  const dailyReviewsTrend = Object.entries(dailyReviewsMap).map(([date, count]) => ({ date, count }));

  return {
    totalPlatformScans,
    totalPlatformRestaurants,
    totalPlatformReviews,
    totalCallbacks,
    topRestaurantsByScans,
    topRestaurantsByRating,
    topRestaurantsByReviews,
    topRestaurantsByConversion,
    dailyScansTrend,
    dailyReviewsTrend
  };
}

// ==========================================
// REVIEWS & CALLBACKS
// ==========================================

export async function createReview(data: {
  rating: number;
  comment?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  requestCallback?: boolean;
  businessId: string;
  reviewSessionId?: string | null;
}) {
  const isPositive = data.rating >= 4;
  const sentiment = isPositive ? 'Positive' : 'Negative';
  
  // Keyword mapping logic
  let matchedThemes: string[] = [];
  if (data.comment) {
    const commentLower = data.comment.toLowerCase();
    const themeKeywords = {
      'Food Quality': ['food', 'taste', 'delicious', 'yummy', 'pizza', 'burger', 'dish', 'meal', 'cook', 'flavor', 'menu', 'pasta', 'tiramisu', 'croissant'],
      'Ambience': ['ambience', 'decor', 'music', 'lighting', 'clean', 'beautiful', 'atmosphere', 'vibe', 'cozy', 'seating', 'wine'],
      'Service': ['service', 'staff', 'waiter', 'waitress', 'friendly', 'polite', 'hospitable', 'quick', 'fast', 'prompt', 'attentive'],
      'Waiting Time': ['wait', 'delay', 'slow', 'time', 'late', 'queue'],
      'Staff Behaviour': ['rude', 'behaviour', 'behavior', 'attitude', 'ignore', 'unprofessional'],
      'Pricing': ['price', 'expensive', 'cost', 'bill', 'overpriced', 'charge', 'value'],
      'Cleanliness': ['dirty', 'cleanliness', 'hair', 'dust', 'mess', 'unhygienic', 'bathroom', 'table', 'plate']
    };
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(kw => commentLower.includes(kw))) {
        matchedThemes.push(theme);
      }
    });
  }
  
  if (matchedThemes.length === 0) {
    matchedThemes.push(isPositive ? 'Service' : 'Waiting Time');
  }
  const themes = matchedThemes.join(', ');

  return runQuery(
    async () => {
      // 1. Create Review
      const review = await db.review.create({
        data: {
          rating: data.rating,
          comment: data.comment || null,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          requestCallback: data.requestCallback || false,
          callbackStatus: data.requestCallback ? CallbackStatus.PENDING : CallbackStatus.RESOLVED,
          redirectedToGoogle: isPositive,
          googleCtaViewed: isPositive,
          googleCtaClicked: isPositive,
          sentiment,
          themes,
          businessId: data.businessId
        }
      });

      // 2. Create RecoveryRequest if rating < 4
      if (data.rating < 4) {
        const priority = (data.rating <= 2 || data.requestCallback) ? 'HIGH' : 'MEDIUM';
        await db.recoveryRequest.create({
          data: {
            businessId: data.businessId,
            reviewId: review.id,
            customerName: data.customerName || 'Anonymous Guest',
            whatsappNumber: data.customerPhone || '+15550000',
            rating: data.rating,
            feedback: data.comment || '',
            callbackRequested: data.requestCallback || false,
            status: 'NEW',
            priority: priority as any
          }
        });
      }

      // 3. Log SUBMIT stage to funnel if reviewSessionId is provided
      if (data.reviewSessionId) {
        await db.funnelEvent.create({
          data: {
            businessId: data.businessId,
            stage: 'SUBMIT',
            reviewSessionId: data.reviewSessionId
          }
        }).catch(err => console.error('Failed to log SUBMIT event in DB:', err));
      }

      return review;
    },
    async () => {
      const reviewId = `rev-${Math.random().toString(36).substring(2, 9)}`;
      const newReview = {
        id: reviewId,
        rating: data.rating,
        comment: data.comment || null,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        requestCallback: data.requestCallback || false,
        callbackStatus: data.requestCallback ? CallbackStatus.PENDING : CallbackStatus.RESOLVED,
        redirectedToGoogle: isPositive,
        googleCtaViewed: isPositive,
        googleCtaClicked: isPositive,
        sentiment,
        themes,
        businessId: data.businessId,
        createdAt: new Date()
      };
      mockReviews.push(newReview);

      if (data.rating < 4) {
        const priority = (data.rating <= 2 || data.requestCallback) ? 'HIGH' : 'MEDIUM';
        mockRecoveryRequests.push({
          id: `rr-${reviewId}`,
          businessId: data.businessId,
          reviewId,
          customerName: data.customerName || 'Anonymous Guest',
          whatsappNumber: data.customerPhone || '+15550000',
          rating: data.rating,
          feedback: data.comment || '',
          callbackRequested: data.requestCallback || false,
          status: RecoveryStatus.NEW,
          priority: priority as any,
          internalNotes: null,
          resolvedById: null,
          resolvedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      if (data.reviewSessionId) {
        mockFunnelEvents.push({
          id: `mfe-submit-${data.businessId}-${Date.now()}`,
          businessId: data.businessId,
          stage: FunnelStage.SUBMIT,
          timestamp: new Date(),
          userAgent: null,
          deviceType: null,
          qrAssetCode: null,
          reviewSessionId: data.reviewSessionId
        });
      }

      return newReview;
    }
  );
}

export async function isSessionSubmitted(reviewSessionId: string): Promise<boolean> {
  return runQuery(
    async () => {
      const event = await db.funnelEvent.findFirst({
        where: {
          reviewSessionId,
          stage: 'SUBMIT'
        }
      });
      return !!event;
    },
    async () => {
      return mockFunnelEvents.some(e => e.reviewSessionId === reviewSessionId && e.stage === 'SUBMIT');
    }
  );
}

export async function trackCtaView(reviewId: string) {
  return runQuery(
    async () => {
      return await db.review.update({
        where: { id: reviewId },
        data: { googleCtaViewed: true }
      });
    },
    async () => {
      const review = mockReviews.find(r => r.id === reviewId);
      if (review) {
        review.googleCtaViewed = true;
      }
      return review || null;
    }
  );
}

export async function trackCtaClick(reviewId: string) {
  return runQuery(
    async () => {
      return await db.review.update({
        where: { id: reviewId },
        data: {
          googleCtaClicked: true,
          redirectedToGoogle: true
        }
      });
    },
    async () => {
      const review = mockReviews.find(r => r.id === reviewId);
      if (review) {
        review.googleCtaClicked = true;
        review.redirectedToGoogle = true;
      }
      return review || null;
    }
  );
}

export async function createCallbackRequest(data: {
  reviewId: string;
  customerName: string;
  phoneNumber: string;
}) {
  return runQuery(
    async () => {
      await db.review.update({
        where: { id: data.reviewId },
        data: {
          requestCallback: true,
          customerName: data.customerName,
          customerPhone: data.phoneNumber,
          callbackStatus: CallbackStatus.PENDING
        }
      });
      return await db.callbackRequest.create({
        data: {
          reviewId: data.reviewId,
          customerName: data.customerName,
          phoneNumber: data.phoneNumber,
          status: CallbackStatus.PENDING
        }
      });
    },
    async () => {
      const review = mockReviews.find(r => r.id === data.reviewId);
      if (review) {
        review.requestCallback = true;
        review.customerName = data.customerName;
        review.customerPhone = data.phoneNumber;
        review.callbackStatus = CallbackStatus.PENDING;
      }
      const newCallback: CallbackRequest = {
        id: `cb-${Math.random().toString(36).substring(2, 9)}`,
        reviewId: data.reviewId,
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        status: CallbackStatus.PENDING,
        createdAt: new Date()
      };
      mockCallbackRequests.push(newCallback);
      return newCallback;
    }
  );
}

export async function getReviewsByBusiness(
  businessId: string,
  filters: {
    rating?: number | null;
    period?: string | null;
    search?: string | null;
  }
) {
  return runQuery(
    async () => {
      const whereClause: any = { businessId };

      if (filters.rating) {
        whereClause.rating = Number(filters.rating);
      }

      if (filters.period) {
        const start = getPeriodStartDate(filters.period);
        whereClause.createdAt = { gte: start };
      }

      if (filters.search) {
        whereClause.OR = [
          { comment: { contains: filters.search, mode: 'insensitive' } },
          { customerName: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      return await db.review.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
    },
    async () => {
      let list = mockReviews.filter(r => r.businessId === businessId);

      if (filters.rating) {
        list = list.filter(r => r.rating === Number(filters.rating));
      }

      if (filters.period) {
        const start = getPeriodStartDate(filters.period);
        list = list.filter(r => r.createdAt >= start);
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter(r =>
          (r.comment || '').toLowerCase().includes(query) ||
          (r.customerName || '').toLowerCase().includes(query)
        );
      }

      return [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  );
}

export async function getCallbackRequestsByBusiness(
  businessId: string,
  filters: {
    status?: CallbackStatus | null;
    search?: string | null;
  }
) {
  return runQuery(
    async () => {
      const whereClause: any = {
        review: { businessId }
      };

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.search) {
        whereClause.OR = [
          { customerName: { contains: filters.search, mode: 'insensitive' } },
          { phoneNumber: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      return await db.callbackRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          review: true
        }
      });
    },
    async () => {
      let reviews = mockReviews.filter(r => r.businessId === businessId);
      const reviewIds = reviews.map(r => r.id);

      let list = mockCallbackRequests.filter(cb => reviewIds.includes(cb.reviewId));

      if (filters.status) {
        list = list.filter(cb => cb.status === filters.status);
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter(cb =>
          cb.customerName.toLowerCase().includes(query) ||
          cb.phoneNumber.toLowerCase().includes(query)
        );
      }

      return list.map(cb => {
        const review = mockReviews.find(r => r.id === cb.reviewId)!;
        return {
          ...cb,
          review
        };
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  );
}

export async function getCallbackRequestById(id: string) {
  return runQuery(
    async () => {
      return await db.callbackRequest.findUnique({
        where: { id },
        include: {
          review: true
        }
      });
    },
    async () => {
      const cb = mockCallbackRequests.find(c => c.id === id);
      if (!cb) return null;
      const review = mockReviews.find(r => r.id === cb.reviewId);
      return { ...cb, review };
    }
  );
}

export async function updateCallbackRequestStatus(id: string, status: CallbackStatus) {
  return runQuery(
    async () => {
      const callback = await db.callbackRequest.update({
        where: { id },
        data: { status }
      });
      await db.review.update({
        where: { id: callback.reviewId },
        data: { callbackStatus: status }
      });
      return callback;
    },
    async () => {
      const cb = mockCallbackRequests.find(c => c.id === id);
      if (cb) {
        cb.status = status;
        const review = mockReviews.find(r => r.id === cb.reviewId);
        if (review) {
          review.callbackStatus = status;
        }
      }
      return cb || null;
    }
  );
}

// ==========================================
// QR CODES LIFECYCLE
// ==========================================

export async function generateQrAssetsCustom(
  prefixLetter: string,
  startNum: number,
  endNum: number,
  adminId: string
) {
  const letter = prefixLetter.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(letter)) {
    throw new Error('Prefix must contain only letters (e.g. A, B, C).');
  }
  if (startNum < 1 || endNum < startNum) {
    throw new Error('Invalid Start or End Number range.');
  }

  const quantity = endNum - startNum + 1;
  const prefix = `cqr-${letter}`;

  return runQuery(
    async () => {
      const codesToCheck: string[] = [];
      for (let i = 0; i < quantity; i++) {
        const code = prefix + String(startNum + i).padStart(3, '0');
        codesToCheck.push(code);
      }

      const existing = await db.qRAsset.findMany({
        where: { qrCode: { in: codesToCheck } },
        select: { qrCode: true }
      });
      if (existing.length > 0) {
        throw new Error(`Duplicate QR codes detected: ${existing.map(e => e.qrCode).join(', ')}`);
      }

      const startSerial = codesToCheck[0];
      const endSerial = codesToCheck[codesToCheck.length - 1];

      return await db.$transaction(async (tx) => {
        const batch = await tx.qRBatch.create({
          data: {
            batchName: `Batch ${letter} (${startNum}-${endNum})`,
            startSerial,
            endSerial,
            quantity,
            generatedBy: adminId
          }
        });

        await tx.qRAsset.createMany({
          data: codesToCheck.map(code => ({
            qrCode: code,
            status: QRAssetStatus.FREE
          }))
        });

        return batch;
      });
    },
    async () => {
      const codesToCheck: string[] = [];
      for (let i = 0; i < quantity; i++) {
        const code = prefix + String(startNum + i).padStart(3, '0');
        codesToCheck.push(code);
      }

      const existing = mockQrAssets.filter(q => codesToCheck.includes(q.qrCode));
      if (existing.length > 0) {
        throw new Error(`Duplicate QR codes detected: ${existing.map(e => e.qrCode).join(', ')}`);
      }

      const startSerial = codesToCheck[0];
      const endSerial = codesToCheck[codesToCheck.length - 1];

      const newBatch = {
        id: `batch-${mockQrBatches.length + 1}`,
        batchName: `Batch ${letter} (${startNum}-${endNum})`,
        startSerial,
        endSerial,
        quantity,
        generatedBy: adminId,
        generatedAt: new Date()
      };

      mockQrBatches.push(newBatch);

      codesToCheck.forEach(code => {
        mockQrAssets.push({
          id: `inv-${Math.random().toString(36).substring(2, 9)}`,
          qrCode: code,
          status: QRAssetStatus.FREE,
          assignedBusinessId: null,
          assignedBy: null,
          assignedDate: null,
          revokedDate: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      return newBatch;
    }
  );
}

export async function revokeQrAsset(qrCode: string, adminId: string) {
  return runQuery(
    async () => {
      const qrRecord = await db.qRAsset.findUnique({
        where: { qrCode }
      });
      if (!qrRecord) {
        throw new Error('QR Asset does not exist.');
      }

      const businessId = qrRecord.assignedBusinessId;

      const updatedQr = await db.qRAsset.update({
        where: { qrCode },
        data: {
          status: QRAssetStatus.FREE,
          assignedBusinessId: null,
          revokedDate: new Date()
        }
      });

      if (businessId) {
        await db.business.update({
          where: { id: businessId },
          data: {
            assignedQrAssetId: null
          }
        });

        const latestHistory = await db.qRHistory.findFirst({
          where: { qrAssetId: qrRecord.id, businessId, revokedAt: null },
          orderBy: { assignedAt: 'desc' }
        });

        if (latestHistory) {
          await db.qRHistory.update({
            where: { id: latestHistory.id },
            data: {
              revokedAt: new Date()
            }
          });
        } else {
          await db.qRHistory.create({
            data: {
              qrAssetId: qrRecord.id,
              businessId,
              assignedBy: adminId,
              revokedAt: new Date(),
              assignedAt: qrRecord.assignedDate || new Date()
            }
          });
        }
      }

      return updatedQr;
    },
    async () => {
      const qrRecord = mockQrAssets.find(q => q.qrCode === qrCode);
      if (!qrRecord) {
        throw new Error('QR Asset does not exist.');
      }

      const businessId = qrRecord.assignedBusinessId;
      qrRecord.status = QRAssetStatus.FREE;
      qrRecord.assignedBusinessId = null;
      qrRecord.revokedDate = new Date();

      if (businessId) {
        const biz = mockBusinesses.find(b => b.id === businessId);
        if (biz) {
          biz.assignedQrAssetId = null;
        }

        const latestHistory = mockQrHistory.find(h => h.qrAssetId === qrRecord.id && h.businessId === businessId && h.revokedAt === null);
        if (latestHistory) {
          latestHistory.revokedAt = new Date();
        } else {
          mockQrHistory.push({
            id: `history-${Math.random().toString(36).substring(2, 9)}`,
            qrAssetId: qrRecord.id,
            businessId,
            assignedBy: adminId,
            assignedAt: qrRecord.assignedDate || new Date(),
            revokedAt: new Date()
          });
        }
      }

      return qrRecord;
    }
  );
}

export async function deleteQrAsset(qrCode: string, adminId: string) {
  return runQuery(
    async () => {
      const qrRecord = await db.qRAsset.findUnique({
        where: { qrCode }
      });
      if (!qrRecord) {
        throw new Error('QR Asset does not exist.');
      }

      const businessId = qrRecord.assignedBusinessId;

      if (businessId) {
        await db.business.update({
          where: { id: businessId },
          data: {
            assignedQrAssetId: null
          }
        });
      }

      const deletedQr = await db.qRAsset.delete({
        where: { qrCode }
      });

      return deletedQr;
    },
    async () => {
      const idx = mockQrAssets.findIndex(q => q.qrCode === qrCode);
      if (idx === -1) {
        throw new Error('QR Asset does not exist.');
      }
      const qrRecord = mockQrAssets[idx];
      const businessId = qrRecord.assignedBusinessId;

      if (businessId) {
        const biz = mockBusinesses.find(b => b.id === businessId);
        if (biz) {
          biz.assignedQrAssetId = null;
        }
      }

      mockQrHistory = mockQrHistory.filter(h => h.qrAssetId !== qrRecord.id);
      mockQrAssets.splice(idx, 1);

      return qrRecord;
    }
  );
}

export async function assignQrToBusiness(data: {
  qrCode: string;
  businessId: string;
  repId: string;
}) {
  return runQuery(
    async () => {
      return await db.$transaction(async (tx) => {
        const qrRecord = await tx.qRAsset.findUnique({
          where: { qrCode: data.qrCode }
        });
        if (!qrRecord) {
          throw new Error('QR Asset does not exist in inventory.');
        }
        if (qrRecord.status === QRAssetStatus.ASSIGNED) {
          if (qrRecord.assignedBusinessId === data.businessId) {
            return { success: true, qrInventory: qrRecord };
          }
          throw new Error(`QR Asset "${data.qrCode}" is already assigned to a business.`);
        }

        // Revoke any current active QR asset of the business
        const currentActive = await tx.qRAsset.findFirst({
          where: { assignedBusinessId: data.businessId, status: QRAssetStatus.ASSIGNED }
        });
        if (currentActive) {
          await tx.qRAsset.update({
            where: { id: currentActive.id },
            data: {
              status: QRAssetStatus.FREE,
              assignedBusinessId: null,
              revokedDate: new Date()
            }
          });
          const currentHist = await tx.qRHistory.findFirst({
            where: { qrAssetId: currentActive.id, businessId: data.businessId, revokedAt: null },
            orderBy: { assignedAt: 'desc' }
          });
          if (currentHist) {
            await tx.qRHistory.update({
              where: { id: currentHist.id },
              data: { revokedAt: new Date() }
            });
          }
        }

        // Assign the new QR asset
        const updatedQr = await tx.qRAsset.update({
          where: { qrCode: data.qrCode },
          data: {
            status: QRAssetStatus.ASSIGNED,
            assignedBusinessId: data.businessId,
            assignedDate: new Date(),
            assignedBy: data.repId
          }
        });

        // Set pointer on Business
        await tx.business.update({
          where: { id: data.businessId },
          data: {
            assignedQrAssetId: updatedQr.id
          }
        });

        // Log this assignment in QRHistory
        const history = await tx.qRHistory.create({
          data: {
            qrAssetId: updatedQr.id,
            businessId: data.businessId,
            assignedBy: data.repId,
            assignedAt: new Date()
          }
        });

        return { success: true, qrInventory: updatedQr };
      });
    },
    async () => {
      const qrRecord = mockQrAssets.find(q => q.qrCode === data.qrCode);
      if (!qrRecord) {
        throw new Error('QR Asset does not exist in inventory.');
      }
      if (qrRecord.status === QRAssetStatus.ASSIGNED) {
        if (qrRecord.assignedBusinessId === data.businessId) {
          return { success: true, qrInventory: qrRecord };
        }
        throw new Error(`QR Asset "${data.qrCode}" is already assigned.`);
      }

      // Revoke current active mock QR asset
      const currentActive = mockQrAssets.find(q => q.assignedBusinessId === data.businessId && q.status === QRAssetStatus.ASSIGNED);
      if (currentActive) {
        currentActive.status = QRAssetStatus.FREE;
        currentActive.assignedBusinessId = null;
        currentActive.revokedDate = new Date();

        const currentHist = mockQrHistory.find(h => h.qrAssetId === currentActive.id && h.businessId === data.businessId && h.revokedAt === null);
        if (currentHist) {
          currentHist.revokedAt = new Date();
        }
      }

      qrRecord.status = QRAssetStatus.ASSIGNED;
      qrRecord.assignedBusinessId = data.businessId;
      qrRecord.assignedBy = data.repId;
      qrRecord.assignedDate = new Date();

      // Update mock business active asset pointer
      const biz = mockBusinesses.find(b => b.id === data.businessId);
      if (biz) {
        biz.assignedQrAssetId = qrRecord.id;
      }

      mockQrHistory.push({
        id: `history-${Math.random().toString(36).substring(2, 9)}`,
        qrAssetId: qrRecord.id,
        businessId: data.businessId,
        assignedBy: data.repId,
        assignedAt: new Date(),
        revokedAt: null
      });

      return { success: true, qrInventory: qrRecord };
    }
  );
}

export async function replaceDamagedQr(data: {
  oldQrCode: string;
  newQrCode: string;
  repId: string;
  repRole?: string;
}) {
  return runQuery(
    async () => {
      return await db.$transaction(async (tx) => {
        const oldQr = await tx.qRAsset.findUnique({
          where: { qrCode: data.oldQrCode }
        });
        if (!oldQr || oldQr.status !== QRAssetStatus.ASSIGNED) {
          throw new Error('Old QR code is not currently ASSIGNED to any business.');
        }

        const businessId = oldQr.assignedBusinessId;
        if (!businessId) {
          throw new Error('Old QR code is not assigned to any business.');
        }

        // Security check: IDOR check for REP role
        if (data.repRole === 'REP') {
          const business = await tx.business.findUnique({
            where: { id: businessId }
          });
          if (business && business.createdByRepId !== data.repId) {
            throw new Error('Access denied. This business was onboarded by another representative.');
          }
        }

        const newQrAsset = await tx.qRAsset.findUnique({
          where: { qrCode: data.newQrCode }
        });
        if (!newQrAsset) {
          throw new Error(`New QR code "${data.newQrCode}" does not exist in inventory.`);
        }
        if (newQrAsset.status !== QRAssetStatus.FREE) {
          throw new Error(`New QR code "${data.newQrCode}" is already assigned to a business.`);
        }

        // 1. Revoke the old QR code
        const updatedOldQr = await tx.qRAsset.update({
          where: { qrCode: data.oldQrCode },
          data: {
            status: QRAssetStatus.FREE,
            assignedBusinessId: null,
            revokedDate: new Date()
          }
        });

        // Update old QR history
        const oldHistory = await tx.qRHistory.findFirst({
          where: { qrAssetId: oldQr.id, businessId, revokedAt: null },
          orderBy: { assignedAt: 'desc' }
        });
        if (oldHistory) {
          await tx.qRHistory.update({
            where: { id: oldHistory.id },
            data: { revokedAt: new Date() }
          });
        }

        // 2. Assign the new QR code
        const updatedNewQr = await tx.qRAsset.update({
          where: { qrCode: data.newQrCode },
          data: {
            status: QRAssetStatus.ASSIGNED,
            assignedBusinessId: businessId,
            assignedDate: new Date(),
            assignedBy: data.repId
          }
        });

        // 3. Update pointer on Business
        await tx.business.update({
          where: { id: businessId },
          data: {
            assignedQrAssetId: updatedNewQr.id
          }
        });

        // 4. Create new QR assignment log history
        await tx.qRHistory.create({
          data: {
            qrAssetId: updatedNewQr.id,
            businessId,
            assignedBy: data.repId,
            assignedAt: new Date()
          }
        });

        return { success: true, oldQr: updatedOldQr, newQr: updatedNewQr };
      });
    },
    async () => {
      const oldQr = mockQrAssets.find(q => q.qrCode === data.oldQrCode);
      if (!oldQr || oldQr.status !== QRAssetStatus.ASSIGNED) {
        throw new Error('Old QR code is not currently ASSIGNED.');
      }

      const businessId = oldQr.assignedBusinessId;
      if (!businessId) {
        throw new Error('Old QR code is not assigned to any business.');
      }

      if (data.repRole === 'REP') {
        const business = mockBusinesses.find(b => b.id === businessId);
        if (business && business.createdByRepId !== data.repId) {
          throw new Error('Access denied. This business was onboarded by another representative.');
        }
      }

      const newQr = mockQrAssets.find(q => q.qrCode === data.newQrCode);
      if (!newQr) {
        throw new Error(`New QR code "${data.newQrCode}" does not exist in inventory.`);
      }
      if (newQr.status !== QRAssetStatus.FREE) {
        throw new Error(`New QR code "${data.newQrCode}" is already assigned.`);
      }

      oldQr.status = QRAssetStatus.FREE;
      oldQr.assignedBusinessId = null;
      oldQr.revokedDate = new Date();

      const oldHist = mockQrHistory.find(h => h.qrAssetId === oldQr.id && h.businessId === businessId && h.revokedAt === null);
      if (oldHist) {
        oldHist.revokedAt = new Date();
      }

      newQr.status = QRAssetStatus.ASSIGNED;
      newQr.assignedBusinessId = businessId;
      newQr.assignedBy = data.repId;
      newQr.assignedDate = new Date();

      const biz = mockBusinesses.find(b => b.id === businessId);
      if (biz) {
        biz.assignedQrAssetId = newQr.id;
      }

      mockQrHistory.push({
        id: `history-${Math.random().toString(36).substring(2, 9)}`,
        qrAssetId: newQr.id,
        businessId,
        assignedBy: data.repId,
        assignedAt: new Date(),
        revokedAt: null
      });

      return { success: true, oldQr, newQr };
    }
  );
};

export async function toggleQrInactive(qrCode: string, inactive: boolean, repId: string, repRole?: string) {
  const targetStatus = inactive ? QRAssetStatus.FREE : QRAssetStatus.ASSIGNED;
  return runQuery(
    async () => {
      const qrRecord = await db.qRAsset.findUnique({
        where: { qrCode }
      });
      if (!qrRecord) {
        throw new Error('QR Asset does not exist in inventory.');
      }
      if (repRole === 'REP') {
        const businessId = qrRecord.assignedBusinessId;
        if (businessId) {
          const business = await db.business.findUnique({
            where: { id: businessId }
          });
          if (business && business.createdByRepId !== repId) {
            throw new Error('Access denied. This business was onboarded by another representative.');
          }
        }
      }

      const updated = await db.qRAsset.update({
        where: { qrCode },
        data: {
          status: targetStatus,
          assignedBusinessId: inactive ? null : qrRecord.assignedBusinessId,
          revokedDate: inactive ? new Date() : qrRecord.revokedDate
        }
      });

      if (inactive && qrRecord.assignedBusinessId) {
        await db.business.update({
          where: { id: qrRecord.assignedBusinessId },
          data: { assignedQrAssetId: null }
        });
        
        const latestHist = await db.qRHistory.findFirst({
          where: { qrAssetId: qrRecord.id, businessId: qrRecord.assignedBusinessId, revokedAt: null },
          orderBy: { assignedAt: 'desc' }
        });
        if (latestHist) {
          await db.qRHistory.update({
            where: { id: latestHist.id },
            data: { revokedAt: new Date() }
          });
        }
      }

      return updated;
    },
    async () => {
      const qrRecord = mockQrAssets.find(q => q.qrCode === qrCode);
      if (!qrRecord) {
        throw new Error('QR Asset does not exist.');
      }
      if (repRole === 'REP') {
        const businessId = qrRecord.assignedBusinessId;
        if (businessId) {
          const business = mockBusinesses.find(b => b.id === businessId);
          if (business && business.createdByRepId !== repId) {
            throw new Error('Access denied. This business was onboarded by another representative.');
          }
        }
      }
      qrRecord.status = targetStatus;
      if (inactive && qrRecord.assignedBusinessId) {
        const bizId = qrRecord.assignedBusinessId;
        qrRecord.assignedBusinessId = null;
        qrRecord.revokedDate = new Date();
        const biz = mockBusinesses.find(b => b.id === bizId);
        if (biz) {
          biz.assignedQrAssetId = null;
        }
        const latestHist = mockQrHistory.find(h => h.qrAssetId === qrRecord.id && h.businessId === bizId && h.revokedAt === null);
        if (latestHist) {
          latestHist.revokedAt = new Date();
        }
      }
      return qrRecord;
    }
  );
}

// History of a specific representative
export async function getRepAssignmentsHistory(repId: string, search?: string | null) {
  return runQuery(
    async () => {
      const whereClause: any = { assignedBy: repId };

      if (search) {
        const query = search.trim();
        whereClause.OR = [
          { business: { name: { contains: query, mode: 'insensitive' } } },
          { qrAsset: { qrCode: { contains: query, mode: 'insensitive' } } }
        ];
      }

      const history = await db.qRHistory.findMany({
        where: whereClause,
        orderBy: { assignedAt: 'desc' },
        take: 100,
        include: {
          qrAsset: true,
          business: { select: { name: true, industry: true } }
        }
      });

      return history.map(h => ({
        ...h,
        createdAt: h.assignedAt,
        action: h.revokedAt ? 'REVOKED' : 'ASSIGNED',
        qrInventory: h.qrAsset
      }));
    },
    async () => {
      let logs = mockQrHistory.filter(log => log.assignedBy === repId);

      let resolvedLogs = logs.map(log => {
        const qrAsset = mockQrAssets.find(q => q.id === log.qrAssetId);
        const business = mockBusinesses.find(b => b.id === log.businessId);
        return {
          ...log,
          createdAt: log.assignedAt,
          action: log.revokedAt ? 'REVOKED' : 'ASSIGNED',
          qrInventory: qrAsset,
          business: business ? { name: business.name, industry: business.industry } : null
        };
      });

      if (search) {
        const query = search.toLowerCase();
        resolvedLogs = resolvedLogs.filter(log =>
          (log.business?.name || '').toLowerCase().includes(query) ||
          (log.qrInventory?.qrCode || '').toLowerCase().includes(query)
        );
      }

      return resolvedLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  );
}

export async function getRepStats(repId: string) {
  return runQuery(
    async () => {
      const [onboardedCount, activeBusinessesCount, recoveryRequestsCount] = await Promise.all([
        db.business.count({
          where: { createdByRepId: repId }
        }),
        db.business.count({
          where: { createdByRepId: repId, status: BusinessStatus.ACTIVE }
        }),
        db.recoveryRequest.count({
          where: { business: { createdByRepId: repId } }
        })
      ]);

      const repBusinesses = await db.business.findMany({
        where: { createdByRepId: repId },
        select: { id: true }
      });
      const bizIds = repBusinesses.map(b => b.id);

      const qrDownloadsCount = await db.activityLog.count({
        where: {
          action: 'QR_DOWNLOAD',
          entityType: 'BUSINESS',
          entityId: { in: bizIds }
        }
      });

      return { onboardedCount, assignmentsCount: recoveryRequestsCount, activeBusinessesCount, qrDownloadsCount };
    },
    async () => {
      const repBusinesses = mockBusinesses.filter(b => b.createdByRepId === repId);
      const bizIds = repBusinesses.map(b => b.id);
      const onboardedCount = repBusinesses.length;
      const activeBusinessesCount = repBusinesses.filter(b => b.status === BusinessStatus.ACTIVE).length;
      
      const recoveryRequestsCount = mockRecoveryRequests.filter(rr => {
        const b = mockBusinesses.find(biz => biz.id === rr.businessId);
        return b?.createdByRepId === repId;
      }).length;

      const qrDownloadsCount = mockLogs.filter(l =>
        l.action === 'QR_DOWNLOAD' &&
        l.entityType === 'BUSINESS' &&
        l.entityId &&
        bizIds.includes(l.entityId)
      ).length;

      return { onboardedCount, assignmentsCount: recoveryRequestsCount, activeBusinessesCount, qrDownloadsCount };
    }
  );
}


export async function getQrInventory(filters?: { status?: QRAssetStatus | null; search?: string | null; businessId?: string | null; batchId?: string | null }) {
  return runQuery(
    async () => {
      const whereClause: any = {};

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.businessId && filters.businessId !== 'ALL') {
        whereClause.assignedBusinessId = filters.businessId;
      }

      if (filters?.search) {
        const query = filters.search.trim();
        whereClause.OR = [
          { qrCode: { contains: query, mode: 'insensitive' } },
          { business: { name: { contains: query, mode: 'insensitive' } } }
        ];
      }

      return await db.qRAsset.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          business: {
            select: {
              name: true,
              slug: true,
              logoUrl: true,
              createdByRep: { select: { name: true } }
            }
          },
          rep: { select: { name: true } }
        }
      });
    },
    async () => {
      let list = [...mockQrAssets];

      if (filters?.status) {
        list = list.filter(q => q.status === filters.status);
      }

      if (filters?.businessId && filters.businessId !== 'ALL') {
        list = list.filter(q => q.assignedBusinessId === filters.businessId);
      }

      const mapped = list.map(q => {
        const business = mockBusinesses.find(b => b.id === q.assignedBusinessId);
        const rep = mockUsers.find(u => u.id === q.assignedBy);
        const bizCreatorRep = business ? mockUsers.find(u => u.id === business.createdByRepId) : null;
        return {
          ...q,
          business: business ? {
            name: business.name,
            slug: business.slug,
            logoUrl: business.logoUrl,
            createdByRep: bizCreatorRep ? { name: bizCreatorRep.name } : null
          } : null,
          rep: rep ? { name: rep.name } : null
        };
      });

      if (filters?.search) {
        const query = filters.search.toLowerCase();
        return mapped.filter(q =>
          q.qrCode.toLowerCase().includes(query) ||
          (q.business?.name || '').toLowerCase().includes(query)
        ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      return mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  );
}

export async function getQrInventoryStats() {
  return runQuery(
    async () => {
      const [total, assigned, free] = await Promise.all([
        db.qRAsset.count(),
        db.qRAsset.count({ where: { status: QRAssetStatus.ASSIGNED } }),
        db.qRAsset.count({ where: { status: QRAssetStatus.FREE } })
      ]);

      return { total, active: assigned, archived: 0, assigned, unassigned: free, free };
    },
    async () => {
      const total = mockQrAssets.length;
      const assigned = mockQrAssets.filter(q => q.status === QRAssetStatus.ASSIGNED).length;
      const free = mockQrAssets.filter(q => q.status === QRAssetStatus.FREE).length;

      return { total, active: assigned, archived: 0, assigned, unassigned: free, free };
    }
  );
}

export async function validateQrCode(qrCode: string) {
  const normalizedCode = qrCode.toLowerCase().trim();
  return runQuery(
    async () => {
      return await db.qRAsset.findFirst({
        where: { qrCode: { equals: qrCode.trim(), mode: 'insensitive' } },
        include: {
          business: true
        }
      });
    },
    async () => {
      const qrRecord = mockQrAssets.find(q => q.qrCode.toLowerCase() === normalizedCode);
      if (!qrRecord) return null;
      const business = mockBusinesses.find(b => b.id === qrRecord.assignedBusinessId) || null;
      return {
        ...qrRecord,
        business: business ? {
          id: business.id,
          name: business.name,
          slug: business.slug,
          industry: business.industry,
          logoUrl: business.logoUrl,
          googleReviewUrl: business.googleReviewUrl,
          enableGoogleReviewRedirect: business.enableGoogleReviewRedirect,
          enableManagerCallback: business.enableManagerCallback
        } : null
      };
    }
  );
}

export async function getQrBatches() {
  return runQuery(
    async () => {
      return await db.qRBatch.findMany({
        orderBy: { generatedAt: 'desc' },
        include: {
          creator: { select: { name: true } }
        }
      });
    },
    async () => {
      return mockQrBatches.map(b => {
        const creator = mockUsers.find(u => u.id === b.generatedBy);
        return {
          ...b,
          creator: creator ? { name: creator.name } : null
        };
      }).sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    }
  );
}



export async function getSuperAdminAnalyticsFiltered(period = '30d') {
  return runQuery(
    async () => {
      const start = getPeriodStartDate(period);

      const [reviews, callbacks, businessesAdded, reps] = await Promise.all([
        db.review.findMany({
          where: { createdAt: { gte: start } }
        }),
        db.callbackRequest.findMany({
          where: { createdAt: { gte: start } }
        }),
        db.business.count({
          where: { createdAt: { gte: start }, deletedAt: null }
        }),
        db.user.findMany({
          where: { role: UserRole.REP }
        })
      ]);

      // Google Redirect Clicks and Google Conversion Rate
      const googleRedirectClicks = reviews.filter(r => r.googleCtaClicked).length;
      const positiveReviewsCount = reviews.filter(r => r.rating >= 4).length;
      const googleConversionRate = positiveReviewsCount > 0
        ? parseFloat(((googleRedirectClicks / positiveReviewsCount) * 100).toFixed(1))
        : 0;

      // Callback resolved rate
      const totalCallbacks = callbacks.length;
      const resolvedCallbacks = callbacks.filter(c => c.status === CallbackStatus.RESOLVED).length;

      // REP Performance Rankings (Batch using groupBy)
      const [repBusinessCounts, repAssignmentCounts] = await Promise.all([
        db.business.groupBy({
          by: ['createdByRepId'],
          where: { createdByRepId: { not: null }, createdAt: { gte: start } },
          _count: { id: true }
        }),
        db.qRHistory.groupBy({
          by: ['assignedBy'],
          where: { assignedAt: { gte: start } },
          _count: { id: true }
        })
      ]);

      const repBusinessMap = new Map(repBusinessCounts.map(c => [c.createdByRepId, c._count.id]));
      const repAssignmentMap = new Map(repAssignmentCounts.map(c => [c.assignedBy, c._count.id]));

      const repRankings = reps.map(rep => ({
        id: rep.id,
        name: rep.name,
        username: rep.username,
        onboarded: repBusinessMap.get(rep.id) || 0,
        assignments: repAssignmentMap.get(rep.id) || 0
      }));
      repRankings.sort((a, b) => b.onboarded - a.onboarded);

      // Most Active Industries (Batch using groupBy)
      const [businessIndustryCounts, activeBusinesses] = await Promise.all([
        db.business.groupBy({
          by: ['industry'],
          where: { createdAt: { gte: start }, deletedAt: null },
          _count: { id: true }
        }),
        db.business.findMany({
          where: { deletedAt: null },
          select: { id: true, industry: true }
        })
      ]);

      const businessIndustryCountsMap = new Map(businessIndustryCounts.map(c => [c.industry, c._count.id]));
      const activeBusinessIndustryMap = new Map(activeBusinesses.map(b => [b.id, b.industry]));

      const reviewsGroupedByBusiness = await db.review.groupBy({
        by: ['businessId'],
        where: { createdAt: { gte: start } },
        _count: { id: true }
      });

      const industryStatsMap = new Map<string, { industry: string; businessCount: number; reviewCount: number }>();
      for (const ind of Object.values(Industry)) {
        industryStatsMap.set(ind, { industry: ind, businessCount: businessIndustryCountsMap.get(ind) || 0, reviewCount: 0 });
      }

      reviewsGroupedByBusiness.forEach(rg => {
        const ind = activeBusinessIndustryMap.get(rg.businessId);
        if (ind) {
          const stats = industryStatsMap.get(ind);
          if (stats) {
            stats.reviewCount += rg._count.id;
          }
        }
      });

      const industryStats = Array.from(industryStatsMap.values());
      industryStats.sort((a, b) => b.reviewCount - a.reviewCount);

      // Top Performing Businesses (take top 10 from grouped reviews)
      const topReviewsGrouped = await db.review.groupBy({
        by: ['businessId'],
        where: { createdAt: { gte: start } },
        _count: { id: true },
        _avg: { rating: true },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });

      const topBusinessIds = topReviewsGrouped.map(g => g.businessId);

      const [topBusinessesDetails, positiveReviewCounts] = await Promise.all([
        db.business.findMany({
          where: { id: { in: topBusinessIds } },
          select: { id: true, name: true }
        }),
        db.review.groupBy({
          by: ['businessId'],
          where: {
            businessId: { in: topBusinessIds },
            rating: { gte: 4 },
            createdAt: { gte: start }
          },
          _count: { id: true }
        })
      ]);

      const topBusinessesDetailsMap = new Map(topBusinessesDetails.map(b => [b.id, b.name]));
      const positiveReviewCountsMap = new Map(positiveReviewCounts.map(c => [c.businessId, c._count.id]));

      const topBusinesses = topReviewsGrouped.map(g => {
        const name = topBusinessesDetailsMap.get(g.businessId) || 'Unknown Business';
        const avgRating = g._avg.rating ? parseFloat(g._avg.rating.toFixed(1)) : 0;
        const totalBizReviews = g._count.id;
        const positiveCount = positiveReviewCountsMap.get(g.businessId) || 0;

        return {
          id: g.businessId,
          name,
          averageRating: avgRating,
          reviewsCount: totalBizReviews,
          positiveCount
        };
      });

      const ratingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = reviews.length > 0 ? parseFloat((ratingSum / reviews.length).toFixed(1)) : 0;
      const positiveReviews = positiveReviewsCount;
      const negativeReviews = reviews.filter(r => r.rating <= 3).length;

      return {
        totalReviews: reviews.length,
        averageRating,
        positiveReviews,
        negativeReviews,
        googleRedirectClicks,
        googleConversionRate,
        callbackRequests: totalCallbacks,
        resolvedRequests: resolvedCallbacks,
        businessesAdded,
        repRankings,
        industryStats,
        topBusinesses
      };
    },
    async () => {
      const start = getPeriodStartDate(period);

      const reviews = mockReviews.filter(r => r.createdAt >= start);
      const callbacks = mockCallbackRequests.filter(c => c.createdAt >= start);
      const businessesAdded = mockBusinesses.filter(b => b.createdAt >= start && b.deletedAt === null).length;

      const googleRedirectClicks = reviews.filter(r => r.googleCtaClicked).length;
      const positiveReviewsCount = reviews.filter(r => r.rating >= 4).length;
      const googleConversionRate = positiveReviewsCount > 0
        ? parseFloat(((googleRedirectClicks / positiveReviewsCount) * 100).toFixed(1))
        : 0;

      const totalCallbacks = callbacks.length;
      const resolvedCallbacks = callbacks.filter(c => c.status === CallbackStatus.RESOLVED).length;

      const reps = mockUsers.filter(u => u.role === UserRole.REP);
      const repRankings = reps.map(rep => {
        const onboarded = mockBusinesses.filter(b => b.createdByRepId === rep.id && b.createdAt >= start).length;
        const assignments = mockQrHistory.filter(l => l.assignedBy === rep.id && l.assignedAt >= start).length;
        return {
          id: rep.id,
          name: rep.name,
          username: rep.username,
          onboarded,
          assignments
        };
      }).sort((a, b) => b.onboarded - a.onboarded);

      const industries = Object.values(Industry);
      const industryStats = industries.map(ind => {
        const count = mockBusinesses.filter(b => b.industry === ind && b.createdAt >= start && b.deletedAt === null).length;
        const reviewCount = reviews.filter(r => {
          const biz = mockBusinesses.find(b => b.id === r.businessId);
          return biz?.industry === ind;
        }).length;
        return {
          industry: ind,
          businessCount: count,
          reviewCount
        };
      }).sort((a, b) => b.reviewCount - a.reviewCount);

      const businessRankings = mockBusinesses.filter(b => b.deletedAt === null).map(b => {
        const bizReviews = reviews.filter(r => r.businessId === b.id);
        const totalBizReviews = bizReviews.length;
        const avgRating = totalBizReviews > 0
          ? parseFloat((bizReviews.reduce((acc, r) => acc + r.rating, 0) / totalBizReviews).toFixed(1))
          : 0;
        const positiveCount = bizReviews.filter(r => r.rating >= 4).length;
        return {
          id: b.id,
          name: b.name,
          averageRating: avgRating,
          reviewsCount: totalBizReviews,
          positiveCount
        };
      }).sort((a, b) => b.reviewsCount - a.reviewsCount);

      const ratingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = reviews.length > 0 ? parseFloat((ratingSum / reviews.length).toFixed(1)) : 0;
      const positiveReviews = positiveReviewsCount;
      const negativeReviews = reviews.filter(r => r.rating <= 3).length;

      return {
        totalReviews: reviews.length,
        averageRating,
        positiveReviews,
        negativeReviews,
        googleRedirectClicks,
        googleConversionRate,
        callbackRequests: totalCallbacks,
        resolvedRequests: resolvedCallbacks,
        businessesAdded,
        repRankings,
        industryStats,
        topBusinesses: businessRankings.slice(0, 10)
      };
    }
  );
}

export async function getActivityLogsFiltered(filters: { date?: string; role?: string; actionType?: string }) {
  return runQuery(
    async () => {
      const whereClause: any = {};

      if (filters.date) {
        const start = new Date(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.date);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt = { gte: start, lte: end };
      }

      if (filters.actionType) {
        whereClause.action = { contains: filters.actionType, mode: 'insensitive' };
      }

      const logs = await db.activityLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 200
      });

      const userIds = Array.from(new Set(logs.map(log => log.userId).filter(Boolean))) as string[];

      const [users, businesses] = await Promise.all([
        db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, role: true }
        }),
        db.business.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true }
        })
      ]);

      const userMap = new Map();
      users.forEach(u => userMap.set(u.id, { name: u.name, role: u.role }));
      businesses.forEach(b => userMap.set(b.id, { name: b.name, role: 'BUSINESS' }));

      const resolved = logs.map(log => {
        const actor = log.userId ? userMap.get(log.userId) : null;
        return {
          id: log.id,
          timestamp: log.createdAt,
          userId: log.userId,
          user: actor ? actor.name : 'System',
          role: actor ? actor.role : 'SYSTEM',
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          description: log.metadata ? (() => {
            try {
              const parsed = JSON.parse(log.metadata);
              if (parsed.name) return `${log.action}: ${parsed.name}`;
              return log.action;
            } catch {
              return log.metadata;
            }
          })() : log.action
        };
      });

      if (filters.role && filters.role !== 'ALL') {
        return resolved.filter(log => log.role === filters.role);
      }

      return resolved;
    },
    async () => {
      let logs = [...mockLogs];

      if (filters.date) {
        const targetDate = new Date(filters.date).toDateString();
        logs = logs.filter(log => log.createdAt.toDateString() === targetDate);
      }

      if (filters.actionType) {
        const query = filters.actionType.toLowerCase();
        logs = logs.filter(log => log.action.toLowerCase().includes(query));
      }

      const resolved = logs.map(log => {
        const user = mockUsers.find(u => u.id === log.userId);
        const biz = mockBusinesses.find(b => b.id === log.userId);

        let userName = 'System';
        let userRole = 'SYSTEM';
        if (user) {
          userName = user.name;
          userRole = user.role;
        } else if (biz) {
          userName = biz.name;
          userRole = 'BUSINESS';
        }

        return {
          id: log.id,
          timestamp: log.createdAt,
          userId: log.userId,
          user: userName,
          role: userRole,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          description: log.metadata ? (() => {
            try {
              const parsed = JSON.parse(log.metadata);
              if (parsed.name) return `${log.action}: ${parsed.name}`;
              return log.action;
            } catch {
              return log.metadata;
            }
          })() : log.action
        };
      });

      if (filters.role && filters.role !== 'ALL') {
        return resolved.filter(log => log.role === filters.role);
      }

      return resolved.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  );
}

export async function updateSubscription(
  businessId: string,
  plan: string,
  action: 'upgrade' | 'downgrade' | 'extend' | 'expire' | 'activate',
  months = 1,
  adminId: string
) {
  return runQuery(
    async () => {
      const latestSub = await db.subscription.findFirst({
        where: { businessId },
        orderBy: { createdAt: 'desc' }
      });

      let dbPlan: SubscriptionPlan = SubscriptionPlan.TRIAL;
      let startDate = new Date();
      let endDate = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
      let targetStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;

      if (plan === 'TRIAL_14') {
        dbPlan = SubscriptionPlan.TRIAL;
        endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      } else if (plan === 'TRIAL_28') {
        dbPlan = SubscriptionPlan.TRIAL;
        endDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      } else if (plan === 'UNLIMITED') {
        dbPlan = SubscriptionPlan.PRO;
        endDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
      } else if (plan === 'TRIAL') {
        dbPlan = SubscriptionPlan.TRIAL;
      } else if (plan === 'BASIC') {
        dbPlan = SubscriptionPlan.BASIC;
      } else if (plan === 'PRO') {
        dbPlan = SubscriptionPlan.PRO;
      }

      if (latestSub) {
        startDate = latestSub.startDate;
        if (action === 'extend') {
          const baseDate = latestSub.endDate.getTime() > Date.now() ? latestSub.endDate : new Date();
          if (plan === 'TRIAL_14') {
            endDate = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
          } else if (plan === 'TRIAL_28') {
            endDate = new Date(baseDate.getTime() + 28 * 24 * 60 * 60 * 1000);
          } else if (plan === 'UNLIMITED') {
            endDate = new Date(baseDate.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
          } else {
            endDate = new Date(baseDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);
          }
        } else if (action === 'expire') {
          endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          targetStatus = SubscriptionStatus.EXPIRED;
        }
      }

      if (action === 'expire') {
        targetStatus = SubscriptionStatus.EXPIRED;
      }

      const newSub = await db.subscription.create({
        data: {
          businessId,
          plan: dbPlan,
          status: targetStatus,
          startDate,
          endDate
        }
      });

      let bizStatus: BusinessStatus = BusinessStatus.ACTIVE;
      if (targetStatus === SubscriptionStatus.EXPIRED) {
        bizStatus = BusinessStatus.INACTIVE;
      }

      await db.business.update({
        where: { id: businessId },
        data: {
          status: bizStatus,
          isActive: bizStatus === BusinessStatus.ACTIVE
        }
      });

      await db.activityLog.create({
        data: {
          userId: adminId,
          action: `Subscription ${action.toUpperCase()}`,
          entityType: 'BUSINESS',
          entityId: businessId,
          metadata: JSON.stringify({ plan, action, endDate })
        }
      });

      return newSub;
    },
    async () => {
      const subs = mockSubscriptions.filter(s => s.businessId === businessId);
      let dbPlan: SubscriptionPlan = SubscriptionPlan.TRIAL;
      let startDate = new Date();
      let endDate = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
      let targetStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;

      if (plan === 'TRIAL_14') {
        dbPlan = SubscriptionPlan.TRIAL;
        endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      } else if (plan === 'TRIAL_28') {
        dbPlan = SubscriptionPlan.TRIAL;
        endDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
      } else if (plan === 'UNLIMITED') {
        dbPlan = SubscriptionPlan.PRO;
        endDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
      } else if (plan === 'TRIAL') {
        dbPlan = SubscriptionPlan.TRIAL;
      } else if (plan === 'BASIC') {
        dbPlan = SubscriptionPlan.BASIC;
      } else if (plan === 'PRO') {
        dbPlan = SubscriptionPlan.PRO;
      }

      if (subs.length > 0) {
        subs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const latestSub = subs[0];
        startDate = latestSub.startDate;
        if (action === 'extend') {
          const baseDate = latestSub.endDate.getTime() > Date.now() ? latestSub.endDate : new Date();
          if (plan === 'TRIAL_14') {
            endDate = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
          } else if (plan === 'TRIAL_28') {
            endDate = new Date(baseDate.getTime() + 28 * 24 * 60 * 60 * 1000);
          } else if (plan === 'UNLIMITED') {
            endDate = new Date(baseDate.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
          } else {
            endDate = new Date(baseDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);
          }
        } else if (action === 'expire') {
          endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          targetStatus = SubscriptionStatus.EXPIRED;
        }
      }

      const newSub = {
        id: `sub-${Math.random().toString(36).substring(2, 9)}`,
        businessId,
        plan: dbPlan,
        status: targetStatus,
        startDate,
        endDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockSubscriptions.push(newSub);

      const biz = mockBusinesses.find(b => b.id === businessId);
      if (biz) {
        let bizStatus: BusinessStatus = BusinessStatus.ACTIVE;
        if (targetStatus === SubscriptionStatus.EXPIRED) {
          bizStatus = BusinessStatus.INACTIVE;
        }
        biz.status = bizStatus;
        biz.isActive = bizStatus === BusinessStatus.ACTIVE;
      }

      mockLogs.push({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        userId: adminId,
        action: `Subscription ${action.toUpperCase()}`,
        entityType: 'BUSINESS',
        entityId: businessId,
        metadata: JSON.stringify({ plan, action, endDate }),
        createdAt: new Date()
      });

      return newSub;
    }
  );
}

// ==========================================
// BUSINESS ONBOARDING / DYNAMIC QR FUNCTIONS
// ==========================================

export async function generateQrForBusiness(businessId: string, userId: string) {
  return runQuery(
    async () => {
      let qrAsset = await db.qRAsset.findFirst({
        where: { status: QRAssetStatus.FREE },
        orderBy: { qrCode: 'asc' }
      });

      if (!qrAsset) {
        const latestRecord = await db.qRAsset.findFirst({
          where: { qrCode: { startsWith: 'cqr-' } },
          orderBy: { qrCode: 'desc' }
        });
        const nextCode = latestRecord ? computeNextQrCode(latestRecord.qrCode) : 'cqr-A001';
        qrAsset = await db.qRAsset.create({
          data: {
            qrCode: nextCode,
            status: QRAssetStatus.FREE
          }
        });
      }

      await db.qRAsset.updateMany({
        where: { assignedBusinessId: businessId, status: QRAssetStatus.ASSIGNED },
        data: {
          status: QRAssetStatus.FREE,
          assignedBusinessId: null,
          revokedDate: new Date()
        }
      });

      const updatedQr = await db.qRAsset.update({
        where: { id: qrAsset.id },
        data: {
          status: QRAssetStatus.ASSIGNED,
          assignedBusinessId: businessId,
          assignedDate: new Date(),
          assignedBy: userId
        }
      });

      await db.business.update({
        where: { id: businessId },
        data: {
          assignedQrAssetId: updatedQr.id
        }
      });

      await db.qRHistory.create({
        data: {
          qrAssetId: updatedQr.id,
          businessId,
          assignedBy: userId,
          assignedAt: new Date()
        }
      });

      return updatedQr;
    },
    async () => {
      let qrAsset = mockQrAssets.find(q => q.status === QRAssetStatus.FREE);
      if (!qrAsset) {
        const latestRecord = mockQrAssets
          .filter(q => q.qrCode.startsWith('cqr-'))
          .sort((a, b) => b.qrCode.localeCompare(a.qrCode))[0];
        const nextCode = latestRecord ? computeNextQrCode(latestRecord.qrCode) : 'cqr-A001';
        qrAsset = {
          id: `inv-${Math.random().toString(36).substring(2, 9)}`,
          qrCode: nextCode,
          status: QRAssetStatus.FREE,
          assignedBusinessId: null,
          assignedBy: null,
          assignedDate: null,
          revokedDate: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockQrAssets.push(qrAsset);
      }

      mockQrAssets.forEach(q => {
        if (q.assignedBusinessId === businessId && q.status === QRAssetStatus.ASSIGNED) {
          q.status = QRAssetStatus.FREE;
          q.assignedBusinessId = null;
          q.revokedDate = new Date();
        }
      });

      qrAsset.status = QRAssetStatus.ASSIGNED;
      qrAsset.assignedBusinessId = businessId;
      qrAsset.assignedBy = userId;
      qrAsset.assignedDate = new Date();

      const biz = mockBusinesses.find(b => b.id === businessId);
      if (biz) {
        biz.assignedQrAssetId = qrAsset.id;
      }

      mockQrHistory.push({
        id: `history-${Math.random().toString(36).substring(2, 9)}`,
        qrAssetId: qrAsset.id,
        businessId,
        assignedBy: userId,
        assignedAt: new Date(),
        revokedAt: null
      });

      return qrAsset;
    }
  );
}

export async function trackQrDownload(businessId: string, userId: string) {
  return runQuery(
    async () => {
      return await db.activityLog.create({
        data: {
          userId,
          action: 'QR_DOWNLOAD',
          entityType: 'BUSINESS',
          entityId: businessId
        }
      });
    },
    async () => {
      const log = {
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        userId,
        action: 'QR_DOWNLOAD',
        entityType: 'BUSINESS',
        entityId: businessId,
        metadata: null,
        createdAt: new Date()
      };
      mockLogs.push(log);
      return log;
    }
  );
}

export async function getQrDownloadStats(businessId: string) {
  return runQuery(
    async () => {
      const logs = await db.activityLog.findMany({
        where: { action: 'QR_DOWNLOAD', entityType: 'BUSINESS', entityId: businessId },
        orderBy: { createdAt: 'desc' }
      });
      const totalDownloads = logs.length;
      const lastDownloadDate = logs.length > 0 ? logs[0].createdAt : null;
      return { totalDownloads, lastDownloadDate };
    },
    async () => {
      const logs = mockLogs.filter(log => log.action === 'QR_DOWNLOAD' && log.entityType === 'BUSINESS' && log.entityId === businessId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const totalDownloads = logs.length;
      const lastDownloadDate = logs.length > 0 ? logs[0].createdAt : null;
      return { totalDownloads, lastDownloadDate };
    }
  );
}

export async function resolveBusinessByIdentifier(identifier: string) {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  return runQuery(
    async () => {
      // 1. Try to find by ID (UUID)
      const bizById = await db.business.findUnique({
        where: { id: identifier },
        include: { qrAssets: { where: { status: QRAssetStatus.ASSIGNED }, take: 1 } }
      });

      if (bizById) {
        const activeQr = bizById.qrAssets.length > 0 ? bizById.qrAssets[0] : null;
        return { business: bizById, qrCode: activeQr?.qrCode || 'NO_QR', qrStatus: activeQr?.status || 'Not Generated' };
      }

      // 2. Try to find by Business Code
      const bizByCode = await db.business.findUnique({
        where: { businessCode: identifier },
        include: { qrAssets: { where: { status: QRAssetStatus.ASSIGNED }, take: 1 } }
      });

      if (bizByCode) {
        const activeQr = bizByCode.qrAssets.length > 0 ? bizByCode.qrAssets[0] : null;
        return { business: bizByCode, qrCode: activeQr?.qrCode || 'NO_QR', qrStatus: activeQr?.status || 'Not Generated' };
      }

      // 3. Try to find by slug
      const bizBySlug = await db.business.findUnique({
        where: { slug: identifier },
        include: { qrAssets: { where: { status: QRAssetStatus.ASSIGNED }, take: 1 } }
      });

      if (bizBySlug) {
        const activeQr = bizBySlug.qrAssets.length > 0 ? bizBySlug.qrAssets[0] : null;
        return { business: bizBySlug, qrCode: activeQr?.qrCode || 'NO_QR', qrStatus: activeQr?.status || 'Not Generated' };
      }

      // 4. Try to find by QR code identifier (case-insensitive)
      const qrRecord = await db.qRAsset.findFirst({
        where: { qrCode: { equals: identifier.trim(), mode: 'insensitive' } },
        include: { business: true }
      });

      if (qrRecord) {
        return { business: qrRecord.business, qrCode: qrRecord.qrCode, qrStatus: qrRecord.status };
      }

      return null;
    },
    async () => {
      // Mock resolution
      // 1. Try ID
      const bizById = mockBusinesses.find(b => b.id === identifier);
      if (bizById) {
        const activeQr = mockQrAssets.find(q => q.assignedBusinessId === bizById.id && q.status === QRAssetStatus.ASSIGNED);
        return {
          business: bizById,
          qrCode: activeQr?.qrCode || 'NO_QR',
          qrStatus: activeQr?.status || 'Not Generated'
        };
      }

      // 2. Try Business Code
      const bizByCode = mockBusinesses.find(b => b.businessCode === identifier);
      if (bizByCode) {
        const activeQr = mockQrAssets.find(q => q.assignedBusinessId === bizByCode.id && q.status === QRAssetStatus.ASSIGNED);
        return {
          business: bizByCode,
          qrCode: activeQr?.qrCode || 'NO_QR',
          qrStatus: activeQr?.status || 'Not Generated'
        };
      }

      // 3. Try Slug
      const bizBySlug = mockBusinesses.find(b => b.slug === identifier);
      if (bizBySlug) {
        const activeQr = mockQrAssets.find(q => q.assignedBusinessId === bizBySlug.id && q.status === QRAssetStatus.ASSIGNED);
        return {
          business: bizBySlug,
          qrCode: activeQr?.qrCode || 'NO_QR',
          qrStatus: activeQr?.status || 'Not Generated'
        };
      }

      // 4. Try QR Code (case-insensitive)
      const qrRecord = mockQrAssets.find(q => q.qrCode.toLowerCase() === normalizedIdentifier);
      if (qrRecord) {
        const biz = mockBusinesses.find(b => b.id === qrRecord.assignedBusinessId) || null;
        return { business: biz, qrCode: qrRecord.qrCode, qrStatus: qrRecord.status };
      }

      return null;
    }
  );
}

// ==========================================
// FUNNEL TRACKING & CUSTOMER RECOVERY
// ==========================================

export async function logFunnelEvent(stage: FunnelStage, businessId: string, reviewSessionId: string, userAgent?: string | null) {
  function getDeviceType(ua: string | null): string {
    if (!ua) return 'Desktop';
    const u = ua.toLowerCase();
    if (u.includes('ipad') || u.includes('tablet')) return 'Tablet';
    if (u.includes('mobile') || u.includes('phone') || u.includes('android')) return 'Mobile';
    return 'Desktop';
  }
  const deviceType = getDeviceType(userAgent || null);

  return runQuery(
    async () => {
      return await db.funnelEvent.create({
        data: {
          businessId,
          stage,
          reviewSessionId,
          userAgent: userAgent || null,
          deviceType
        }
      });
    },
    async () => {
      const fe = {
        id: `fe-${Math.random().toString(36).substring(2, 9)}`,
        businessId,
        stage,
        timestamp: new Date(),
        userAgent: userAgent || null,
        deviceType,
        qrAssetCode: null,
        reviewSessionId
      };
      mockFunnelEvents.push(fe);
      return fe;
    }
  );
}

export async function getRecoveryRequests(filters: { businessId?: string, status?: string, searchQuery?: string, priority?: string, createdByRepId?: string }) {
  return runQuery(
    async () => {
      const where: any = {};
      if (filters.businessId) {
        where.businessId = filters.businessId;
      }
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.priority) {
        where.priority = filters.priority;
      }
      if (filters.createdByRepId) {
        where.business = { createdByRepId: filters.createdByRepId };
      }
      if (filters.searchQuery) {
        where.OR = [
          { customerName: { contains: filters.searchQuery, mode: 'insensitive' } },
          { whatsappNumber: { contains: filters.searchQuery, mode: 'insensitive' } }
        ];
      }
      const list = await db.recoveryRequest.findMany({
        where,
        include: { business: true, review: true, resolvedBy: true }
      });

      const statusOrder: Record<string, number> = {
        'NEW': 1,
        'CONTACTED': 2,
        'RESOLVED': 3,
        'CLOSED': 4
      };

      return list.sort((a, b) => {
        const orderA = statusOrder[a.status] || 5;
        const orderB = statusOrder[b.status] || 5;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
    async () => {
      let list = [...mockRecoveryRequests];
      if (filters.businessId) {
        list = list.filter(rr => rr.businessId === filters.businessId);
      }
      if (filters.status) {
        list = list.filter(rr => rr.status === filters.status);
      }
      if (filters.priority) {
        list = list.filter(rr => rr.priority === filters.priority);
      }
      if (filters.createdByRepId) {
        list = list.filter(rr => {
          const biz = mockBusinesses.find(b => b.id === rr.businessId);
          return biz?.createdByRepId === filters.createdByRepId;
        });
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        list = list.filter(rr => rr.customerName.toLowerCase().includes(q) || rr.whatsappNumber.includes(q));
      }
      
      list.forEach(rr => {
        if (rr.resolvedById) {
          const u = mockUsers.find(user => user.id === rr.resolvedById);
          (rr as any).resolvedBy = u ? { id: u.id, name: u.name, email: u.email } : null;
        } else {
          (rr as any).resolvedBy = null;
        }
      });

      const statusOrder: Record<string, number> = {
        'NEW': 1,
        'CONTACTED': 2,
        'RESOLVED': 3,
        'CLOSED': 4
      };
      return list.sort((a, b) => {
        const orderA = statusOrder[a.status] || 5;
        const orderB = statusOrder[b.status] || 5;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }
  );
}

export async function getRecoveryRequestDetails(id: string) {
  return runQuery(
    async () => {
      return await db.recoveryRequest.findUnique({
        where: { id },
        include: { business: true, review: true, resolvedBy: true }
      });
    },
    async () => {
      const rr = mockRecoveryRequests.find(item => item.id === id);
      if (!rr) return null;
      
      const biz = mockBusinesses.find(b => b.id === rr.businessId);
      const rev = mockReviews.find(r => r.id === rr.reviewId);
      const resolver = rr.resolvedById ? mockUsers.find(u => u.id === rr.resolvedById) : null;
      
      return {
        ...rr,
        business: biz || null,
        review: rev || null,
        resolvedBy: resolver ? { id: resolver.id, name: resolver.name, email: resolver.email } : null
      };
    }
  );
}

export async function updateRecoveryStatusAndNotes(id: string, status: RecoveryStatus, internalNotes?: string | null, userId?: string) {
  const isResolved = status === 'RESOLVED';
  return runQuery(
    async () => {
      const data: any = { status };
      if (internalNotes !== undefined) {
        data.internalNotes = internalNotes;
      }
      if (isResolved) {
        data.resolvedById = userId || null;
        data.resolvedAt = new Date();
      }
      return await db.recoveryRequest.update({
        where: { id },
        data,
        include: { business: true, review: true, resolvedBy: true }
      });
    },
    async () => {
      const rr = mockRecoveryRequests.find(item => item.id === id);
      if (!rr) throw new Error('Recovery request not found.');
      
      rr.status = status;
      if (internalNotes !== undefined) {
        rr.internalNotes = internalNotes;
      }
      if (isResolved) {
        rr.resolvedById = userId || null;
        rr.resolvedAt = new Date();
      }
      rr.updatedAt = new Date();
      
      const biz = mockBusinesses.find(b => b.id === rr.businessId);
      const rev = mockReviews.find(r => r.id === rr.reviewId);
      const resolver = rr.resolvedById ? mockUsers.find(u => u.id === rr.resolvedById) : null;
      
      return {
        ...rr,
        business: biz || null,
        review: rev || null,
        resolvedBy: resolver ? { id: resolver.id, name: resolver.name, email: resolver.email } : null
      };
    }
  );
}

export async function getRecoveryStats(businessId?: string, createdByRepId?: string) {
  return runQuery(
    async () => {
      const where: any = {};
      if (businessId) {
        where.businessId = businessId;
      }
      if (createdByRepId) {
        where.business = { createdByRepId };
      }
      
      const list = await db.recoveryRequest.findMany({ where });
      const total = list.length;
      const open = list.filter(rr => rr.status === 'NEW' || rr.status === 'CONTACTED').length;
      const resolved = list.filter(rr => rr.status === 'RESOLVED').length;
      const closed = list.filter(rr => rr.status === 'CLOSED').length;
      const resolutionRate = total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 0.0;
      
      return { total, open, resolved, closed, resolutionRate };
    },
    async () => {
      let list = [...mockRecoveryRequests];
      if (businessId) {
        list = list.filter(rr => rr.businessId === businessId);
      }
      if (createdByRepId) {
        list = list.filter(rr => {
          const b = mockBusinesses.find(biz => biz.id === rr.businessId);
          return b?.createdByRepId === createdByRepId;
        });
      }
      const total = list.length;
      const open = list.filter(rr => rr.status === RecoveryStatus.NEW || rr.status === RecoveryStatus.CONTACTED).length;
      const resolved = list.filter(rr => rr.status === RecoveryStatus.RESOLVED).length;
      const closed = list.filter(rr => rr.status === RecoveryStatus.CLOSED).length;
      const resolutionRate = total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 0.0;
      
      return { total, open, resolved, closed, resolutionRate };
    }
  );
}

export async function getBusinessAnalytics(businessId: string | null | undefined, period = '30d', createdByRepId?: string) {
  return runQuery(
    async () => {
      const start = getPeriodStartDate(period);
      const end = new Date();

      const whereScan: any = { scannedAt: { gte: start, lte: end } };
      const whereReview: any = { createdAt: { gte: start, lte: end } };
      const whereCallback: any = { createdAt: { gte: start, lte: end } };
      const whereRecovery: any = { createdAt: { gte: start, lte: end } };
      const whereFunnel: any = { timestamp: { gte: start, lte: end } };

      if (businessId && businessId !== 'ALL') {
        whereScan.businessId = businessId;
        whereReview.businessId = businessId;
        whereCallback.review = { businessId };
        whereRecovery.businessId = businessId;
        whereFunnel.businessId = businessId;
      } else if (createdByRepId) {
        whereScan.business = { createdByRepId };
        whereReview.business = { createdByRepId };
        whereCallback.review = { business: { createdByRepId } };
        whereRecovery.business = { createdByRepId };
        whereFunnel.business = { createdByRepId };
      }

      const [scans, reviews, callbacks, recoveryRequests, funnelEvents] = await Promise.all([
        db.qRScan.findMany({ where: whereScan }),
        db.review.findMany({ where: whereReview }),
        db.callbackRequest.findMany({ where: whereCallback }),
        db.recoveryRequest.findMany({ where: whereRecovery }),
        db.funnelEvent.findMany({ where: whereFunnel })
      ]);

      return computeAnalytics(scans, reviews, callbacks, recoveryRequests, funnelEvents, start, end);
    },
    async () => {
      const start = getPeriodStartDate(period);
      const end = new Date();

      const scans = mockScans.filter(s => {
        if (businessId && businessId !== 'ALL') return s.businessId === businessId;
        if (createdByRepId) {
          const b = mockBusinesses.find(biz => biz.id === s.businessId);
          return b?.createdByRepId === createdByRepId && s.scannedAt >= start && s.scannedAt <= end;
        }
        return s.scannedAt >= start && s.scannedAt <= end;
      });
      const reviews = mockReviews.filter(r => {
        if (businessId && businessId !== 'ALL') return r.businessId === businessId;
        if (createdByRepId) {
          const b = mockBusinesses.find(biz => biz.id === r.businessId);
          return b?.createdByRepId === createdByRepId && r.createdAt >= start && r.createdAt <= end;
        }
        return r.createdAt >= start && r.createdAt <= end;
      });
      const callbacks = mockCallbackRequests.filter(c => {
        const review = mockReviews.find(r => r.id === c.reviewId);
        if (businessId && businessId !== 'ALL') return review?.businessId === businessId;
        if (createdByRepId) {
          const b = mockBusinesses.find(biz => biz.id === review?.businessId);
          return b?.createdByRepId === createdByRepId && c.createdAt >= start && c.createdAt <= end;
        }
        return c.createdAt >= start && c.createdAt <= end;
      });
      const recoveryRequests = mockRecoveryRequests.filter(rr => {
        if (businessId && businessId !== 'ALL') return rr.businessId === businessId;
        if (createdByRepId) {
          const b = mockBusinesses.find(biz => biz.id === rr.businessId);
          return b?.createdByRepId === createdByRepId && rr.createdAt >= start && rr.createdAt <= end;
        }
        return rr.createdAt >= start && rr.createdAt <= end;
      });
      const funnelEvents = mockFunnelEvents.filter(fe => {
        if (businessId && businessId !== 'ALL') return fe.businessId === businessId;
        if (createdByRepId) {
          const b = mockBusinesses.find(biz => biz.id === fe.businessId);
          return b?.createdByRepId === createdByRepId && fe.timestamp >= start && fe.timestamp <= end;
        }
        return fe.timestamp >= start && fe.timestamp <= end;
      });

      return computeAnalytics(scans, reviews, callbacks, recoveryRequests, funnelEvents, start, end);
    }
  );
}

function computeAnalytics(
  scans: QRScan[], 
  reviews: Review[], 
  callbacks: CallbackRequest[], 
  recoveryRequests: RecoveryRequest[], 
  funnelEvents: FunnelEvent[],
  start: Date, 
  end: Date
) {
  const totalReviews = reviews.length;

  // Average Rating
  const averageRating = totalReviews > 0
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
    : 0.0;

  // Positive/Negative counts
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const negativeReviews = reviews.filter(r => r.rating <= 3).length;

  // Google redirect analytics
  const googleRedirectClicks = reviews.filter(r => r.googleCtaClicked).length;
  const googleConversionRate = positiveReviews > 0
    ? parseFloat(((googleRedirectClicks / positiveReviews) * 100).toFixed(1))
    : 0.0;

  // Recovery analytics
  const recoveryRequestsCount = recoveryRequests.length;
  const resolvedRecoveryRequests = recoveryRequests.filter(rr => rr.status === 'RESOLVED').length;
  const openRecoveryRequests = recoveryRequests.filter(rr => rr.status === 'NEW' || rr.status === 'CONTACTED').length;
  const resolutionRate = recoveryRequestsCount > 0
    ? parseFloat(((resolvedRecoveryRequests / recoveryRequestsCount) * 100).toFixed(1))
    : 0.0;

  // Funnel Analytics
  const scanEventsCount = funnelEvents.filter(fe => fe.stage === 'SCAN').length;
  const startEventsCount = funnelEvents.filter(fe => fe.stage === 'START').length;
  const submitEventsCount = funnelEvents.filter(fe => fe.stage === 'SUBMIT').length;
  const redirectEventsCount = funnelEvents.filter(fe => fe.stage === 'REDIRECT').length;

  // Reputation Intelligence Themes
  const themePraises: Record<string, number> = {};
  const themeComplaints: Record<string, number> = {};

  reviews.forEach(r => {
    if (!r.themes) return;
    const splitThemes = r.themes.split(',').map(t => t.trim());
    splitThemes.forEach(t => {
      if (!t) return;
      if (r.rating >= 4) {
        themePraises[t] = (themePraises[t] || 0) + 1;
      } else {
        themeComplaints[t] = (themeComplaints[t] || 0) + 1;
      }
    });
  });

  // Daily Trend calculation for the period range
  const dailyTrendMap: Record<string, number> = {};
  const reviewTrendMap: Record<string, number> = {};

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  for (let i = diffDays - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dailyTrendMap[dateStr] = 0;
    reviewTrendMap[dateStr] = 0;
  }

  funnelEvents.forEach(fe => {
    if (fe.stage === 'SCAN') {
      const dateStr = fe.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (dailyTrendMap[dateStr] !== undefined) {
        dailyTrendMap[dateStr]++;
      }
    }
  });

  reviews.forEach(r => {
    const dateStr = r.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (reviewTrendMap[dateStr] !== undefined) {
      reviewTrendMap[dateStr]++;
    }
  });

  const dailyTrend = Object.entries(dailyTrendMap).map(([date, count]) => ({ date, count }));
  const reviewTrend = Object.entries(reviewTrendMap).map(([date, count]) => ({ date, count }));

  return {
    totalReviews,
    averageRating,
    positiveReviews,
    negativeReviews,
    googleRedirectClicks,
    googleConversionRate,
    recoveryRequestsCount,
    resolvedRecoveryRequests,
    openRecoveryRequests,
    resolutionRate,
    funnel: {
      scans: scanEventsCount,
      starts: startEventsCount,
      submits: submitEventsCount,
      redirects: redirectEventsCount
    },
    themes: {
      praises: themePraises,
      complaints: themeComplaints
    },
    dailyTrend,
    reviewTrend
  };
}


