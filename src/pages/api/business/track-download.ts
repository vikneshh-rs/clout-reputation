import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { trackQrDownload } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required.' });
    }

    await trackQrDownload(businessId, sessionUser.id);

    return res.status(200).json({ success: true, message: 'QR download logged successfully.' });
  } catch (error: any) {
    console.error('Download tracking API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error tracking download.' });
  }
}
