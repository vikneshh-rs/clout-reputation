import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
  TrendingUp,
  QrCode,
  Settings,
  ArrowRight,
  ChevronRight,
  User,
  Clock,
  Smartphone
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

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

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  customerPhone: string | null;
  requestCallback: boolean;
  callbackStatus: 'PENDING' | 'CONTACTED' | 'RESOLVED';
  redirectedToGoogle: boolean;
  googleCtaViewed: boolean;
  googleCtaClicked: boolean;
  createdAt: string;
}

interface RecoveryRequest {
  id: string;
  businessId: string;
  reviewId: string;
  customerName: string;
  whatsappNumber: string;
  rating: number;
  feedback: string | null;
  callbackRequested: boolean;
  status: 'NEW' | 'CONTACTED' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  internalNotes: string | null;
  createdAt: string;
}

export default function BusinessDashboard(props: any) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recoveryQueue, setRecoveryQueue] = useState<RecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d'); // '7d' | '30d' | '90d' | '180d' | '365d'

  const { theme, toggleTheme } = props;

  const isReadOnly = router.query.readOnly === 'true';
  const businessId = router.query.businessId as string;

  const getLink = (basePath: string) => {
    const queryParams = new URLSearchParams();
    if (isReadOnly) queryParams.append('readOnly', 'true');
    if (businessId) queryParams.append('businessId', businessId);
    const qStr = queryParams.toString();
    return qStr ? `${basePath}?${qStr}` : basePath;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      queryParams.append('period', period);
      if (user?.role === 'SUPER_ADMIN' && businessId) {
        queryParams.append('businessId', businessId);
      }

      const [analyticsRes, reviewsRes, recoveryRes] = await Promise.all([
        fetch(`/api/business/analytics?${queryParams.toString()}`),
        fetch(`/api/business/reviews?${queryParams.toString()}`),
        fetch(`/api/business/recovery?${queryParams.toString()}`)
      ]);

      if (analyticsRes.ok && reviewsRes.ok && recoveryRes.ok) {
        const analyticsPayload = await analyticsRes.json();
        const reviewsPayload = await reviewsRes.json();
        const recoveryPayload = await recoveryRes.json();
        
        setData(analyticsPayload.analytics);
        setReviews(reviewsPayload.reviews || []);
        setRecoveryQueue(recoveryPayload.list || []);
      } else {
        setError('Failed to compile business dashboard statistics.');
      }
    } catch (err) {
      setError('Network error retrieving business intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'BUSINESS' || (user.role === 'SUPER_ADMIN' && isReadOnly))) {
      fetchDashboardData();
    }
  }, [user, period]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#073afe]" />
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
        <p className="text-slate-500 text-sm mt-1">Business access credentials required.</p>
      </div>
    );
  }

  // Date Formatting
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Business greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Local KPI calculations
  const reviewsTodayCount = reviews.filter(r => {
    const rDate = new Date(r.createdAt).toDateString();
    const today = new Date().toDateString();
    return rDate === today;
  }).length;

  const pendingRecoveryCount = recoveryQueue.filter(r => r.status === 'NEW' || r.status === 'CONTACTED').length;
  const activeQrCount = data ? 1 : 0; // standard 1 assigned primary QR flyer per active biz onboarding

  // Color generator for avatar fallback
  const getAvatarColors = (name: string | null) => {
    const text = name || 'Guest';
    const char = text[0].toUpperCase();
    const colors: Record<string, { bg: string }> = {
      A: { bg: 'bg-blue-50 text-[#073afe]' },
      B: { bg: 'bg-emerald-50 text-emerald-700' },
      C: { bg: 'bg-amber-50 text-amber-700' },
      D: { bg: 'bg-rose-50 text-rose-700' },
      E: { bg: 'bg-indigo-50 text-indigo-700' },
      F: { bg: 'bg-violet-50 text-violet-700' },
      G: { bg: 'bg-purple-50 text-purple-700' },
      H: { bg: 'bg-pink-50 text-pink-700' },
      I: { bg: 'bg-cyan-50 text-cyan-700' },
      J: { bg: 'bg-teal-50 text-teal-700' },
    };
    return colors[char] || { bg: 'bg-slate-50 text-slate-700' };
  };

  const renderTrendChart = (scansPoints: TrendPoint[], reviewsPoints: TrendPoint[]) => {
    if (!scansPoints || scansPoints.length === 0) return null;
    
    const width = 600;
    const height = 220;
    const paddingX = 40;
    const paddingY = 25;
    
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
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto overflow-visible font-sans select-none">
          <defs>
            <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="reviewGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#073afe" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#073afe" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow-scan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#38BDF8" floodOpacity="0.1" />
            </filter>
            <filter id="glow-review" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#073afe" floodOpacity="0.15" />
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
          <path d={scanPath} fill="none" className="stroke-sky-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-scan)" />
          <path d={reviewPath} fill="none" stroke="#073afe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-review)" />

          {/* Data Points Dots */}
          {scanCoords.map((p, idx) => (
            <circle key={`scan-dot-${idx}`} cx={p.x} cy={p.y} r="2.5" className="fill-white stroke-sky-400" strokeWidth="1.5" />
          ))}
          {reviewCoords.map((p, idx) => (
            <circle key={`review-dot-${idx}`} cx={p.x} cy={p.y} r="2.5" className="fill-white stroke-[#073afe]" strokeWidth="1.5" />
          ))}

          {/* Y Axis Guides */}
          <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" className="text-[8px] fill-slate-400 font-semibold font-sans">{maxVal}</text>
          <text x={paddingX - 10} y={paddingY + chartHeight / 2 + 3} textAnchor="end" className="text-[8px] fill-slate-400 font-semibold font-sans">{Math.round(maxVal / 2)}</text>
          <text x={paddingX - 10} y={height - paddingY + 3} textAnchor="end" className="text-[8px] fill-slate-400 font-semibold font-sans">0</text>

          {/* Dates */}
          {scansPoints.map((p, idx) => {
            const showLabel = idx === 0 || idx === scansPoints.length - 1 || idx % Math.ceil(scansPoints.length / 5) === 0;
            if (!showLabel) return null;
            return (
              <g key={idx}>
                <text x={paddingX + idx * stepX} y={height - 8} textAnchor="middle" className="text-[8px] fill-slate-400 font-bold uppercase tracking-wider">
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

      {/* Modern Greeting Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-slate-200/60">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            {getGreeting()}, {user.name} 👋
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-800 uppercase tracking-wider">{user.name} Management</span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1">
              <Calendar size={13} className="text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Period Selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <label htmlFor="period-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Timeline
          </label>
          <select
            id="period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-0 cursor-pointer"
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
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-32 flex flex-col justify-center items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-[#073afe]" />
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Retrieving client intelligence...</p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          
          {/* Redesigned 5 Premium KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            
            {/* 1. Average Rating */}
            <Card className="flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] border-slate-200/80 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    Average Score
                  </span>
                  <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{data.averageRating}</h3>
                    <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl border border-amber-100/30">
                  <Star size={16} className="fill-current text-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-3">
                <div className="flex text-amber-500 mr-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={10} 
                      className={i < Math.round(data.averageRating) ? 'fill-amber-500 text-amber-500' : 'text-slate-200'} 
                    />
                  ))}
                </div>
                <span>Customer score average</span>
              </div>
            </Card>

            {/* 2. Total Reviews */}
            <Card className="flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] border-slate-200/80 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    Total Reviews
                  </span>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{data.totalReviews}</h3>
                </div>
                <div className="p-2.5 bg-[#EFF3FF] text-[#073afe] rounded-xl border border-blue-100/30">
                  <MessageSquare size={16} />
                </div>
              </div>
              <div className="mt-4 text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-3 flex items-center gap-1">
                <span className="text-[#073afe] font-bold">{data.positiveReviews}</span>
                <span>positive submissions</span>
              </div>
            </Card>

            {/* 3. Reviews Today */}
            <Card className="flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] border-slate-200/80 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    Reviews Today
                  </span>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{reviewsTodayCount}</h3>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/30">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="mt-4 text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-3">
                <span>Submitted within last 24h</span>
              </div>
            </Card>

            {/* 4. Pending Recovery */}
            <Card className={`flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] border-slate-200/80 transition-all duration-300 ${pendingRecoveryCount > 0 ? 'ring-1 ring-red-100' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    Pending Recovery
                  </span>
                  <h3 className={`text-3xl font-extrabold tracking-tight ${pendingRecoveryCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{pendingRecoveryCount}</h3>
                </div>
                <div className={`p-2.5 rounded-xl border ${pendingRecoveryCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-100/30 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200/20'}`}>
                  <AlertCircle size={16} />
                </div>
              </div>
              <div className="mt-4 text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-3 flex items-center justify-between">
                <span>Loyalty cases unresolved</span>
                {pendingRecoveryCount > 0 && <span className="inline-flex h-2 w-2 rounded-full bg-rose-500" />}
              </div>
            </Card>

            {/* 5. Active QR Codes */}
            <Card className="flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] border-slate-200/80 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    Active QR Codes
                  </span>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeQrCount}</h3>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/30">
                  <QrCode size={16} />
                </div>
              </div>
              <div className="mt-4 text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-3 flex items-center gap-1.5">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-[9px] uppercase">{user.slug || 'active-portal'}</span>
              </div>
            </Card>

          </div>

          {/* Quick Actions Grid Section */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Quick Management Shortcuts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <Link href={getLink('/dashboard/business/settings')} className="group block">
                <Card className="p-5 border-slate-200/60 hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer h-full flex items-start gap-4">
                  <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-[#EFF3FF] group-hover:text-[#073afe] transition-all">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#073afe] transition-colors">Download QR Flyers</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Save your high-res table flyer PDF for printing.</p>
                  </div>
                </Card>
              </Link>

              <Link href={getLink('/dashboard/business/reviews')} className="group block">
                <Card className="p-5 border-slate-200/60 hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer h-full flex items-start gap-4">
                  <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-[#EFF3FF] group-hover:text-[#073afe] transition-all">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#073afe] transition-colors">Browse Feed Comments</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">View recent ratings and search text responses.</p>
                  </div>
                </Card>
              </Link>

              <Link href={getLink('/dashboard/business/recovery')} className="group block">
                <Card className="p-5 border-slate-200/60 hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer h-full flex items-start gap-4">
                  <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-[#EFF3FF] group-hover:text-[#073afe] transition-all">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#073afe] transition-colors">Manage Recovery Queue</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Contact negative reviews to recover customer loyalty.</p>
                  </div>
                </Card>
              </Link>

              <Link href={getLink('/dashboard/business/settings')} className="group block">
                <Card className="p-5 border-slate-200/60 hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer h-full flex items-start gap-4">
                  <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-[#EFF3FF] group-hover:text-[#073afe] transition-all">
                    <Settings size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#073afe] transition-colors">Configure Settings</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Manage Google review redirection details.</p>
                  </div>
                </Card>
              </Link>

            </div>
          </div>

          {/* Redesigned Charts Section */}
          {data.dailyTrend && data.dailyTrend.length > 0 && (
            <Card className="border-slate-200/60 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                    QR Funnel Volume Trend
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Compare total QR Scan volumes (light blue line) against customer feedback submissions (brand blue line).
                  </p>
                </div>
                
                {/* Custom Legends */}
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-400 inline-block" />
                    <span className="text-slate-500">QR Scans</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#073afe] inline-block" />
                    <span className="text-slate-500">Reviews</span>
                  </div>
                </div>
              </div>
              
              {renderTrendChart(data.dailyTrend, data.reviewTrend)}
            </Card>
          )}

          {/* Feeds Columns layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMN 1: Recent Reviews */}
            <Card className="border-slate-200/60 p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-slate-400" />
                    Recent Customer Feed
                  </h4>
                  <Link href={getLink('/dashboard/business/reviews')} className="text-[10px] font-bold text-[#073afe] hover:underline flex items-center gap-0.5 uppercase tracking-wider">
                    View All
                    <ChevronRight size={10} />
                  </Link>
                </div>

                {reviews.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">
                    No customer reviews recorded in this period.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((rev) => {
                      const initialColor = getAvatarColors(rev.customerName);
                      const formattedRevDate = new Date(rev.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });

                      return (
                        <div key={rev.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all duration-200">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3">
                              {/* Customer initials avatar */}
                              <div className={`h-8 w-8 rounded-full ${initialColor.bg} flex items-center justify-center text-xs font-bold flex-shrink-0 border border-slate-200/20`}>
                                {rev.customerName ? rev.customerName[0].toUpperCase() : 'G'}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-900">{rev.customerName || 'Anonymous Guest'}</h5>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex text-amber-500">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        size={9} 
                                        className={i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-250'} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-semibold">{formattedRevDate}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Status badges */}
                            <div className="flex flex-wrap gap-1">
                              {rev.googleCtaClicked && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-[#073afe] border border-blue-100/50">
                                  Google CTA
                                </span>
                              )}
                              {rev.requestCallback && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                  rev.callbackStatus === 'RESOLVED' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  Callback
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-650 mt-3 pl-1 leading-relaxed italic bg-white/60 p-2.5 rounded-lg border border-slate-100/50">
                            {rev.comment ? `"${rev.comment}"` : 'No written feedback comments left.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* COLUMN 2: Recovery Queue */}
            <Card className="border-slate-200/60 p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <PhoneCall size={14} className="text-slate-400" />
                    Recovery Actions Queue
                  </h4>
                  <Link href={getLink('/dashboard/business/recovery')} className="text-[10px] font-bold text-[#073afe] hover:underline flex items-center gap-0.5 uppercase tracking-wider">
                    Manage Queue
                    <ChevronRight size={10} />
                  </Link>
                </div>

                {recoveryQueue.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">
                    No active recovery requests pending. Good job!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recoveryQueue.slice(0, 3).map((item) => {
                      const priorityColor = item.priority === 'HIGH' 
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : item.priority === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-slate-50 text-slate-600 border-slate-100';

                      const statusColor = item.status === 'NEW'
                        ? 'bg-red-50/50 text-red-650 border-red-200'
                        : 'bg-amber-50/50 text-amber-650 border-amber-250';

                      const formattedRecDate = new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });

                      return (
                        <div key={item.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex flex-col justify-between gap-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-bold text-slate-900">{item.customerName}</h5>
                                <span className="text-[9px] text-slate-400 font-semibold">{formattedRecDate}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 font-semibold">Rated {item.rating} Stars</span>
                                <span className="text-slate-200">•</span>
                                <span className="text-[10px] text-slate-500 font-semibold">{item.whatsappNumber}</span>
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${priorityColor}`}>
                                {item.priority}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${statusColor}`}>
                                {item.status}
                              </span>
                            </div>
                          </div>

                          {item.feedback && (
                            <p className="text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-lg border border-slate-100/50 line-clamp-2">
                              {item.feedback}
                            </p>
                          )}

                          <div className="flex justify-end gap-2 border-t border-slate-100 pt-2.5">
                            {/* Contact Action */}
                            <a 
                              href={`https://wa.me/${item.whatsappNumber.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                              <PhoneCall size={10} />
                              <span>WhatsApp</span>
                            </a>
                            <Link 
                              href={getLink(`/dashboard/business/recovery`)}
                              className="inline-flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <span>Update Status</span>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

          </div>

        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm font-medium">
          No analytics data available for the selected period range.
        </div>
      )}
    </DashboardLayout>
  );
}
