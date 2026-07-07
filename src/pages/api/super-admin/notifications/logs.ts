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

    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Job ID is required.' });
    }

    const logs = await db.notificationLog.findMany({
      where: { jobId },
      orderBy: { attemptNumber: 'desc' }
    });

    return res.status(200).json({ logs });
  } catch (error) {
    console.error('Super Admin Notification Logs API error:', error);
    return res.status(500).json({ error: 'Internal server error fetching attempts log' });
  }
}
