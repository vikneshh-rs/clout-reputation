import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser, clearSessionCookie } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API/AUTH/ME] Session verification requested');
    const user = await getSessionUser(req);
    if (!user) {
      console.warn('[API/AUTH/ME] Verification failed: No active session user found');
      clearSessionCookie(res); // Clear the invalid/expired session cookie
      return res.status(401).json({ error: 'Unauthorized. No active session.' });
    }

    console.log(`[API/AUTH/ME] Verification successful for user: ${user.username || user.name} (${user.role})`);
    return res.status(200).json({ user });
  } catch (error) {
    console.error('[API/AUTH/ME] Session verify error:', error);
    clearSessionCookie(res); // Clear session cookie on error just in case
    return res.status(500).json({ error: 'Internal server error verifying session' });
  }
}
