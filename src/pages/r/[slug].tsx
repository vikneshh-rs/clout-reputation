import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AlertTriangle, Loader2 } from 'lucide-react';
import DigitalReviewCard from '@/components/review/DigitalReviewCard';
import RatingCard from '@/components/review/RatingCard';
import FeedbackSheet from '@/components/review/FeedbackSheet';
import SuccessScreen from '@/components/review/SuccessScreen';
import { resolveBusinessByIdentifier, recordQrScan } from '@/lib/data';
import { BusinessStatus, QRAssetStatus } from '@prisma/client';

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

export default function PublicReviewPortal({
  initialDetails = null,
  initialError = null,
  initialQrStatus = null,
}: {
  initialDetails?: BusinessDetails | null;
  initialError?: string | null;
  initialQrStatus?: string | null;
}) {
  const router = useRouter();
  const { slug } = router.query;

  // Portal Details State
  const [loading, setLoading] = useState(!initialDetails && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [qrStatus, setQrStatus] = useState<string | null>(initialQrStatus);
  const [details, setDetails] = useState<BusinessDetails | null>(initialDetails);

  // Session & Stage Tracking
  const [reviewSessionId, setReviewSessionId] = useState('');
  const funnelLoggedScanRef = useRef(false);
  const [funnelLoggedStart, setFunnelLoggedStart] = useState(false);

  // Flow State
  const [step, setStep] = useState<'rating' | 'positive-redirect' | 'negative-form' | 'negative-completion'>('rating');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sheetDismissed, setSheetDismissed] = useState(false);

  // Tap Safety Net Timer State
  const [selectionTimer, setSelectionTimer] = useState<NodeJS.Timeout | null>(null);

  // Check and initialize session storage on mount / details resolution
  useEffect(() => {
    if (!slug) return;
    
    const sessionKey = `clout_session_${slug}`;
    const savedSession = sessionStorage.getItem(sessionKey);
    
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        Promise.resolve().then(() => {
          setReviewSessionId(parsed.reviewSessionId);
          if (parsed.hasSubmitted) {
            const isPos = parsed.submittedRating >= 4;
            setStep(isPos ? 'positive-redirect' : 'negative-completion');
            setRating(parsed.submittedRating);
            setSheetDismissed(true);
          }
        });
      } catch (e) {
        console.error('Error parsing saved session:', e);
        const newId = `session-${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
        Promise.resolve().then(() => {
          setReviewSessionId(newId);
        });
        sessionStorage.setItem(sessionKey, JSON.stringify({ reviewSessionId: newId, hasSubmitted: false }));
      }
    } else {
      const newId = `session-${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      Promise.resolve().then(() => {
        setReviewSessionId(newId);
      });
      sessionStorage.setItem(sessionKey, JSON.stringify({ reviewSessionId: newId, hasSubmitted: false }));
    }
  }, [slug]);

  // Fetch Portal details
  useEffect(() => {
    if (!slug) return;
    if (details && (details.business.slug === slug || details.qrCode === slug)) {
      setLoading(false);
      return;
    }

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
      } catch (err) {
        const errObj = err as Error;
        setError(errObj.message || 'Unable to load details for this review portal.');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [slug, details]);

  // Log SCAN stage once details are fetched
  useEffect(() => {
    if (details && reviewSessionId && !funnelLoggedScanRef.current) {
      funnelLoggedScanRef.current = true;
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
  }, [details, reviewSessionId]);

  // Trigger redirect when step becomes positive-redirect (handles both submission and session restore)
  useEffect(() => {
    if (step === 'positive-redirect' && details?.business?.googleReviewUrl) {
      window.location.href = details.business.googleReviewUrl;
    }
  }, [step, details]);

  // Log START stage when a user clicks a star for the first time
  const triggerFunnelStart = () => {
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
    triggerFunnelStart();

    const timer = setTimeout(() => {
      if (selectedRating >= 4) {
        submitPositiveRating(selectedRating);
      } else {
        setStep('negative-form');
        setSheetDismissed(false);
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
      if (details.business.googleReviewUrl) {
        window.location.href = details.business.googleReviewUrl;
      }

    } catch (err) {
      const errObj = err as Error;
      console.error(errObj);
      setSaveError(errObj.message || 'Unable to submit rating. Please try again.');
      setSubmitting(false);
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
    } catch (err) {
      const errObj = err as Error;
      console.error(errObj);
      setSaveError(errObj.message || 'Unable to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (selectionTimer) clearTimeout(selectionTimer);
    };
  }, [selectionTimer]);

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

  const isSheetOpen = (step === 'negative-form' || step === 'negative-completion') && !sheetDismissed;

  return (
    <>
      <Head>
        <title>{details.business.name} - Review Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover" />
      </Head>

      <DigitalReviewCard 
        businessName={details.business.name} 
        isRating={step === 'rating' || step === 'negative-form' || step === 'negative-completion'}
        sheetOpen={isSheetOpen}
      >
        {saveError && (
          <div className="w-full mb-4 p-3.5 bg-rose-50 border border-rose-200/50 text-rose-700 text-xs rounded-xl font-sans font-medium text-left animate-fadeIn">
            {saveError}
          </div>
        )}

        {(step === 'rating' || step === 'negative-form' || step === 'negative-completion') && (
          <RatingCard 
            rating={rating} 
            onChange={handleStarSelect} 
            submitting={submitting} 
          />
        )}

        {step === 'positive-redirect' && (
          <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
            <Loader2 className="animate-spin h-8 w-8 text-[#073afe]" />
            <p className="text-xs text-slate-500 mt-4 font-semibold">Redirecting to Google Reviews...</p>
          </div>
        )}
      </DigitalReviewCard>

      <FeedbackSheet
        isOpen={isSheetOpen}
        isSuccess={step === 'negative-completion'}
        loading={submitting}
        onClose={() => {
          if (step === 'negative-completion') {
            setSheetDismissed(true);
          } else {
            setStep('rating');
          }
        }}
        onSubmit={(data) => {
          handleRecoverySubmit({
            customerName: data.customerName || '',
            customerPhone: data.phone || '',
            comment: data.feedback || '',
            callbackRequested: data.requestCallback,
          });
        }}
      />
    </>
  );
}

export const getServerSideProps = async (context: any) => {
  const { slug } = context.params;
  
  if (!slug || typeof slug !== 'string') {
    return {
      props: {
        initialError: 'Identifier is required.',
        initialQrStatus: 'NOT_FOUND'
      }
    };
  }

  try {
    const result = await resolveBusinessByIdentifier(slug);
    if (!result) {
      return {
        props: {
          initialError: 'Business or review portal not found.',
          initialQrStatus: 'NOT_FOUND'
        }
      };
    }

    const { business, qrCode, qrStatus } = result;

    if (qrStatus === 'Not Generated' || qrCode === 'NO_QR') {
      return {
        props: {
          initialError: 'This business does not have an active QR code generated.',
          initialQrStatus: 'NOT_GENERATED'
        }
      };
    }

    if (qrStatus === QRAssetStatus.FREE) {
      return {
        props: {
          initialError: 'This QR Code is currently inactive.',
          initialQrStatus: 'INACTIVE'
        }
      };
    }

    if (!business || !business.isActive || business.status === BusinessStatus.INACTIVE) {
      return {
        props: {
          initialError: 'This review portal is temporarily inactive.',
          initialQrStatus: 'INACTIVE'
        }
      };
    }

    if (business.status === BusinessStatus.PENDING) {
      return {
        props: {
          initialError: 'This review portal setup is incomplete.',
          initialQrStatus: 'PENDING'
        }
      };
    }

    // Record QR scan on server side
    const userAgent = context.req.headers['user-agent'] || null;
    try {
      await recordQrScan({
        businessId: business.id,
        qrCode,
        userAgent: userAgent ? String(userAgent) : null
      });
    } catch (e) {
      console.error('Error recording QR scan in getServerSideProps:', e);
    }

    return {
      props: {
        initialDetails: {
          qrCode,
          status: qrStatus,
          business: {
            id: business.id,
            name: business.name,
            slug: business.slug,
            industry: business.industry,
            logoUrl: business.logoUrl,
            googleReviewUrl: business.googleReviewUrl,
            enableGoogleReviewRedirect: business.enableGoogleReviewRedirect,
            enableManagerCallback: business.enableManagerCallback
          }
        }
      }
    };
  } catch (err) {
    console.error('getServerSideProps error in review portal page:', err);
    return {
      props: {
        initialError: 'Internal server error processing review portal.',
        initialQrStatus: 'SERVER_ERROR'
      }
    };
  }
};
