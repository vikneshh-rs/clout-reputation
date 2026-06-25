import { NextApiRequest, NextApiResponse } from 'next';
import { logFunnelEvent } from '@/lib/data';
import { FunnelStage } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { stage, businessId, reviewSessionId } = req.body;
  if (!stage || !businessId || !reviewSessionId) {
    return res.status(400).json({ error: 'Missing required funnel parameters: stage, businessId, reviewSessionId.' });
  }

  // Validate funnel stage enum
  const validStages = ['SCAN', 'START', 'SUBMIT', 'REDIRECT'];
  if (!validStages.includes(stage)) {
    return res.status(400).json({ error: `Invalid funnel stage: ${stage}.` });
  }

  try {
    const userAgent = req.headers['user-agent'] || null;
    const event = await logFunnelEvent(stage as FunnelStage, businessId, reviewSessionId, userAgent);
    return res.status(200).json({ success: true, event });
  } catch (error: any) {
    console.error('Funnel event API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error logging funnel event.' });
  }
}
