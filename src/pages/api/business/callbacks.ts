import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, getAuthorizedBusinessId } from '@/lib/auth';
import { getCallbackRequestsByBusiness, updateCallbackRequestStatus } from '@/lib/data';
import { CallbackStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'BUSINESS' && sessionUser.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const businessId = getAuthorizedBusinessId(req, sessionUser);
    if (!businessId) {
      return res.status(403).json({ error: 'Forbidden. Access to business denied.' });
    }

    if (req.method === 'GET') {
      const { status, search } = req.query;
      const callbacks = await getCallbackRequestsByBusiness(businessId, {
        status: status ? (status as CallbackStatus) : null,
        search: search ? String(search) : null
      });
      return res.status(200).json({ success: true, callbacks });
    } else if (req.method === 'PUT' || req.method === 'POST') {
      if (sessionUser.role === 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Super Admin view is read-only.' });
      }

      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: 'Callback ID and new status are required.' });
      }

      // Verify status is valid enum
      const validStatuses = Object.values(CallbackStatus);
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
      
      const updated = await updateCallbackRequestStatus(id, status as CallbackStatus);
      return res.status(200).json({ success: true, callback: updated });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Callback requests API error:', error);
    return res.status(500).json({ error: 'Internal server error with callback requests.' });
  }
}
