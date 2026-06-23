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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1857D6]" />
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
        <title>Reviews Management - Clout Reputation</title>
      </Head>

      <div className="mb-6">
        <h2 className="text-xl font-bold font-['Source_Sans_Pro'] text-black">Review Feed</h2>
        <p className="text-xs text-gray-500 mt-0.5">Monitor client scores, filter by rating level, and review Google post conversions.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
          <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Reviews */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Reviews</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <h3 className="text-3xl font-bold text-black">{totalReviews}</h3>
            <span className="text-[10px] text-slate-400">responses</span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Average Rating</span>
          <div className="flex items-center space-x-2 mt-2">
            <h3 className="text-3xl font-bold text-black">{averageRating}</h3>
            <div className="flex items-center text-amber-500">
              <Star size={16} className="fill-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400">out of 5</span>
          </div>
        </div>

        {/* Positive Reviews */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Positive (Rating &gt;= 4)</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <h3 className="text-3xl font-bold text-emerald-600">{positiveReviews}</h3>
            <span className="text-[10px] text-slate-400">
              ({totalReviews > 0 ? ((positiveReviews / totalReviews) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        {/* Negative Reviews */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Negative (Rating &lt;= 3)</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <h3 className="text-3xl font-bold text-rose-600">{negativeReviews}</h3>
            <span className="text-[10px] text-slate-400">
              ({totalReviews > 0 ? ((negativeReviews / totalReviews) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow w-full">
            <label htmlFor="search-input" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Search Comments
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search keywords, customer names, comments..."
                className="w-full text-xs border border-slate-200 rounded-xl bg-white pl-9 pr-4 py-2 focus:border-[#1857D6] focus:outline-none focus:ring-2 focus:ring-[#1857D6]/10"
              />
            </div>
          </div>

          <div className="w-full md:w-48">
            <label htmlFor="rating-filter" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Rating
            </label>
            <select
              id="rating-filter"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl bg-white px-2.5 py-1.5 focus:border-[#1857D6] focus:outline-none"
            >
              <option value="ALL">All Scores</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="w-full md:w-48">
            <label htmlFor="period-filter" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Timeline Period
            </label>
            <select
              id="period-filter"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl bg-white px-2.5 py-1.5 focus:border-[#1857D6] focus:outline-none"
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
            className="w-full md:w-auto bg-[#1857D6] hover:bg-[#154fc4] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer justify-center"
          >
            Apply Search
          </button>
        </form>
      </div>

      {/* Reviews Table/Feed */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-12 text-center text-slate-400 text-sm">
          No matching reviews found for current filters.
        </div>
      ) : (
        <div className="space-y-4">
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
                className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-slate-200 transition-all duration-300"
              >
                {/* Header Summary */}
                <div
                  onClick={() => toggleExpand(rev.id)}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={15}
                          className={i < rev.rating ? 'fill-amber-500' : 'text-slate-200'}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {rev.customerName || 'Anonymous Customer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{formattedDate}</span>
                    {rev.googleCtaClicked && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-150">
                        Posted on Google
                      </span>
                    )}
                    {rev.requestCallback && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold border ${
                        rev.callbackStatus === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                          : rev.callbackStatus === 'CONTACTED'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        Callback: {rev.callbackStatus}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 bg-slate-50/30">
                    <div className="space-y-4">
                      {/* Comment */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Comment
                        </span>
                        <p className="text-sm text-black mt-1 bg-white p-3 border border-slate-100 rounded-xl">
                          {rev.comment || 'No feedback comment left by customer.'}
                        </p>
                      </div>

                      {/* Contact metadata */}
                      {(rev.customerName || rev.customerPhone) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Customer Contact Name
                            </span>
                            <span className="text-sm font-semibold text-black block mt-1">
                              {rev.customerName || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Phone Number
                            </span>
                            <span className="text-sm font-semibold text-black block mt-1">
                              {rev.customerPhone || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Funnel Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Redirect Clicked</span>
                          <span className="text-xs font-semibold text-black block mt-0.5">
                            {rev.googleCtaClicked ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Redirect Viewed</span>
                          <span className="text-xs font-semibold text-black block mt-0.5">
                            {rev.googleCtaViewed ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Callback Required</span>
                          <span className="text-xs font-semibold text-black block mt-0.5">
                            {rev.requestCallback ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Internal ID</span>
                          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
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
