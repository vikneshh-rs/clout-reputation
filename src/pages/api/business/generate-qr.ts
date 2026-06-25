import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { generateQrForBusiness, logActivity } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'REP')) {
      return res.status(403).json({ error: 'Access denied. Authorized role required.' });
    }

    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required.' });
    }

    const qr = await generateQrForBusiness(businessId, sessionUser.id);

    await logActivity(
      sessionUser.id,
      'Generated QR Code',
      'BUSINESS',
      businessId,
      { qrCode: qr.qrCode }
    );

    return res.status(200).json({
      message: 'Successfully generated active QR code.',
      qr
    });
  } catch (error: any) {
    console.error('QR generation API error:', error);
    return res.status(400).json({ error: error.message || 'Internal server error generating QR.' });
  }
}
