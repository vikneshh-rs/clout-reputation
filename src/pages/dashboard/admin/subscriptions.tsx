import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Clock, 
  Search, 
  Sliders, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Play,
  StopCircle
} from 'lucide-react';

interface Subscription {
  id: string;
  businessId: string;
  plan: 'TRIAL' | 'BASIC' | 'PRO';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  createdAt: string;
  business: {
    name: string;
  } | null;
}

export default function SubscriptionsManagementPage(props: any) {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  // Form State
  const [plan, setPlan] = useState<'TRIAL' | 'BASIC' | 'PRO'>('TRIAL');
  const [action, setAction] = useState<'upgrade' | 'downgrade' | 'extend' | 'expire' | 'activate'>('upgrade');
  const [months, setMonths] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/super-admin/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      } else {
        setError('Failed to fetch subscription details.');
      }
    } catch (err) {
      setError('Network error fetching subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchSubscriptions();
    }
  }, [user]);

  const openManageModal = (sub: Subscription) => {
    setSelectedSub(sub);
    setPlan(sub.plan);
    // Suggest logical actions
    setAction(sub.status === 'EXPIRED' || sub.status === 'CANCELLED' ? 'activate' : 'extend');
    setMonths(1);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    setError('');

    if (!selectedSub) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/super-admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedSub.businessId,
          plan,
          action,
          months
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Subscription for "${selectedSub.business?.name || 'Business'}" updated successfully.`);
        setIsModalOpen(false);
        fetchSubscriptions();
      } else {
        setFormError(data.error || 'Failed to update subscription.');
      }
    } catch (err) {
      setFormError('Network error updating subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const bizName = sub.business?.name || '';
    const matchesSearch = bizName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-['Source_Sans_Pro']">
        <Loader2 className="animate-spin h-8 w-8 text-[#1853AB]" />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-['Source_Sans_Pro']">
        <AlertTriangle className="h-12 w-12 text-red-650 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-zinc-500 text-sm mt-1">Super Admin permissions required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Client Subscriptions" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Subscriptions Management - Clout Reputation</title>
        
      </Head>

      <div className="mb-6">
        <p className="text-xs text-zinc-500 mt-0.5">Manage subscription tiers, extend end dates, or cancel access for client portals.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
          <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-xs flex items-start">
          <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Subscription List Card */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {/* Table Toolbar */}
        <div className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-[#1853AB]" />
            <h4 className="font-bold text-xs text-black uppercase tracking-wider">Business Subscriptions</h4>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:flex-grow-0">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search size={12} className="text-zinc-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business name"
                className="pl-8 pr-3 py-1.5 w-full sm:w-52 text-xs border border-slate-200 rounded-xl bg-white focus:border-[#1853AB] focus:outline-none focus:ring-2 focus:ring-[#1853AB]/10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl bg-white px-2.5 py-1.5 focus:border-[#1853AB] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Directory List Table */}
        <div className="overflow-x-auto">
          {loading && subscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-6 w-6 text-[#1853AB] mx-auto mb-2" />
              <span className="text-xs text-zinc-450">Loading subscriptions...</span>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              No subscriptions found.
            </div>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Business Name</th>
                  <th className="px-6 py-3">Subscription Tier</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-black">
                      {sub.business?.name || <span className="text-zinc-350 italic">Unknown</span>}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.plan === 'PRO' 
                          ? 'bg-indigo-50 text-indigo-750 border border-indigo-150'
                          : sub.plan === 'BASIC'
                          ? 'bg-blue-50 text-blue-750 border border-blue-150'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sub.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-zinc-500">
                      {new Date(sub.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-zinc-750 font-medium">
                      {new Date(sub.endDate).toLocaleDateString()}
                      {new Date(sub.endDate).getTime() < Date.now() && sub.status === 'ACTIVE' && (
                        <span className="block text-[8px] text-red-550 font-semibold mt-0.5">Overdue / Expired</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => openManageModal(sub)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-[#1853AB] font-semibold text-[10px] transition-colors"
                        title="Manage plan tier and period limits"
                      >
                        <Sliders size={10} />
                        <span>Manage Subscription</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manage Subscription Modal */}
      {isModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-[0px_25px_60px_rgba(15,23,42,0.15)] max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-['Source_Sans_Pro']">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-black flex flex-col">
                <span>Manage Subscription</span>
                <span className="text-[10px] text-zinc-400 font-normal mt-0.5">Business: {selectedSub.business?.name}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-zinc-200 rounded text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubscriptionSubmit}>
              <div className="p-6 space-y-4 text-xs">
                {formError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 font-semibold text-[11px]">
                    {formError}
                  </div>
                )}

                {/* Plan Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Target Plan Tier</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl bg-white px-2.5 py-1.5 focus:border-[#1853AB] focus:outline-none font-medium text-black"
                  >
                    <option value="TRIAL">TRIAL Tier (30 days default)</option>
                    <option value="BASIC">BASIC Tier (180 days default)</option>
                    <option value="PRO">PRO Tier (365 days default)</option>
                  </select>
                </div>

                {/* Action Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Select Update Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'upgrade', label: 'Upgrade Plan', icon: TrendingUp },
                      { value: 'downgrade', label: 'Downgrade Plan', icon: TrendingDown },
                      { value: 'extend', label: 'Extend End Date', icon: CalendarDays },
                      { value: 'expire', label: 'Expire Sub', icon: StopCircle },
                      { value: 'activate', label: 'Activate Sub', icon: Play }
                    ].map((actOpt) => {
                      const Icon = actOpt.icon;
                      const active = action === actOpt.value;
                      return (
                        <button
                          key={actOpt.value}
                          type="button"
                          onClick={() => setAction(actOpt.value as any)}
                          className={`p-2 border rounded font-semibold text-[10px] flex items-center gap-1.5 transition-colors ${
                            active
                              ? 'bg-blue-50 border-[#1853AB] text-[#1853AB]'
                              : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                          }`}
                        >
                          <Icon size={12} />
                          {actOpt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Months input for 'extend' action */}
                {action === 'extend' && (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Months to Extend By</label>
                    <input
                      type="number"
                      value={months}
                      onChange={(e) => setMonths(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max="36"
                      className="w-full text-xs border border-slate-200 rounded-xl bg-white px-3 py-2 focus:border-[#1853AB] focus:outline-none focus:ring-2 focus:ring-[#1853AB]/10"
                      required
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Adds specified number of months to the current subscription end date.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-[#1853AB] font-semibold text-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1853AB] hover:bg-[#134289] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {submitting && <Loader2 className="animate-spin h-3.5 w-3.5" />}
                  <span>Apply Action</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
