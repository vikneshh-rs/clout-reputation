import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getSuperAdminAnalyticsFiltered } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    const { period } = req.query;
    const periodStr = period ? String(period) : '30d';

    const analytics = await getSuperAdminAnalyticsFiltered(periodStr);

    return res.status(200).json({ analytics });
  } catch (error: any) {
    console.error('Super Admin platform analytics API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error fetching platform analytics.' });
  }
}
