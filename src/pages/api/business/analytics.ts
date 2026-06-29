import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, getAuthorizedBusinessId } from '@/lib/auth';
import { getBusinessAnalytics, getBusinessById } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }

    const { role } = sessionUser;
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isRep = role === 'REP';

    let businessId = getAuthorizedBusinessId(req, sessionUser);
    if (!businessId && (isSuperAdmin || isRep)) {
      businessId = 'ALL';
    }

    if (!businessId) {
      return res.status(403).json({ error: 'Forbidden. Access denied.' });
    }

    // Security check: IDOR validation for Representatives
    if (isRep && businessId && businessId !== 'ALL') {
      const business = await getBusinessById(businessId);
      if (!business || business.createdByRepId !== sessionUser.id) {
        return res.status(403).json({ error: 'Forbidden. Access denied to this business.' });
      }
    }

    const { period } = req.query;
    const repId = isRep ? sessionUser.id : undefined;

    const analytics = await getBusinessAnalytics(businessId, period ? String(period) : '30d', repId);
    return res.status(200).json({ analytics });
  } catch (error) {
    console.error('Business analytics API error:', error);
    return res.status(500).json({ error: 'Internal server error compiling analytics' });
  }
}
