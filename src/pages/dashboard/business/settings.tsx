import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Store, Phone, MapPin, Globe, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface BusinessDetails {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  googleReviewUrl: string | null;
  enableGoogleReviewRedirect: boolean;
  enableManagerCallback: boolean;
}

export default function BusinessSettings(props: any) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const isReadOnly = router.query.readOnly === 'true';
  const businessId = router.query.businessId as string;
  
  const [details, setDetails] = useState<BusinessDetails | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [enableGoogleReviewRedirect, setEnableGoogleReviewRedirect] = useState(true);
  const [enableManagerCallback, setEnableManagerCallback] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { theme, toggleTheme } = props;

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (user?.role === 'SUPER_ADMIN' && businessId) {
        queryParams.append('businessId', businessId);
      }

      const res = await fetch(`/api/business/details?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const biz = data.business;
        setDetails(biz);
        setName(biz.name || '');
        setPhone(biz.phone || '');
        setAddress(biz.address || '');
        setGoogleReviewUrl(biz.googleReviewUrl || '');
        setEnableGoogleReviewRedirect(biz.enableGoogleReviewRedirect ?? true);
        setEnableManagerCallback(biz.enableManagerCallback ?? true);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch business details.');
      }
    } catch (err) {
      setError('Network error fetching business details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'BUSINESS' || (user.role === 'SUPER_ADMIN' && isReadOnly))) {
      fetchBusinessDetails();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setError('');
    setSuccess('');
    setSaving(true);

    if (!name.trim()) {
      setError('Business name is required.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/business/details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          googleReviewUrl: googleReviewUrl.trim() || null,
          enableGoogleReviewRedirect,
          enableManagerCallback
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDetails(data.business);
        setSuccess('Business profile settings updated successfully.');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to update business details.');
      }
    } catch (err) {
      setError('Network error updating business details.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
      </div>
    );
  }

  const isAllowed = user && (user.role === 'BUSINESS' || (user.role === 'SUPER_ADMIN' && isReadOnly));
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">Business owner credentials required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Business Settings" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Settings - Clout Reputation</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/20">
            <h3 className="text-lg font-bold font-sans tracking-tight text-slate-900">Profile &amp; Settings</h3>
            <p className="text-xs text-slate-500 mt-1">Configure your business details, contact information, and review redirection workflows.</p>
          </div>

          {/* Form */}
          <div className="p-6">
            {error && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
                <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-xs flex items-start">
                <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-[#1857D6]" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="business-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Business Name (Login Identifier)
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="business-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full text-xs border border-slate-200 rounded-xl bg-white pl-10 pr-3 py-2 focus:border-[#1857D6] focus:outline-none focus:ring-2 focus:ring-[#1857D6]/10 disabled:bg-slate-50 disabled:text-slate-400"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Careful: Business Name is the unique ID you use to log into your dashboard.
                  </p>
                </div>

                {/* Slug display */}
                {details && typeof window !== 'undefined' && (
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Public Review Link Slug
                    </span>
                    <div className="mt-1 flex items-center bg-slate-50/50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono">
                      <Globe size={14} className="text-slate-400 mr-2" />
                      <span>{window.location.origin}/r/{details.slug}</span>
                    </div>
                  </div>
                )}

                {/* Google Review Url */}
                <div>
                  <label htmlFor="google-url" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Google Review URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="google-url"
                      type="url"
                      value={googleReviewUrl}
                      onChange={(e) => setGoogleReviewUrl(e.target.value)}
                      disabled={isReadOnly}
                      placeholder="https://search.google.com/local/writereview?placeid=..."
                      className="w-full text-xs border border-slate-200 rounded-xl bg-white pl-10 pr-3 py-2 focus:border-[#1857D6] focus:outline-none focus:ring-2 focus:ring-[#1857D6]/10 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Customers leaving 4 or 5 stars will be prompted to post to this link.
                  </p>
                </div>

                {/* Contact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label htmlFor="business-phone" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        id="business-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isReadOnly}
                        placeholder="+1 (555) 123-4567"
                        className="w-full text-xs border border-slate-200 rounded-xl bg-white pl-10 pr-3 py-2 focus:border-[#1857D6] focus:outline-none focus:ring-2 focus:ring-[#1857D6]/10 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="business-address" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Business Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        id="business-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={isReadOnly}
                        placeholder="123 Corporate St, New York, NY"
                        className="w-full text-xs border border-slate-200 rounded-xl bg-white pl-10 pr-3 py-2 focus:border-[#1857D6] focus:outline-none focus:ring-2 focus:ring-[#1857D6]/10 disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Switch toggles */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Customer Experience Control
                  </h4>

                  {/* Google Auto-Redirect */}
                  <div className="flex items-start justify-between">
                    <div className="flex-grow pr-4">
                      <label htmlFor="toggle-redirect" className="text-sm font-semibold text-slate-900 cursor-pointer">
                        Enable Google Review Redirect
                      </label>
                      <p className="text-[10px] text-slate-500">
                        When enabled, 4-5 stars ratings immediately show the &quot;Post on Google&quot; call-to-action button, which forwards them directly.
                      </p>
                    </div>
                    <input
                      id="toggle-redirect"
                      type="checkbox"
                      checked={enableGoogleReviewRedirect}
                      onChange={(e) => setEnableGoogleReviewRedirect(e.target.checked)}
                      disabled={isReadOnly}
                      className="h-4 w-4 text-[#1857D6] focus:ring-[#1857D6] border-slate-300 rounded mt-1 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  {/* Manager Callback Request */}
                  <div className="flex items-start justify-between">
                    <div className="flex-grow pr-4">
                      <label htmlFor="toggle-callback" className="text-sm font-semibold text-slate-900 cursor-pointer">
                        Enable Callback Request Form
                      </label>
                      <p className="text-[10px] text-slate-500">
                        When enabled, customers rating 1-3 stars are shown a contact form to request an direct manager callback and recovery.
                      </p>
                    </div>
                    <input
                      id="toggle-callback"
                      type="checkbox"
                      checked={enableManagerCallback}
                      onChange={(e) => setEnableManagerCallback(e.target.checked)}
                      disabled={isReadOnly}
                      className="h-4 w-4 text-[#1857D6] focus:ring-[#1857D6] border-slate-300 rounded mt-1 cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  {isReadOnly ? (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                      Read-Only Mode
                    </span>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 bg-[#1857D6] hover:bg-[#154fc4] text-white text-sm font-semibold rounded-xl px-6 py-2.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
