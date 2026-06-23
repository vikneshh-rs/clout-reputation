import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getRepAssignmentsHistory, getRepStats } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'REP' && sessionUser.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied. Field Representative role required.' });
    }

    const { search } = req.query;
    const [history, stats] = await Promise.all([
      getRepAssignmentsHistory(sessionUser.id, search ? String(search) : null),
      getRepStats(sessionUser.id)
    ]);

    return res.status(200).json({ history, stats });
  } catch (error) {
    console.error('Fetch Rep assignments history error:', error);
    return res.status(500).json({ error: 'Internal server error fetching assignment logs.' });
  }
}
