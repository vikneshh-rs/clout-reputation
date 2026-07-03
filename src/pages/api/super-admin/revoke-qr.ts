import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { revokeQrAsset, logActivity } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    const { qrCode } = req.body;
    if (!qrCode || typeof qrCode !== 'string') {
      return res.status(400).json({ error: 'QR Code is required.' });
    }

    const updatedQr = await revokeQrAsset(qrCode, sessionUser.id);

    await logActivity(
      sessionUser.id,
      `Revoked QR Asset: ${qrCode}`,
      'BUSINESS',
      null,
      { qrCode }
    );

    return res.status(200).json({
      message: `Successfully revoked QR code "${qrCode}".`,
      qrAsset: updatedQr
    });
  } catch (error: any) {
    console.error('Revoke QR API error:', error);
    return res.status(400).json({ error: error.message || 'Internal server error revoking QR asset.' });
  }
}
