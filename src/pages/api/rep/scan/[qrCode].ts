import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { validateQrCode } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'REP' && sessionUser.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied. Field Representative role required.' });
    }

    const { qrCode } = req.query;
    if (!qrCode || typeof qrCode !== 'string') {
      return res.status(400).json({ error: 'QR Code is required.' });
    }

    const qrRecord = await validateQrCode(qrCode);
    if (!qrRecord) {
      return res.status(404).json({ error: 'QR Code does not exist in inventory.' });
    }

    return res.status(200).json({ 
      status: qrRecord.status,
      qrInventory: qrRecord
    });
  } catch (error: any) {
    console.error('Scan QR API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error validating QR.' });
  }
}
