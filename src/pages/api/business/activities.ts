import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, getAuthorizedBusinessId } from '@/lib/auth';
import { getRecentActivities } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }

    const businessId = getAuthorizedBusinessId(req, sessionUser);
    if (!businessId) {
      return res.status(403).json({ error: 'Forbidden. Access denied.' });
    }

    const activities = await getRecentActivities(businessId);
    return res.status(200).json({ activities });
  } catch (error) {
    console.error('Business activities API error:', error);
    return res.status(500).json({ error: 'Internal server error fetching activities' });
  }
}
