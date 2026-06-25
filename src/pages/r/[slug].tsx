import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  AlertTriangle, 
  Loader2, 
  Store, 
  ExternalLink, 
  Star, 
  Check, 
  Phone,
  User,
  Heart,
  MessageSquare,
  ChevronRight
} from 'lucide-react';

interface BusinessDetails {
  qrCode: string;
  status: string;
  business: {
    id: string;
    name: string;
    slug: string;
    industry: string;
    logoUrl: string | null;
    googleReviewUrl: string | null;
    enableGoogleReviewRedirect: boolean;
    enableManagerCallback: boolean;
  };
}

export default function PublicQRResolver() {
  const router = useRouter();
  const { slug } = router.query;

  // Loading and details state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string | null>(null);
  const [details, setDetails] = useState<BusinessDetails | null>(null);

  // Session & Stage Tracking
  const [reviewSessionId, setReviewSessionId] = useState('');
  const [funnelLoggedScan, setFunnelLoggedScan] = useState(false);
  const [funnelLoggedStart, setFunnelLoggedStart] = useState(false);

  // Form states
  const [step, setStep] = useState<'rating' | 'positive-share' | 'positive-completion' | 'negative-form' | 'negative-completion'>('rating');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [callbackRequested, setCallbackRequested] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createdReview, setCreatedReview] = useState<any>(null);

  // Generate session ID on mount
  useEffect(() => {
    setReviewSessionId(`session-${Math.random().toString(36).substring(2, 11)}_${Date.now()}`);
  }, []);

  // Fetch details
  useEffect(() => {
    if (!slug) return;

    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setQrStatus(null);
        const res = await fetch(`/api/r/${slug}`);
        if (!res.ok) {
          const errData = await res.json();
          setQrStatus(errData.status || 'NOT_FOUND');
          throw new Error(errData.error || 'Invalid or expired review portal link.');
        }
        const data = await res.json();
        setDetails(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load details for this review portal.');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [slug]);

  // Log SCAN stage once details are fetched successfully
  useEffect(() => {
    if (details && reviewSessionId && !funnelLoggedScan) {
      setFunnelLoggedScan(true);
      fetch('/api/business/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'SCAN',
          businessId: details.business.id,
          reviewSessionId
        })
      }).catch(err => console.error('Failed to log SCAN stage:', err));
    }
  }, [details, reviewSessionId, funnelLoggedScan]);

  // Log START stage when a user clicks a star for the first time
  const triggerFunnelStart = async (selectedRating: number) => {
    if (details && reviewSessionId && !funnelLoggedStart) {
      setFunnelLoggedStart(true);
      fetch('/api/business/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'START',
          businessId: details.business.id,
          reviewSessionId
        })
      }).catch(err => console.error('Failed to log START stage:', err));
    }

    setRating(selectedRating);
    setSaveError(null);

    // Route to appropriate path based on rating selection
    if (selectedRating >= 4) {
      setStep('positive-share');
    } else {
      setStep('negative-form');
    }
  };

  // Submit positive review (e.g. if they click Maybe Later or we pre-save before redirect)
  const submitPositiveReview = async (isRedirecting: boolean) => {
    if (!details) return;
    try {
      setSubmitting(true);
      setSaveError(null);

      const res = await fetch(`/api/r/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: isRedirecting ? 'Redirected to Google Reviews' : 'Opted to skip Google redirect',
          customerName: 'Positive Guest',
          customerPhone: null,
          requestCallback: false,
          reviewSessionId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to record positive review.');
      }

      const review = await res.json();
      setCreatedReview(review);

      // Log CTA View
      await fetch('/api/r/cta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, action: 'view' })
      }).catch(err => console.error('Failed to log CTA view:', err));

      if (isRedirecting) {
        // Log CTA Click and redirect
        await fetch('/api/r/cta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            reviewId: review.id, 
            action: 'click', 
            businessId: details.business.id, 
            reviewSessionId 
          })
        }).catch(err => console.error('Failed to log CTA click:', err));
        
        window.location.href = details.business.googleReviewUrl || '/';
      } else {
        setStep('positive-completion');
      }
    } catch (err: any) {
      console.error('Positive review submission error:', err);
      setSaveError(err.message || 'Error saving review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit negative review and create recovery ticket
  const handleNegativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details) return;

    setSaveError(null);

    // Front-end validations
    if (!customerName.trim()) {
      alert('Please enter your name.');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Please enter your WhatsApp number.');
      return;
    }
    if (!comment.trim()) {
      alert('Please share your feedback so we can improve.');
      return;
    }

    // WhatsApp phone format validation (only digits, plus, space, dash, min 7 chars)
    const phoneClean = customerPhone.trim();
    const phoneRegex = /^[0-9+\s\-]{7,20}$/;
    if (!phoneRegex.test(phoneClean)) {
      alert('Please enter a valid WhatsApp phone number (at least 7 digits, digits and optional + only).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/r/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          customerName,
          customerPhone: phoneClean,
          requestCallback: callbackRequested,
          reviewSessionId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send feedback.');
      }

      setStep('negative-completion');
    } catch (err: any) {
      console.error('Negative feedback submission error:', err);
      setSaveError(err.message || 'Unable to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-['Inter',_sans-serif]">
        <Loader2 className="animate-spin h-10 w-10 text-[#1853AB]" />
        <p className="text-xs text-zinc-500 mt-4 font-medium">Opening review portal...</p>
      </div>
    );
  }

  if (error || !details) {
    const errorHeading = qrStatus === 'NOT_FOUND' 
      ? 'Portal Not Found' 
      : qrStatus === 'INACTIVE' 
      ? 'Portal Temporarily Inactive'
      : qrStatus === 'PENDING'
      ? 'Setup Incomplete'
      : 'Review Portal Inactive';

    const errorText = qrStatus === 'NOT_FOUND' 
      ? 'This business review portal link is invalid or has been removed.' 
      : qrStatus === 'INACTIVE' 
      ? 'This business review portal has been set to inactive.' 
      : qrStatus === 'PENDING'
      ? 'This business review portal is currently being set up. Please try again later.'
      : 'This review portal is currently inactive.';

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative font-sans">
        <div className="w-full max-w-md text-center bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-8 shadow-sm">
          <div className="mx-auto w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center mb-4 border border-red-200">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-red-650 mb-2">{errorHeading}</h3>
          <p className="text-xs text-zinc-500 px-4">{errorText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden">
      <Head>
        <title>{details.business.name} - Review Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <style>{`
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            background-color: #F8FAFC !important;
            color: #0F172A !important;
          }
        `}</style>
      </Head>

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-10 w-10 rounded-2xl bg-[#1853AB] flex items-center justify-center shadow-md shadow-blue-500/10 mb-2.5">
            <img src="/logo.png" alt="Clout" className="h-5.5 w-5.5 object-contain brightness-0 invert" />
          </div>
          <span className="text-xs font-bold tracking-widest text-[#1853AB] uppercase">
            Clout Reputation
          </span>
        </div>

        {/* Portal Card */}
        <div className="w-full bg-white/75 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_20px_50px_rgba(15,23,42,0.03)] relative overflow-hidden">
          
          {/* Header section containing business name and logo */}
          {step === 'rating' && (
            <div className="flex items-center space-x-4 pb-5 border-b border-slate-100/60 mb-6">
              {details.business.logoUrl ? (
                <img 
                  src={details.business.logoUrl} 
                  alt={details.business.name} 
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm" 
                />
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl text-slate-800 shadow-sm">
                  <Store size={22} className="text-[#1853AB]" />
                </div>
              )}
              <div>
                <h2 className="text-base font-bold tracking-tight text-slate-900 leading-tight">{details.business.name}</h2>
                <p className="text-[9px] text-[#1853AB] font-bold uppercase tracking-wider mt-1 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block">
                  {details.business.industry.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: Star selection step */}
          {step === 'rating' && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  How was your experience today?
                </h3>
                <p className="text-xs text-slate-500">Tap a star to leave your rating</p>
              </div>

              {/* Huge stars targets for mobile layout */}
              <div className="flex items-center justify-center space-x-2.5 py-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => triggerFunnelStart(star)}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-200/80 text-slate-300 hover:bg-slate-50/50 hover:border-slate-300 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Star className="h-6 w-6 text-slate-350 hover:text-amber-400 hover:fill-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PATH A: Positive Rating Selected - Share on Google */}
          {step === 'positive-share' && (
            <div className="space-y-6 text-center py-2 animate-fadeIn">
              <div className="inline-flex items-center justify-center p-4 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-100 shadow-[0_8px_20px_rgba(16,185,129,0.06)]">
                <Heart size={26} className="fill-emerald-500 text-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  We are glad you enjoyed your visit.
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Would you mind sharing your experience on Google?
                </p>
              </div>

              <div className="p-6 bg-slate-50/80 backdrop-blur-md rounded-2xl border border-slate-100/60 space-y-4">
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => submitPositiveReview(true)}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow-md shadow-blue-500/10 active:scale-[0.98] cursor-pointer border-none"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    ) : null}
                    Leave Google Review
                    <ExternalLink size={12} className="ml-1.5" />
                  </button>
                  <button
                    onClick={() => submitPositiveReview(false)}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PATH A COMPLETION: Thank you for positive feedback */}
          {step === 'positive-completion' && (
            <div className="space-y-6 text-center py-6 animate-fadeIn">
              <div className="inline-flex items-center justify-center p-4 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-100 shadow-sm">
                <Check size={26} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Thank you for your support.</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Your feedback helps local businesses grow. We appreciate your time!
                </p>
              </div>
              <div className="pt-4 text-xs text-slate-400 font-medium">
                We look forward to serving you again soon!
              </div>
            </div>
          )}

          {/* PATH B: Negative Feedback Form */}
          {step === 'negative-form' && (
            <form onSubmit={handleNegativeSubmit} className="space-y-5 animate-fadeIn">
              <div className="text-center pb-4 border-b border-slate-100/60 space-y-2">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-250/50 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  We are sorry your experience did not meet expectations.
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Help us improve by sharing your feedback.
                </p>
              </div>

              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-200/50 text-rose-700 text-xs rounded-xl">
                  {saveError}
                </div>
              )}

              {/* Form Inputs */}
              <div className="space-y-4">
                
                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label htmlFor="cname" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Your Name
                  </label>
                  <div className="relative">
                    <User size={13} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      id="cname"
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1853AB] text-xs transition-all placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-1.5">
                  <label htmlFor="cphone" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      id="cphone"
                      type="tel"
                      required
                      placeholder="e.g. +1 555 123 4567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1853AB] text-xs transition-all placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Feedback comment message */}
                <div className="space-y-1.5">
                  <label htmlFor="comments" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Feedback Message
                  </label>
                  <textarea
                    id="comments"
                    rows={4}
                    required
                    placeholder="Tell us what went wrong so we can fix it."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white/60 text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-[#1853AB] focus:outline-none transition-all placeholder-slate-400"
                  />
                </div>

                {/* Callback checkbox */}
                {details.business.enableManagerCallback && (
                  <div className="flex items-start space-x-3 pt-2 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                    <input
                      id="callback-req"
                      type="checkbox"
                      checked={callbackRequested}
                      onChange={(e) => setCallbackRequested(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-650 border-slate-300 rounded focus:ring-blue-500/10 cursor-pointer"
                    />
                    <label htmlFor="callback-req" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                      I would like a callback from management
                      <span className="block text-[9px] text-slate-450 mt-0.5 font-normal">Our recovery team will reach out directly to resolve this.</span>
                    </label>
                  </div>
                )}

              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow-md shadow-blue-500/10 active:scale-[0.98] cursor-pointer border-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" />
                      Sending Feedback...
                    </>
                  ) : (
                    'Send Feedback'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* PATH B COMPLETION: Thank you for negative feedback */}
          {step === 'negative-completion' && (
            <div className="space-y-6 text-center py-6 animate-fadeIn">
              <div className="inline-flex items-center justify-center p-4 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-100 shadow-sm">
                <Check size={26} className="text-emerald-500" />
              </div>
              <div className="space-y-2.5">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Thank you for sharing your feedback.</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Our team will review your concerns and work to improve.
                </p>
                {callbackRequested && (
                  <p className="text-xs font-semibold text-[#1853AB] bg-blue-50/60 p-3 rounded-2xl max-w-xs mx-auto mt-2 border border-blue-100">
                    A team member may contact you regarding your feedback.
                  </p>
                )}
              </div>
              <div className="pt-4 text-xs text-slate-400 font-medium">
                We value your input and hope to welcome you back soon!
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-6 tracking-wide uppercase font-semibold">
          Powered by Clout Reputation V1
        </p>
      </div>
    </div>
  );
}
