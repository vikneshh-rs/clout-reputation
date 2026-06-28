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
        <Loader2 className="animate-spin h-8 w-8 text-[#073afe]" />
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
        <title>Settings - Cloutation</title>
      </Head>

      <div className="max-w-2xl mx-auto animate-fadeIn">
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/10">
            <h3 className="text-base font-bold font-sans tracking-tight text-slate-900">Profile &amp; Settings</h3>
            <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Configure your business details, contact information, and review redirection workflows.</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2.5 font-medium animate-fadeIn">
                <AlertCircle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2.5 font-medium animate-fadeIn">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {loading ? (
              <div className="py-20 flex flex-col justify-center items-center gap-3">
                <Loader2 className="animate-spin h-8 w-8 text-[#073afe] stroke-[2.25]" />
                <p className="text-xs text-slate-500 font-semibold tracking-wide">Fetching configuration...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="business-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Business Name (Login Identifier)
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="business-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full text-xs border border-slate-200 rounded-2xl bg-white pl-10 pr-4 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 transition-all font-medium disabled:bg-slate-50 disabled:text-slate-400 h-[46px]"
                      required
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal pl-0.5">
                    Careful: Business Name is the unique ID you use to log into your dashboard.
                  </p>
                </div>

                {/* Slug display */}
                {details && typeof window !== 'undefined' && (
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Public Review Link Slug
                    </span>
                    <div className="flex items-center bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3 text-xs text-slate-650 font-mono select-all">
                      <Globe size={14} className="text-slate-400 mr-2.5 flex-shrink-0" />
                      <span className="truncate">{window.location.origin}/r/{details.slug}</span>
                    </div>
                  </div>
                )}

                {/* Google Review Url */}
                <div className="space-y-1.5">
                  <label htmlFor="google-url" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Google Review URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="google-url"
                      type="url"
                      value={googleReviewUrl}
                      onChange={(e) => setGoogleReviewUrl(e.target.value)}
                      disabled={isReadOnly}
                      placeholder="https://search.google.com/local/writereview?placeid=..."
                      className="w-full text-xs border border-slate-200 rounded-2xl bg-white pl-10 pr-4 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 transition-all font-medium disabled:bg-slate-50 disabled:text-slate-400 h-[46px]"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal pl-0.5">
                    Customers leaving 4 or 5 stars will be prompted to post to this link.
                  </p>
                </div>

                {/* Contact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label htmlFor="business-phone" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="business-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isReadOnly}
                        placeholder="+1 (555) 123-4567"
                        className="w-full text-xs border border-slate-200 rounded-2xl bg-white pl-10 pr-4 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 transition-all font-medium disabled:bg-slate-50 disabled:text-slate-400 h-[46px]"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label htmlFor="business-address" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Business Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        id="business-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={isReadOnly}
                        placeholder="123 Corporate St, New York, NY"
                        className="w-full text-xs border border-slate-200 rounded-2xl bg-white pl-10 pr-4 py-3 focus:border-[#073afe] focus:outline-none focus:ring-4 focus:ring-[#073afe]/5 transition-all font-medium disabled:bg-slate-50 disabled:text-slate-400 h-[46px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Switch toggles */}
                <div className="border-t border-slate-100 pt-6 space-y-5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer Experience Control
                  </h4>

                  {/* Google Auto-Redirect */}
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-grow pr-4">
                      <label htmlFor="toggle-redirect" className="text-xs font-bold text-slate-800 cursor-pointer block">
                        Enable Google Review Redirect
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        When enabled, 4-5 stars ratings immediately show the &quot;Post on Google&quot; call-to-action button, which forwards them directly.
                      </p>
                    </div>
                    <button
                      id="toggle-redirect"
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setEnableGoogleReviewRedirect(!enableGoogleReviewRedirect)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enableGoogleReviewRedirect ? 'bg-[#073afe]' : 'bg-slate-250'
                      } disabled:opacity-50 disabled:cursor-not-allowed mt-0.5`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          enableGoogleReviewRedirect ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Manager Callback Request */}
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-grow pr-4">
                      <label htmlFor="toggle-callback" className="text-xs font-bold text-slate-800 cursor-pointer block">
                        Enable Callback Request Form
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        When enabled, customers rating 1-3 stars are shown a contact form to request a direct manager callback and recovery.
                      </p>
                    </div>
                    <button
                      id="toggle-callback"
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setEnableManagerCallback(!enableManagerCallback)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enableManagerCallback ? 'bg-[#073afe]' : 'bg-slate-250'
                      } disabled:opacity-50 disabled:cursor-not-allowed mt-0.5`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          enableManagerCallback ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  {isReadOnly ? (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                      Read-Only Mode
                    </span>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-bold rounded-2xl px-6 py-3 transition-all disabled:opacity-50 cursor-pointer h-[46px]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Settings</span>
                        </>
                      )}
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
