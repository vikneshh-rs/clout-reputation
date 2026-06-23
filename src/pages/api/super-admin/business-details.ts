import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getBusinessById, getRecentActivities } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Business ID query parameter is required.' });
    }

    const business = await getBusinessById(id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const logs = await getRecentActivities(id);

    return res.status(200).json({
      business,
      logs
    });
  } catch (error) {
    console.error('Super Admin business details API error:', error);
    return res.status(500).json({ error: 'Internal server error retrieving business details' });
  }
}
