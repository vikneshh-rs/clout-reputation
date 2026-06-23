import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  QrCode, 
  Search, 
  AlertCircle, 
  Database,
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import { useRouter } from 'next/router';

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

export default function RepHistory(props: any) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = props;

  const [history, setHistory] = useState<AssignmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);

      const res = await fetch(`/api/rep/history?${queryParams.toString()}`);
      if (res.ok) {
        const payload = await res.json();
        setHistory(payload.history || []);
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
  }, [user, search]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
      </div>
    );
  }

  // Access check
  if (!user || (user.role !== 'REP' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-black mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-zinc-550 text-sm mt-1">Field Representative credentials required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Assignment History" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Assignment Logs - Clout Reputation</title>
        <style>{`
          body, .dashboard-layout {
            font-family: 'Source Sans Pro', sans-serif !important;
          }
        `}</style>
      </Head>

      <button
        onClick={() => router.push('/dashboard/rep')}
        className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-black mb-6 transition-colors border-none bg-transparent cursor-pointer"
      >
        <ArrowLeft size={12} className="mr-1.5" />
        Back to dashboard
      </button>

      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Assignment Logs</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Permanent audit logs tracking QR stickers mapped or replaced for businesses.</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Search logs by QR Code or Business Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-xl bg-white pl-9 pr-3 py-2 focus:border-[#1857D6] focus:outline-none focus:ring-2 focus:ring-[#1857D6]/10"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
          <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table Card */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <Database className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
            <h3 className="font-bold text-sm">No logs recorded</h3>
            <p className="text-xs text-zinc-500 mt-1">Assignments matching your filter could not be found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/50 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    Sticker QR Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    Business Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    Industry Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    Operation Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-right">
                    Logged Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-[#1857D6]">
                      {log.qrInventory.qrCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
                      {log.business?.name || 'Unknown Business'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {log.business?.industry ? log.business.industry.toLowerCase().replace('_', ' ') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.2 text-[8px] font-bold uppercase rounded border ${
                        log.action === 'ASSIGNED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                          : log.action === 'REASSIGNED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-150'
                          : log.action === 'REPLACED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono text-zinc-500">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
