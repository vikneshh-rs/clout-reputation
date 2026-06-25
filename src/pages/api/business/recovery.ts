import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, getAuthorizedBusinessId } from '@/lib/auth';
import { getRecoveryRequests, getRecoveryRequestDetails, updateRecoveryStatusAndNotes } from '@/lib/data';
import { RecoveryStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  if (req.method === 'GET') {
    try {
      const { id, status, searchQuery, priority } = req.query;

      // 1. Fetch details of a specific request
      if (id && typeof id === 'string') {
        const details = await getRecoveryRequestDetails(id);
        if (!details) {
          return res.status(404).json({ error: 'Recovery request not found.' });
        }

        // Scope validation
        if (isBusiness) {
          const authBizId = getAuthorizedBusinessId(req, sessionUser);
          if (details.businessId !== authBizId) {
            return res.status(403).json({ error: 'Access denied to this business.' });
          }
        } else if (isRep) {
          if (details.business?.createdByRepId !== sessionUser.id) {
            return res.status(403).json({ error: 'Access denied to this representative business.' });
          }
        }

        return res.status(200).json({ success: true, details });
      }

      // 2. Fetch list of requests
      const filters: any = {};
      if (status && typeof status === 'string' && status !== 'ALL') {
        filters.status = status;
      }
      if (priority && typeof priority === 'string' && priority !== 'ALL') {
        filters.priority = priority;
      }
      if (searchQuery && typeof searchQuery === 'string') {
        filters.searchQuery = searchQuery;
      }

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
      return res.status(200).json({ success: true, list });
    } catch (error: any) {
      console.error('Fetch recovery requests error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error retrieving recovery requests.' });
    }
  } else if (req.method === 'PUT') {
    // Representatives are Read-Only!
    if (isRep) {
      return res.status(403).json({ error: 'Representatives have read-only access and cannot modify recovery tickets.' });
    }

    try {
      const { id, status, internalNotes } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: 'Recovery ticket ID and status are required.' });
      }

      // Validate status
      const validStatuses = ['NEW', 'CONTACTED', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid recovery status: ${status}.` });
      }

      // Authorization Scope Check
      const details = await getRecoveryRequestDetails(id);
      if (!details) {
        return res.status(404).json({ error: 'Recovery request not found.' });
      }

      if (isBusiness) {
        const authBizId = getAuthorizedBusinessId(req, sessionUser);
        if (details.businessId !== authBizId) {
          return res.status(403).json({ error: 'Access denied. Scoped business mismatch.' });
        }
      }

      const updated = await updateRecoveryStatusAndNotes(id, status as RecoveryStatus, internalNotes, sessionUser.id);
      return res.status(200).json({ success: true, updated });
    } catch (error: any) {
      console.error('Update recovery request error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error updating recovery ticket.' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
