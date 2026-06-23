import { NextApiRequest, NextApiResponse } from 'next';
import { createCallbackRequest } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reviewId, customerName, phoneNumber } = req.body;

  if (!reviewId || !customerName || !phoneNumber) {
    return res.status(400).json({ error: 'Missing required callback fields.' });
  }

  try {
    const callback = await createCallbackRequest({
      reviewId,
      customerName,
      phoneNumber
    });
    return res.status(200).json({ success: true, callback });
  } catch (error) {
    console.error('Submit callback API error:', error);
    return res.status(500).json({ error: 'Internal server error submitting callback request.' });
  }
}
