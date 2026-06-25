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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1853AB]" />
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
        <title>Callbacks Dashboard - Clout Reputation</title>
      </Head>

      <div className="mb-6">
        <h2 className="text-xl font-bold font-['Source_Sans_Pro'] text-black">Loyalty Recovery</h2>
        <p className="text-xs text-gray-500 mt-0.5">Contact unsatisfied clients who requested a follow-up to address issues and retain business.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
          <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Pending Cases</span>
          <h3 className="text-3xl font-bold mt-2 text-rose-600">{pendingRequests}</h3>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Contacted Cases</span>
          <h3 className="text-3xl font-bold mt-2 text-amber-600">{contactedRequests}</h3>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Resolved Cases</span>
          <h3 className="text-3xl font-bold mt-2 text-emerald-600">{resolvedRequests}</h3>
        </div>
      </div>

      {/* Search Filter Panel */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow w-full">
            <label htmlFor="search-input" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Search Contact Info
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, review comment..."
                className="w-full text-xs border border-slate-200 rounded-xl bg-white pl-9 pr-4 py-2 focus:border-[#1853AB] focus:outline-none focus:ring-2 focus:ring-[#1853AB]/10"
              />
            </div>
          </div>

          <div className="w-full md:w-56">
            <label htmlFor="status-filter" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Case Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl bg-white px-2.5 py-1.5 focus:border-[#1853AB] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending (Needs Action)</option>
              <option value="CONTACTED">Contacted (In Progress)</option>
              <option value="RESOLVED">Resolved (Complete)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto bg-[#1853AB] hover:bg-[#134289] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer justify-center"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Callback cases list */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#1853AB]" />
        </div>
      ) : callbacks.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-12 text-center text-slate-400 text-sm">
          No callback requests found matching current filters.
        </div>
      ) : (
        <div className="space-y-4">
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
                className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-2 flex-grow">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-sm font-bold text-black">{item.customerName}</h4>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.phoneNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      item.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                        : item.status === 'CONTACTED'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-amber-500">
                    <span className="font-semibold text-slate-500 mr-1">Rating:</span>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < item.review.rating ? 'fill-amber-500' : 'text-slate-200'}
                      />
                    ))}
                  </div>

                  <p className="text-sm text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider mb-1">
                      Customer Comment
                    </span>
                    "{item.review.comment || 'No comment text provided'}"
                  </p>

                  <span className="block text-[10px] text-slate-400">Requested: {dateStr}</span>
                </div>

                {/* Action buttons */}
                {isReadOnly ? (
                  <span className="text-xs font-semibold text-zinc-400 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded">
                    Read-Only
                  </span>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {item.status !== 'CONTACTED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'CONTACTED')}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 text-amber-700 font-semibold text-[10px] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Mark Contacted
                      </button>
                    )}
                    {item.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                        disabled={actionLoadingId === item.id}
                        className="bg-[#1853AB] hover:bg-[#134289] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer justify-center"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {item.status !== 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'PENDING')}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-semibold text-[10px] transition-colors disabled:opacity-50 cursor-pointer"
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
