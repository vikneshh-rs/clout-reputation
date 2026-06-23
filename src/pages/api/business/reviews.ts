import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, getAuthorizedBusinessId } from '@/lib/auth';
import { getReviewsByBusiness } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'BUSINESS' && sessionUser.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const businessId = getAuthorizedBusinessId(req, sessionUser);
    if (!businessId) {
      return res.status(403).json({ error: 'Forbidden. Access to business denied.' });
    }

    const { rating, period, search } = req.query;

    const reviews = await getReviewsByBusiness(businessId, {
      rating: rating ? Number(rating) : null,
      period: period ? String(period) : null,
      search: search ? String(search) : null
    });

    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Fetch business reviews API error:', error);
    return res.status(500).json({ error: 'Internal server error fetching reviews.' });
  }
}
