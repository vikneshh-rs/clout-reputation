import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import CustomerRecoveryModule from '@/components/CustomerRecoveryModule';
import { AlertCircle } from 'lucide-react';

export default function BusinessRecovery(props: any) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  const isReadOnly = router.query.readOnly === 'true';
  const businessId = router.query.businessId as string;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1853AB]" />
      </div>
    );
  }

  const isAllowed = user && (user.role === 'BUSINESS' || (user.role === 'SUPER_ADMIN' && isReadOnly));
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <AlertCircle className="h-12 w-12 text-slate-800 mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">Tenant permissions required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Customer Recovery Queue" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Customer Recovery - Clout Reputation</title>
      </Head>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Customer Recovery</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage, contact, and audit negative experience cases to recover customer loyalty.
        </p>
      </div>

      <CustomerRecoveryModule businessId={businessId} readOnly={isReadOnly} />
    </DashboardLayout>
  );
}
