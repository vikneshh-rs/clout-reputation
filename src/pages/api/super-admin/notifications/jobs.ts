import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
      provider = '',
      notificationType = '',
      eventType = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      businessId = ''
    } = req.query;

    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query filters
    const where: any = {};

    // Search queries
    if (search) {
      const searchStr = String(search).trim();
      where.OR = [
        { id: { contains: searchStr, mode: 'insensitive' } },
        { recipient: { contains: searchStr, mode: 'insensitive' } },
        { reviewId: { contains: searchStr, mode: 'insensitive' } },
        { business: { name: { contains: searchStr, mode: 'insensitive' } } },
        { review: { customerName: { contains: searchStr, mode: 'insensitive' } } }
      ];
    }

    // Status filter
    if (status) {
      where.status = String(status);
    }

    // Provider filter
    if (provider) {
      where.provider = String(provider);
    }

    // Notification type filter
    if (notificationType) {
      where.notificationType = String(notificationType);
    }

    // Event type filter
    if (eventType) {
      where.eventType = String(eventType);
    }

    // Business filter
    if (businessId) {
      where.businessId = String(businessId);
    }

    // Date Range filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(String(startDate));
      }
      if (endDate) {
        where.createdAt.lte = new Date(String(endDate));
      }
    }

    // Retrieve database results
    const [jobs, totalCount] = await Promise.all([
      db.notificationJob.findMany({
        where,
        orderBy: { [String(sortBy)]: String(sortOrder) === 'asc' ? 'asc' : 'desc' },
        skip,
        take: limitNum,
        include: {
          business: {
            select: { id: true, name: true, slug: true }
          },
          review: {
            select: { id: true, customerName: true, rating: true }
          }
        }
      }),
      db.notificationJob.count({ where })
    ]);

    return res.status(200).json({
      jobs,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (error) {
    console.error('Super Admin Notification Jobs API error:', error);
    return res.status(500).json({ error: 'Internal server error fetching jobs list' });
  }
}
