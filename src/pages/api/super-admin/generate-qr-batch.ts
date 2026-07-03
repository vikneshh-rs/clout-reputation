import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { generateQrAssetsCustom, logActivity } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    const { prefix, startNumber, endNumber } = req.body;
    if (!prefix || startNumber === undefined || endNumber === undefined) {
      return res.status(400).json({ error: 'Prefix, Start Number, and End Number are required.' });
    }

    const start = parseInt(startNumber, 10);
    const end = parseInt(endNumber, 10);

    if (isNaN(start) || start < 1 || isNaN(end) || end < start) {
      return res.status(400).json({ error: 'Invalid range. Start and End numbers must be positive integers, and End must be >= Start.' });
    }

    const result = await generateQrAssetsCustom(prefix, start, end, sessionUser.id);

    await logActivity(
      sessionUser.id,
      `Generated QR Batch for Prefix: ${prefix}`,
      'QR_BATCH',
      null,
      { prefix, startNumber: start, endNumber: end, quantity: end - start + 1 }
    );

    return res.status(201).json({
      message: `Successfully generated QR codes.`,
      batch: result
    });
  } catch (error: any) {
    console.error('Super Admin QR batch generation API error:', error);
    return res.status(400).json({ error: error.message || 'Internal server error generating QR batch.' });
  }
}
