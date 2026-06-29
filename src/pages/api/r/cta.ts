import { NextApiRequest, NextApiResponse } from 'next';
import { trackCtaView, trackCtaClick, logFunnelEvent } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reviewId, action, businessId, reviewSessionId } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  // Handle duplicate session redirect tracking (when reviewId is not generated or is undefined)
  if (!reviewId || reviewId === 'undefined') {
    if (action === 'click' && businessId && reviewSessionId) {
      try {
        const userAgent = req.headers['user-agent'] || null;
        await logFunnelEvent('REDIRECT', businessId, reviewSessionId, userAgent)
          .catch(err => console.error('Failed to log REDIRECT funnel event on duplicate session:', err));
        return res.status(200).json({ success: true, message: 'Redirect logged for duplicate session' });
      } catch (err) {
        return res.status(500).json({ error: 'Internal server error logging duplicate redirect' });
      }
    }
    return res.status(400).json({ error: 'Missing reviewId parameter' });
  }

  try {
    if (action === 'view') {
      const review = await trackCtaView(reviewId);
      return res.status(200).json({ success: true, review });
    } else if (action === 'click') {
      const review = await trackCtaClick(reviewId);
      
      // If session tracking parameters are present, log REDIRECT funnel event
      if (businessId && reviewSessionId) {
        const userAgent = req.headers['user-agent'] || null;
        await logFunnelEvent('REDIRECT', businessId, reviewSessionId, userAgent)
          .catch(err => console.error('Failed to log REDIRECT funnel event:', err));
      }
      
      return res.status(200).json({ success: true, review });
    } else {
      return res.status(400).json({ error: 'Invalid action type' });
    }
  } catch (error) {
    console.error('Track CTA API error:', error);
    return res.status(500).json({ error: 'Internal server error tracking CTA' });
  }
}
