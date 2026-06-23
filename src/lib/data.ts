import { db } from './db';
import bcrypt from 'bcryptjs';
import {
  User,
  Business,
  Review,
  CallbackRequest,
  Subscription,
  ActivityLog,
  QRScan,
  QRInventory,
  AssignmentLog,
  QRBatch,
  UserRole,
  Industry,
  BusinessStatus,
  QRStatus,
  CallbackStatus,
  SubscriptionStatus,
  SubscriptionPlan
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
let mockBusinesses: Business[] = [
  { id: 'b1', name: 'Bella Italia', slug: 'bella-italia', businessCode: 'CR-000001', passwordHash: '', industry: Industry.RESTAURANT, logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop', googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ313_placeholder1', phone: '+15550212', address: '123 Pizza Way, Rome', isActive: true, status: BusinessStatus.ACTIVE, deletedAt: null, enableGoogleReviewRedirect: true, enableManagerCallback: true, createdByRepId: 'u-rep1', createdAt: new Date(), updatedAt: new Date() },
  { id: 'b2', name: 'Luxe Salon', slug: 'luxe-salon', businessCode: 'CR-000002', passwordHash: '', industry: Industry.SALON, logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&auto=format&fit=crop', googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ313_placeholder2', phone: '+15550213', address: '456 Beauty Blvd, New York', isActive: true, status: BusinessStatus.ACTIVE, deletedAt: null, enableGoogleReviewRedirect: true, enableManagerCallback: true, createdByRepId: 'u-rep1', createdAt: new Date(), updatedAt: new Date() },
  { id: 'b3', name: 'Cafe Paris', slug: 'cafe-paris', businessCode: 'CR-000003', passwordHash: '', industry: Industry.CAFE, logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&auto=format&fit=crop', googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ313_placeholder3', phone: '+15550214', address: '789 Croissant St, Paris', isActive: true, status: BusinessStatus.ACTIVE, deletedAt: null, enableGoogleReviewRedirect: true, enableManagerCallback: true, createdByRepId: 'u-rep2', createdAt: new Date(), updatedAt: new Date() },
];

let mockUsers: User[] = [
  { id: 'u-admin', name: 'Viknesh', email: 'admin@cloutreputation.com', username: 'deco-admin', passwordHash: '', role: UserRole.SUPER_ADMIN, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'u-rep1', name: 'Field Agent Dan', email: 'rep@cloutreputation.com', username: 'dan', passwordHash: '', role: UserRole.REP, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'u-rep2', name: 'Rahul', email: 'rahul@cloutreputation.com', username: 'rahul', passwordHash: '', role: UserRole.REP, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'u-rep3', name: 'Karthik', email: 'karthik@cloutreputation.com', username: 'karthik', passwordHash: '', role: UserRole.REP, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

let mockSubscriptions: Subscription[] = [
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

let mockQrInventory: any[] = [];
let mockAssignmentLogs: any[] = [];
let mockQrBatches: any[] = [
  {
    id: 'batch-1',
    batchName: 'Print Batch #1',
    startSerial: 'QR-000001',
    endSerial: 'QR-000100',
    quantity: 100,
    generatedBy: 'u-admin',
    generatedAt: new Date()
  }
];

function seedMockInventory() {
  if (mockQrInventory.length > 0) return;

  // 1. Map existing businesses to inventory (ASSIGNED status)
  const qrCodes = ['QR-BELLA', 'QR-LUXE', 'QR-PARIS'];
  mockBusinesses.forEach((biz, idx) => {
    const invId = `inv-${biz.id}`;
    mockQrInventory.push({
      id: invId,
      qrCode: qrCodes[idx],
      status: QRStatus.ASSIGNED,
      assignedBusinessId: biz.id,
      assignedBy: biz.createdByRepId,
      assignedAt: biz.createdAt,
      replacementQrId: null,
      createdAt: biz.createdAt
    });

    mockAssignmentLogs.push({
      id: `log-${biz.id}`,
      qrInventoryId: invId,
      businessId: biz.id,
      assignedBy: biz.createdByRepId,
      action: 'ASSIGNED',
      createdAt: biz.createdAt
    });
  });

  // 2. Generate 100 unassigned pre-printed QR Codes: QR-000001 to QR-000100
  for (let i = 1; i <= 100; i++) {
    const numStr = String(i).padStart(6, '0');
    mockQrInventory.push({
      id: `inv-unassigned-${i}`,
      qrCode: `QR-${numStr}`,
      status: QRStatus.UNASSIGNED,
      assignedBusinessId: null,
      assignedBy: null,
      assignedAt: null,
      replacementQrId: null,
      createdAt: new Date()
    });
  }
}
seedMockInventory();

let mockLogs: ActivityLog[] = [
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
async function runQuery<T>(dbQuery: () => Promise<T>, mockQuery: () => Promise<T>): Promise<T> {
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
          }
        }
      });
    },
    async () => {
      const biz = mockBusinesses.find(b => b.id === id);
      if (!biz) return null;
      const subscriptions = mockSubscriptions.filter(s => s.businessId === id);
      return { ...biz, subscriptions };
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
        totalReps,
        totalReviews,
        avgRatingResult,
        activeSubscriptions,
        expiredSubscriptions,
        assignedQRs,
        unassignedQRs,
        reviewsThisMonth,
        businessesThisMonth,
        callbacksThisMonth,
        googleRedirectClicksThisMonth
      ] = await Promise.all([
        db.business.count({ where: { deletedAt: null } }),
        db.user.count({ where: { role: UserRole.REP } }),
        db.review.count(),
        db.review.aggregate({ _avg: { rating: true } }),
        db.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
        db.subscription.count({ where: { status: SubscriptionStatus.EXPIRED } }),
        db.qRInventory.count({ where: { status: QRStatus.ASSIGNED } }),
        db.qRInventory.count({ where: { status: QRStatus.UNASSIGNED } }),
        db.review.count({ where: { createdAt: { gte: startOfMonth } } }),
        db.business.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
        db.callbackRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
        db.review.count({
          where: {
            createdAt: { gte: startOfMonth },
            googleCtaClicked: true
          }
        })
      ]);

      const averagePlatformRating = avgRatingResult._avg.rating
        ? parseFloat(avgRatingResult._avg.rating.toFixed(2))
        : 0;

      return {
        totalBusinesses,
        totalReps,
        totalReviews,
        averagePlatformRating,
        activeSubscriptions,
        expiredSubscriptions,
        assignedQRs,
        unassignedQRs,
        reviewsThisMonth,
        businessesThisMonth,
        callbacksThisMonth,
        googleRedirectClicksThisMonth
      };
    },
    async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const totalBusinesses = mockBusinesses.filter(b => b.deletedAt === null).length;
      const totalReps = mockUsers.filter(u => u.role === UserRole.REP).length;
      const totalReviews = mockReviews.length;

      const totalRating = mockReviews.reduce((acc, r) => acc + r.rating, 0);
      const averagePlatformRating = totalReviews > 0 ? parseFloat((totalRating / totalReviews).toFixed(2)) : 0;

      const activeSubscriptions = mockSubscriptions.filter(s => s.status === SubscriptionStatus.ACTIVE).length;
      const expiredSubscriptions = mockSubscriptions.filter(s => s.status === SubscriptionStatus.EXPIRED).length;

      const assignedQRs = mockQrInventory.filter(q => q.status === QRStatus.ASSIGNED).length;
      const unassignedQRs = mockQrInventory.filter(q => q.status === QRStatus.UNASSIGNED).length;

      const reviewsThisMonth = mockReviews.filter(r => r.createdAt >= startOfMonth).length;
      const businessesThisMonth = mockBusinesses.filter(b => b.createdAt >= startOfMonth && b.deletedAt === null).length;
      const callbacksThisMonth = mockCallbackRequests.filter(c => c.createdAt >= startOfMonth).length;
      const googleRedirectClicksThisMonth = mockReviews.filter(r => r.createdAt >= startOfMonth && r.googleCtaClicked).length;

      return {
        totalBusinesses,
        totalReps,
        totalReviews,
        averagePlatformRating,
        activeSubscriptions,
        expiredSubscriptions,
        assignedQRs,
        unassignedQRs,
        reviewsThisMonth,
        businessesThisMonth,
        callbacksThisMonth,
        googleRedirectClicksThisMonth
      };
    }
  );
}

// Listing operations
export async function getAllBusinesses(includeDeleted = false) {
  return runQuery(
    async () => {
      return await db.business.findMany({
        where: includeDeleted ? {} : { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          createdByRep: {
            select: { id: true, name: true }
          },
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
    },
    async () => {
      return mockBusinesses
        .filter(b => includeDeleted || b.isActive)
        .map(b => {
          const rep = mockUsers.find(u => u.id === b.createdByRepId) || null;
          const subscriptions = mockSubscriptions.filter(s => s.businessId === b.id);
          return {
            ...b,
            createdByRep: rep ? { id: rep.id, name: rep.name } : null,
            subscriptions
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

export async function onboardBusiness(data: {
  name: string;
  passwordHash: string;
  industry: Industry;
  phone?: string | null;
  address?: string | null;
  googleReviewUrl?: string | null;
  plan?: SubscriptionPlan;
  createdByRepId: string;
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
            status: BusinessStatus.ACTIVE,
            createdByRepId: data.createdByRepId
          }
        });

        const subscription = await tx.subscription.create({
          data: {
            businessId: business.id,
            plan: data.plan || SubscriptionPlan.TRIAL,
            status: SubscriptionStatus.ACTIVE,
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });

        return { business, subscription };
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

      const newBiz = {
        id: businessId,
        name: data.name,
        slug,
        businessCode,
        passwordHash: data.passwordHash,
        industry: data.industry,
        logoUrl: null,
        googleReviewUrl: data.googleReviewUrl || null,
        phone: data.phone || null,
        address: data.address || null,
        isActive: true,
        status: BusinessStatus.ACTIVE,
        deletedAt: null,
        enableGoogleReviewRedirect: true,
        enableManagerCallback: true,
        createdByRepId: data.createdByRepId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newSub = {
        id: `sub-${businessId}`,
        businessId,
        plan: data.plan || SubscriptionPlan.TRIAL,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockBusinesses.push(newBiz);
      mockSubscriptions.push(newSub);
      return { business: newBiz, subscription: newSub };
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
      if (status === BusinessStatus.SUSPENDED) action = 'Business Suspended';
      if (status === BusinessStatus.EXPIRED) action = 'Business Subscription Expired';

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
      if (status === BusinessStatus.SUSPENDED) action = 'Business Suspended';
      if (status === BusinessStatus.EXPIRED) action = 'Business Subscription Expired';

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

export async function getBusinessAnalytics(businessId: string, period = '30d') {
  return runQuery(
    async () => {
      const start = getPeriodStartDate(period);
      const end = new Date();

      const [scans, reviews, callbacks] = await Promise.all([
        db.qRScan.findMany({
          where: { businessId, scannedAt: { gte: start, lte: end } }
        }),
        db.review.findMany({
          where: { businessId, createdAt: { gte: start, lte: end } }
        }),
        db.callbackRequest.findMany({
          where: { review: { businessId }, createdAt: { gte: start, lte: end } }
        })
      ]);

      return computeAnalytics(scans, reviews, callbacks, start, end);
    },
    async () => {
      const start = getPeriodStartDate(period);
      const end = new Date();

      const scans = mockScans.filter(s => s.businessId === businessId && s.scannedAt >= start && s.scannedAt <= end);
      const reviews = mockReviews.filter(r => r.businessId === businessId && r.createdAt >= start && r.createdAt <= end);
      const callbacks = mockCallbackRequests.filter(c => {
        const review = mockReviews.find(r => r.id === c.reviewId);
        return review?.businessId === businessId && c.createdAt >= start && c.createdAt <= end;
      });

      return computeAnalytics(scans, reviews, callbacks, start, end);
    }
  );
}

function computeAnalytics(scans: QRScan[], reviews: Review[], callbacks: CallbackRequest[], start: Date, end: Date) {
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

  // Callback analytics
  const callbackRequests = callbacks.length;
  const resolvedRequests = callbacks.filter(c => c.status === CallbackStatus.RESOLVED).length;

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

  scans.forEach(s => {
    const dateStr = s.scannedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (dailyTrendMap[dateStr] !== undefined) {
      dailyTrendMap[dateStr]++;
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
    callbackRequests,
    resolvedRequests,
    dailyTrend,
    reviewTrend
  };
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
}) {
  return runQuery(
    async () => {
      return await db.review.create({
        data: {
          rating: data.rating,
          comment: data.comment || null,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          requestCallback: data.requestCallback || false,
          callbackStatus: data.requestCallback ? CallbackStatus.PENDING : CallbackStatus.RESOLVED,
          redirectedToGoogle: false,
          googleCtaViewed: false,
          googleCtaClicked: false,
          businessId: data.businessId
        }
      });
    },
    async () => {
      const newReview: Review = {
        id: `rev-${Math.random().toString(36).substring(2, 9)}`,
        rating: data.rating,
        comment: data.comment || null,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        requestCallback: data.requestCallback || false,
        callbackStatus: data.requestCallback ? CallbackStatus.PENDING : CallbackStatus.RESOLVED,
        redirectedToGoogle: false,
        googleCtaViewed: false,
        googleCtaClicked: false,
        businessId: data.businessId,
        createdAt: new Date()
      };
      mockReviews.push(newReview);
      return newReview;
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

export async function generateQrInventory(quantity: number, adminId: string) {
  return runQuery(
    async () => {
      const batchCount = await db.qRBatch.count();

      const latestRecord = await db.qRInventory.findFirst({
        where: {
          qrCode: { startsWith: 'QR-' }
        },
        orderBy: {
          qrCode: 'desc'
        }
      });

      let startNum = 1;
      if (latestRecord) {
        const latestNum = parseInt(latestRecord.qrCode.replace('QR-', ''));
        if (!isNaN(latestNum)) {
          startNum = latestNum + 1;
        }
      }

      const newRecords = [];
      const startSerial = `QR-${String(startNum).padStart(6, '0')}`;
      const endSerial = `QR-${String(startNum + quantity - 1).padStart(6, '0')}`;

      await db.qRBatch.create({
        data: {
          batchName: `Print Batch #${batchCount + 1}`,
          startSerial,
          endSerial,
          quantity,
          generatedBy: adminId
        }
      });

      for (let i = 0; i < quantity; i++) {
        const numStr = String(startNum + i).padStart(6, '0');
        newRecords.push({
          qrCode: `QR-${numStr}`,
          status: QRStatus.UNASSIGNED
        });
      }

      await db.qRInventory.createMany({
        data: newRecords
      });

      return newRecords.length;
    },
    async () => {
      const batchCount = mockQrBatches.length;
      let startNum = 1;
      const filtered = mockQrInventory
        .filter(q => q.qrCode.startsWith('QR-'))
        .map(q => parseInt(q.qrCode.replace('QR-', '')))
        .filter(n => !isNaN(n));
      if (filtered.length > 0) {
        startNum = Math.max(...filtered) + 1;
      }

      const startSerial = `QR-${String(startNum).padStart(6, '0')}`;
      const endSerial = `QR-${String(startNum + quantity - 1).padStart(6, '0')}`;

      const newBatch = {
        id: `batch-${batchCount + 1}`,
        batchName: `Print Batch #${batchCount + 1}`,
        startSerial,
        endSerial,
        quantity,
        generatedBy: adminId,
        generatedAt: new Date()
      };
      mockQrBatches.push(newBatch);

      for (let i = 0; i < quantity; i++) {
        const numStr = String(startNum + i).padStart(6, '0');
        mockQrInventory.push({
          id: `inv-gen-${startNum + i}`,
          qrCode: `QR-${numStr}`,
          status: QRStatus.UNASSIGNED,
          assignedBusinessId: null,
          assignedBy: null,
          assignedAt: null,
          replacementQrId: null,
          createdAt: new Date()
        });
      }
      return quantity;
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
        const qrRecord = await tx.qRInventory.findUnique({
          where: { qrCode: data.qrCode }
        });
        if (!qrRecord) {
          throw new Error('QR Code does not exist in inventory.');
        }
        if (qrRecord.status !== QRStatus.UNASSIGNED) {
          throw new Error(`QR Code is already in status: ${qrRecord.status}`);
        }

        const updatedQr = await tx.qRInventory.update({
          where: { qrCode: data.qrCode },
          data: {
            status: QRStatus.ASSIGNED,
            assignedBusinessId: data.businessId,
            assignedBy: data.repId,
            assignedAt: new Date()
          }
        });

        await tx.assignmentLog.create({
          data: {
            qrInventoryId: updatedQr.id,
            businessId: data.businessId,
            assignedBy: data.repId,
            action: 'ASSIGNED'
          }
        });

        return { success: true, qrInventory: updatedQr };
      });
    },
    async () => {
      const qrRecord = mockQrInventory.find(q => q.qrCode === data.qrCode);
      if (!qrRecord) {
        throw new Error('QR Code does not exist in inventory.');
      }
      if (qrRecord.status !== QRStatus.UNASSIGNED) {
        throw new Error(`QR Code is already in status: ${qrRecord.status}`);
      }

      qrRecord.status = QRStatus.ASSIGNED;
      qrRecord.assignedBusinessId = data.businessId;
      qrRecord.assignedBy = data.repId;
      qrRecord.assignedAt = new Date();

      const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
      mockAssignmentLogs.push({
        id: logId,
        qrInventoryId: qrRecord.id,
        businessId: data.businessId,
        assignedBy: data.repId,
        action: 'ASSIGNED',
        createdAt: new Date()
      });

      return { success: true, qrInventory: qrRecord };
    }
  );
}

export async function replaceDamagedQr(data: {
  oldQrCode: string;
  newQrCode: string;
  repId: string;
}) {
  return runQuery(
    async () => {
      return await db.$transaction(async (tx) => {
        const oldQr = await tx.qRInventory.findUnique({
          where: { qrCode: data.oldQrCode }
        });
        if (!oldQr || oldQr.status !== QRStatus.ASSIGNED) {
          throw new Error('Old QR code is not in ASSIGNED status.');
        }

        const newQr = await tx.qRInventory.findUnique({
          where: { qrCode: data.newQrCode }
        });
        if (!newQr) {
          throw new Error('New QR code does not exist in inventory.');
        }
        if (newQr.status !== QRStatus.UNASSIGNED) {
          throw new Error(`New QR code is in status: ${newQr.status}, expected UNASSIGNED.`);
        }

        const businessId = oldQr.assignedBusinessId!;

        const updatedNewQr = await tx.qRInventory.update({
          where: { qrCode: data.newQrCode },
          data: {
            status: QRStatus.ASSIGNED,
            assignedBusinessId: businessId,
            assignedBy: data.repId,
            assignedAt: new Date()
          }
        });

        const updatedOldQr = await tx.qRInventory.update({
          where: { qrCode: data.oldQrCode },
          data: {
            status: QRStatus.REPLACED,
            assignedBusinessId: null,
            replacementQrId: updatedNewQr.id
          }
        });

        await tx.assignmentLog.create({
          data: {
            qrInventoryId: updatedNewQr.id,
            businessId,
            assignedBy: data.repId,
            action: 'REPLACED'
          }
        });

        return { success: true, oldQr: updatedOldQr, newQr: updatedNewQr };
      });
    },
    async () => {
      const oldQr = mockQrInventory.find(q => q.qrCode === data.oldQrCode);
      if (!oldQr || oldQr.status !== QRStatus.ASSIGNED) {
        throw new Error('Old QR code is not in ASSIGNED status.');
      }

      const newQr = mockQrInventory.find(q => q.qrCode === data.newQrCode);
      if (!newQr) {
        throw new Error('New QR code does not exist in inventory.');
      }
      if (newQr.status !== QRStatus.UNASSIGNED) {
        throw new Error(`New QR code is in status: ${newQr.status}, expected UNASSIGNED.`);
      }

      const businessId = oldQr.assignedBusinessId;

      newQr.status = QRStatus.ASSIGNED;
      newQr.assignedBusinessId = businessId;
      newQr.assignedBy = data.repId;
      newQr.assignedAt = new Date();

      oldQr.status = QRStatus.REPLACED;
      oldQr.assignedBusinessId = null;
      oldQr.replacementQrId = newQr.id;

      const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
      mockAssignmentLogs.push({
        id: logId,
        qrInventoryId: newQr.id,
        businessId,
        assignedBy: data.repId,
        action: 'REPLACED',
        createdAt: new Date()
      });

      return { success: true, oldQr, newQr };
    }
  );
}

export async function toggleQrInactive(qrCode: string, inactive: boolean, repId: string) {
  return runQuery(
    async () => {
      const qrRecord = await db.qRInventory.findUnique({
        where: { qrCode }
      });
      if (!qrRecord || (qrRecord.status !== QRStatus.ASSIGNED && qrRecord.status !== QRStatus.INACTIVE)) {
        throw new Error('QR code is not in an active or inactive state.');
      }

      const targetStatus = inactive ? QRStatus.INACTIVE : QRStatus.ASSIGNED;
      const updated = await db.qRInventory.update({
        where: { qrCode },
        data: { status: targetStatus }
      });

      const actionStr = inactive ? 'UNASSIGNED' : 'ASSIGNED';
      await db.assignmentLog.create({
        data: {
          qrInventoryId: qrRecord.id,
          businessId: qrRecord.assignedBusinessId!,
          assignedBy: repId,
          action: actionStr
        }
      });

      return updated;
    },
    async () => {
      const qrRecord = mockQrInventory.find(q => q.qrCode === qrCode);
      if (!qrRecord || (qrRecord.status !== QRStatus.ASSIGNED && qrRecord.status !== QRStatus.INACTIVE)) {
        throw new Error('QR code is not in an active or inactive state.');
      }

      const targetStatus = inactive ? QRStatus.INACTIVE : QRStatus.ASSIGNED;
      qrRecord.status = targetStatus;

      const actionStr = inactive ? 'UNASSIGNED' : 'ASSIGNED';
      const logId = `log-${Math.random().toString(36).substring(2, 9)}`;
      mockAssignmentLogs.push({
        id: logId,
        qrInventoryId: qrRecord.id,
        businessId: qrRecord.assignedBusinessId,
        assignedBy: repId,
        action: actionStr,
        createdAt: new Date()
      });

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
          { qrInventory: { qrCode: { contains: query, mode: 'insensitive' } } }
        ];
      }

      return await db.assignmentLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          qrInventory: true,
          business: { select: { name: true, industry: true } }
        }
      });
    },
    async () => {
      let logs = mockAssignmentLogs.filter(log => log.assignedBy === repId);

      let resolvedLogs = logs.map(log => {
        const qrInventory = mockQrInventory.find(q => q.id === log.qrInventoryId);
        const business = mockBusinesses.find(b => b.id === log.businessId);
        return {
          ...log,
          qrInventory,
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

// REP stats card counting how many businesses onboarded
export async function getRepStats(repId: string) {
  return runQuery(
    async () => {
      const [onboardedCount, assignmentsCount] = await Promise.all([
        db.business.count({
          where: { createdByRepId: repId }
        }),
        db.assignmentLog.count({
          where: { assignedBy: repId }
        })
      ]);
      return { onboardedCount, assignmentsCount };
    },
    async () => {
      const onboardedCount = mockBusinesses.filter(b => b.createdByRepId === repId).length;
      const assignmentsCount = mockAssignmentLogs.filter(log => log.assignedBy === repId).length;
      return { onboardedCount, assignmentsCount };
    }
  );
}

export async function getQrInventory(filters?: { status?: QRStatus | null; search?: string | null; businessId?: string | null; batchId?: string | null }) {
  return runQuery(
    async () => {
      const whereClause: any = {};

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.businessId && filters.businessId !== 'ALL') {
        whereClause.assignedBusinessId = filters.businessId;
      }

      if (filters?.batchId && filters.batchId !== 'ALL') {
        const batch = await db.qRBatch.findUnique({
          where: { id: filters.batchId }
        });
        if (batch) {
          whereClause.qrCode = {
            gte: batch.startSerial,
            lte: batch.endSerial
          };
        }
      }

      if (filters?.search) {
        const query = filters.search.trim();
        whereClause.OR = [
          { qrCode: { contains: query, mode: 'insensitive' } },
          { business: { name: { contains: query, mode: 'insensitive' } } }
        ];
      }

      return await db.qRInventory.findMany({
        where: whereClause,
        orderBy: { qrCode: 'asc' },
        take: 200,
        include: {
          business: { select: { name: true } }
        }
      });
    },
    async () => {
      let list = [...mockQrInventory];

      if (filters?.status) {
        list = list.filter(q => q.status === filters.status);
      }

      if (filters?.businessId && filters.businessId !== 'ALL') {
        list = list.filter(q => q.assignedBusinessId === filters.businessId);
      }

      if (filters?.batchId && filters.batchId !== 'ALL') {
        const batch = mockQrBatches.find(b => b.id === filters.batchId);
        if (batch) {
          list = list.filter(q => q.qrCode >= batch.startSerial && q.qrCode <= batch.endSerial);
        }
      }

      const mapped = list.map(q => {
        const business = mockBusinesses.find(b => b.id === q.assignedBusinessId);
        return {
          ...q,
          business: business ? { name: business.name } : null
        };
      });

      if (filters?.search) {
        const query = filters.search.toLowerCase();
        return mapped.filter(q =>
          q.qrCode.toLowerCase().includes(query) ||
          (q.business?.name || '').toLowerCase().includes(query)
        ).sort((a, b) => a.qrCode.localeCompare(b.qrCode));
      }

      return mapped.sort((a, b) => a.qrCode.localeCompare(b.qrCode));
    }
  );
}

export async function getQrInventoryStats() {
  return runQuery(
    async () => {
      const [total, assigned, unassigned, damaged, replaced, inactive] = await Promise.all([
        db.qRInventory.count(),
        db.qRInventory.count({ where: { status: QRStatus.ASSIGNED } }),
        db.qRInventory.count({ where: { status: QRStatus.UNASSIGNED } }),
        db.qRInventory.count({ where: { status: QRStatus.DAMAGED } }),
        db.qRInventory.count({ where: { status: QRStatus.REPLACED } }),
        db.qRInventory.count({ where: { status: QRStatus.INACTIVE } })
      ]);

      return { total, assigned, unassigned, damaged, replaced, inactive };
    },
    async () => {
      const total = mockQrInventory.length;
      const assigned = mockQrInventory.filter(q => q.status === QRStatus.ASSIGNED).length;
      const unassigned = mockQrInventory.filter(q => q.status === QRStatus.UNASSIGNED).length;
      const damaged = mockQrInventory.filter(q => q.status === QRStatus.DAMAGED).length;
      const replaced = mockQrInventory.filter(q => q.status === QRStatus.REPLACED).length;
      const inactive = mockQrInventory.filter(q => q.status === QRStatus.INACTIVE).length;

      return { total, assigned, unassigned, damaged, replaced, inactive };
    }
  );
}

export async function validateQrCode(qrCode: string) {
  return runQuery(
    async () => {
      return await db.qRInventory.findUnique({
        where: { qrCode },
        include: {
          business: true
        }
      });
    },
    async () => {
      const qrRecord = mockQrInventory.find(q => q.qrCode === qrCode);
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

export async function generateQrBatchCustom(batchName: string, startSerial: string, quantity: number, adminId: string) {
  // Validate batch limit
  if (quantity < 1 || quantity > 1000) {
    throw new Error('Batch size must be between 1 and 1000 QR codes.');
  }

  const match = startSerial.match(/^(QR-)(\d+)$/i);
  if (!match) {
    throw new Error('Invalid Starting QR Number format. Expected format: QR-XXXXXX where X is numeric.');
  }

  const prefix = match[1];
  const startNumStr = match[2];
  const startNum = parseInt(startNumStr, 10);
  const padLength = startNumStr.length;

  return runQuery(
    async () => {
      const codesToCheck: string[] = [];
      for (let i = 0; i < quantity; i++) {
        const code = prefix + String(startNum + i).padStart(padLength, '0');
        codesToCheck.push(code);
      }

      // Check duplicates
      const existing = await db.qRInventory.findMany({
        where: { qrCode: { in: codesToCheck } },
        select: { qrCode: true }
      });
      if (existing.length > 0) {
        throw new Error(`Duplicate QR codes detected. The following codes already exist: ${existing.map(e => e.qrCode).join(', ')}`);
      }

      const endSerial = codesToCheck[codesToCheck.length - 1];

      return await db.$transaction(async (tx) => {
        // Create batch record
        const batch = await tx.qRBatch.create({
          data: {
            batchName,
            startSerial,
            endSerial,
            quantity,
            generatedBy: adminId
          }
        });

        // Create QR codes
        await tx.qRInventory.createMany({
          data: codesToCheck.map(code => ({
            qrCode: code,
            status: QRStatus.UNASSIGNED
          }))
        });

        return batch;
      });
    },
    async () => {
      const codesToCheck: string[] = [];
      for (let i = 0; i < quantity; i++) {
        const code = prefix + String(startNum + i).padStart(padLength, '0');
        codesToCheck.push(code);
      }

      const existing = mockQrInventory.filter(q => codesToCheck.includes(q.qrCode));
      if (existing.length > 0) {
        throw new Error(`Duplicate QR codes detected: ${existing.map(e => e.qrCode).join(', ')}`);
      }

      const endSerial = codesToCheck[codesToCheck.length - 1];
      const newBatch = {
        id: `batch-${mockQrBatches.length + 1}`,
        batchName,
        startSerial,
        endSerial,
        quantity,
        generatedBy: adminId,
        generatedAt: new Date()
      };
      mockQrBatches.push(newBatch);

      codesToCheck.forEach(code => {
        mockQrInventory.push({
          id: `inv-gen-${code}`,
          qrCode: code,
          status: QRStatus.UNASSIGNED,
          assignedBusinessId: null,
          assignedBy: null,
          assignedAt: null,
          replacementQrId: null,
          createdAt: new Date()
        });
      });

      return newBatch;
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
        db.assignmentLog.groupBy({
          by: ['assignedBy'],
          where: { createdAt: { gte: start } },
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
        const assignments = mockAssignmentLogs.filter(l => l.assignedBy === rep.id && l.createdAt >= start).length;
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
  plan: SubscriptionPlan,
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

      let startDate = new Date();
      let endDate = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
      let targetStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;

      if (latestSub) {
        startDate = latestSub.startDate;
        if (action === 'extend') {
          const baseDate = latestSub.endDate.getTime() > Date.now() ? latestSub.endDate : new Date();
          endDate = new Date(baseDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);
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
          plan,
          status: targetStatus,
          startDate,
          endDate
        }
      });

      let bizStatus: BusinessStatus = BusinessStatus.ACTIVE;
      if (targetStatus === SubscriptionStatus.EXPIRED) {
        bizStatus = BusinessStatus.EXPIRED;
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
      let startDate = new Date();
      let endDate = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
      let targetStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;

      if (subs.length > 0) {
        subs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const latestSub = subs[0];
        startDate = latestSub.startDate;
        if (action === 'extend') {
          const baseDate = latestSub.endDate.getTime() > Date.now() ? latestSub.endDate : new Date();
          endDate = new Date(baseDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);
        } else if (action === 'expire') {
          endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          targetStatus = SubscriptionStatus.EXPIRED;
        }
      }

      if (action === 'expire') {
        targetStatus = SubscriptionStatus.EXPIRED;
      }

      const newSub = {
        id: `sub-${Math.random().toString(36).substring(2, 9)}`,
        businessId,
        plan,
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
          bizStatus = BusinessStatus.EXPIRED;
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
