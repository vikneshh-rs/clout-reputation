import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    const { jobId } = req.body;

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Job ID is required.' });
    }

    const job = await db.notificationJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Notification job not found.' });
    }

    // Reset status back to PENDING and clear error messages to trigger reprocessing
    // BUT preserve the retryCount history (do not reset it to 0)
    const updated = await db.notificationJob.update({
      where: { id: jobId },
      data: {
        status: 'PENDING',
        errorMessage: null,
        scheduledFor: null, // deliver immediately on next cron cycle
        updatedAt: new Date()
      }
    });

    return res.status(200).json({
      message: 'Job status reset to PENDING successfully. Re-execution queued.',
      job: updated
    });
  } catch (error) {
    console.error('Super Admin Notification Retry API error:', error);
    return res.status(500).json({ error: 'Internal server error queueing retry job' });
  }
}
