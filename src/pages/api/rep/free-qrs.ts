import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getQrInventory } from '@/lib/data';
import { QRAssetStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'REP' && sessionUser.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const freeQrs = await getQrInventory({ status: QRAssetStatus.FREE, search: null, batchId: null });

    return res.status(200).json({
      qrCodes: freeQrs.map(q => q.qrCode)
    });
  } catch (error) {
    console.error('Free QRs API error:', error);
    return res.status(500).json({ error: 'Internal server error fetching free QR codes.' });
  }
}
