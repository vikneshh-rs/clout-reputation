import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Globe, 
  PhoneCall, 
  Building2, 
  Calendar, 
  Loader2, 
  AlertTriangle,
  Award,
  BarChart
} from 'lucide-react';

interface RepRanking {
  id: string;
  name: string;
  username: string;
  onboarded: number;
  assignments: number;
}

interface IndustryStat {
  industry: string;
  businessCount: number;
  reviewCount: number;
}

interface TopBusiness {
  id: string;
  name: string;
  averageRating: number;
  reviewsCount: number;
  positiveCount: number;
}

interface AnalyticsData {
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  googleRedirectClicks: number;
  googleConversionRate: number;
  callbackRequests: number;
  resolvedRequests: number;
  businessesAdded: number;
  repRankings: RepRanking[];
  industryStats: IndustryStat[];
  topBusinesses: TopBusiness[];
}

export default function PlatformAnalyticsPage(props: any) {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  // State
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/super-admin/analytics?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.analytics);
      } else {
        setError('Failed to fetch platform analytics.');
      }
    } catch (err) {
      setError('Network error fetching platform analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchAnalytics();
    }
  }, [user, period]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-['Source_Sans_Pro']">
        <Loader2 className="animate-spin h-8 w-8 text-[#073afe]" />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-['Source_Sans_Pro']">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">Super Admin permissions required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Platform Analytics" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Platform Analytics - Cloutation</title>
      </Head>

      {/* Period Selection Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-xs text-slate-500 mt-0.5">Visualize platform engagement, representatives performance, and review flows.</p>
        <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-md border border-slate-100 rounded-xl p-1 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <Calendar size={12} className="text-slate-400 ml-1.5" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs font-semibold py-1 px-2 pr-6 border-none bg-transparent focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="180d">Last 6 Months</option>
            <option value="365d">Last Year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
          <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="p-24 text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#073afe] mx-auto mb-4" />
          <span className="text-xs text-slate-500">Compiling platform metrics...</span>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Reviews & Sentiment */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reviews Collected</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">{data.totalReviews}</h3>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Positive: {data.positiveReviews}</span>
                  <span>Negative: {data.negativeReviews}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                  <div 
                    className="bg-[#073afe] h-1.5" 
                    style={{ width: `${data.totalReviews > 0 ? (data.positiveReviews / data.totalReviews) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-slate-300 h-1.5" 
                    style={{ width: `${data.totalReviews > 0 ? (data.negativeReviews / data.totalReviews) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Average Platform Rating */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">{data.averageRating} <span className="text-sm font-normal text-slate-400">/ 5.0</span></h3>
              </div>
              <div className="mt-4 text-[10px] text-slate-500 font-semibold flex items-center">
                <TrendingUp size={12} className="text-emerald-500 mr-1" />
                Across all active portals &amp; QR scans
              </div>
            </div>

            {/* Google Conversion Analytics */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Google Redirect Clicks</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">{data.googleRedirectClicks}</h3>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                  <span>CONVERSION RATE</span>
                  <span className="text-[#073afe]">{data.googleConversionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5" 
                    style={{ width: `${data.googleConversionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Callback Requests & Resolved Rate */}
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Callback Requests</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">{data.callbackRequests}</h3>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                  <span>RESOLVED RATE</span>
                  <span className="text-emerald-600">
                    {data.callbackRequests > 0 
                      ? Math.round((data.resolvedRequests / data.callbackRequests) * 100) 
                      : 100}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-[#073afe] h-1.5" 
                    style={{ 
                      width: `${data.callbackRequests > 0 
                        ? (data.resolvedRequests / data.callbackRequests) * 100 
                        : 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Leaders & Rankings Segment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* REP Leaderboard */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="px-5 py-4 bg-slate-50/20 border-b border-slate-100 flex items-center space-x-2">
                <Award size={16} className="text-[#073afe]" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Representative Leaderboard</h4>
              </div>
              
              <div className="overflow-x-auto">
                {data.repRankings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No representative data recorded.</div>
                ) : (
                  <table className="min-w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-2.5 text-center w-12">Rank</th>
                        <th className="px-5 py-2.5">Representative</th>
                        <th className="px-5 py-2.5 text-center">Onboarded</th>
                        <th className="px-5 py-2.5 text-center">QR Codes Assigned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-transparent">
                      {data.repRankings.map((rep, idx) => (
                        <tr key={rep.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3 text-center font-bold text-slate-900">{idx + 1}</td>
                          <td className="px-5 py-3">
                            <div className="font-bold text-slate-900">{rep.name}</div>
                            <div className="text-[9px] text-slate-400 font-medium">@{rep.username}</div>
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-900">{rep.onboarded}</td>
                          <td className="px-5 py-3 text-center text-slate-500">{rep.assignments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Active Industries */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="px-5 py-4 bg-slate-50/20 border-b border-slate-100 flex items-center space-x-2">
                <BarChart size={16} className="text-[#073afe]" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Industry Performance</h4>
              </div>
              
              <div className="overflow-x-auto">
                {data.industryStats.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No industry metrics recorded.</div>
                ) : (
                  <table className="min-w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-2.5">Industry</th>
                        <th className="px-5 py-2.5 text-center">Businesses Active</th>
                        <th className="px-5 py-2.5 text-center">Total Reviews</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-transparent">
                      {data.industryStats.map((ind) => (
                        <tr key={ind.industry} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold uppercase">
                              {ind.industry}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-900">{ind.businessCount}</td>
                          <td className="px-5 py-3 text-center text-slate-500">{ind.reviewCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Top Client Businesses Section */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/20 border-b border-slate-100 flex items-center space-x-2">
              <Building2 size={16} className="text-[#073afe]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top Performing Client Portals (By Reviews Count)</h4>
            </div>

            <div className="overflow-x-auto">
              {data.topBusinesses.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">No client business records found.</div>
              ) : (
                <table className="min-w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Business Name</th>
                      <th className="px-6 py-3 text-center">Average Rating</th>
                      <th className="px-6 py-3 text-center">Total Reviews</th>
                      <th className="px-6 py-3 text-center">Positive Reviews</th>
                      <th className="px-6 py-3 text-right">Positive Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-transparent">
                    {data.topBusinesses.map((biz) => {
                      const ratio = biz.reviewsCount > 0 ? Math.round((biz.positiveCount / biz.reviewsCount) * 100) : 0;
                      return (
                        <tr key={biz.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-slate-900">{biz.name}</td>
                          <td className="px-6 py-3.5 text-center font-bold text-slate-700">{biz.averageRating} ★</td>
                          <td className="px-6 py-3.5 text-center text-slate-900 font-semibold">{biz.reviewsCount}</td>
                          <td className="px-6 py-3.5 text-center text-emerald-600 font-medium">{biz.positiveCount}</td>
                          <td className="px-6 py-3.5 text-right font-bold text-[#073afe]">{ratio}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
