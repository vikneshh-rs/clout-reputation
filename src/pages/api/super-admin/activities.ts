import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getActivityLogsFiltered } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    const { date, role, actionType } = req.query;

    const logs = await getActivityLogsFiltered({
      date: date ? String(date) : undefined,
      role: role ? String(role) : undefined,
      actionType: actionType ? String(actionType) : undefined
    });

    return res.status(200).json({ logs });
  } catch (error: any) {
    console.error('Super Admin activity logs API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error fetching activity logs.' });
  }
}
