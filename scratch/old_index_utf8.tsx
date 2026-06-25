import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink, 
  PhoneCall, 
  CheckCircle, 
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface KPIData {
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  googleRedirectClicks: number;
  googleConversionRate: number;
  callbackRequests: number;
  resolvedRequests: number;
}

interface TrendPoint {
  date: string;
  count: number;
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
  dailyTrend: TrendPoint[];
  reviewTrend: TrendPoint[];
}

export default function BusinessDashboard(props: any) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d'); // '7d' | '30d' | '90d' | '180d' | '365d'

  const { theme, toggleTheme } = props;

  const isReadOnly = router.query.readOnly === 'true';
  const businessId = router.query.businessId as string;

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      queryParams.append('period', period);
      if (user?.role === 'SUPER_ADMIN' && businessId) {
        queryParams.append('businessId', businessId);
      }

      const res = await fetch(`/api/business/analytics?${queryParams.toString()}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload.analytics);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch business analytics.');
      }
    } catch (err) {
      setError('Network error retrieving business intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'BUSINESS' || (user.role === 'SUPER_ADMIN' && isReadOnly))) {
      fetchAnalytics();
    }
  }, [user, period]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1857D6]" />
      </div>
    );
  }

  // RBAC isolation check
  const isAllowed = user && (user.role === 'BUSINESS' || (user.role === 'SUPER_ADMIN' && isReadOnly));
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-550 text-sm mt-1">Business access credentials required.</p>
      </div>
    );
  }

  const renderTrendChart = (scansPoints: TrendPoint[], reviewsPoints: TrendPoint[]) => {
    if (!scansPoints || scansPoints.length === 0) return null;
    
    const width = 600;
    const height = 140;
    const paddingX = 35;
    const paddingY = 15;
    
    const maxScans = Math.max(...scansPoints.map(p => p.count), 5);
    const maxReviews = Math.max(...reviewsPoints.map(p => p.count), 5);
    const maxVal = Math.max(maxScans, maxReviews);
    
    const stepX = (width - paddingX * 2) / (scansPoints.length - 1 || 1);
    const chartHeight = height - paddingY * 2;
    
    const scanCoords = scansPoints.map((p, idx) => ({
      x: paddingX + idx * stepX,
      y: height - paddingY - (p.count / maxVal) * chartHeight
    }));

    const reviewCoords = reviewsPoints.map((p, idx) => ({
      x: paddingX + idx * stepX,
      y: height - paddingY - (p.count / maxVal) * chartHeight
    }));

    const scanPath = scanCoords.reduce((acc, p, idx) => acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');
    const reviewPath = reviewCoords.reduce((acc, p, idx) => acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');

    const scanAreaPath = scanCoords.length > 0 
      ? `${scanPath} L ${scanCoords[scanCoords.length - 1].x} ${height - paddingY} L ${scanCoords[0].x} ${height - paddingY} Z`
      : '';

    const reviewAreaPath = reviewCoords.length > 0 
      ? `${reviewPath} L ${reviewCoords[reviewCoords.length - 1].x} ${height - paddingY} L ${reviewCoords[0].x} ${height - paddingY} Z`
      : '';

    return (
      <div className="w-full overflow-x-auto animate-fadeIn">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto overflow-visible">
          <defs>
            <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="reviewGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1857D6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1857D6" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow-scan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#60A5FA" floodOpacity="0.2" />
            </filter>
            <filter id="glow-review" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1857D6" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} className="stroke-slate-100" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingY + chartHeight / 2} x2={width - paddingX} y2={paddingY + chartHeight / 2} className="stroke-slate-100" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} className="stroke-slate-200" strokeWidth="1" />

          {/* Gradient Area Fills */}
          <path d={scanAreaPath} fill="url(#scanGradient)" className="border-none" />
          <path d={reviewAreaPath} fill="url(#reviewGradient)" className="border-none" />

          {/* Paths */}
          <path d={scanPath} fill="none" className="stroke-blue-400/80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-scan)" />
          <path d={reviewPath} fill="none" stroke="#1857D6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-review)" />

          {/* Data Points Dots */}
          {scanCoords.map((p, idx) => (
            <circle key={`scan-dot-${idx}`} cx={p.x} cy={p.y} r="2.5" className="fill-white stroke-blue-400 transition-all duration-300 hover:r-4 cursor-pointer" strokeWidth="1.5" />
          ))}
          {reviewCoords.map((p, idx) => (
            <circle key={`review-dot-${idx}`} cx={p.x} cy={p.y} r="2.5" className="fill-white stroke-[#1857D6] transition-all duration-300 hover:r-4 cursor-pointer" strokeWidth="1.5" />
          ))}

          {/* Dates */}
          {scansPoints.map((p, idx) => {
            const showLabel = idx === 0 || idx === scansPoints.length - 1 || idx % Math.ceil(scansPoints.length / 5) === 0;
            if (!showLabel) return null;
            return (
              <g key={idx}>
                <text x={paddingX + idx * stepX} y={height - 2} textAnchor="middle" className="text-[8px] fill-slate-400 font-bold uppercase tracking-wider">
                  {p.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <DashboardLayout title="Business Dashboard" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Dashboard - {user.name} - Clout Reputation</title>
      </Head>

      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-900">
            Welcome back, {user.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor client feedback, callback status, and Google search reviews funnel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-xs font-bold text-slate-705 uppercase tracking-wider">
            Filter:
          </label>
          <select
            id="period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 text-slate-900 rounded px-3 py-1.5 focus:outline-none focus:border-[#1857D6]"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="180d">Last 180 Days</option>
            <option value="365d">Last 365 Days</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-750 text-xs flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-650 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col justify-center items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
          <p className="text-xs text-slate-500 font-medium">Loading analytics data...</p>
        </div>
      ) : data ? (
        <div className="space-y-8 animate-fadeIn">
          {/* 8 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Total Reviews */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Total Reviews
                </span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{data.totalReviews}</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-450 font-semibold">
                  <span>Customer responses</span>
                </div>
              </div>
              <div className="p-3.5 bg-indigo-50/80 text-indigo-650 border border-indigo-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <MessageSquare size={20} />
              </div>
            </div>

            {/* 2. Average Rating */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Average Rating
                </span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none flex items-center gap-1">
                  {data.averageRating}
                  <Star size={16} className="fill-amber-500 text-amber-500 inline-block" />
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-450 font-semibold">
                  <span>Out of 5 stars</span>
                </div>
              </div>
              <div className="p-3.5 bg-amber-50/80 text-amber-500 border border-amber-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <Star size={20} className="fill-current text-amber-500" />
              </div>
            </div>

            {/* 3. Positive Reviews */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Positive Reviews
                </span>
                <h3 className="text-3xl font-extrabold text-emerald-600 leading-none">{data.positiveReviews}</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-450 font-semibold">
                  <span>4 & 5 stars reviews</span>
                </div>
              </div>
              <div className="p-3.5 bg-emerald-50/80 text-emerald-650 border border-emerald-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <ThumbsUp size={20} />
              </div>
            </div>

            {/* 4. Negative Reviews */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Negative Reviews
                </span>
                <h3 className="text-3xl font-extrabold text-rose-600 leading-none">{data.negativeReviews}</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-450 font-semibold">
                  <span>1, 2 & 3 stars reviews</span>
                </div>
              </div>
              <div className="p-3.5 bg-rose-50/80 text-rose-650 border border-rose-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <ThumbsDown size={20} />
              </div>
            </div>

            {/* 5. Google Redirect Clicks */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Google Redirects
                </span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{data.googleRedirectClicks}</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-450 font-semibold">
                  <span>CTA clicks</span>
                </div>
              </div>
              <div className="p-3.5 bg-violet-50/80 text-violet-650 border border-violet-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <ExternalLink size={20} />
              </div>
            </div>

            {/* 6. Google Conversion Rate */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Google Conversion
                </span>
                <h3 className="text-3xl font-extrabold text-[#1857D6] leading-none">{data.googleConversionRate}%</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-450 font-semibold">
                  <span>Redirect rate</span>
                </div>
              </div>
              <div className="p-3.5 bg-cyan-50/80 text-cyan-650 border border-cyan-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <TrendingUp size={20} />
              </div>
            </div>

            {/* 7. Callback Requests */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Callback Requests
                </span>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-none">{data.callbackRequests}</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-450 font-semibold">
                  <span>Loyalty recovery cases</span>
                </div>
              </div>
              <div className="p-3.5 bg-blue-50/80 text-blue-650 border border-blue-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <PhoneCall size={20} />
              </div>
            </div>

            {/* 8. Resolved Callbacks */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-100/60 shadow-[0_8px_30px_rgba(15,23,42,0.015)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.04)] hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center group">
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Resolved Callbacks
                </span>
                <h3 className="text-3xl font-extrabold text-emerald-600 leading-none">{data.resolvedRequests}</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-450 font-semibold">
                  <span>Cases marked RESOLVED</span>
                </div>
              </div>
              <div className="p-3.5 bg-sky-50/80 text-sky-655 border border-sky-100/30 rounded-2xl group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <CheckCircle size={20} />
              </div>
            </div>

          </div>

          {/* Charts panel */}
          {data.dailyTrend && data.dailyTrend.length > 0 && (
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Volume Funnel Trend
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compare QR Scan volumes (light blue) with Customer Reviews (deep blue).
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-blue-300/80 inline-block" />
                    <span className="text-slate-600">QR Scans</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-[#1857D6] inline-block" />
                    <span className="text-slate-600">Reviews</span>
                  </div>
                </div>
              </div>
              {renderTrendChart(data.dailyTrend, data.reviewTrend)}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          No analytics data available for the selected range.
        </div>
      )}
    </DashboardLayout>
  );
}
