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
  Loader2
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
  recentLogs?: ActivityLog[];
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
        <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
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
        <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
      </div>
    );
  }

  return (
    <DashboardLayout title="System Control Dashboard" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Super Admin Dashboard - Clout Reputation</title>
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
          {/* 8 Platform KPI Cards */}
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

            {/* Total REPs */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total REPs</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{stats.totalReps}</h3>
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
              <div className="p-3.5 bg-emerald-50/80 text-emerald-650 border border-emerald-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <MessageSquare size={20} />
              </div>
            </div>

            {/* Avg Rating */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Average Rating</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none flex items-center gap-1.5">
                  {stats.averagePlatformRating}
                  <Star size={18} className="fill-amber-500 text-amber-500 inline-block" />
                </h3>
              </div>
              <div className="p-3.5 bg-amber-50/80 text-amber-600 border border-amber-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <TrendingUp size={20} />
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Subscriptions</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{stats.activeSubscriptions}</h3>
              </div>
              <div className="p-3.5 bg-cyan-50/80 text-cyan-600 border border-cyan-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <CheckCircle size={20} />
              </div>
            </div>

            {/* Expired Subscriptions */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Expired Subscriptions</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{stats.expiredSubscriptions}</h3>
              </div>
              <div className="p-3.5 bg-rose-50/80 text-rose-600 border border-rose-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <Clock size={20} />
              </div>
            </div>

            {/* Assigned QRs */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Assigned QRs</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{stats.assignedQRs}</h3>
              </div>
              <div className="p-3.5 bg-blue-50/80 text-blue-600 border border-blue-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <QrCode size={20} />
              </div>
            </div>

            {/* Unassigned QRs */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Unassigned QRs</span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{stats.unassignedQRs}</h3>
              </div>
              <div className="p-3.5 bg-sky-50/80 text-sky-600 border border-sky-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <QrCode size={20} />
              </div>
            </div>
          </div>

          {/* Monthly counters */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 font-sans">Activity In Current Month</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300">
                <span className="block text-[10px] font-bold text-slate-450 tracking-wider uppercase">Reviews This Month</span>
                <span className="block text-3xl font-extrabold text-slate-900 leading-none mt-3">{stats.reviewsThisMonth}</span>
              </div>
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300">
                <span className="block text-[10px] font-bold text-slate-450 tracking-wider uppercase">Businesses Added</span>
                <span className="block text-3xl font-extrabold text-slate-900 leading-none mt-3">{stats.businessesThisMonth}</span>
              </div>
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300">
                <span className="block text-[10px] font-bold text-slate-455 tracking-wider uppercase">Callbacks Requested</span>
                <span className="block text-3xl font-extrabold text-slate-900 leading-none mt-3">{stats.callbacksThisMonth}</span>
              </div>
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300">
                <span className="block text-[10px] font-bold text-slate-455 tracking-wider uppercase">Google CTA Redirects</span>
                <span className="block text-3xl font-extrabold text-slate-900 leading-none mt-3">{stats.googleRedirectClicksThisMonth}</span>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
              <div className="flex items-center space-x-2">
                <Activity size={16} className="text-[#1857D6]" />
                <h4 className="text-sm font-bold text-slate-900">Recent Activity Log</h4>
              </div>
              <Link href="/dashboard/admin/activity" className="text-xs font-semibold text-[#1857D6] hover:underline flex items-center">
                View All Activity
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {stats.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/30 transition-colors flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-blue-50/70 text-[#1857D6] rounded-xl">
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
