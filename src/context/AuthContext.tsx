import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface User {
  id: string;
  name: string;
  email: string | null;
  username: string;
  role: 'SUPER_ADMIN' | 'REP' | 'BUSINESS';
  slug?: string;
  industry?: string;
  logoUrl?: string | null;
  googleReviewUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, loginType?: 'business' | 'superadmin' | 'rep') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user on mount and set up global fetch interceptor
  useEffect(() => {
    async function loadUser() {
      console.log("[AUTH] Auth check started");
      try {
        const res = await fetch('/api/auth/me');
        console.log("[AUTH] Auth response", res);
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          console.warn("[AUTH] Authentication failed: status code", res.status);
          setUser(null);
          if (res.status === 401) {
            // Clear the session cookie via logout endpoint
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
            
            // Redirect to appropriate portal if on a dashboard page
            const path = window.location.pathname;
            if (path.startsWith('/dashboard')) {
              if (path.startsWith('/dashboard/admin') || path.startsWith('/dashboard/super-admin')) {
                router.replace('/superadmin?error=session_expired');
              } else if (path.startsWith('/dashboard/rep')) {
                router.replace('/reps?error=session_expired');
              } else {
                router.replace('/login?error=session_expired');
              }
            }
          }
        }
      } catch (error) {
        console.error("[AUTH] Authentication failed", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Set up global fetch interceptor to catch any other 401s during session
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 401) {
          const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url || '';
          // Avoid intercepting auth/me and auth/logout to prevent infinite recursion loops
          if (!urlStr.includes('/api/auth/me') && !urlStr.includes('/api/auth/logout')) {
            console.warn("[AUTH] Global fetch interceptor caught 401 Unauthorized for:", urlStr);
            setUser(null);
            // Clear session cookie via logout endpoint
            originalFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
            
            const path = window.location.pathname;
            if (path.startsWith('/dashboard')) {
              if (path.startsWith('/dashboard/admin') || path.startsWith('/dashboard/super-admin')) {
                router.replace('/superadmin?error=session_expired');
              } else if (path.startsWith('/dashboard/rep')) {
                router.replace('/reps?error=session_expired');
              } else {
                router.replace('/login?error=session_expired');
              }
            }
          }
        }
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);

  const login = async (username: string, password: string, loginType: 'business' | 'superadmin' | 'rep' = 'business') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, loginType }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        // Redirect based on role
        if (data.user.role === 'SUPER_ADMIN') {
          router.push('/dashboard/admin');
        } else if (data.user.role === 'REP') {
          router.push('/dashboard/rep');
        } else if (data.user.role === 'BUSINESS') {
          router.push('/dashboard/business');
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    const role = user?.role;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      if (role === 'SUPER_ADMIN') {
        router.push('/superadmin');
      } else if (role === 'REP') {
        router.push('/reps');
      } else {
        router.push('/login');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
