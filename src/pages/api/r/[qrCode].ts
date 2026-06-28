import { NextApiRequest, NextApiResponse } from 'next';
import { resolveBusinessByIdentifier, recordQrScan, createReview, isSessionSubmitted } from '@/lib/data';
import { BusinessStatus, QRStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { qrCode } = req.query; // qrCode param is the identifier (either slug or QR UUID)

  if (!qrCode || typeof qrCode !== 'string') {
    return res.status(400).json({ error: 'Identifier query parameter is required.' });
  }

  try {
    const result = await resolveBusinessByIdentifier(qrCode);

    if (!result) {
      return res.status(404).json({ error: 'Business or review portal not found.', status: 'NOT_FOUND' });
    }

    const { business, qrCode: activeQrCode, qrStatus } = result;

    if (qrStatus === 'Not Generated' || activeQrCode === 'NO_QR') {
      return res.status(400).json({ error: 'This business does not have an active QR code generated.', status: 'NOT_GENERATED' });
    }

    if (qrStatus === QRStatus.ARCHIVED) {
      return res.status(400).json({ error: 'This QR code asset has been archived.', status: 'ARCHIVED' });
    }

    if (!business.isActive || business.status === BusinessStatus.INACTIVE) {
      return res.status(403).json({ error: 'This review portal is temporarily inactive.', status: 'INACTIVE' });
    }

    if (business.status === BusinessStatus.PENDING) {
      return res.status(403).json({ error: 'This review portal setup is incomplete.', status: 'PENDING' });
    }

    if (req.method === 'GET') {
      // Log this scan in database
      const userAgent = req.headers['user-agent'] || null;
      await recordQrScan({
        businessId: business.id,
        qrCode: activeQrCode,
        userAgent: userAgent ? String(userAgent) : null
      });

      return res.status(200).json({
        qrCode: activeQrCode,
        status: qrStatus,
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
      const { rating, comment, customerName, customerPhone, requestCallback, reviewSessionId } = req.body;
      
      if (rating === undefined) {
        return res.status(400).json({ error: 'Rating is required.' });
      }

      const ratingVal = Number(rating);
      if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
      }

      // Check for duplicate submission
      if (reviewSessionId) {
        const alreadySubmitted = await isSessionSubmitted(reviewSessionId);
        if (alreadySubmitted) {
          return res.status(200).json({ success: true, message: 'Review already submitted for this session.' });
        }
      }

      const review = await createReview({
        rating: ratingVal,
        comment,
        customerName,
        customerPhone,
        requestCallback: requestCallback === true,
        businessId: business.id,
        reviewSessionId
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
