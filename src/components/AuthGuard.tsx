import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { pathname } = router;

  const isDashboard = pathname.startsWith('/dashboard');

  useEffect(() => {
    if (loading) return;

    if (isDashboard) {
      if (!user) {
        if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/super-admin')) {
          router.replace('/superadmin');
        } else if (pathname.startsWith('/dashboard/rep')) {
          router.replace('/reps');
        } else if (pathname.startsWith('/dashboard/business')) {
          router.replace('/login');
        } else {
          router.replace('/login');
        }
      } else {
        // Logged in, check role permissions
        if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/super-admin')) {
          if (user.role !== 'SUPER_ADMIN') {
            router.replace('/superadmin?error=access_denied');
          }
        } else if (pathname.startsWith('/dashboard/rep')) {
          if (user.role !== 'REP' && user.role !== 'SUPER_ADMIN') {
            router.replace('/reps?error=access_denied');
          }
        } else if (pathname.startsWith('/dashboard/business')) {
          const isReadOnly = router.query.readOnly === 'true';
          if (user.role !== 'BUSINESS' && !(user.role === 'SUPER_ADMIN' && isReadOnly)) {
            router.replace('/login?error=access_denied');
          }
        }
      }
    }
  }, [user, loading, pathname, isDashboard, router]);

  if (isDashboard && (loading || !user)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
      </div>
    );
  }

  // Double check role mismatch to prevent flashing unauthorized content before redirect triggers
  if (isDashboard && user) {
    if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/super-admin')) {
      if (user.role !== 'SUPER_ADMIN') {
        return (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
          </div>
        );
      }
    } else if (pathname.startsWith('/dashboard/rep')) {
      if (user.role !== 'REP' && user.role !== 'SUPER_ADMIN') {
        return (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
          </div>
        );
      }
    } else if (pathname.startsWith('/dashboard/business')) {
      const isReadOnly = router.query.readOnly === 'true';
      if (user.role !== 'BUSINESS' && !(user.role === 'SUPER_ADMIN' && isReadOnly)) {
        return (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
          </div>
        );
      }
    }
  }

  return <>{children}</>;
}
