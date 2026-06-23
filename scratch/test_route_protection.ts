import { NextRequest } from 'next/server';
import { proxy } from '../src/proxy';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super-secret-cloutreputation-jwt-key-change-this-in-production';
const COOKIE_NAME = 'cloutreputation_session';

function generateToken(role: 'SUPER_ADMIN' | 'REP' | 'BUSINESS', userId: string, username: string) {
  const payload = {
    userId,
    email: `${username.toLowerCase()}@cloutreputation.com`,
    username,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
  };
  return jwt.sign(payload, JWT_SECRET);
}

async function runTest() {
  console.log('🧪 Verifying Route Protection Proxy...');

  const tokens = {
    SUPER_ADMIN: generateToken('SUPER_ADMIN', 'u-admin', 'deco-admin'),
    REP: generateToken('REP', 'u-rep1', 'dan'),
    BUSINESS: generateToken('BUSINESS', 'b1', 'Bella-Italia')
  };

  const testCases = [
    // 1. Logged out scenarios
    { name: 'Logged Out accessing /dashboard/admin', path: '/dashboard/admin', token: null, expectedRedirect: '/superadmin' },
    { name: 'Logged Out accessing /dashboard/rep', path: '/dashboard/rep', token: null, expectedRedirect: '/reps' },
    { name: 'Logged Out accessing /dashboard/business', path: '/dashboard/business', token: null, expectedRedirect: '/login' },

    // 2. REP user scenarios
    { name: 'REP accessing /dashboard/admin', path: '/dashboard/admin', token: tokens.REP, expectedRedirect: '/superadmin?error=access_denied' },
    { name: 'REP accessing /dashboard/rep', path: '/dashboard/rep', token: tokens.REP, expectedRedirect: null },
    { name: 'REP accessing /dashboard/business (read-only allowed for admins, not reps)', path: '/dashboard/business', token: tokens.REP, expectedRedirect: '/login?error=access_denied' },

    // 3. BUSINESS user scenarios
    { name: 'BUSINESS accessing /dashboard/admin', path: '/dashboard/admin', token: tokens.BUSINESS, expectedRedirect: '/superadmin?error=access_denied' },
    { name: 'BUSINESS accessing /dashboard/rep', path: '/dashboard/rep', token: tokens.BUSINESS, expectedRedirect: '/reps?error=access_denied' },
    { name: 'BUSINESS accessing /dashboard/business', path: '/dashboard/business', token: tokens.BUSINESS, expectedRedirect: null },

    // 4. SUPER_ADMIN user scenarios
    { name: 'SUPER_ADMIN accessing /dashboard/admin', path: '/dashboard/admin', token: tokens.SUPER_ADMIN, expectedRedirect: null },
    { name: 'SUPER_ADMIN accessing /dashboard/rep', path: '/dashboard/rep', token: tokens.SUPER_ADMIN, expectedRedirect: null },
    { name: 'SUPER_ADMIN accessing /dashboard/business', path: '/dashboard/business', token: tokens.SUPER_ADMIN, expectedRedirect: null }
  ];

  let passedCount = 0;

  for (const tc of testCases) {
    const headers: Record<string, string> = {};
    if (tc.token) {
      headers['Cookie'] = `${COOKIE_NAME}=${tc.token}`;
    }

    const req = new NextRequest(`http://localhost:3000${tc.path}`, { headers });
    const res = await proxy(req);

    const redirectUrl = res?.headers?.get('Location');
    const actualRedirect = redirectUrl ? new URL(redirectUrl).pathname + new URL(redirectUrl).search : null;

    if (actualRedirect === tc.expectedRedirect) {
      console.log(`✅ [PASS] ${tc.name} -> Got: ${actualRedirect || 'Access Granted'}`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] ${tc.name} -> Expected: ${tc.expectedRedirect || 'Access Granted'}, Got: ${actualRedirect || 'Access Granted'}`);
    }
  }

  console.log(`\n📊 Verification Summary: ${passedCount}/${testCases.length} checks passed.`);
  if (passedCount === testCases.length) {
    console.log('🎉 ROUTE PROTECTION IS WORKING CORRECTLY NATIVELY VIA src/proxy.ts!');
  } else {
    console.log('⚠️ ROUTE PROTECTION FAILS.');
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('❌ Error executing route tests:', err);
  process.exit(1);
});
