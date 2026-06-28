import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  QrCode, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  AlertTriangle,
  RotateCcw,
  Briefcase
} from 'lucide-react';
import { Industry, QRStatus } from '@prisma/client';

interface QRRecord {
  id: string;
  qrCode: string;
  status: QRStatus;
  assignedBusinessId: string | null;
  business?: { name: string; slug: string; industry: string } | null;
}

export default function QRAssignPortal(props: any) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = props;

  // Global Page States
  const [step, setStep] = useState(1); // 1: QR lookup, 2: Details Form, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: QR Code Lookup state
  const [inputQrCode, setInputQrCode] = useState('');
  const [validatedQr, setValidatedQr] = useState<QRRecord | null>(null);

  // Enhancement 1 states
  const [verifyMethod, setVerifyMethod] = useState<'scan' | 'manual'>('scan');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  // Step 2: Onboarding Form states
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<Industry>(Industry.OTHER);
  const [password, setPassword] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Step 2: Existing Business states
  const [businesses, setBusinesses] = useState<{ id: string; name: string; industry: string }[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'existing' | 'new'>('existing');

  // Replacement workflow state
  const [replacementMode, setReplacementMode] = useState(false);
  const [oldQrCode, setOldQrCode] = useState('');
  const [newQrCode, setNewQrCode] = useState('');

  useEffect(() => {
    if (router.query.replace === 'true') {
      setReplacementMode(true);
    } else {
      setReplacementMode(false);
    }
  }, [router.query]);

  useEffect(() => {
    if (user && (user.role === 'REP' || user.role === 'SUPER_ADMIN')) {
      fetchBusinesses();
    }
  }, [user]);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch('/api/rep/businesses');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
        if (data.businesses && data.businesses.length > 0) {
          setSelectedBusinessId(data.businesses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    }
  };

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (verifyMethod === 'scan' && step === 1 && !replacementMode && user && (user.role === 'REP' || user.role === 'SUPER_ADMIN')) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          activeStream = stream;
          setCameraStream(stream);
          setCameraError(false);
        })
        .catch(err => {
          console.warn('Camera blocked or unavailable:', err);
          setCameraError(true);
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
    };
  }, [verifyMethod, step, replacementMode, user]);

  // Validation handler for Step 1
  const handleValidateQr = async (e?: React.FormEvent, codeToUse?: string) => {
    if (e) e.preventDefault();
    const targetCode = codeToUse || inputQrCode;
    if (!targetCode.trim()) return;

    setError('');
    setLoading(true);
    setValidatedQr(null);

    try {
      const res = await fetch(`/api/rep/scan/${targetCode.trim()}`);

      if (res.ok) {
        const payload = await res.json();
        const record = payload.qrInventory;
        const status = payload.status;
        setValidatedQr(record);

        if (status === 'ASSIGNED') {
          setError(`Sticker "${targetCode.trim()}" is already ASSIGNED to "${record.business?.name || 'another business'}". Onboarding is blocked.`);
        } else if (status === 'DAMAGED') {
          setError(`Sticker "${targetCode.trim()}" is marked as DAMAGED. Onboarding is blocked. Please use the Swap QR Sticker utility to replace it.`);
        } else if (status === 'REPLACED') {
          setError(`Sticker "${targetCode.trim()}" is marked as REPLACED. Onboarding is blocked.`);
        } else if (status === 'INACTIVE') {
          setError(`Sticker "${targetCode.trim()}" is marked as INACTIVE. Onboarding is blocked.`);
        } else if (status === 'UNASSIGNED') {
          // Unassigned, move to details
          setStep(2);
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Invalid QR Code. Please check the serial sticker.');
      }
    } catch (err) {
      setError('Network connection error validating sticker.');
    } finally {
      setLoading(false);
    }
  };

  // Existing business assignment submission
  const handleAssignToExistingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessId) {
      setError('Please select a business.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/rep/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          qrCode: validatedQr?.qrCode,
          businessId: selectedBusinessId
        })
      });

      if (res.ok) {
        const selectedBiz = businesses.find(b => b.id === selectedBusinessId);
        setSuccess(`Successfully assigned QR "${validatedQr?.qrCode}" to "${selectedBiz?.name || 'the business'}".`);
        setStep(3);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to assign QR.');
      }
    } catch (err) {
      setError('Network error during assignment.');
    } finally {
      setLoading(false);
    }
  };

  // Onboard & Link submission
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !password || !industry) {
      setError('Please fill in Business Name, Industry, and Password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/rep/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          qrCode: validatedQr?.qrCode,
          businessDetails: {
            name: businessName.trim(),
            industry,
            password,
            googleReviewUrl: googleReviewUrl.trim() || null,
            phone: phone.trim() || null,
            address: address.trim() || null
          }
        })
      });

      if (res.ok) {
        setSuccess(`Successfully onboarded "${businessName}" and linked QR code "${validatedQr?.qrCode}".`);
        setStep(3);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to onboard business and assign QR.');
      }
    } catch (err) {
      setError('Network error during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  // QR Swap handler
  const handleReplaceQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldQrCode.trim() || !newQrCode.trim()) {
      setError('Both old and new QR codes are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/rep/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPLACE',
          oldQrCode: oldQrCode.trim(),
          newQrCode: newQrCode.trim()
        })
      });

      if (res.ok) {
        const payload = await res.json();
        setSuccess(`Sticker swap complete! Replaced damaged QR "${oldQrCode}" with "${newQrCode}".`);
        setStep(3);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Replacement failed. Ensure old QR is ASSIGNED and new QR is UNASSIGNED.');
      }
    } catch (err) {
      setError('Network error processing replacement.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setInputQrCode('');
    setValidatedQr(null);
    setBusinessName('');
    setIndustry(Industry.OTHER);
    setPassword('');
    setGoogleReviewUrl('');
    setPhone('');
    setAddress('');
    setOldQrCode('');
    setNewQrCode('');
    setError('');
    setSuccess('');
    setSelectedBusinessId(businesses.length > 0 ? businesses[0].id : '');
    setActiveSubTab('existing');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#073afe]" />
      </div>
    );
  }

  if (!user || (user.role !== 'REP' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-black mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-zinc-500 text-sm mt-1">REP credentials required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title={replacementMode ? "Replace Damaged QR" : "Scan & Assign QR"} theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>{replacementMode ? "Replace QR" : "Onboard Business"} - Clout Reputation</title>
        <style>{`
          body, .dashboard-layout {
            font-family: 'Source Sans Pro', sans-serif !important;
          }
          @keyframes pulseScan {
            0% { top: 0%; opacity: 0.8; }
            50% { top: 100%; opacity: 0.8; }
            100% { top: 0%; opacity: 0.8; }
          }
        `}</style>
      </Head>

      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => {
            if (step === 2) {
              setStep(1);
            } else {
              router.push('/dashboard/rep');
            }
          }}
          className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-black mb-6 transition-colors border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft size={12} className="mr-1.5" />
          {step === 2 ? 'Back to lookup' : 'Back to dashboard'}
        </button>

        <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 mb-6">
            <div className="p-2.5 bg-blue-50/70 text-[#073afe] rounded-2xl">
              {replacementMode ? <RotateCcw size={22} /> : <QrCode size={22} />}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {replacementMode ? 'Replace Damaged Sticker' : 'Onboard Business & Link QR'}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {replacementMode 
                  ? 'Transfer client profile from a damaged sticker to a new unassigned sticker.'
                  : 'Scan a physical QR sticker, onboard the merchant, and activate the link.'
                }
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
              <AlertTriangle className="mr-2 h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: LOOKUP ================= */}
          {!replacementMode && step === 1 && (
            <div className="space-y-6">
              {/* Tab Switcher */}
              <div className="flex border-b border-slate-100 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('scan');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${verifyMethod === 'scan' ? 'border-[#073afe] text-[#073afe]' : 'border-transparent text-zinc-500'}`}
                >
                  1. Scan QR Sticker
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('manual');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${verifyMethod === 'manual' ? 'border-[#073afe] text-[#073afe]' : 'border-transparent text-zinc-500'}`}
                >
                  2. Enter Manually
                </button>
              </div>

              {/* METHOD 1: SCAN QR */}
              {verifyMethod === 'scan' && (
                <div className="space-y-6">
                  {cameraError ? (
                    <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-center space-y-4">
                      <AlertTriangle className="mx-auto h-8 w-8 text-black" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-black">Camera Permissions Blocked</h4>
                        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                          Please allow camera access in your browser settings to scan physical stickers directly, or use the manual entry fallback.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVerifyMethod('manual')}
                        className="bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border-none mx-auto"
                      >
                        Enter QR Code Manually
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Viewfinder Container */}
                      <div className="relative aspect-video bg-black rounded overflow-hidden border border-slate-200 flex flex-col items-center justify-center">
                        {cameraStream ? (
                          <>
                            {/* Live video */}
                            <video
                              autoPlay
                              playsInline
                              muted
                              ref={(el) => {
                                if (el && cameraStream) {
                                  el.srcObject = cameraStream;
                                }
                              }}
                              className="w-full h-full object-cover"
                            />
                            {/* Scanning mask overlays */}
                            <div className="absolute inset-0 border-[24px] border-black/45 pointer-events-none flex items-center justify-center">
                              {/* Inner focus brackets */}
                              <div className="w-40 h-40 border-2 border-dashed border-white/80 rounded relative">
                                {/* Moving red scanner line */}
                                <div className="absolute left-0 w-full h-[2px] bg-red-600 shadow-[0_0_8px_#ef4444] animate-[pulseScan_2s_infinite]" />
                              </div>
                            </div>
                            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-[9px] text-white px-2.5 py-1 rounded font-semibold tracking-wider uppercase">
                              Live Viewfinder Active
                            </span>
                          </>
                        ) : (
                          <div className="text-center space-y-2">
                            <Loader2 className="animate-spin h-6 w-6 text-white mx-auto" />
                            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                              Requesting webcam feed...
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Simulation Section */}
                      <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulate QR Code Scan</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Select a pre-seeded QR sticker from your sheet to simulate a camera capture.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <select
                            id="simulateQrSelect"
                            className="flex-1 text-xs border border-slate-200 rounded-xl bg-white px-2.5 py-1.5 focus:border-[#073afe] focus:outline-none font-mono uppercase"
                          >
                            <option value="QR-000004">QR-000004 (UNASSIGNED)</option>
                            <option value="QR-000005">QR-000005 (UNASSIGNED)</option>
                            <option value="QR-BELLA">QR-BELLA (ASSIGNED - Bella Italia)</option>
                            <option value="QR-LUXE">QR-LUXE (ASSIGNED - Luxe Salon)</option>
                            <option value="QR-000099">QR-000099 (INVALID/NON-EXISTENT)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const selectEl = document.getElementById('simulateQrSelect') as HTMLSelectElement;
                              if (selectEl) {
                                handleValidateQr(undefined, selectEl.value);
                              }
                            }}
                            className="bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border-none whitespace-nowrap"
                          >
                            Simulate Scan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* METHOD 2: ENTER MANUALLY */}
              {verifyMethod === 'manual' && (
                <form onSubmit={(e) => handleValidateQr(e)} className="space-y-6">
                  <div>
                    <label htmlFor="qrInput" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Enter QR Code Sticker Manually
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Type the printed serial number (e.g. QR-000004) from the sticker.
                    </p>
                    <div className="mt-2 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                        <QrCode size={16} />
                      </div>
                      <input
                        id="qrInput"
                        type="text"
                        required
                        value={inputQrCode}
                        onChange={(e) => setInputQrCode(e.target.value.toUpperCase())}
                        className="w-full text-xs border border-slate-200 rounded-xl bg-white pl-10 pr-3 py-2 focus:border-[#073afe] focus:outline-none focus:ring-2 focus:ring-[#073afe]/10 font-mono uppercase"
                        placeholder="QR-000004"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !inputQrCode.trim()}
                    className="w-full flex justify-center items-center bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                    Validate Sticker
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================= STEP 2: ASSIGN / ONBOARD FORM ================= */}
          {!replacementMode && step === 2 && validatedQr && (
            <div className="space-y-6">
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs">
                Selected QR Code Sticker: <strong className="font-mono text-black">{validatedQr.qrCode}</strong>
              </div>

              {/* Sub-tab Switcher */}
              <div className="flex border-b border-slate-100 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('existing');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${activeSubTab === 'existing' ? 'border-[#073afe] text-[#073afe]' : 'border-transparent text-zinc-500'}`}
                >
                  Link to Existing Business
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('new');
                    setError('');
                  }}
                  className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${activeSubTab === 'new' ? 'border-[#073afe] text-[#073afe]' : 'border-transparent text-zinc-500'}`}
                >
                  Onboard New Business
                </button>
              </div>

              {activeSubTab === 'existing' ? (
                <form onSubmit={handleAssignToExistingSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="existingBizSelect" className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
                      Select Business
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                      Choose an active business from the system to link with this QR code.
                    </p>
                    <select
                      id="existingBizSelect"
                      value={selectedBusinessId}
                      onChange={(e) => setSelectedBusinessId(e.target.value)}
                      className="mt-2 text-xs border border-slate-200 rounded-xl bg-white w-full px-3 py-2.5 focus:border-[#073afe] focus:outline-none"
                    >
                      {businesses.length === 0 ? (
                        <option value="">No active businesses found</option>
                      ) : (
                        businesses.map((biz) => (
                          <option key={biz.id} value={biz.id}>
                            {biz.name} ({biz.industry.replace('_', ' ')})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !selectedBusinessId}
                    className="w-full flex justify-center items-center bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer border-none disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                    Assign QR to Business
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOnboardSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="bizName" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Business Name
                      </label>
                      <input
                        id="bizName"
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="mt-1.5 w-full text-xs border border-slate-200 rounded-xl bg-white px-3 py-2 focus:border-[#073afe] focus:outline-none focus:ring-2 focus:ring-[#073afe]/10"
                        placeholder="e.g. Luxe Cafe"
                      />
                    </div>

                    <div>
                      <label htmlFor="bizIndustry" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Industry Scope
                      </label>
                      <select
                        id="bizIndustry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value as Industry)}
                        className="mt-1.5 text-xs border border-slate-200 rounded-xl bg-white w-full px-2.5 py-1.5 focus:border-[#073afe] focus:outline-none"
                      >
                        {Object.values(Industry).map((ind) => (
                          <option key={ind} value={ind}>{ind.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="bizPassword" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Dashboard Password
                      </label>
                      <input
                        id="bizPassword"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1.5 w-full text-xs border border-slate-200 rounded-xl bg-white px-3 py-2 focus:border-[#073afe] focus:outline-none focus:ring-2 focus:ring-[#073afe]/10"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="bizGoogle" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Google Review Page URL
                      </label>
                      <input
                        id="bizGoogle"
                        type="url"
                        value={googleReviewUrl}
                        onChange={(e) => setGoogleReviewUrl(e.target.value)}
                        className="mt-1.5 w-full text-xs border border-slate-200 rounded-xl bg-white px-3 py-2 focus:border-[#073afe] focus:outline-none focus:ring-2 focus:ring-[#073afe]/10"
                        placeholder="https://search.google.com/local/writereview?placeid=..."
                      />
                    </div>

                    <div>
                      <label htmlFor="bizPhone" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Contact Phone (Optional)
                      </label>
                      <input
                        id="bizPhone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1.5 w-full text-xs border border-slate-200 rounded-xl bg-white px-3 py-2 focus:border-[#073afe] focus:outline-none focus:ring-2 focus:ring-[#073afe]/10"
                        placeholder="+15551234"
                      />
                    </div>

                    <div>
                      <label htmlFor="bizAddress" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Address (Optional)
                      </label>
                      <input
                        id="bizAddress"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1.5 w-full text-xs border border-slate-200 rounded-xl bg-white px-3 py-2 focus:border-[#073afe] focus:outline-none focus:ring-2 focus:ring-[#073afe]/10"
                        placeholder="123 Main St, New York"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer border-none disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                    Onboard &amp; Link QR
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================= REPLACEMENT MODE FORM ================= */}
          {replacementMode && step === 1 && (
            <form onSubmit={handleReplaceQr} className="space-y-6">
              <div>
                <label htmlFor="oldQrInput" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  OLD Damaged QR Code
                </label>
                <input
                  id="oldQrInput"
                  type="text"
                  required
                  value={oldQrCode}
                  onChange={(e) => setOldQrCode(e.target.value.toUpperCase())}
                  className="mt-1.5 w-full text-xs border border-slate-200 rounded-xl bg-white px-3 py-2 focus:border-[#073afe] focus:outline-none focus:ring-2 focus:ring-[#073afe]/10 font-mono uppercase"
                  placeholder="QR-OLD123"
                />
              </div>

              <div>
                <label htmlFor="newQrInput" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  NEW Unassigned QR Code
                </label>
                <input
                  id="newQrInput"
                  type="text"
                  required
                  value={newQrCode}
                  onChange={(e) => setNewQrCode(e.target.value.toUpperCase())}
                  className="mt-1.5 w-full text-xs border border-slate-200 rounded-xl bg-white px-3 py-2 focus:border-[#073afe] focus:outline-none focus:ring-2 focus:ring-[#073afe]/10 font-mono uppercase"
                  placeholder="QR-NEW456"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer border-none disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Swap QR Sticker
              </button>
            </form>
          )}

          {/* ================= STEP 3: SUCCESS ================= */}
          {step === 3 && (
            <div className="text-center py-8 space-y-6">
              <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200/50 rounded-full flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Operation Successful</h3>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  {success}
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={resetForm}
                  className="inline-flex items-center space-x-1 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-[#073afe] font-semibold text-[10px] transition-colors justify-center"
                >
                  Perform another action
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/rep')}
                  className="bg-[#073afe] hover:bg-[#052ecb] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border-none justify-center"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
