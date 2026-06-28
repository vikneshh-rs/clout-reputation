import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import { getUserById, getBusinessById } from './data';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-cloutation-jwt-key-change-this-in-production';
const COOKIE_NAME = 'cloutation_session';

export interface TokenPayload {
  userId: string;
  email: string | null;
  username: string; // Username for users, Business Name for businesses
  role: 'SUPER_ADMIN' | 'REP' | 'BUSINESS';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    console.log(`[AUTH] Token verified successfully for user: ${decoded.userId} (${decoded.role})`);
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.warn('[AUTH] JWT expired at:', error.expiredAt);
    } else {
      console.warn('[AUTH] JWT verification failed:', error.message);
    }
    return null;
  }
}

export function getSessionToken(req: NextApiRequest): string | null {
  // Try to get token from header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get token from cookies
  const cookieString = req.headers.cookie || '';
  const cookies = parseCookies(cookieString);
  return cookies[COOKIE_NAME] || null;
}

export async function getSessionUser(req: NextApiRequest) {
  console.log('[AUTH] Checking session token...');
  const token = getSessionToken(req);
  if (!token) {
    console.warn('[AUTH] No session token found in request headers or cookies');
    return null;
  }
  console.log('[AUTH] Token received');

  const payload = verifyToken(token);
  if (!payload) {
    console.warn('[AUTH] Token verification failed');
    return null;
  }

  try {
    if (payload.role === 'BUSINESS') {
      const business = await getBusinessById(payload.userId);
      if (!business) {
        console.warn(`[AUTH] Business user not found for ID: ${payload.userId}`);
        return null;
      }
      console.log(`[AUTH] User identified: ${business.name} (BUSINESS)`);
      return {
        ...business,
        role: 'BUSINESS' as const
      };
    } else {
      const user = await getUserById(payload.userId);
      if (!user) {
        console.warn(`[AUTH] User not found for ID: ${payload.userId}`);
        return null;
      }
      console.log(`[AUTH] User identified: ${user.username} (${user.role})`);
      return user;
    }
  } catch (error) {
    console.error('[AUTH] Error looking up session user:', error);
    return null;
  }
}

export function setSessionCookie(res: NextApiResponse, token: string) {
  // Set Cookie as HTTP-only, secure, sameSite=lax, path=/
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieValue = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
    60 * 60 * 24 * 7
  }${isProduction ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieValue);
}

export function clearSessionCookie(res: NextApiResponse) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieValue = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    isProduction ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieValue);
}

// Helper to parse cookies from headers
function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;

  cookieString.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    if (name) {
      cookies[name] = parts.slice(1).join('=').trim();
    }
  });

  return cookies;
}

/**
 * Enforces tenant-level data isolation.
 * For BUSINESS dashboard, it forces their own businessId.
 * For SUPER_ADMIN/REP, it allows querying other businessIds if provided.
 */
export function getAuthorizedBusinessId(
  req: NextApiRequest,
  sessionUser: { role: string; id: string }
): string | null {
  if (sessionUser.role === 'SUPER_ADMIN' || sessionUser.role === 'REP') {
    const queryId = (req.query.businessId || req.query.restaurantId) as string;
    const bodyId = (req.body?.businessId || req.body?.restaurantId) as string;
    return queryId || bodyId || null;
  }
  
  if (sessionUser.role === 'BUSINESS') {
    return sessionUser.id;
  }
  
  return null;
}
