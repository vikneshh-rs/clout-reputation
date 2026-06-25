import { NextApiRequest, NextApiResponse } from 'next';
import { comparePassword, signToken, setSessionCookie } from '@/lib/auth';
import { getUserByUsername, getBusinessByName, logActivity } from '@/lib/data';
import { BusinessStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, loginType } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Business Name and password are required' });
  }

  try {
    if (loginType === 'business') {
      // Business Name + Password Auth
      const business = await getBusinessByName(username);
      if (!business) {
        return res.status(401).json({ error: 'Invalid business name or password' });
      }

      if (!business.isActive || business.status === BusinessStatus.INACTIVE) {
        return res.status(403).json({ error: 'Your account is currently inactive or suspended. Please contact support.' });
      }

      const isMatch = await comparePassword(password, business.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid business name or password' });
      }

      // Sign token
      const token = signToken({
        userId: business.id,
        email: null,
        username: business.name,
        role: 'BUSINESS',
      });

      // Set cookie
      setSessionCookie(res, token);

      // Log activity
      await logActivity(business.id, 'Business Logged In', 'BUSINESS', business.id);

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: business.id,
          name: business.name,
          role: 'BUSINESS',
          slug: business.slug,
          industry: business.industry,
          logoUrl: business.logoUrl,
          googleReviewUrl: business.googleReviewUrl,
        },
      });
    } else {
      // User Auth (Super Admin / REP)
      const user = await getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Role portal isolation validation
      if (loginType === 'superadmin') {
        if (user.role !== 'SUPER_ADMIN') {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
      } else if (loginType === 'rep') {
        if (user.role !== 'REP') {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
      } else {
        return res.status(401).json({ error: 'Invalid login type' });
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      if (user.role === 'REP' && !user.isActive) {
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
      }

      // Sign session token
      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      // Set cookie
      setSessionCookie(res, token);

      // Log activity
      await logActivity(user.id, 'User Logged In', 'USER', user.id);

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}
