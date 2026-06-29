import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateSubscription, runQuery, mockSubscriptions, mockBusinesses } from '@/lib/data';
import { SubscriptionPlan } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    if (req.method === 'GET') {
      const resolved = await runQuery(
        async () => {
          return await db.subscription.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
              business: { select: { name: true } }
            }
          });
        },
        async () => {
          const subs = [...mockSubscriptions];
          const resolved = subs.map((s: any) => {
            const biz = mockBusinesses.find((b: any) => b.id === s.businessId);
            return {
              ...s,
              business: biz ? { name: biz.name } : null
            };
          });
          resolved.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
          return resolved;
        }
      );

      return res.status(200).json({ subscriptions: resolved });
    }

    if (req.method === 'POST') {
      const { businessId, plan, action, months } = req.body;
      if (!businessId || !plan || !action) {
        return res.status(400).json({ error: 'Business ID, plan, and action are required.' });
      }

      if (!Object.values(SubscriptionPlan).includes(plan)) {
        return res.status(400).json({ error: `Invalid plan. Must be: ${Object.values(SubscriptionPlan).join(', ')}` });
      }

      const qtyMonths = months ? parseInt(months, 10) : 1;

      const sub = await updateSubscription(
        businessId,
        plan as SubscriptionPlan,
        action as any,
        qtyMonths,
        sessionUser.id
      );

      return res.status(200).json({
        message: 'Subscription updated successfully.',
        subscription: sub
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Super Admin subscriptions API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error managing subscriptions.' });
  }
}
