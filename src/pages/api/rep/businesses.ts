import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getAllBusinesses } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || (sessionUser.role !== 'REP' && sessionUser.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied. Representative or Admin role required.' });
    }

    const businesses = await getAllBusinesses(false); // active only
    
    // Return a simplified list of businesses: id, name, slug, industry
    const simplified = businesses.map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      industry: b.industry
    }));

    return res.status(200).json({ businesses: simplified });
  } catch (error) {
    console.error('Fetch active businesses error:', error);
    return res.status(500).json({ error: 'Internal server error fetching businesses.' });
  }
}
