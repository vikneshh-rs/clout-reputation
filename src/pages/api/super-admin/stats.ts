import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getSuperAdminStats, getActivityLogsFiltered } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate and authorize session user
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    const [stats, recentLogs] = await Promise.all([
      getSuperAdminStats(),
      getActivityLogsFiltered({})
    ]);
    
    return res.status(200).json({
      ...stats,
      recentLogs: recentLogs ? recentLogs.slice(0, 5) : []
    });
  } catch (error) {
    console.error('Fetch Super Admin stats error:', error);
    return res.status(500).json({ error: 'Internal server error fetching stats' });
  }
}
