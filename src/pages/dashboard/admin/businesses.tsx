import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Store, 
  Plus, 
  Search, 
  ExternalLink, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  X,
  MapPin,
  Phone,
  Settings,
  Calendar,
  Lock
} from 'lucide-react';

interface Subscription {
  id: string;
  plan: 'TRIAL' | 'BASIC' | 'PRO';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  endDate: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  businessCode: string;
  industry: 'RESTAURANT' | 'CAFE' | 'SALON' | 'RESORT' | 'HOTEL' | 'CLINIC' | 'GYM' | 'SPA' | 'RETAIL_STORE' | 'OTHER';
  phone: string | null;
  address: string | null;
  googleReviewUrl: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  createdAt: string;
  createdByRep: {
    id: string;
    name: string;
  } | null;
  subscriptions?: Subscription[];
}

export default function BusinessesManagementPage(props: any) {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  // State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Onboarding Form State
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    industry: 'RESTAURANT',
    phone: '',
    address: '',
    plan: 'TRIAL',
    googleReviewUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/super-admin/businesses');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
      } else {
        setError('Failed to fetch businesses.');
      }
    } catch (err) {
      setError('Network error fetching businesses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchBusinesses();
    }
  }, [user]);

  const openOnboardModal = () => {
    setFormData({
      name: '',
      password: '',
      industry: 'RESTAURANT',
      phone: '',
      address: '',
      plan: 'TRIAL',
      googleReviewUrl: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    setError('');

    if (!formData.name.trim()) {
      setFormError('Business name is required.');
      return;
    }
    if (!formData.password.trim()) {
      setFormError('Password is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/super-admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Business "${formData.name}" onboarded successfully.`);
        setIsModalOpen(false);
        fetchBusinesses();
      } else {
        setFormError(data.error || 'Failed to onboard business.');
      }
    } catch (err) {
      setFormError('Network error onboarding business.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (biz: Business) => {
    setSuccess('');
    setError('');

    const nextStatus = biz.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg = nextStatus === 'SUSPENDED'
      ? `Are you sure you want to suspend "${biz.name}"? They will be blocked from logging in and collecting customer reviews.`
      : `Are you sure you want to activate "${biz.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/super-admin/businesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          id: biz.id,
          status: nextStatus
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Business "${biz.name}" status updated to ${nextStatus}.`);
        fetchBusinesses();
      } else {
        setError(data.error || 'Failed to update status.');
      }
    } catch (err) {
      setError('Network error updating business status.');
    }
  };

  const filteredBusinesses = businesses.filter((biz) => {
    // 1. Search Query (name or code)
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      biz.name.toLowerCase().includes(query) ||
      biz.businessCode.toLowerCase().includes(query);

    // 2. Industry Filter
    const matchesIndustry = 
      industryFilter === 'ALL' || biz.industry === industryFilter;

    // 3. Status Filter
    const matchesStatus = 
      statusFilter === 'ALL' || biz.status === statusFilter;

    return matchesSearch && matchesIndustry && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-['Source_Sans_Pro']">
        <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
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
    <DashboardLayout title="Businesses & Onboarding" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Businesses Management - Clout Reputation</title>
        
      </Head>

      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <p className="text-xs text-zinc-500 mt-0.5">Onboard new client businesses, activate or suspend access, and inspect metrics.</p>
        <button
          onClick={openOnboardModal}
          className="bg-[#1857D6] hover:bg-[#154fc4] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Plus size={14} />
          Onboard Business
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 text-red-750 text-xs flex items-start">
          <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-750 text-xs flex items-start">
          <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Store size={16} className="text-[#1857D6]" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-sans">Business Directory</h4>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {/* Search (Multi-field: Name/Code) */}
            <div className="relative flex-grow sm:flex-grow-0">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search size={12} className="text-zinc-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or code (e.g. CR-001)"
                className="pl-8 pr-3 py-1.5 w-full sm:w-60 text-xs border border-zinc-250 rounded bg-white focus:border-[#1857D6] focus:outline-none"
              />
            </div>

            {/* Industry Filter */}
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-zinc-250 rounded bg-white focus:border-[#1857D6] focus:outline-none"
            >
              <option value="ALL">All Industries</option>
              <option value="RESTAURANT">Restaurant</option>
              <option value="CAFE">Cafe</option>
              <option value="SALON">Salon</option>
              <option value="RESORT">Resort</option>
              <option value="HOTEL">Hotel</option>
              <option value="CLINIC">Clinic</option>
              <option value="GYM">Gym</option>
              <option value="SPA">Spa</option>
              <option value="RETAIL_STORE">Retail Store</option>
              <option value="OTHER">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-zinc-250 rounded bg-white focus:border-[#1857D6] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Directory List Table */}
        <div className="overflow-x-auto">
          {loading && businesses.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-6 w-6 text-[#1857D6] mx-auto mb-2" />
              <span className="text-xs text-zinc-450">Loading businesses...</span>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              No businesses found matching criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-zinc-150 text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-400 uppercase font-bold tracking-wider text-[10px] border-b border-zinc-150">
                <tr>
                  <th className="px-6 py-3">Business</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Industry</th>
                  <th className="px-6 py-3">Subscription</th>
                  <th className="px-6 py-3">Onboarded By</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 bg-white">
                {filteredBusinesses.map((biz) => {
                  const sub = biz.subscriptions && biz.subscriptions.length > 0 ? biz.subscriptions[0] : null;
                  
                  return (
                    <tr key={biz.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-black">{biz.name}</div>
                        <div className="text-[10px] text-zinc-400 flex flex-col mt-0.5 space-y-0.5">
                          {biz.phone && (
                            <span className="flex items-center">
                              <Phone size={8} className="mr-1" /> {biz.phone}
                            </span>
                          )}
                          {biz.address && (
                            <span className="flex items-center">
                              <MapPin size={8} className="mr-1" /> {biz.address}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-zinc-650 font-medium">{biz.businessCode}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-[10px] font-semibold">
                          {biz.industry}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {sub ? (
                          <div>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              sub.plan === 'PRO' 
                                ? 'bg-indigo-50 text-indigo-750 border border-indigo-150'
                                : sub.plan === 'BASIC'
                                ? 'bg-blue-50 text-blue-750 border border-blue-150'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            }`}>
                              {sub.plan}
                            </span>
                            <span className="block text-[9px] text-zinc-400 mt-1">
                              Expires: {new Date(sub.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-350 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-zinc-500">
                        {biz.createdByRep?.name || <span className="text-zinc-350 italic">Super Admin</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          biz.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-750 border border-emerald-150'
                            : biz.status === 'SUSPENDED'
                            ? 'bg-red-50 text-red-750 border border-red-150'
                            : 'bg-amber-50 text-amber-700 border border-amber-250'
                        }`}>
                          {biz.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2 whitespace-nowrap">
                        {/* View Dashboard (forwarding readOnly and businessId) */}
                        <Link
                          href={`/dashboard/business?businessId=${biz.id}&readOnly=true`}
                          className="inline-flex items-center space-x-1 p-1 bg-white border border-zinc-250 rounded hover:bg-zinc-50 text-[#1857D6] font-semibold text-[10px]"
                          title="Inspect business dashboard in read-only mode"
                        >
                          <ExternalLink size={10} />
                          <span>View Dashboard</span>
                        </Link>

                        {/* Suspend / Activate Toggle */}
                        <button
                          onClick={() => handleToggleStatus(biz)}
                          className={`inline-flex items-center space-x-1 p-1 border rounded font-semibold text-[10px] ${
                            biz.status === 'ACTIVE'
                              ? 'bg-red-50 hover:bg-red-100/70 text-red-700 border-red-200'
                              : 'bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 border-emerald-200'
                          }`}
                          title={biz.status === 'ACTIVE' ? 'Suspend business access' : 'Reactivate business'}
                        >
                          <span>{biz.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Onboard Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded shadow-lg max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-150 bg-zinc-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-black flex items-center gap-1.5">
                <Store size={16} className="text-[#1857D6]" />
                Onboard Client Business
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-zinc-200 rounded text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleOnboardSubmit}>
              <div className="p-6 space-y-4 text-xs max-h-[400px] overflow-y-auto">
                {formError && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-750 font-semibold text-[11px]">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Business Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Bella Italia"
                      className="w-full p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Login Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Set access password"
                      className="w-full p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full p-2 border border-zinc-200 rounded bg-white focus:border-[#1857D6] focus:outline-none"
                    >
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="CAFE">Cafe</option>
                      <option value="SALON">Salon</option>
                      <option value="RESORT">Resort</option>
                      <option value="HOTEL">Hotel</option>
                      <option value="CLINIC">Clinic</option>
                      <option value="GYM">Gym</option>
                      <option value="SPA">Spa</option>
                      <option value="RETAIL_STORE">Retail Store</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Initial Plan</label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full p-2 border border-zinc-200 rounded bg-white focus:border-[#1857D6] focus:outline-none"
                    >
                      <option value="TRIAL">Trial (30 days)</option>
                      <option value="BASIC">Basic (180 days)</option>
                      <option value="PRO">Pro (365 days)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +1 555-0199"
                      className="w-full p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. 123 Main St, NY"
                      className="w-full p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-1">Google Review URL</label>
                  <input
                    type="url"
                    value={formData.googleReviewUrl}
                    onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="w-full p-2 border border-zinc-200 rounded focus:border-[#1857D6] focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-150 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-250 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1857D6] hover:bg-[#154fc4] text-white text-xs font-semibold rounded transition-colors flex items-center gap-1"
                >
                  {submitting && <Loader2 className="animate-spin h-3.5 w-3.5" />}
                  <span>Onboard Business</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
