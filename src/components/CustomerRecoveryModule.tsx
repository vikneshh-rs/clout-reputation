import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  MessageCircle, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Phone, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  AlertCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
  review: {
    id: string;
    rating: number;
    comment?: string | null;
  };
  resolvedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface CustomerRecoveryModuleProps {
  businessId?: string;
  readOnly?: boolean;
}

export default function CustomerRecoveryModule({ businessId, readOnly = false }: CustomerRecoveryModuleProps) {
  const { user } = useAuth();
  const isRep = user?.role === 'REP';
  const effectiveReadOnly = readOnly || isRep;

  const [tickets, setTickets] = useState<RecoveryRequest[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer Details State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<RecoveryRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusInput, setStatusInput] = useState<RecoveryRequest['status']>('NEW');
  const [notesInput, setNotesInput] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (businessId) params.append('businessId', businessId);

      const res = await fetch(`/api/business/recovery?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.list || []);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch recovery requests.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching recovery tickets.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const params = new URLSearchParams();
      if (businessId) params.append('businessId', businessId);
      const res = await fetch(`/api/business/analytics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchTickets();
    });
  }, [statusFilter, priorityFilter, businessId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAnalytics();
    });
  }, [businessId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  // Fetch Ticket Details for Drawer
  const loadTicketDetails = async (id: string) => {
    try {
      setDetailLoading(true);
      setUpdateError('');
      const res = await fetch(`/api/business/recovery?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.details);
        setStatusInput(data.details.status);
        setNotesInput(data.details.internalNotes || '');
      }
    } catch (err) {
      console.error('Error loading ticket details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openDrawer = (id: string) => {
    setSelectedTicketId(id);
    loadTicketDetails(id);
  };

  const closeDrawer = () => {
    setSelectedTicketId(null);
    setSelectedTicket(null);
  };

  // Update Ticket
  const handleUpdateTicket = async () => {
    if (effectiveReadOnly || !selectedTicket) return;
    try {
      setUpdatingTicket(true);
      setUpdateError('');
      const res = await fetch('/api/business/recovery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          status: statusInput,
          internalNotes: notesInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh ticket details & list
        setSelectedTicket(data.updated);
        setStatusInput(data.updated.status);
        setNotesInput(data.updated.internalNotes || '');
        fetchTickets();
        fetchAnalytics();
      } else {
        const err = await res.json();
        setUpdateError(err.error || 'Failed to update ticket.');
      }
    } catch (err) {
      setUpdateError('Network error updating ticket.');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Funnel calculations helper
  const getFunnelConversion = (stage1: number, stage2: number) => {
    if (stage1 === 0) return '0%';
    return `${Math.round((stage2 / stage1) * 100)}%`;
  };

  // Cleanup phone number for WhatsApp wa.me link
  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    return phoneStr.replace(/\D/g, '');
  };

  return (
    <div className="space-y-8 font-sans animate-fadeIn">
      {/* 1. Dashboard Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI: Total Requests */}
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden hover:shadow-[0_12px_30px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 transition-all duration-300">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Recovery Tickets</span>
          {analyticsLoading ? (
            <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-2" />
          ) : (
            <h3 className="text-2xl font-extrabold mt-2 text-slate-900 tracking-tight">{analytics?.recoveryRequestsCount || 0}</h3>
          )}
          <span className="block text-[10px] text-slate-450 mt-1.5 font-medium">Captured rating &lt; 4 reviews</span>
        </div>

        {/* KPI: Open Tickets */}
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden hover:shadow-[0_12px_30px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 transition-all duration-300">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Open Cases</span>
          {analyticsLoading ? (
            <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-2" />
          ) : (
            <h3 className="text-2xl font-extrabold mt-2 text-amber-600 tracking-tight">{analytics?.openRecoveryRequests || 0}</h3>
          )}
          <span className="block text-[10px] text-slate-455 mt-1.5 font-medium">Pending and In-contact status</span>
        </div>

        {/* KPI: Resolved Tickets */}
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden hover:shadow-[0_12px_30px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 transition-all duration-300">
          <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Resolved Cases</span>
          {analyticsLoading ? (
            <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-2" />
          ) : (
            <h3 className="text-2xl font-extrabold mt-2 text-emerald-600 tracking-tight">{analytics?.resolvedRecoveryRequests || 0}</h3>
          )}
          <span className="block text-[10px] text-slate-455 mt-1.5 font-medium">Customer issues resolved</span>
        </div>

        {/* KPI: Resolution Rate */}
        <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden hover:shadow-[0_12px_30px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Resolution Rate</span>
            {analyticsLoading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-2" />
            ) : (
              <h3 className="text-2xl font-extrabold mt-2 text-blue-650 tracking-tight">{analytics?.resolutionRate || 0.0}%</h3>
            )}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#073afe] h-full rounded-full" style={{ width: `${analytics?.resolutionRate || 0}%` }} />
          </div>
        </div>
      </div>

      {/* 2. Funnel & Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Review Funnel Visualization */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp size={14} className="text-[#073afe]" />
              Review Funnel Conversion
            </h3>
            <p className="text-[11px] text-slate-450 mt-0.5">Scans resulting in reviews and search redirection</p>
          </div>

          {analyticsLoading ? (
            <div className="space-y-4 py-8 animate-fadeIn">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3.5 my-2">
              {/* Funnel Level 1: Scans */}
              <div className="relative animate-fadeIn">
                <div className="flex justify-between items-center bg-slate-50/55 border border-slate-100/50 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">1</span>
                    <span className="text-xs font-semibold text-slate-700">QR Scans</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{analytics?.funnel?.scans || 0}</span>
                </div>
              </div>

              {/* Conversion Arrow 1 */}
              <div className="flex justify-between items-center px-6 py-0.5 text-[10px] text-slate-400 font-bold">
                <div className="flex items-center gap-1">
                  <ArrowRight size={10} className="rotate-90" />
                  <span>Start Rate</span>
                </div>
                <span className="font-mono">{getFunnelConversion(analytics?.funnel?.scans || 0, analytics?.funnel?.starts || 0)}</span>
              </div>

              {/* Funnel Level 2: Starts */}
              <div className="relative">
                <div className="flex justify-between items-center bg-indigo-50/30 border border-indigo-100/40 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
                    <span className="text-xs font-semibold text-slate-700">Review Started</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{analytics?.funnel?.starts || 0}</span>
                </div>
              </div>

              {/* Conversion Arrow 2 */}
              <div className="flex justify-between items-center px-6 py-0.5 text-[10px] text-slate-400 font-bold">
                <div className="flex items-center gap-1">
                  <ArrowRight size={10} className="rotate-90" />
                  <span>Submission Rate</span>
                </div>
                <span className="font-mono">{getFunnelConversion(analytics?.funnel?.starts || 0, analytics?.funnel?.submits || 0)}</span>
              </div>

              {/* Funnel Level 3: Submits */}
              <div className="relative">
                <div className="flex justify-between items-center bg-blue-50/30 border border-blue-100/40 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
                    <span className="text-xs font-semibold text-slate-700">Review Submitted</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{analytics?.funnel?.submits || 0}</span>
                </div>
              </div>

              {/* Conversion Arrow 3 */}
              <div className="flex justify-between items-center px-6 py-0.5 text-[10px] text-slate-400 font-bold">
                <div className="flex items-center gap-1">
                  <ArrowRight size={10} className="rotate-90" />
                  <span>Google Redirect Rate</span>
                </div>
                <span className="font-mono">{getFunnelConversion(analytics?.funnel?.submits || 0, analytics?.funnel?.redirects || 0)}</span>
              </div>

              {/* Funnel Level 4: Redirects */}
              <div className="relative">
                <div className="flex justify-between items-center bg-emerald-50/30 border border-emerald-100/40 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">4</span>
                    <span className="text-xs font-semibold text-slate-700">Google Redirects</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{analytics?.funnel?.redirects || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Intelligence Themes */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider mb-0.5">
              <Sparkles size={14} className="text-indigo-650" />
              Reputation Intelligence
            </h3>
            <p className="text-[11px] text-slate-450">Sentiment frequencies categorized from customer feedback</p>
          </div>

          {analyticsLoading ? (
            <div className="space-y-4 py-6 animate-fadeIn">
              <div className="h-20 bg-slate-100 animate-pulse rounded-xl" />
              <div className="h-20 bg-slate-100 animate-pulse rounded-xl" />
            </div>
          ) : (
            <div className="space-y-6 my-4">
              {/* Praises (>= 4 stars themes) */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-2.5 flex items-center gap-1">
                  <ThumbsUp size={11} /> Positive Praises
                </h4>
                {(!analytics?.themes?.praises || Object.keys(analytics.themes.praises).length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic font-medium pl-0.5">No praise data yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
                    {Object.entries(analytics.themes.praises)
                      .sort((a: any, b: any) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([theme, count]: any) => {
                        const total = Object.values(analytics.themes.praises).reduce((s: any, c: any) => s + c, 0) as number;
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={theme} className="text-xs">
                            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650 mb-1">
                              <span>{theme}</span>
                              <span className="font-bold text-slate-900">{count}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Complaints (< 4 stars themes) */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-2.5 flex items-center gap-1">
                  <ThumbsDown size={11} /> Negative Complaints
                </h4>
                {(!analytics?.themes?.complaints || Object.keys(analytics.themes.complaints).length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic font-medium pl-0.5">No complaint data yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
                    {Object.entries(analytics.themes.complaints)
                      .sort((a: any, b: any) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([theme, count]: any) => {
                        const total = Object.values(analytics.themes.complaints).reduce((s: any, c: any) => s + c, 0) as number;
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={theme} className="text-xs">
                            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650 mb-1">
                              <span>{theme}</span>
                              <span className="font-bold text-slate-900">{count}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Search and Filters Panel */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-end">
          {/* Search text */}
          <div className="sm:col-span-2 space-y-1.5">
            <label htmlFor="searchQuery" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Search Customers
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name or phone number..."
                className="w-full text-xs border border-slate-200 rounded-2xl bg-white pl-10 pr-4 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 font-medium transition-all h-[46px]"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="space-y-1.5">
            <label htmlFor="statusFilter" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Status Filter
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-2xl bg-white px-3.5 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 font-medium transition-all h-[46px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New (Unopened)</option>
              <option value="CONTACTED">Contacted (In Progress)</option>
              <option value="RESOLVED">Resolved (Saved)</option>
              <option value="CLOSED">Closed (Unresponsive)</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="space-y-1.5">
            <label htmlFor="priorityFilter" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Priority
            </label>
            <select
              id="priorityFilter"
              value={priorityFilter}
              onChange={(e: any) => setPriorityFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-2xl bg-white px-3.5 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 font-medium transition-all h-[46px]"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </form>
      </div>

      {/* 4. Tickets Table / Queue */}
      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-3">
            <Loader2 className="animate-spin h-8 w-8 text-[#073afe] stroke-[2.25]" />
            <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading recovery queue...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs font-semibold text-rose-500 bg-rose-50/50">
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 px-6 flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-5 border border-slate-105 shadow-sm text-slate-400">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {user?.role === 'SUPER_ADMIN' ? 'No pending customer recovery requests.' : 'No customer recovery requests yet.'}
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              {user?.role === 'SUPER_ADMIN' 
                ? 'All customer complaints across all locations have been successfully resolved.' 
                : 'Customer feedback submitted through QR codes will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4.5 px-6">Customer / Contact</th>
                  <th className="py-4.5 px-4 text-center">Stars</th>
                  <th className="py-4.5 px-4">Priority</th>
                  <th className="py-4.5 px-4">Status</th>
                  <th className="py-4.5 px-4">Callback</th>
                  <th className="py-4.5 px-4">Submission Date</th>
                  <th className="py-4.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tickets.map((t) => {
                  const dateStr = new Date(t.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-slate-50/20 transition-colors ${
                        t.status === 'NEW' ? 'font-semibold bg-slate-50/10' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900">{t.customerName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{t.whatsappNumber}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-100/50">
                          {t.rating} ★
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                          t.priority === 'HIGH' 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : t.priority === 'MEDIUM' 
                            ? 'bg-orange-50 text-orange-700 border-orange-100' 
                            : 'bg-slate-50 text-slate-650 border-slate-150'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          t.status === 'RESOLVED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : t.status === 'CONTACTED' 
                            ? 'bg-amber-50 text-amber-700 border-amber-250' 
                            : t.status === 'CLOSED'
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-rose-50 text-rose-600 border-rose-150 animate-pulse'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {t.callbackRequested ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                            Yes
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">No</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-semibold">
                        {dateStr}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openDrawer(t.id)}
                          className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-[#073afe] hover:bg-[#EFF3FF] border border-slate-100 bg-white transition-all shadow-sm cursor-pointer"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Detail Slide-over / Drawer */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
            onClick={closeDrawer}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col justify-between z-10 border-l border-slate-100 overflow-y-auto animate-slideUp">
            {detailLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="animate-spin h-8 w-8 text-[#073afe] stroke-[2.25]" />
                <span className="text-xs font-semibold">Fetching ticket details...</span>
              </div>
            ) : selectedTicket ? (
              <>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recovery Request Details</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedTicket.customerName}</h3>
                  </div>
                  <button 
                    onClick={closeDrawer}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  {/* Status & Priority tags */}
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                      selectedTicket.priority === 'HIGH' 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : selectedTicket.priority === 'MEDIUM' 
                        ? 'bg-orange-50 text-orange-700 border-orange-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      Priority: {selectedTicket.priority}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                      selectedTicket.status === 'RESOLVED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : selectedTicket.status === 'CONTACTED' 
                        ? 'bg-amber-50 text-amber-700 border-amber-255' 
                        : selectedTicket.status === 'CLOSED'
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : 'bg-rose-50 text-rose-600 border-rose-150 animate-pulse'
                    }`}>
                      Status: {selectedTicket.status}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[20px] space-y-3.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Info</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-medium">Contact Number</span>
                        <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{selectedTicket.whatsappNumber}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-medium">Submission Date</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                          {new Date(selectedTicket.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-medium">Callback Requested</span>
                        <span className={`text-xs font-bold mt-0.5 block ${selectedTicket.callbackRequested ? 'text-rose-600' : 'text-slate-500'}`}>
                          {selectedTicket.callbackRequested ? 'Yes (Requested)' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-medium">Business Portal</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block">{selectedTicket.business?.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating & Comment */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Star Rating & Feedback</h4>
                    <div className="flex items-center gap-1 text-amber-500 text-sm pl-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < selectedTicket.rating ? 'text-amber-500' : 'text-slate-200'}>
                          ★
                        </span>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-1.5">({selectedTicket.rating} Stars)</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 italic leading-relaxed">
                      &quot;{selectedTicket.feedback || 'No comment provided by customer'}&quot;
                    </div>
                  </div>

                  {/* Resolution Logs / Audit accountability */}
                  {selectedTicket.status === 'RESOLVED' && (
                    <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-4 rounded-2xl text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Ticket Resolved Successfully</span>
                      </div>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Resolved by <span className="font-bold text-emerald-700">{selectedTicket.resolvedBy?.name || 'Administrator'}</span> ({selectedTicket.resolvedBy?.email}) on{' '}
                        <span className="font-bold">
                          {selectedTicket.resolvedAt ? new Date(selectedTicket.resolvedAt).toLocaleString() : new Date().toLocaleString()}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Instant Outreach Actions */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instant Customer Outreach</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <a
                        href={`tel:${selectedTicket.whatsappNumber}`}
                        className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl shadow-sm transition-all h-[46px]"
                      >
                        <PhoneCall size={14} className="text-slate-500" />
                        Call Customer
                      </a>
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(selectedTicket.whatsappNumber)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20ba56] text-white text-xs font-bold rounded-2xl shadow-sm transition-all h-[46px]"
                      >
                        <MessageCircle size={14} />
                        Chat on WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Internal status and notes editor */}
                  <div className="space-y-4 border-t border-slate-100 pt-5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolve & Audit Ticket</h4>

                    {updateError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl flex items-center gap-1.5 font-medium">
                        <AlertCircle size={14} className="text-rose-500" />
                        <span>{updateError}</span>
                      </div>
                    )}

                    {effectiveReadOnly ? (
                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] text-slate-400 mb-1">Status</span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border bg-slate-50 text-slate-600 border-slate-200">
                            {selectedTicket.status} (Read-Only)
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 mb-1">Internal Notes</span>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-650 italic leading-relaxed">
                            {selectedTicket.internalNotes || 'No internal notes saved.'}
                          </div>
                        </div>
                        <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] font-semibold text-amber-700 leading-relaxed">
                          Representatives are restricted to read-only views and cannot alter ticket statuses or internal notes.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Status Select */}
                        <div className="space-y-1.5">
                          <label htmlFor="ticketStatus" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Update Status
                          </label>
                          <select
                            id="ticketStatus"
                            value={statusInput}
                            onChange={(e: any) => setStatusInput(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-2xl bg-white px-3.5 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 transition-all font-semibold text-slate-800 h-[46px]"
                          >
                            <option value="NEW">New (Requires Callback)</option>
                            <option value="CONTACTED">Contacted (In Progress)</option>
                            <option value="RESOLVED">Resolved (Resolved & Logged)</option>
                            <option value="CLOSED">Closed (Archived Case)</option>
                          </select>
                        </div>

                        {/* Notes input */}
                        <div className="space-y-1.5">
                          <label htmlFor="ticketNotes" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Internal Resolution Notes
                          </label>
                          <textarea
                            id="ticketNotes"
                            rows={3}
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Describe how the customer issue was resolved or notes on correspondence..."
                            className="w-full text-xs border border-slate-200 rounded-2xl bg-white px-4 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 transition-all font-medium text-slate-800 placeholder:text-slate-400 leading-relaxed"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleUpdateTicket}
                          disabled={updatingTicket}
                          className="w-full bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-bold py-3 px-4 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 h-[46px]"
                        >
                          {updatingTicket ? (
                            <>
                              <Loader2 className="animate-spin h-3.5 w-3.5" />
                              <span>Saving Audit...</span>
                            </>
                          ) : (
                            <span>Save Changes & Audit</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
