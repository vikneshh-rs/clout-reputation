import { NextApiRequest, NextApiResponse } from 'next';
import { validateQrCode, recordQrScan, createReview } from '@/lib/data';
import { BusinessStatus, QRStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { qrCode } = req.query;

  if (!qrCode || typeof qrCode !== 'string') {
    return res.status(400).json({ error: 'QR Code query parameter is required.' });
  }

  try {
    const qrRecord = await validateQrCode(qrCode);

    if (!qrRecord) {
      return res.status(404).json({ error: 'QR code not found.', status: 'NOT_FOUND' });
    }

    if (qrRecord.status === QRStatus.UNASSIGNED) {
      return res.status(400).json({ error: 'This QR code is unassigned.', status: 'UNASSIGNED' });
    }

    if (qrRecord.status === QRStatus.DAMAGED || qrRecord.status === QRStatus.REPLACED || qrRecord.status === QRStatus.INACTIVE) {
      return res.status(400).json({ error: 'This QR code is no longer active.', status: qrRecord.status });
    }

    if (qrRecord.status !== QRStatus.ASSIGNED || !qrRecord.business) {
      return res.status(400).json({ error: 'This QR code is not active.', status: qrRecord.status });
    }

    const business = qrRecord.business;

    if (!business.isActive || business.status === BusinessStatus.SUSPENDED) {
      return res.status(403).json({ error: 'This review portal is temporarily suspended.', status: 'SUSPENDED' });
    }

    if (business.status === BusinessStatus.EXPIRED) {
      return res.status(403).json({ error: 'This review portal subscription has expired.', status: 'EXPIRED' });
    }

    if (req.method === 'GET') {
      // Log this scan in database (runs deduplication inside recordQrScan)
      const userAgent = req.headers['user-agent'] || null;
      await recordQrScan({
        businessId: business.id,
        qrCode,
        userAgent: userAgent ? String(userAgent) : null
      });

      return res.status(200).json({
        qrCode: qrRecord.qrCode,
        status: qrRecord.status,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          industry: business.industry,
          logoUrl: business.logoUrl,
          googleReviewUrl: business.googleReviewUrl,
          enableGoogleReviewRedirect: business.enableGoogleReviewRedirect,
          enableManagerCallback: business.enableManagerCallback
        }
      });
    } else if (req.method === 'POST') {
      const { rating, comment } = req.body;
      
      if (rating === undefined) {
        return res.status(400).json({ error: 'Rating is required.' });
      }

      const ratingVal = Number(rating);
      if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
      }

      const review = await createReview({
        rating: ratingVal,
        comment,
        businessId: business.id
      });

      return res.status(200).json(review);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('QR Code Resolver API error:', error);
    return res.status(500).json({ error: 'Internal server error processing review portal.' });
  }
}
