import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  MessageSquare, 
  Search, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';

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

export default function BusinessReviews(props: any) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  const isReadOnly = router.query.readOnly === 'true';
  const businessId = router.query.businessId as string;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('ALL');
  const [period, setPeriod] = useState('30d'); // '7d' | '30d' | '90d' | '180d' | '365d'

  // Expanded card state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (rating !== 'ALL') queryParams.append('rating', rating);
      queryParams.append('period', period);
      if (user?.role === 'SUPER_ADMIN' && businessId) {
        queryParams.append('businessId', businessId);
      }

      const res = await fetch(`/api/business/reviews?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch reviews.');
      }
    } catch (err) {
      setError('Network error fetching business reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'BUSINESS' || (user.role === 'SUPER_ADMIN' && isReadOnly))) {
      fetchReviews();
    }
  }, [user, rating, period]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-['Source_Sans_Pro']">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#073afe]" />
      </div>
    );
  }

  const isAllowed = user && (user.role === 'BUSINESS' || (user.role === 'SUPER_ADMIN' && isReadOnly));
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-['Source_Sans_Pro']">
        <AlertCircle className="h-12 w-12 text-black mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-gray-500 text-sm mt-1">Tenant permissions required.</p>
      </div>
    );
  }

  // Calculate local metrics based on current fetched list
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
    : 0;
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const negativeReviews = reviews.filter(r => r.rating <= 3).length;

  return (
    <DashboardLayout title="Customer Reviews" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Reviews Management - Cloutation</title>
      </Head>

      <div className="mb-6">
        <h2 className="text-xl font-bold font-sans text-slate-900">Review Feed</h2>
        <p className="text-xs text-slate-450 mt-0.5">Monitor client scores, filter by rating level, and review Google post conversions.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2.5 font-medium animate-fadeIn">
          <AlertCircle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Reviews */}
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.04)] hover:border-slate-200 transition-all duration-300 relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Reviews</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalReviews}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">responses</span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.04)] hover:border-slate-200 transition-all duration-300 relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Average Rating</span>
          <div className="flex items-center space-x-2 mt-2">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{averageRating}</h3>
            <div className="flex items-center text-amber-500">
              <Star size={16} className="fill-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">out of 5</span>
          </div>
        </div>

        {/* Positive Reviews */}
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.04)] hover:border-slate-200 transition-all duration-300 relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Positive (Rating &gt;= 4)</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">{positiveReviews}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">
              ({totalReviews > 0 ? ((positiveReviews / totalReviews) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        {/* Negative Reviews */}
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.04)] hover:border-slate-200 transition-all duration-300 relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Negative (Rating &lt;= 3)</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <h3 className="text-3xl font-extrabold text-rose-600 tracking-tight">{negativeReviews}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">
              ({totalReviews > 0 ? ((negativeReviews / totalReviews) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-grow w-full space-y-1.5">
            <label htmlFor="search-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Search Comments
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search keywords, customer names, comments..."
                className="w-full text-xs border border-slate-200 rounded-2xl bg-white pl-10 pr-4 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 font-medium transition-all h-[46px]"
              />
            </div>
          </div>

          <div className="w-full md:w-48 space-y-1.5">
            <label htmlFor="rating-filter" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Rating
            </label>
            <select
              id="rating-filter"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-2xl bg-white px-3.5 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 font-medium transition-all h-[46px]"
            >
              <option value="ALL">All Scores</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="w-full md:w-48 space-y-1.5">
            <label htmlFor="period-filter" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Timeline Period
            </label>
            <select
              id="period-filter"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-2xl bg-white px-3.5 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 font-medium transition-all h-[46px]"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="180d">Last 180 Days</option>
              <option value="365d">Last 365 Days</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-bold px-6 py-3 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer justify-center h-[46px] shadow-sm flex-shrink-0"
          >
            <Search size={14} />
            <span>Apply Search</span>
          </button>
        </form>
      </div>

      {/* Reviews Table/Feed */}
      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-[#073afe] stroke-[2.25]" />
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Retrieving feedback feed...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-16 text-center text-slate-450 text-xs font-semibold">
          No matching reviews found for current filters.
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {reviews.map((rev) => {
            const isExpanded = expandedId === rev.id;
            const formattedDate = new Date(rev.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={rev.id}
                className="bg-white border border-slate-100 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.03)] hover:border-slate-200 transition-all duration-200"
              >
                {/* Header Summary */}
                <div
                  onClick={() => toggleExpand(rev.id)}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-805">
                      {rev.customerName || 'Anonymous Customer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-semibold text-[11px]">{formattedDate}</span>
                    {rev.googleCtaClicked && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-[#073afe] font-bold text-[9px] uppercase tracking-wider border border-blue-100/50">
                        Posted on Google
                      </span>
                    )}
                    {rev.requestCallback && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider border ${
                        rev.callbackStatus === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : rev.callbackStatus === 'CONTACTED'
                          ? 'bg-amber-50 text-amber-700 border-amber-250'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        Callback: {rev.callbackStatus}
                      </span>
                    )}
                    <div className="text-slate-400 p-0.5 hover:text-slate-650 transition-colors">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-5 bg-slate-50/20 rounded-b-[20px] animate-slideDown">
                    <div className="space-y-5">
                      {/* Comment */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Comment
                        </span>
                        <p className="text-xs text-slate-700 mt-1 bg-white p-4 border border-slate-100 rounded-2xl italic leading-relaxed shadow-[0_2px_8px_rgba(15,23,42,0.01)]">
                          {rev.comment ? `"${rev.comment}"` : 'No feedback comment left by customer.'}
                        </p>
                      </div>

                      {/* Contact metadata */}
                      {(rev.customerName || rev.customerPhone) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Customer Contact Name
                            </span>
                            <span className="text-xs font-bold text-slate-800 block mt-1">
                              {rev.customerName || 'N/A'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Phone Number
                            </span>
                            <span className="text-xs font-bold text-slate-800 block mt-1 font-mono">
                              {rev.customerPhone || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Funnel Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Redirect Clicked</span>
                          <span className="text-xs font-bold text-slate-850 block mt-0.5">
                            {rev.googleCtaClicked ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Redirect Viewed</span>
                          <span className="text-xs font-bold text-slate-855 block mt-0.5">
                            {rev.googleCtaViewed ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Callback Required</span>
                          <span className="text-xs font-bold text-slate-855 block mt-0.5">
                            {rev.requestCallback ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Internal ID</span>
                          <span className="text-[10px] font-mono text-slate-450 block mt-0.5">
                            {rev.id}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
