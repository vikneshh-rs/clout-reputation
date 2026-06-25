import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import CustomerRecoveryModule from '@/components/CustomerRecoveryModule';
import { AlertCircle, Filter, Loader2 } from 'lucide-react';

interface BusinessItem {
  id: string;
  name: string;
}

export default function AdminRecovery(props: any) {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string>('ALL');
  const [loadingBiz, setLoadingBiz] = useState(false);

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      const fetchBusinesses = async () => {
        try {
          setLoadingBiz(true);
          const res = await fetch('/api/super-admin/businesses');
          if (res.ok) {
            const data = await res.json();
            setBusinesses(data.businesses || []);
          }
        } catch (err) {
          console.error('Error fetching businesses for selector:', err);
        } finally {
          setLoadingBiz(false);
        }
      };
      fetchBusinesses();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1853AB]" />
      </div>
    );
  }

  const isAllowed = user && user.role === 'SUPER_ADMIN';
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <AlertCircle className="h-12 w-12 text-slate-800 mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">Super Admin permissions required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Platform Customer Recovery Queue" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Customer Recovery Admin - Clout Reputation</title>
      </Head>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Customer Recovery</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor and resolve negative experience tickets across all client businesses.
          </p>
        </div>

        {/* Global Business Selector */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-100 px-3 py-1.5 rounded-2xl shadow-sm max-w-xs w-full">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          {loadingBiz ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 size={10} className="animate-spin" />
              <span>Loading businesses...</span>
            </div>
          ) : (
            <select
              value={selectedBizId}
              onChange={(e) => setSelectedBizId(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none w-full cursor-pointer"
            >
              <option value="ALL">All Client Businesses</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <CustomerRecoveryModule businessId={selectedBizId === 'ALL' ? undefined : selectedBizId} />
    </DashboardLayout>
  );
}
