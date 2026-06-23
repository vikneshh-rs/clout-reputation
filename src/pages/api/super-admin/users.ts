import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionUser } from '@/lib/auth';
import { getAllUsers, deleteUser, logActivity } from '@/lib/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authenticate and authorize session user
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    // GET Request: List all users
    if (req.method === 'GET') {
      const users = await getAllUsers();
      return res.status(200).json({ users });
    }

    // DELETE Request: Delete user account
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'User ID is required.' });
      }

      // Prevent Super Admin from deleting themselves
      if (sessionUser.id === id) {
        return res.status(400).json({ error: 'You cannot delete your own Super Admin account.' });
      }

      await deleteUser(id);
      
      // Log activity
      await logActivity(sessionUser.id, 'User Deleted', 'USER', id);
      
      return res.status(200).json({ message: 'User account deleted successfully.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Super Admin users endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error managing users' });
  }
}
