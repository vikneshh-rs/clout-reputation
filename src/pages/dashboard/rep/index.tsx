import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  QrCode, 
  ArrowRight, 
  UserCheck, 
  AlertCircle,
  PlusCircle,
  RotateCcw,
  Briefcase
} from 'lucide-react';

interface AssignmentLog {
  id: string;
  qrInventory: {
    qrCode: string;
    status: string;
  };
  business?: {
    name: string;
    industry: string;
  } | null;
  action: string;
  createdAt: string;
}

export default function RepDashboard(props: any) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = props;

  const [history, setHistory] = useState<AssignmentLog[]>([]);
  const [stats, setStats] = useState({ onboardedCount: 0, assignmentsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/rep/history');
      if (res.ok) {
        const payload = await res.json();
        setHistory(payload.history || []);
        setStats(payload.stats || { onboardedCount: 0, assignmentsCount: 0 });
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch history logs.');
      }
    } catch (err) {
      setError('Network error retrieving rep history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'REP' || user.role === 'SUPER_ADMIN')) {
      fetchHistory();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
      </div>
    );
  }

  // Access check
  if (!user || (user.role !== 'REP' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">Field Representative credentials required.</p>
      </div>
    );
  }

  const recentAssignments = history.slice(0, 5);

  return (
    <DashboardLayout title="Rep Dashboard" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Rep Dashboard - Clout Reputation</title>
      </Head>

      {/* Welcome banner */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-blue-50/70 text-[#1857D6] rounded-xl">
            <UserCheck size={20} />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 font-sans">Welcome back, {user.name}!</h2>
        </div>
        <p className="text-xs text-slate-500 max-w-xl pl-1">
          Onboard new businesses instantly by scanning or entering unassigned pre-printed QR code stickers.
        </p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Businesses Onboarded */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 flex justify-between items-center group">
          <div className="space-y-2">
            <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest">Businesses Onboarded</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <h3 className="text-3xl font-extrabold text-[#1857D6]">{stats.onboardedCount}</h3>
              <span className="text-xs text-slate-500">accounts registered</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50/70 text-[#1857D6] rounded-2xl group-hover:scale-105 transition-transform duration-300">
            <Briefcase size={22} />
          </div>
        </div>

        {/* Total QR Assignments */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 flex justify-between items-center group">
          <div className="space-y-2">
            <span className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest">Total QR Assignments</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <h3 className="text-3xl font-extrabold text-slate-900">{stats.assignmentsCount}</h3>
              <span className="text-xs text-slate-500">activations logged</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50/70 text-[#1857D6] rounded-2xl group-hover:scale-105 transition-transform duration-300">
            <QrCode size={22} />
          </div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => router.push('/dashboard/rep/assign')}
          className="flex items-center justify-between p-5 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-left hover:border-blue-500/50 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50/70 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <PlusCircle size={22} />
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-900">Scan & Onboard QR Code</strong>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Map a fresh pre-printed QR to a new business</span>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => router.push('/dashboard/rep/assign?replace=true')}
          className="flex items-center justify-between p-5 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-left hover:border-blue-500/50 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-50/70 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <RotateCcw size={22} />
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-900">Swap Damaged QR Sticker</strong>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Replace a damaged QR sticker with a new one</span>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Recent Activity Logs Feed */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent QR Assignments</h3>
            <span className="text-[9px] text-slate-450 uppercase block mt-0.5">Logs of your latest field operations</span>
          </div>
          <button
            onClick={() => router.push('/dashboard/rep/history')}
            className="text-[10px] font-bold text-[#1857D6] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            Full Logs <ArrowRight size={10} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/50 rounded-xl text-rose-700 text-xs mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 flex justify-center items-center">
            <Loader2 className="animate-spin h-6 w-6 text-[#1857D6]" />
          </div>
        ) : stats.assignmentsCount === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No assignments recorded yet. Click "Scan & Onboard QR Code" to get started!
          </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-sans">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-bold uppercase tracking-wider text-slate-500">Business Name</th>
                    <th scope="col" className="px-4 py-2.5 font-bold uppercase tracking-wider text-slate-500">Business Type</th>
                    <th scope="col" className="px-4 py-2.5 font-bold uppercase tracking-wider text-slate-500">QR Code</th>
                    <th scope="col" className="px-4 py-2.5 font-bold uppercase tracking-wider text-slate-500 text-right">Assigned Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-transparent">
                  {recentAssignments.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{log.business?.name || 'Unknown Business'}</td>
                      <td className="px-4 py-3 capitalize text-slate-500">{log.business?.industry ? log.business.industry.toLowerCase().replace('_', ' ') : 'N/A'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#1857D6]">{log.qrInventory?.qrCode || 'N/A'}</td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Inline fallback loader helper
function Loader2({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
