import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AlertTriangle, Loader2 } from 'lucide-react';
import DigitalReviewCard from '@/components/review/DigitalReviewCard';
import RatingCard from '@/components/review/RatingCard';
import RecoveryForm from '@/components/review/RecoveryForm';
import SuccessScreen from '@/components/review/SuccessScreen';
import PoweredByFooter from '@/components/review/PoweredByFooter';

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

export default function PublicReviewPortal() {
  const router = useRouter();
  const { slug } = router.query;

  // Portal Details State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string | null>(null);
  const [details, setDetails] = useState<BusinessDetails | null>(null);

  // Session & Stage Tracking
  const [reviewSessionId, setReviewSessionId] = useState('');
  const [funnelLoggedScan, setFunnelLoggedScan] = useState(false);
  const [funnelLoggedStart, setFunnelLoggedStart] = useState(false);

  // Flow State
  const [step, setStep] = useState<'rating' | 'positive-redirect' | 'negative-form' | 'negative-completion'>('rating');
  const [rating, setRating] = useState(0);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Tap Safety Net Timer State
  const [selectionTimer, setSelectionTimer] = useState<NodeJS.Timeout | null>(null);

  // Redirect Countdown State
  const [countdown, setCountdown] = useState(2.0);
  const [redirectInterval, setRedirectInterval] = useState<NodeJS.Timeout | null>(null);

  // Check and initialize session storage on mount / details resolution
  useEffect(() => {
    if (!slug) return;
    
    const sessionKey = `clout_session_${slug}`;
    const savedSession = sessionStorage.getItem(sessionKey);
    
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setReviewSessionId(parsed.reviewSessionId);
        if (parsed.hasSubmitted) {
          const isPos = parsed.submittedRating >= 4;
          setStep(isPos ? 'positive-redirect' : 'negative-completion');
          setRating(parsed.submittedRating);
          if (!isPos) {
            setIsBottomSheetOpen(true);
          }
        }
      } catch (e) {
        console.error('Error parsing saved session:', e);
        const newId = `session-${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
        setReviewSessionId(newId);
        sessionStorage.setItem(sessionKey, JSON.stringify({ reviewSessionId: newId, hasSubmitted: false }));
      }
    } else {
      const newId = `session-${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      setReviewSessionId(newId);
      sessionStorage.setItem(sessionKey, JSON.stringify({ reviewSessionId: newId, hasSubmitted: false }));
    }
  }, [slug]);

  // Fetch Portal details
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

  // Log SCAN stage once details are fetched
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
  const triggerFunnelStart = (selectedRating: number) => {
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
    setSaveError(null);
  };

  // Handle star rating selection tap (with 400ms protection window)
  const handleStarSelect = (selectedRating: number) => {
    if (selectionTimer) {
      clearTimeout(selectionTimer);
    }

    setRating(selectedRating);
    triggerFunnelStart(selectedRating);

    const timer = setTimeout(() => {
      if (selectedRating >= 4) {
        submitPositiveRating(selectedRating);
      } else {
        setStep('negative-form');
        setIsBottomSheetOpen(true);
      }
    }, 400);

    setSelectionTimer(timer);
  };

  // Submit positive rating (4-5 stars) and initiate automatic countdown redirect
  const submitPositiveRating = async (posRating: number) => {
    if (!details) return;

    setSubmitting(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/r/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: posRating,
          comment: null,
          customerName: null,
          customerPhone: null,
          requestCallback: false,
          reviewSessionId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to record rating.');
      }

      const review = await res.json();

      fetch('/api/r/cta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.id,
          action: 'click',
          businessId: details.business.id,
          reviewSessionId
        })
      }).catch(err => console.error('Failed to log redirect cta click:', err));

      const sessionKey = `clout_session_${slug}`;
      sessionStorage.setItem(sessionKey, JSON.stringify({
        reviewSessionId,
        hasSubmitted: true,
        submittedRating: posRating,
        callbackRequested: false
      }));

      setStep('positive-redirect');
      setSubmitting(false);

      let timeRemaining = 2.0;
      const interval = setInterval(() => {
        timeRemaining -= 0.1;
        setCountdown(Math.max(0, timeRemaining));
        
        if (timeRemaining <= 0) {
          clearInterval(interval);
          if (details.business.googleReviewUrl) {
            window.location.href = details.business.googleReviewUrl;
          }
        }
      }, 100);

      setRedirectInterval(interval);

    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || 'Unable to submit rating. Please try again.');
      setSubmitting(false);
    }
  };

  const handleRedirectClick = (e: React.MouseEvent) => {
    if (redirectInterval) {
      clearInterval(redirectInterval);
    }
    if (details?.business?.googleReviewUrl) {
      window.location.href = details.business.googleReviewUrl;
    }
  };

  const handleRecoverySubmit = async (formData: { customerName: string; customerPhone: string; comment: string; callbackRequested: boolean }) => {
    if (!details) return;

    setSubmitting(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/r/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: formData.comment,
          customerName: formData.callbackRequested ? formData.customerName : null,
          customerPhone: formData.callbackRequested ? formData.customerPhone : null,
          requestCallback: formData.callbackRequested,
          reviewSessionId
        })
      });

      if (!res.ok) {
        throw new Error('Failed to submit feedback.');
      }

      const sessionKey = `clout_session_${slug}`;
      sessionStorage.setItem(sessionKey, JSON.stringify({
        reviewSessionId,
        hasSubmitted: true,
        submittedRating: rating,
        callbackRequested: formData.callbackRequested
      }));

      setStep('negative-completion');
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || 'Unable to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (selectionTimer) clearTimeout(selectionTimer);
      if (redirectInterval) clearInterval(redirectInterval);
    };
  }, [selectionTimer, redirectInterval]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
        <Loader2 className="animate-spin h-10 w-10 text-[#073afe]" />
        <p className="text-xs text-slate-500 mt-4 font-semibold tracking-wide">Opening review portal...</p>
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative font-sans">
        <div className="w-full max-w-[400px] text-center bg-white border border-slate-100 rounded-[24px] p-8 shadow-sm">
          <div className="mx-auto w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center mb-4 border border-red-200">
            <AlertTriangle size={24} className="text-rose-500" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mb-2">{errorHeading}</h3>
          <p className="text-xs text-slate-500 px-4 leading-relaxed">{errorText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-5 relative font-sans overflow-y-auto">
      <Head>
        <title>{details.business.name} - Review Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover" />
      </Head>

      <div className="w-full max-w-[420px] flex flex-col items-center relative z-10 my-auto">
        
        {/* Permanent Digital Review Card Shell */}
        <DigitalReviewCard businessName={details.business.name}>
          
          {saveError && (
            <div className="w-full mb-4 p-3.5 bg-rose-50 border border-rose-200/50 text-rose-700 text-xs rounded-xl font-sans font-medium text-left animate-fadeIn">
              {saveError}
            </div>
          )}
          
          {step === 'rating' && (
            <div className="flex flex-col h-full w-full items-center">
              <div className="mt-[60px] w-full flex justify-center">
                <RatingCard 
                  rating={rating} 
                  onChange={handleStarSelect} 
                  submitting={submitting} 
                />
              </div>
              
              <span
                className="
                  mt-[42px]
                  text-[18px]
                  font-normal
                  text-[#6B7280]
                  text-center
                "
              >
                Tap a star to share your experience
              </span>
              
              <div className="mt-auto w-full">
                <PoweredByFooter />
              </div>
            </div>
          )}
          
          {step === 'positive-redirect' && (
            <div className="flex flex-col h-full w-full items-center">
              <SuccessScreen 
                type="positive" 
                googleReviewUrl={details.business.googleReviewUrl || ''} 
                countdownSeconds={countdown}
                onRedirectClick={handleRedirectClick}
              />
              <div className="mt-auto w-full">
                <PoweredByFooter />
              </div>
            </div>
          )}
          
          {step === 'negative-form' && (
            <div className="flex flex-col h-full w-full items-center justify-center animate-fadeIn">
              <div className="flex flex-col items-center justify-center flex-grow">
                <p className="text-xs text-slate-500 font-semibold mt-8">Recording rating details...</p>
                <Loader2 className="animate-spin h-6 w-6 text-[#073afe] mt-2" />
              </div>
              <div className="mt-auto w-full">
                <PoweredByFooter />
              </div>
            </div>
          )}

          {step === 'negative-completion' && (
            <div className="flex flex-col h-full w-full items-center">
              <SuccessScreen type="negative" />
              <div className="mt-auto w-full">
                <PoweredByFooter />
              </div>
            </div>
          )}
          
        </DigitalReviewCard>
      </div>

      {/* Bottom Sheet Drawer for Negative Experience (1-3 stars) */}
      {isBottomSheetOpen && (
        <div 
          className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => {
            if (step !== 'negative-completion') {
              setIsBottomSheetOpen(false);
              setStep('rating');
              setRating(0);
            }
          }}
        />
      )}

      {/* Slide-Up Bottom Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-white rounded-t-[24px] shadow-2xl z-50 overflow-hidden flex flex-col h-[75vh] transition-transform duration-250 ease-out ${
          isBottomSheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 flex-shrink-0" />
        
        <div className="flex-grow overflow-y-auto px-8 pb-8 pt-2">
          {step === 'negative-completion' ? (
            <SuccessScreen type="negative" />
          ) : (
            <RecoveryForm 
              onSubmit={handleRecoverySubmit} 
              submitting={submitting} 
            />
          )}
        </div>
      </div>

    </div>
  );
}
