import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  PhoneCall, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  MessageSquare,
  Star,
  Check
} from 'lucide-react';

interface CallbackRequest {
  id: string;
  reviewId: string;
  customerName: string;
  phoneNumber: string;
  status: 'PENDING' | 'CONTACTED' | 'RESOLVED';
  createdAt: string;
  review: {
    rating: number;
    comment: string | null;
    createdAt: string;
  };
}

export default function CallbackRequests(props: any) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  const isReadOnly = router.query.readOnly === 'true';
  const businessId = router.query.businessId as string;

  const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Action loading state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCallbacks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (user?.role === 'SUPER_ADMIN' && businessId) {
        queryParams.append('businessId', businessId);
      }

      const res = await fetch(`/api/business/callbacks?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCallbacks(data.callbacks || []);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch callback requests.');
      }
    } catch (err) {
      setError('Network error fetching callback requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'BUSINESS' || (user.role === 'SUPER_ADMIN' && isReadOnly))) {
      fetchCallbacks();
    }
  }, [user, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCallbacks();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (isReadOnly) return;
    try {
      setActionLoadingId(id);
      const res = await fetch('/api/business/callbacks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });

      if (res.ok) {
        // Update local state without full refetch
        setCallbacks(prev => 
          prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c)
        );
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Network error updating callback status.');
    } finally {
      setActionLoadingId(null);
    }
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

  // Aggregate metrics locally
  const pendingRequests = callbacks.filter(c => c.status === 'PENDING').length;
  const contactedRequests = callbacks.filter(c => c.status === 'CONTACTED').length;
  const resolvedRequests = callbacks.filter(c => c.status === 'RESOLVED').length;

  return (
    <DashboardLayout title="Callbacks Recovery" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Callbacks Dashboard - Cloutation</title>
      </Head>

      <div className="mb-6 animate-fadeIn">
        <h2 className="text-xl font-bold font-sans text-slate-900">Loyalty Recovery</h2>
        <p className="text-xs text-slate-450 mt-0.5">Contact unsatisfied clients who requested a follow-up to address issues and retain business.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2.5 font-medium animate-fadeIn">
          <AlertCircle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8 animate-fadeIn">
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden hover:shadow-[0_12px_30px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 transition-all duration-300">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Pending Cases</span>
          <h3 className="text-3xl font-extrabold mt-2 text-rose-600 tracking-tight">{pendingRequests}</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden hover:shadow-[0_12px_30px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 transition-all duration-300">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Contacted Cases</span>
          <h3 className="text-3xl font-extrabold mt-2 text-amber-600 tracking-tight">{contactedRequests}</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden hover:shadow-[0_12px_30px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 transition-all duration-300">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Resolved Cases</span>
          <h3 className="text-3xl font-extrabold mt-2 text-emerald-600 tracking-tight">{resolvedRequests}</h3>
        </div>
      </div>

      {/* Search Filter Panel */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] mb-8 animate-fadeIn">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-grow w-full space-y-1.5">
            <label htmlFor="search-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Search Contact Info
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, review comment..."
                className="w-full text-xs border border-slate-200 rounded-2xl bg-white pl-10 pr-4 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 font-medium transition-all h-[46px]"
              />
            </div>
          </div>

          <div className="w-full md:w-56 space-y-1.5">
            <label htmlFor="status-filter" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Case Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-2xl bg-white px-3.5 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 font-medium transition-all h-[46px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending (Needs Action)</option>
              <option value="CONTACTED">Contacted (In Progress)</option>
              <option value="RESOLVED">Resolved (Complete)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-bold px-6 py-3 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer justify-center h-[46px] shadow-sm flex-shrink-0"
          >
            <Search size={14} />
            <span>Apply Filters</span>
          </button>
        </form>
      </div>

      {/* Callback cases list */}
      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-[#073afe] stroke-[2.25]" />
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Retrieving callback requests...</p>
        </div>
      ) : callbacks.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-16 text-center text-slate-400 text-xs font-semibold">
          No callback requests found matching current filters.
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {callbacks.map((item) => {
            const dateStr = new Date(item.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.03)] hover:border-slate-200 transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-3.5 flex-grow">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-sm font-bold text-slate-900">{item.customerName}</h4>
                    <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      {item.phoneNumber}
                    </span>
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${
                      item.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : item.status === 'CONTACTED'
                        ? 'bg-amber-50 text-amber-700 border-amber-250'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-amber-500 pl-0.5">
                    <span className="font-bold text-slate-400 mr-2 text-[10px] uppercase">Rating:</span>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < item.review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 italic leading-relaxed shadow-[0_2px_8px_rgba(15,23,42,0.01)]">
                    <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wider mb-1.5 not-italic">
                      Customer Comment
                    </span>
                    "{item.review.comment || 'No comment text provided'}"
                  </p>

                  <span className="block text-[10px] text-slate-400 pl-0.5 font-medium">Requested: {dateStr}</span>
                </div>

                {/* Action buttons */}
                {isReadOnly ? (
                  <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                    Read-Only Mode
                  </span>
                ) : (
                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto justify-end flex-shrink-0">
                    {item.status !== 'CONTACTED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'CONTACTED')}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-amber-200 rounded-2xl hover:bg-amber-50 text-amber-705 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer h-[40px] shadow-sm flex-1 md:flex-initial"
                      >
                        Mark Contacted
                      </button>
                    )}
                    {item.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-[#073afe] hover:bg-[#052ecb] text-white font-bold text-xs rounded-2xl transition-all disabled:opacity-50 cursor-pointer h-[40px] shadow-sm flex-1 md:flex-initial"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {item.status !== 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'PENDING')}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer h-[40px] shadow-sm flex-1 md:flex-initial"
                      >
                        Reset to Pending
                      </button>
                    )}
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
