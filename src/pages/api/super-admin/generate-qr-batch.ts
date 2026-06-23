import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { generateQrBatchCustom, logActivity } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    const { batchName, startSerial, quantity } = req.body;
    if (!batchName || !startSerial || quantity === undefined) {
      return res.status(400).json({ error: 'Batch Name, Starting QR Number, and Quantity are required.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      return res.status(400).json({ error: 'Batch size must be between 1 and 1000 QR codes.' });
    }

    const result = await generateQrBatchCustom(batchName, startSerial, qty, sessionUser.id);

    await logActivity(
      sessionUser.id,
      `Generated QR Batch: ${batchName}`,
      'QR_BATCH',
      null,
      { batchName, startSerial, quantity: qty }
    );

    return res.status(201).json({
      message: `Successfully generated ${qty} QR codes.`,
      batch: result
    });
  } catch (error: any) {
    console.error('Super Admin QR batch generation API error:', error);
    return res.status(400).json({ error: error.message || 'Internal server error generating QR batch.' });
  }
}
