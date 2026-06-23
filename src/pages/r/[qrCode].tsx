import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Loader2, 
  Store, 
  ExternalLink, 
  Star, 
  ChevronRight, 
  Check, 
  Phone,
  User,
  Heart
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

export default function PublicQRResolver(props: any) {
  const router = useRouter();
  const { qrCode } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string | null>(null);
  const [details, setDetails] = useState<BusinessDetails | null>(null);

  // Form states
  const [step, setStep] = useState<'rating' | 'thankyou' | 'callback' | 'callback-success'>('rating');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createdReview, setCreatedReview] = useState<any>(null);

  // Callback form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [callbackSubmitting, setCallbackSubmitting] = useState(false);

  useEffect(() => {
    if (!qrCode) return;

    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setQrStatus(null);
        const res = await fetch(`/api/r/${qrCode}`);
        if (!res.ok) {
          const errData = await res.json();
          setQrStatus(errData.status || 'NOT_FOUND');
          throw new Error(errData.error || 'Invalid or expired QR code.');
        }
        const data = await res.json();
        setDetails(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load details for this QR code.');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [qrCode]);

  // Trigger Google Review CTA view tracking when thank you step is reached (if rating >= 4)
  useEffect(() => {
    if (step === 'thankyou' && createdReview && createdReview.rating >= 4) {
      fetch('/api/r/cta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: createdReview.id, action: 'view' })
      }).catch(err => console.error('Failed to log CTA view:', err));
    }
  }, [step, createdReview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 font-['Inter',_sans-serif]">
        <Loader2 className="animate-spin h-10 w-10 text-[#1857D6]" />
        <p className="text-xs text-zinc-500 mt-4 font-medium">Opening review portal...</p>
      </div>
    );
  }

  if (error || !details) {
    const errorHeading = qrStatus === 'NOT_FOUND' 
      ? 'QR Code Not Found' 
      : qrStatus === 'SUSPENDED' 
      ? 'Portal Suspended' 
      : 'QR Code Inactive';

    const errorText = qrStatus === 'NOT_FOUND' 
      ? 'QR code not found.' 
      : qrStatus === 'SUSPENDED' 
      ? 'This business review portal has been suspended.' 
      : 'This QR code is no longer active.';

    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 relative font-['Source_Sans_Pro',_sans-serif]">
        
        <div className="w-full max-w-md text-center">
          <div className="mx-auto w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center mb-4 border border-red-200">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-red-650 mb-2">{errorHeading}</h3>
          <p className="text-sm text-zinc-500 mb-6 px-4">{errorText}</p>
        </div>
      </div>
    );
  }

  const handleReviewSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rating) {
      alert('Please select a rating.');
      return;
    }

    try {
      setSubmitting(true);
      setSaveError(null);
      const res = await fetch(`/api/r/${qrCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment
        })
      });

      if (!res.ok) {
        throw new Error('Failed to submit review');
      }

      const reviewData = await res.json();
      setCreatedReview(reviewData);

      if (rating >= 4) {
        setStep('thankyou');
      } else if (rating <= 3 && details.business.enableManagerCallback) {
        setStep('callback');
      } else {
        setStep('thankyou');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setSaveError('Could not submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please enter your Name and Phone Number.');
      return;
    }

    try {
      setCallbackSubmitting(true);
      const res = await fetch('/api/r/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: createdReview.id,
          customerName,
          phoneNumber: customerPhone
        })
      });

      if (!res.ok) {
        throw new Error('Failed to record callback request');
      }

      setStep('callback-success');
    } catch (err) {
      console.error('Callback request error:', err);
      alert('Could not process callback. Please try again.');
    } finally {
      setCallbackSubmitting(false);
    }
  };

  const handleGoogleRedirect = async () => {
    if (!createdReview || !details?.business?.googleReviewUrl) return;
    try {
      await fetch('/api/r/cta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: createdReview.id, action: 'click' })
      });
    } catch (err) {
      console.error('Failed to log CTA click:', err);
    }
    window.location.href = details.business.googleReviewUrl;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden">
      <Head>
        <title>{details.business.name} - Review Portal</title>
        <style>{`
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            background-color: #F8FAFC !important;
            color: #0F172A !important;
          }
        `}</style>
      </Head>

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulseGlow" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2 animate-pulseGlow" />

      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 animate-fadeIn">
          <div className="h-10 w-10 rounded-2xl bg-[#1857D6] flex items-center justify-center shadow-md shadow-blue-500/10 mb-2.5">
            <img src="/logo.png" alt="Clout" className="h-5.5 w-5.5 object-contain brightness-0 invert" />
          </div>
          <span className="text-xs font-bold tracking-widest text-[#1857D6] uppercase">
            Clout Reputation
          </span>
        </div>

        {/* Form Container Card */}
        <div className="w-full bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_20px_50px_rgba(15,23,42,0.04)] animate-slideUp relative overflow-hidden">
          
          {/* Header Card (Business Logo + Name) - always visible during feedback input */}
          {(step === 'rating' || step === 'callback') && (
            <div className="flex items-center space-x-4 pb-5 border-b border-slate-100/60 mb-6">
              {details.business.logoUrl ? (
                <img 
                  src={details.business.logoUrl} 
                  alt={details.business.name} 
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm" 
                />
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl text-slate-800 shadow-sm">
                  <Store size={22} className="text-[#1857D6]" />
                </div>
              )}
              <div>
                <h2 className="text-base font-bold tracking-tight text-slate-900 leading-tight">{details.business.name}</h2>
                <p className="text-[9px] text-[#1857D6] font-bold uppercase tracking-wider mt-1 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block">
                  {details.business.industry.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: Rating form (Stars + Conditional comment box) */}
          {step === 'rating' && (
            <form onSubmit={(e) => handleReviewSubmit(e)} className="space-y-6 animate-slideUp">
              <div className="text-center py-1 space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  How was your experience?
                </h3>
                <p className="text-xs text-slate-550">Tap a star to leave your rating</p>
              </div>

              {/* Large Stars selector */}
              <div className="flex items-center justify-center space-x-2.5 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setSaveError(null);
                    }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ease-out focus:outline-none touch-manipulation cursor-pointer border ${
                      rating >= star
                        ? 'bg-amber-50/80 border-amber-300 text-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.15)] scale-110'
                        : 'bg-white/80 border-slate-200 text-slate-300 hover:bg-slate-50/50 hover:border-slate-350 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Star className={`h-6 w-6 transition-all duration-300 ${rating >= star ? 'fill-amber-500 scale-105' : 'fill-none'}`} />
                  </button>
                ))}
              </div>

              {/* Conditional comments + Submit section */}
              {rating > 0 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="space-y-2">
                    <label htmlFor="comments" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Tell us more about your experience (Optional)
                    </label>
                    <textarea
                      id="comments"
                      rows={4}
                      placeholder="Tell us what you liked or how we can improve"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-white/60 text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-[#1857D6] focus:outline-none transition-all placeholder-slate-400"
                    />
                  </div>

                  {saveError && (
                    <div className="p-4 bg-rose-50/80 border border-rose-200/50 text-rose-700 text-xs rounded-2xl flex flex-col items-center gap-2 animate-fadeIn">
                      <span>{saveError}</span>
                      <button
                        type="button"
                        onClick={() => handleReviewSubmit()}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold border-none cursor-pointer transition-colors shadow-sm"
                      >
                        Retry Submission
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow-md shadow-blue-500/10 active:scale-[0.98] cursor-pointer border-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Submitting Review...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* STEP 2: Positive / Negative Thank You Screen */}
          {step === 'thankyou' && (
            <div className="space-y-6 text-center py-4 animate-slideUp">
              <div className="inline-flex items-center justify-center p-4 bg-emerald-50/80 text-emerald-600 rounded-3xl border border-emerald-100 shadow-[0_8px_20px_rgba(16,185,129,0.1)]">
                <Heart size={26} className="fill-emerald-500 text-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {rating >= 4 ? 'Thank you for your feedback!' : 'Thank you for your feedback.'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {rating >= 4 
                    ? "We're delighted you shared your experience with us."
                    : "Our team will review your concern."
                  }
                </p>
              </div>

              {rating >= 4 && details.business.googleReviewUrl && details.business.enableGoogleReviewRedirect ? (
                <div className="p-6 bg-slate-50/85 backdrop-blur-md rounded-2xl border border-slate-100 space-y-4 animate-fadeIn shadow-sm">
                  <p className="text-xs font-semibold text-slate-700 leading-normal max-w-xs mx-auto">
                    Would you take a moment to share your experience on Google? It helps our business grow.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleGoogleRedirect}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow-md shadow-blue-500/10 active:scale-[0.98] cursor-pointer border-none"
                    >
                      Post on Google
                      <ExternalLink size={12} className="ml-1.5" />
                    </button>
                    <button
                      onClick={() => {
                        setRating(0);
                        setComment('');
                        setStep('rating');
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 text-xs text-slate-400 font-medium">
                  We look forward to serving you again soon!
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Negative callback recovery form */}
          {step === 'callback' && (
            <form onSubmit={handleCallbackSubmit} className="space-y-5 py-1 animate-slideUp">
              <div className="text-center pb-5 border-b border-slate-100/60 space-y-2">
                <div className="w-12 h-12 bg-amber-50/80 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_8px_20px_rgba(245,158,11,0.1)] animate-bounce-subtle">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  We're sorry your experience wasn't perfect.
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Would you like us to contact you?
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="cname" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Name
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-4.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      id="cname"
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1857D6] text-xs transition-all placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cphone" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      id="cphone"
                      type="tel"
                      required
                      placeholder="Enter your phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-white/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1857D6] text-xs transition-all placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={callbackSubmitting}
                  className="w-full inline-flex items-center justify-center px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow-md shadow-blue-500/10 active:scale-[0.98] cursor-pointer border-none"
                >
                  {callbackSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" />
                      Saving Request...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setStep('thankyou')}
                  className="w-full text-center text-xs font-semibold text-slate-550 hover:text-slate-900 py-3 transition-colors cursor-pointer border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 shadow-sm active:scale-[0.98]"
                >
                  Skip
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Callback success screen (Same message as skipped negative flow) */}
          {step === 'callback-success' && (
            <div className="space-y-6 text-center py-6 animate-slideUp">
              <div className="inline-flex items-center justify-center p-4 bg-emerald-50/80 text-emerald-600 rounded-3xl border border-emerald-100 shadow-[0_8px_20px_rgba(16,185,129,0.1)]">
                <Check size={24} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Request Submitted</h3>
                <p className="text-xs text-slate-550 max-w-xs mx-auto leading-relaxed">
                  Thank you for your feedback. Our team will review your concern.
                </p>
              </div>
              <div className="pt-4 text-xs text-slate-400 font-medium">
                We look forward to serving you again soon!
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-400 mt-6 tracking-wide uppercase font-semibold">
          Powered by Clout Reputation V1
        </p>
      </div>
    </div>
  );
}
