import { NextApiRequest, NextApiResponse } from 'next';
import { getNotificationMetrics, getRecentDeliveries } from '@/lib/monitoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const metrics = await getNotificationMetrics();
    const recentDeliveries = await getRecentDeliveries(20);

    return res.status(200).json({
      success: true,
      metrics,
      recentDeliveries,
    });
  } catch (error: any) {
    console.error('Failed to retrieve notification dashboard metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error retrieving metrics.',
      message: error?.message || String(error),
    });
  }
}
