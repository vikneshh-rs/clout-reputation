import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  X, 
  Link2, 
  QrCode, 
  Key, 
  Award,
  Sparkles
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  address?: string | null;
  googleReviewUrl?: string | null;
  category?: string | null;
  website?: string | null;
  googleMapsUrl?: string | null;
  qrCodeUrl?: string | null;
  status: string;
}

interface BusinessHealthWidgetProps {
  business: Business;
  avgRating: number;
  openTickets: number;
}

export default function BusinessHealthWidget({ business, avgRating, openTickets }: BusinessHealthWidgetProps) {
  // Profile completion calculation
  const computeProfileCompletion = (biz: Business) => {
    let pct = 0;
    if (biz.name) pct += 10;
    if (biz.logoUrl) pct += 15;
    if (biz.description) pct += 15;
    if (biz.contactPerson) pct += 10;
    if (biz.phone) pct += 10;
    if (biz.address) pct += 10;
    if (biz.googleReviewUrl) pct += 10;
    if (biz.category) pct += 10;
    if (biz.website) pct += 5;
    if (biz.googleMapsUrl) pct += 5;
    return pct;
  };

  const getSetupState = (pct: number) => {
    if (pct < 50) return { label: 'Setup Incomplete', color: 'bg-rose-50 text-rose-700 border-rose-250' };
    if (pct < 85) return { label: 'Ready To Launch', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Live', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const getHealth = (rating: number, tickets: number) => {
    if (rating >= 4.5 && tickets === 0) {
      return {
        label: 'Good',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeBg: 'bg-emerald-500',
        desc: 'Reputation is healthy and all customer issues are resolved.'
      };
    }
    if (rating >= 4.0 && tickets < 3) {
      return {
        label: 'Warning',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        badgeBg: 'bg-amber-500',
        desc: 'Reputation is moderate. Address open recovery tickets soon.'
      };
    }
    return {
      label: 'Attention Needed',
      color: 'bg-rose-50 text-rose-700 border-rose-250 animate-pulse',
      badgeBg: 'bg-rose-500',
      desc: 'Reputation is low or too many customer recovery requests are pending!'
    };
  };

  const completionPct = computeProfileCompletion(business);
  const setupState = getSetupState(completionPct);
  const health = getHealth(avgRating, openTickets);

  // Status checks
  const hasPortal = business.status === 'ACTIVE' || business.status === 'ONBOARDED';
  const hasQr = !!business.qrCodeUrl;
  const hasGoogleUrl = !!business.googleReviewUrl;

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">
      {/* Header with Health Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100/60 pb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles size={14} className="text-blue-600" />
            Reputation Health
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Real-time status based on reviews and recovery queue</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${health.color}`}>
          <span className={`h-2 w-2 rounded-full ${health.badgeBg}`} />
          {health.label}
        </div>
      </div>

      {/* Health Description Alert */}
      <div className={`p-4 rounded-2xl text-xs flex gap-3 items-start border ${
        health.label === 'Good' 
          ? 'bg-emerald-50/40 text-emerald-800 border-emerald-100/50' 
          : health.label === 'Warning' 
          ? 'bg-amber-50/40 text-amber-800 border-amber-100/50' 
          : 'bg-rose-50/40 text-rose-800 border-rose-100/50'
      }`}>
        {health.label === 'Good' ? (
          <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        )}
        <div>
          <span className="font-bold block mb-0.5">Status: {health.label}</span>
          <p className="text-slate-500 font-medium">{health.desc}</p>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-500">Profile Completion</span>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border ${setupState.color}`}>
              {setupState.label}
            </span>
            <span className="font-bold text-slate-900">{completionPct}%</span>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              completionPct < 50 ? 'bg-rose-500' : completionPct < 85 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Asset Statuses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${hasPortal ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Key size={14} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portal Access</span>
              <span className="text-xs font-semibold text-slate-900">{hasPortal ? 'Active' : 'Missing'}</span>
            </div>
          </div>
          {hasPortal ? (
            <Check size={16} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <X size={16} className="text-rose-500 flex-shrink-0" />
          )}
        </div>

        <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${hasQr ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <QrCode size={14} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">QR Code</span>
              <span className="text-xs font-semibold text-slate-900">{hasQr ? 'Generated' : 'Missing'}</span>
            </div>
          </div>
          {hasQr ? (
            <Check size={16} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <X size={16} className="text-rose-500 flex-shrink-0" />
          )}
        </div>

        <div className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${hasGoogleUrl ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Link2 size={14} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Google Review</span>
              <span className="text-xs font-semibold text-slate-900">{hasGoogleUrl ? 'Connected' : 'Missing'}</span>
            </div>
          </div>
          {hasGoogleUrl ? (
            <Check size={16} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <X size={16} className="text-rose-500 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
