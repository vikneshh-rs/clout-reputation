import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, getAuthorizedBusinessId } from '@/lib/auth';
import { getRecoveryRequests } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionUser = await getSessionUser(req);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { role } = sessionUser;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isRep = role === 'REP';
  const isBusiness = role === 'BUSINESS';

  if (!isSuperAdmin && !isRep && !isBusiness) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const filters: any = {};
    if (isBusiness) {
      const authBizId = getAuthorizedBusinessId(req, sessionUser);
      filters.businessId = authBizId || 'NO_ACCESS';
    } else if (isRep) {
      filters.createdByRepId = sessionUser.id;
    } else if (isSuperAdmin) {
      const authBizId = req.query.businessId as string;
      if (authBizId && authBizId !== 'ALL') {
        filters.businessId = authBizId;
      }
    }

    const list = await getRecoveryRequests(filters);
    const unresolved = list.filter(rr => rr.status === 'NEW' || rr.status === 'CONTACTED');
    const highPriorityCount = unresolved.filter(rr => rr.priority === 'HIGH').length;
    const mediumPriorityCount = unresolved.filter(rr => rr.priority === 'MEDIUM').length;
    const unresolvedCount = unresolved.length;

    return res.status(200).json({
      success: true,
      unresolvedCount,
      highPriorityCount,
      mediumPriorityCount
    });
  } catch (error: any) {
    console.error('Fetch recovery notifications count error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error retrieving notification counts.' });
  }
}
