import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Store, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  QrCode, 
  Star, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  Loader2,
  Bell
} from 'lucide-react';

interface ActivityLog {
  id: string;
  user: string;
  role: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  timestamp: string;
  description: string;
}

interface Stats {
  totalBusinesses: number;
  totalReps: number;
  totalReviews: number;
  averagePlatformRating: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  assignedQRs: number;
  unassignedQRs: number;
  reviewsThisMonth: number;
  businessesThisMonth: number;
  callbacksThisMonth: number;
  googleRedirectClicksThisMonth: number;
}

function NotificationSummaryWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/super-admin/notifications/stats?period=7d')
      .then(res => res.ok ? res.json() : null)
      .then(payload => {
        if (payload) {
          setData(payload);
        }
      })
      .catch(err => console.error('Error fetching dashboard summary:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 p-6 rounded-3xl mb-8 flex items-center justify-center">
        <Loader2 className="animate-spin h-5 w-5 text-[#073afe]" />
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fadeIn">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-50 text-[#073afe] border border-blue-100/30 rounded-2xl">
          <Bell size={22} className="text-[#073afe] animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 font-sans">Notification Dispatcher Engine</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Queue: <strong className="text-slate-800 font-bold">{summary.queueLength} pending/processing</strong> | 
            Success Rate: <strong className="text-emerald-600 font-bold">{summary.successRate}%</strong>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hourly Throughput</span>
          <strong className="text-slate-900 mt-0.5">{summary.throughput?.messagesPerHour ?? 0} dispatches</strong>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Latency</span>
          <strong className="text-slate-900 mt-0.5">{summary.avgProcessingTime}ms</strong>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cron Job</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 mt-0.5 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
          </span>
        </div>
      </div>

      <Link href="/dashboard/admin/notifications" className="px-4.5 py-2.5 bg-[#073afe] hover:bg-[#0630d3] text-white text-xs font-bold rounded-2xl shadow-sm flex items-center gap-1.5 transition-all self-stretch md:self-auto justify-center border-none text-center">
        <span>Control Center</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

export default function AdminDashboard(props: any) {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { theme, toggleTheme } = props;

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/super-admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('Failed to fetch platform statistics.');
      }
    } catch (err) {
      setError('Network error fetching stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchStats();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <Loader2 className="animate-spin h-8 w-8 text-[#073afe]" />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">Super Admin permissions required.</p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <Loader2 className="animate-spin h-8 w-8 text-[#073afe]" />
      </div>
    );
  }

  return (
    <DashboardLayout title="System Control Dashboard" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Super Admin Dashboard - Cloutation</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">Platform Health & KPIs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time indicators of businesses, representatives, QR codes, and active subscriptions.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
          <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {stats && (
        <>
          {/* 4 Platform KPI Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8 animate-fadeIn">
            {/* Total Businesses */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Businesses</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{stats.totalBusinesses}</h3>
              </div>
              <div className="p-3.5 bg-indigo-50/80 text-indigo-600 border border-indigo-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <Store size={20} />
              </div>
            </div>

            {/* Active Businesses */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Businesses</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{(stats as any).activeBusinesses ?? 0}</h3>
              </div>
              <div className="p-3.5 bg-emerald-50/80 text-emerald-650 border border-emerald-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <CheckCircle size={20} />
              </div>
            </div>

            {/* Active REPs */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active REPs</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{(stats as any).activeReps ?? 0}</h3>
              </div>
              <div className="p-3.5 bg-violet-50/80 text-violet-600 border border-violet-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <Users size={20} />
              </div>
            </div>

            {/* Total Reviews */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Reviews</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{stats.totalReviews}</h3>
              </div>
              <div className="p-3.5 bg-blue-50/80 text-blue-650 border border-blue-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <MessageSquare size={20} />
              </div>
            </div>
          </div>

          <NotificationSummaryWidget />

          {/* Activity Section */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
              <div className="flex items-center space-x-2">
                <Activity size={16} className="text-[#073afe]" />
                <h4 className="text-sm font-bold text-slate-900">Recent Activity Log</h4>
              </div>
              <Link href="/dashboard/admin/activity" className="text-xs font-semibold text-[#073afe] hover:underline flex items-center">
                View All Activity
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {stats.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/30 transition-colors flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-blue-50/70 text-[#073afe] rounded-xl">
                        <Activity size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-900 font-bold">{log.description}</p>
                        <p className="text-[10px] text-slate-500">
                          Actor: <span className="font-semibold text-slate-600">{log.user}</span> ({log.role})
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No activity logs recorded.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
