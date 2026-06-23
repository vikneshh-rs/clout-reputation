import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  QrCode,
  Star,
  TrendingUp,
  MessageSquare,
  Layers,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Users,
  Shield,
  Activity,
  ChevronRight,
  Check,
  Building2,
  PhoneCall,
  Link as LinkIcon
} from 'lucide-react';

// Custom spring transition preset matching 500ms - 900ms duration feel
const springTransition = {
  type: 'spring',
  stiffness: 85,
  damping: 17,
  mass: 1.1
};

export default function LandingPage() {
  // Framer Motion Scroll Hook for Parallax Effects
  const { scrollY } = useScroll();

  // Background meshes slow drift
  const bgGlowY1 = useTransform(scrollY, [0, 3000], [0, 350]);
  const bgGlowY2 = useTransform(scrollY, [0, 3000], [0, -350]);
  const bgGlowY3 = useTransform(scrollY, [0, 3000], [0, 200]);

  // Hero Stack Parallax (moving at different speeds)
  const heroCard1Y = useTransform(scrollY, [0, 1000], [0, -110]);
  const heroCard2Y = useTransform(scrollY, [0, 1000], [0, -50]);
  const heroCard3Y = useTransform(scrollY, [0, 1000], [0, -160]);

  // Product Showcase Mockup Parallax
  const showcaseY = useTransform(scrollY, [600, 1800], [50, -50]);
  const showcaseOverlapY = useTransform(scrollY, [600, 1800], [120, -120]);

  // Analytics showcase Parallax
  const analyticsChartY = useTransform(scrollY, [1400, 2600], [60, -60]);

  // Lead Generation States
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadIndustry, setLeadIndustry] = useState('RESTAURANT');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Interactive Sentiment Routing Widget States
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackPhone, setFeedbackPhone] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [callbackRequested, setCallbackRequested] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadCompany) return;

    setFormLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setFormLoading(false);
    setFormSubmitted(true);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
  };

  const resetFeedbackWidget = () => {
    setSelectedRating(null);
    setFeedbackName('');
    setFeedbackPhone('');
    setFeedbackComment('');
    setCallbackRequested(true);
    setFeedbackSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#1857D6] selection:text-white relative overflow-hidden flex flex-col justify-between">
      <Head>
        <title>Clout Reputation | QR-Powered B2B Reputation Management Platform</title>
        <meta name="description" content="Turn customer feedback into business growth using QR-powered reviews, funnel routing, sentiment analytics, and customer recovery." />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          h1, h2, h3, .font-display {
            font-family: 'Outfit', sans-serif !important;
            letter-spacing: -0.03em !important;
          }
          body, p, span, div, a, button, select, input, textarea {
            font-family: 'Plus Jakarta Sans', sans-serif !important;
          }
          .glass-mac-frosted {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.44) 0%, rgba(255, 255, 255, 0.16) 100%);
            backdrop-filter: blur(30px) saturate(130%);
            border: 1px solid rgba(255, 255, 255, 0.55);
            box-shadow: 0 12px 40px -10px rgba(15, 23, 42, 0.03);
          }
          .glass-mac-frosted-dark {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.82) 100%);
            backdrop-filter: blur(30px) saturate(125%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 20px 50px -12px rgba(15, 23, 42, 0.25);
          }
          .text-glow {
            text-shadow: 0 0 50px rgba(24, 87, 214, 0.1);
          }
        `}</style>
      </Head>

      {/* ATMOSPHERIC BACKGROUND SYSTEM (Cinematic radial glow meshes + scroll parallax) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle architectural dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-35" />
        
        {/* Floating gradient meshes */}
        <motion.div style={{ y: bgGlowY1 }} className="absolute top-[-10%] left-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#1857D6]/8 to-cyan-400/3 blur-[140px] opacity-70" />
        <motion.div style={{ y: bgGlowY2 }} className="absolute top-[25%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-indigo-500/6 to-[#1857D6]/3 blur-[120px] opacity-60" />
        <motion.div style={{ y: bgGlowY3 }} className="absolute top-[50%] left-[-15%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#1857D6]/5 to-cyan-500/4 blur-[130px] opacity-65" />
        <motion.div style={{ y: bgGlowY1 }} className="absolute bottom-[10%] right-[10%] w-[900px] h-[900px] rounded-full bg-gradient-to-br from-[#1857D6]/7 to-indigo-600/3 blur-[150px] opacity-75" />
      </div>

      {/* FLOAT MAC-STYLE HEADER */}
      <header className="relative z-50 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-6">
        <div className="glass-mac-frosted rounded-2xl px-8 py-4.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#1857D6] text-white rounded-xl shadow-sm">
              <QrCode size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0F172A] font-display">Clout Reputation</span>
          </div>

          <nav className="hidden md:flex items-center space-x-10 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            <a href="#how-it-works" className="hover:text-[#1857D6] transition-colors">How It Works</a>
            <a href="#product-showcase" className="hover:text-[#1857D6] transition-colors">Platform</a>
            <a href="#features" className="hover:text-[#1857D6] transition-colors">Features</a>
            <a href="#analytics" className="hover:text-[#1857D6] transition-colors">Analytics</a>
          </nav>

          <div className="flex items-center space-x-5">
            <Link
              href="/login"
              className="text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] transition-colors uppercase tracking-widest"
            >
              Sign In
            </Link>
            <a
              href="#book-demo"
              className="inline-flex items-center justify-center px-5 py-3 text-[10px] font-bold text-white bg-[#1857D6] hover:bg-[#154fc4] rounded-xl transition-all shadow-[0_4px_12px_rgba(24,87,214,0.18)] hover:shadow-[0_6px_18px_rgba(24,87,214,0.3)] uppercase tracking-widest border-none"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Breathable 160px Spacing, Asymmetric visual stack) */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-40 xl:py-48 grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
        {/* Left Column: Typography Showcase */}
        <div className="lg:col-span-6 space-y-10 text-left">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-[#1857D6]/8 border border-[#1857D6]/15 text-[#1857D6] gap-2 shadow-sm uppercase tracking-widest">
            <Sparkles size={11} className="animate-pulse" />
            Autonomous Sentiment Funnel
          </div>

          <h1 className="text-6xl sm:text-7xl xl:text-8xl font-extrabold tracking-tight text-[#0F172A] leading-[0.98] font-display text-glow">
            Collect More <br/>
            <span className="text-[#1857D6]">5-Star Reviews.</span> <br/>
            Before Problems <br/>
            Become Public.
          </h1>

          <p className="text-[#64748B] text-lg leading-relaxed max-w-xl">
            Turn customer feedback into private growth. Distribute smart QR codes to route positive sentiment straight to Google, and privately resolve unhappy guests on the spot.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-5 pt-4">
            <a
              href="#book-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4.5 font-bold text-white bg-[#1857D6] hover:bg-[#154fc4] rounded-xl transition-all shadow-[0_8px_20px_rgba(24,87,214,0.25)] hover:shadow-[0_12px_28px_rgba(24,87,214,0.4)] gap-2 group border-none text-xs uppercase tracking-widest"
            >
              Book a Demo
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4.5 font-bold text-[#0F172A] glass-mac-frosted rounded-xl hover:bg-white/80 transition-all text-xs uppercase tracking-widest"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Right Column: Parallax 3D Stack (Tuned float offsets) */}
        <div className="lg:col-span-6 relative h-[500px] w-full flex items-center justify-center">
          {/* Card 1: Review Growth Chart Mockup (Deep Parallax Back Layer) */}
          <motion.div
            style={{ y: heroCard1Y }}
            className="absolute top-8 left-0 w-72 glass-mac-frosted rounded-2xl p-5 shadow-lg border border-white/50"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Google Review Velocity</span>
              <span className="text-[9px] font-bold text-[#10B981] bg-[#10B981]/8 px-2 py-0.5 rounded-full">+148%</span>
            </div>
            <div className="flex items-baseline space-x-1.5 mb-2">
              <span className="text-2xl font-extrabold text-[#0F172A] font-display">842</span>
              <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider">new 5-stars</span>
            </div>
            {/* Smooth SVG chart curve */}
            <svg className="w-full h-16 text-[#1857D6]" viewBox="0 0 100 30" fill="none">
              <path d="M0,25 Q15,22 30,10 T60,18 T90,2 T100,5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M0,25 Q15,22 30,10 T60,18 T90,2 T100,5 L100,30 L0,30 Z" fill="url(#heroBlueGlow)" opacity="0.1" />
              <defs>
                <linearGradient id="heroBlueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1857D6" />
                  <stop offset="100%" stopColor="#1857D6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Card 2: Satisfaction Score Gauge (Foreground Mid-Layer) */}
          <motion.div
            style={{ y: heroCard2Y }}
            className="absolute z-20 w-80 glass-mac-frosted rounded-2xl p-6 shadow-2xl border border-white/60"
          >
            <div className="flex items-center space-x-3.5 mb-4">
              <div className="p-2 bg-[#1857D6]/8 text-[#1857D6] rounded-xl">
                <Activity size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Satisfaction Index</h4>
                <p className="text-[9px] text-[#64748B]">Real-time customer satisfaction sentiment</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="text-4xl font-extrabold text-[#0F172A] tracking-tight font-display">4.92</div>
                <div className="flex text-[#1857D6] space-x-0.5">
                  <Star size={9} className="fill-current" />
                  <Star size={9} className="fill-current" />
                  <Star size={9} className="fill-current" />
                  <Star size={9} className="fill-current" />
                  <Star size={9} className="fill-current" />
                </div>
              </div>
              <div className="w-16 h-16 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="5.5" fill="transparent" />
                  <circle cx="32" cy="32" r="26" stroke="#1857D6" strokeWidth="5.5" fill="transparent"
                    strokeDasharray={163.3} strokeDashoffset={16.3} strokeLinecap="round" />
                </svg>
                <span className="absolute text-[9px] font-extrabold text-[#1857D6]">98.4%</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Recent Activity (Floating Top Layer) */}
          <motion.div
            style={{ y: heroCard3Y }}
            className="absolute top-[-20px] right-2 w-72 glass-mac-frosted rounded-2xl p-5 shadow-lg border border-white/50"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[9px] font-bold text-[#0F172A] uppercase tracking-wider">Live Sentiments</span>
              </div>
              <span className="text-[9px] text-[#64748B]">Just scanned</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <div className="space-y-0.5">
                  <strong className="block text-[#0F172A] font-semibold">Luxe Salon</strong>
                  <span className="text-[8px] text-[#64748B] font-mono">QR-LUXE</span>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="flex text-[#1857D6] justify-end"><Star size={7} className="fill-current" /><Star size={7} className="fill-current" /><Star size={7} className="fill-current" /><Star size={7} className="fill-current" /><Star size={7} className="fill-current" /></div>
                  <span className="text-[8px] text-[#10B981] font-bold bg-[#10B981]/8 px-1.5 py-0.5 rounded uppercase tracking-wider">Routed to Google</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST SECTION (Minimalist spacing, clean design) */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-16 border-t border-slate-200/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <span className="text-[9px] font-extrabold text-[#64748B] uppercase tracking-widest block">Supported Sectors</span>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Powering customer experiences across hundreds of hospitality and service locations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-6 opacity-60">
            {['RESTAURANTS', 'CAFES', 'CLINICS', 'HOTELS', 'SALONS'].map((label) => (
              <span key={label} className="text-xs font-bold tracking-widest text-[#0F172A] border border-slate-200 bg-white/40 px-3.5 py-2 rounded-xl shadow-sm font-display">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS & SENTIMENT SIMULATOR (Merged into one beautiful asymmetric composition,Whitespace: py-40) */}
      <section id="how-it-works" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-40 border-t border-slate-200/40">
        <div className="text-center max-w-3xl mx-auto mb-28 space-y-4">
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Sentiment Routing</span>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] tracking-tight font-display">
            A Smart Review Funnel.
          </h2>
          <p className="text-[#64748B] text-base max-w-lg mx-auto">
            Try the sentiment simulator below to see how customer scores are routed in real-time.
          </p>
        </div>

        {/* Asymmetrical Layout: Sandbox Simulator Left, 3 Steps on the Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Simulator Box (Col Span 7) */}
          <div className="lg:col-span-7 bg-[#F8FAFC]/40 border border-slate-200/60 rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[460px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-[#1857D6]/3 blur-3xl pointer-events-none rounded-full" />
            
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#1857D6]/8 text-[#1857D6] mb-3 uppercase tracking-widest">
                  Interactive Simulator
                </div>
                <h3 className="text-3xl font-bold text-[#0F172A] leading-tight font-display">Test the Routing Engine</h3>
                <p className="text-xs text-[#64748B] mt-2">
                  Select a star score below to simulate a real customer rating scan.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => {
                      setSelectedRating(stars);
                      setFeedbackSubmitted(false);
                    }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      selectedRating === stars 
                        ? 'bg-[#1857D6] text-white shadow-lg scale-105' 
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-300 hover:text-[#1857D6] hover:scale-102'
                    }`}
                  >
                    <Star size={18} className={selectedRating === stars || (selectedRating && selectedRating >= stars) ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>
            </div>

            {/* Sandbox funnels outputs */}
            <div className="mt-8 min-h-[220px] flex items-center">
              <AnimatePresence mode="wait">
                {selectedRating === null && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center w-full py-6 space-y-3"
                  >
                    <div className="mx-auto w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-350 bg-white">
                      <Star size={18} />
                    </div>
                    <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                      Choose a star value above to see the routing action live.
                    </p>
                  </motion.div>
                )}

                {selectedRating !== null && selectedRating >= 4 && (
                  <motion.div
                    key="positive"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full space-y-5"
                  >
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5">
                      <CheckCircle className="flex-shrink-0 text-[#10B981] mt-0.5" size={14} />
                      <span className="text-[11px] leading-relaxed">
                        <strong>Positive score ({selectedRating} stars) detected.</strong> The customer is directed straight to Google to boost public review numbers.
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                      <div className="text-center py-2 space-y-2">
                        <div className="text-base font-bold text-slate-900 font-display">Thank you for your rating!</div>
                        <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                          We are redirecting you to Google Reviews to write a review.
                        </p>
                        <div className="w-28 h-1 bg-slate-100 rounded-full mx-auto overflow-hidden relative">
                          <div className="absolute top-0 left-0 h-full bg-[#1857D6] w-2/3 rounded-full animate-[pulseGlow_1.5s_infinite]" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {selectedRating !== null && selectedRating <= 3 && (
                  <motion.div
                    key="negative"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="w-full space-y-4"
                  >
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                      <PhoneCall className="flex-shrink-0 text-amber-600 mt-0.5" size={14} />
                      <span className="text-[11px] leading-relaxed">
                        <strong>Critical score ({selectedRating} stars) detected.</strong> The review funnel captures feedback privately for immediate owner recovery.
                      </span>
                    </div>

                    {!feedbackSubmitted ? (
                      <form onSubmit={handleFeedbackSubmit} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            required
                            value={feedbackName}
                            onChange={(e) => setFeedbackName(e.target.value)}
                            placeholder="Your Name"
                            className="text-xs border border-slate-200 rounded-lg p-2 focus:border-[#1857D6] focus:outline-none"
                          />
                          <input
                            type="text"
                            required
                            value={feedbackPhone}
                            onChange={(e) => setFeedbackPhone(e.target.value)}
                            placeholder="Phone Number"
                            className="text-xs border border-slate-200 rounded-lg p-2 focus:border-[#1857D6] focus:outline-none"
                          />
                          <textarea
                            required
                            rows={2}
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            placeholder="How can we resolve your issue?"
                            className="sm:col-span-2 text-xs border border-slate-200 rounded-lg p-2 focus:border-[#1857D6] focus:outline-none resize-none"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="callbackCheck"
                            checked={callbackRequested}
                            onChange={(e) => setCallbackRequested(e.target.checked)}
                            className="rounded text-[#1857D6] focus:ring-[#1857D6]"
                          />
                          <label htmlFor="callbackCheck" className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">
                            Request callback from a manager
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#0F172A] hover:bg-black text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer border-none uppercase tracking-wider"
                        >
                          Submit Private Feedback
                        </button>
                      </form>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm space-y-2">
                        <div className="mx-auto w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                          <Check size={16} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">Feedback Logged</h4>
                        <p className="text-[11px] text-[#64748B] max-w-sm mx-auto">
                          Logged privately. A manager will contact you at {feedbackPhone}.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 3 Steps List (Col Span 5, offset/asymmetrical spacing) */}
          <div className="lg:col-span-5 space-y-10 pl-0 lg:pl-6">
            {[
              { num: '01', title: 'Deploy QR Codes', desc: 'Representatives print and assign custom serial QR badges to tables or point of sale checkout stands.' },
              { num: '02', title: 'Customers Scan', desc: 'Customers scan stickers with their camera, loading the platform in under 2 seconds without app downloads.' },
              { num: '03', title: 'Booster Routing', desc: 'Positive ratings route directly to Google, while critical feedback goes privately to owner callback request lists.' }
            ].map((step, idx) => (
              <div key={step.num} className="space-y-2 relative pl-12">
                <span className="absolute left-0 top-0 text-2xl font-extrabold text-[#1857D6]/20 font-display">
                  {step.num}
                </span>
                <h4 className="text-base font-bold text-[#0F172A]">{step.title}</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section Contextual CTA */}
        <div className="text-center pt-20">
          <a
            href="#book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-widest"
          >
            <span>Schedule a Live Workflow Walkthrough</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* CINEMATIC PRODUCT SHOWCASE (Whitespace: py-40, Tilted mockup with overlapping floating card) */}
      <section id="product-showcase" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-40 border-t border-slate-200/40 bg-[#FAFAFA]/50">
        <div className="text-center max-w-3xl mx-auto mb-28 space-y-4">
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Unified Console</span>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] tracking-tight font-display">
            A Command Center for Multi-site Reputation
          </h2>
          <p className="text-[#64748B] text-base max-w-lg mx-auto">
            Manage QR inventory, monitor active representatives, and track callback requests from a secure, unified dashboard.
          </p>
        </div>

        {/* Asymmetrical Mockup Container with Parallax overlays */}
        <div className="relative w-full max-w-5xl mx-auto h-[600px] flex items-center justify-center">
          {/* Main Mockup: Tilted macOS window */}
          <motion.div
            style={{ y: showcaseY }}
            className="absolute z-10 w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl overflow-hidden"
          >
            {/* Windows Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="text-[10px] font-bold text-[#64748B] pl-4 font-mono">admin.cloutreputation.com/qr-inventory</span>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-50 text-[9px] font-bold text-[#1857D6] rounded-full uppercase tracking-widest">Super Admin</span>
            </div>

            {/* Mockup Dashboard Table Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[350px]">
              {/* Sidebar Mockup */}
              <div className="lg:col-span-3 border-r border-slate-100 pr-4 hidden lg:block space-y-5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block px-2">Menu</span>
                <div className="space-y-1">
                  {[
                    { label: 'Dashboard', active: false },
                    { label: 'QR Inventory', active: true },
                    { label: 'REPs Panel', active: false },
                    { label: 'Businesses', active: false }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold ${
                        item.active ? 'bg-[#1857D6] text-white shadow-sm' : 'text-[#64748B]'
                      }`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Mockup */}
              <div className="lg:col-span-9 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Total QRs', v: '43' },
                    { l: 'Unassigned', v: '39' },
                    { l: 'Assigned', v: '4', c: 'text-[#1857D6]' }
                  ].map((kpi) => (
                    <div key={kpi.l} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-wider block">{kpi.l}</span>
                      <strong className={`text-lg font-bold block ${kpi.c || 'text-[#0F172A]'}`}>{kpi.v}</strong>
                    </div>
                  ))}
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                  <table className="min-w-full text-left text-[10px] text-slate-500 font-sans">
                    <thead className="bg-slate-50 font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150">
                      <tr>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Assigned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { code: 'QR-BELLA', status: 'ASSIGNED', biz: 'Bella Italia' },
                        { code: 'QR-LUXE', status: 'ASSIGNED', biz: 'Luxe Salon' },
                        { code: 'QR-000004', status: 'UNASSIGNED', biz: 'None', un: true }
                      ].map((row) => (
                        <tr key={row.code} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-mono font-bold text-[#1857D6]">{row.code}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                              row.un ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-[#1857D6]'
                            }`}>{row.status}</span>
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-[#0F172A]">{row.biz}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Overlapping Floating Component (Parallax Foreground layer, offset right) */}
          <motion.div
            style={{ y: showcaseOverlapY }}
            className="absolute z-20 bottom-10 right-0 w-80 glass-mac-frosted rounded-2xl p-5 shadow-2xl border border-white/60"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-[#1857D6]/8 text-[#1857D6] rounded-lg">
                <LinkIcon size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Quick Assignment</h4>
                <p className="text-[8px] text-[#64748B]">Assign QR stickers in one click</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg text-[10px] space-y-1 font-mono">
                <div>Sticker: <strong className="text-black">QR-000004</strong></div>
                <div>Status: <span className="text-[#1857D6] font-bold">UNASSIGNED</span></div>
              </div>
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-[#64748B] uppercase tracking-widest">Target Business</label>
                <div className="text-[10px] font-bold text-slate-800 border border-slate-200 rounded-lg p-2 bg-white flex justify-between items-center">
                  <span>Pondy Promoters</span>
                  <span className="text-[8px] text-slate-400 font-medium">RESTAURANT</span>
                </div>
              </div>
              <button
                type="button"
                className="w-full bg-[#1857D6] text-white text-[10px] font-bold py-2 rounded-lg border-none uppercase tracking-widest cursor-pointer"
              >
                Confirm Link
              </button>
            </div>
          </motion.div>
        </div>

        {/* Section Contextual CTA */}
        <div className="text-center pt-20">
          <a
            href="#book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-widest"
          >
            <span>Tour the Platform Portals</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* BESPOKE FEATURE GRID SECTION (Whitespace: py-40, staggered asymmetrical layout) */}
      <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-40 border-t border-slate-200/40">
        <div className="text-center max-w-3xl mx-auto mb-28 space-y-4">
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Capabilities</span>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] tracking-tight font-display">
            Built for High-Velocity B2B Operations
          </h2>
          <p className="text-[#64748B] text-base max-w-lg mx-auto">
            Everything your representative agents and managers need to monitor, deploy, and scale customer sentiment.
          </p>
        </div>

        {/* Asymmetrical staggered card list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: 'Smart Funnel Routing', desc: 'Positive experiences route straight to Google, while critical feedback goes privately to managers.', icon: Star, offset: false },
            { title: 'QR Batch Manager', desc: 'Create, track, and print physical QR code sheets in clean, audited inventory lists.', icon: QrCode, offset: true },
            { title: 'Multi-Location Support', desc: 'Monitor satisfaction scores and callback queues across multiple retail sites.', icon: Building2, offset: false },
            { title: 'Callback Requests', desc: 'Trigger instant notifications for customer callback requests to resolve issues privately.', icon: PhoneCall, offset: true },
            { title: 'REP Onboarding Audits', desc: 'Audit representative actions, tracking which agents generated and assigned specific QR batches.', icon: Users, offset: false },
            { title: 'Executive Analytics', desc: 'Unified control panel featuring satisfaction trends, conversion rates, and conversion velocities.', icon: TrendingUp, offset: true },
            { title: 'Role-Based Portals', desc: 'Differentiated dashboard views and RBAC security rules for Admin, REP, and Merchant accounts.', icon: Shield, offset: false },
            { title: 'Callback Resolution Queue', desc: 'Log manager action timestamps, recording who resolved callback issues and when.', icon: Layers, offset: true }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`glass-mac-frosted rounded-3xl p-7 shadow-sm transition-all duration-300 group ${
                item.offset ? 'lg:translate-y-8' : ''
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-[#1857D6]/8 text-[#1857D6] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                <item.icon size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] mb-2">{item.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Section Contextual CTA */}
        <div className="text-center pt-28">
          <a
            href="#book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-widest"
          >
            <span>Request Developer Docs &amp; Early Access</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* EXECUTIVE ANALYTICS SECTION (Whitespace: py-40, responsive SVG-chart mockup) */}
      <section id="analytics" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-40 border-t border-slate-200/40 bg-[#FAFAFA]/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          {/* Left Side: Text and Metrics */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Business Intelligence</span>
            <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] tracking-tight font-display">
              Turn Sentiment Into Executive Data
            </h2>
            <p className="text-[#64748B] text-base leading-relaxed">
              Identify satisfaction categories, analyze scan-to-review conversion funnels, and compare rating averages between locations to make data-backed growth decisions.
            </p>
            
            <div className="space-y-4 pt-2">
              {[
                { label: 'Scan-to-Review Conversion', percent: '68.4%' },
                { label: 'Negative Feedback Intercept Rate', percent: '96.2%' }
              ].map((metric) => (
                <div key={metric.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    <span>{metric.label}</span>
                    <span>{metric.percent}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1857D6] rounded-full" style={{ width: metric.percent }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <a
                href="#book-demo"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-widest"
              >
                <span>See Analytics in Action</span>
                <ChevronRight size={14} />
              </a>
            </div>
          </div>

          {/* Right Side: Parallax Glass Chart Panel */}
          <div className="lg:col-span-7 relative h-[420px] flex items-center justify-center">
            <motion.div
              style={{ y: analyticsChartY }}
              className="w-full glass-mac-frosted rounded-3xl p-6 shadow-2xl border border-white/60 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Reputation Velocity Trends</h4>
                  <p className="text-[9px] text-[#64748B]">Satisfaction conversion compared by month</p>
                </div>
                <span className="text-[9px] font-bold text-[#1857D6] bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">B2B BI Engine</span>
              </div>

              {/* High-Fidelity SVG Bar Graph */}
              <div className="h-44 w-full flex items-end justify-between px-2 pt-6">
                {[
                  { m: 'Jan', val: 40 },
                  { m: 'Feb', val: 65 },
                  { m: 'Mar', val: 55 },
                  { m: 'Apr', val: 80 },
                  { m: 'May', val: 70 },
                  { m: 'Jun', val: 95 }
                ].map((col, idx) => (
                  <div key={col.m} className="flex-1 flex flex-col items-center space-y-2 group">
                    <div className="w-full max-w-[28px] bg-slate-100 rounded-lg h-36 relative overflow-hidden flex items-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${col.val}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: idx * 0.05 }}
                        className="w-full bg-[#1857D6] rounded-t-lg"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#64748B]">{col.m}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION (Spacious case studies, minimal design) */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-40 border-t border-slate-200/40">
        <div className="text-center max-w-3xl mx-auto mb-28 space-y-4">
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Case Studies</span>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] tracking-tight font-display">
            Trusted by Enterprise Operators
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: '"Our Google review volume jumped 40% in our first two months. The private recovery screen helped us catch two service mistakes before they became public complaints."',
              name: 'Jean-Luc Picard',
              role: 'Owner, Cafe Paris'
            },
            {
              quote: '"Rep onboarding was instant. Our field representative assigned QR codes to our tables in under 5 minutes. The billing and statistics portal is very clean and simple."',
              name: 'Marco Silva',
              role: 'Manager, Bella Italia'
            },
            {
              quote: '"We run multiple salon locations, and tracking rep analytics has saved us huge resources. It\'s the cleanest, most minimalist feedback engine we have used."',
              name: 'Isabella Rossi',
              role: 'Founder, Luxe Salon'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-mac-frosted rounded-3xl p-8 shadow-sm flex flex-col justify-between"
            >
              <p className="text-[#64748B] text-xs italic leading-relaxed mb-6 font-medium">
                {item.quote}
              </p>
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#1857D6]/8 text-[#1857D6] flex items-center justify-center font-bold text-xs uppercase">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">{item.name}</h4>
                  <span className="text-[10px] text-[#64748B] font-semibold">{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section Contextual CTA */}
        <div className="text-center pt-12">
          <a
            href="#book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-widest"
          >
            <span>Read all Client Case Studies</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* CONVERSION DEMO & EARLY ACCESS SECTION (Lead Gen forms inside glass card) */}
      <section id="book-demo" className="relative z-10 w-full max-w-4xl mx-auto px-6 lg:px-8 py-40 border-t border-slate-200/40">
        <div className="glass-mac-frosted rounded-3xl p-8 lg:p-12 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 bg-[#1857D6]/4 blur-3xl pointer-events-none rounded-full" />

          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Get Started</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight font-display">
              Schedule Your Demo &amp; Access Request
            </h2>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Ready to grow your reputation? Share your details to schedule a live product walkthrough with our B2B team.
            </p>
          </div>

          {!formSubmitted ? (
            <form onSubmit={handleLeadSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="leadName" className="block text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Full Name</label>
                  <input
                    id="leadName"
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white/70 focus:border-[#1857D6] focus:outline-none"
                    placeholder="e.g. Jean Picard"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="leadEmail" className="block text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Business Email</label>
                  <input
                    id="leadEmail"
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white/70 focus:border-[#1857D6] focus:outline-none"
                    placeholder="name@company.com"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="leadCompany" className="block text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Company Name</label>
                  <input
                    id="leadCompany"
                    type="text"
                    required
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white/70 focus:border-[#1857D6] focus:outline-none"
                    placeholder="e.g. Cafe Paris Group"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="leadIndustry" className="block text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Industry</label>
                  <select
                    id="leadIndustry"
                    value={leadIndustry}
                    onChange={(e) => setLeadIndustry(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white/70 focus:border-[#1857D6] focus:outline-none"
                  >
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="CAFE">Cafe / Bakery</option>
                    <option value="SALON">Salon / Beauty</option>
                    <option value="CLINIC">Healthcare Clinic</option>
                    <option value="HOTEL">Hotel / Hospitality</option>
                    <option value="OTHER">Other Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-[#1857D6] hover:bg-[#154fc4] text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(24,87,214,0.2)] hover:shadow-[0_6px_18px_rgba(24,87,214,0.3)] disabled:opacity-50 uppercase tracking-widest cursor-pointer border-none"
                >
                  {formLoading ? 'Submitting request...' : 'Submit Request'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 space-y-4 max-w-sm mx-auto">
              <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200/50 rounded-full flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-[#0F172A]">Request Logged</h4>
                <p className="text-xs text-[#64748B]">
                  Thank you, {leadName}. Our team will review your application for **{leadCompany}** and reach out to schedule a live walkthrough within 24 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormSubmitted(false)}
                className="text-xs font-semibold text-[#1857D6] hover:underline bg-transparent border-none cursor-pointer"
              >
                Perform another request
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FINAL HIGH-CONTRAST CONVERSION CTA */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-8 py-40 text-center">
        <div className="glass-mac-frosted-dark rounded-3xl p-12 lg:p-16 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Ambient lighting glows inside dark panel */}
          <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#1857D6]/20 blur-[90px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[90px]" />

          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto font-display">
            Ready to Amplify Your Brand Reputation?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Join modern businesses utilizing Clout Reputation to collect more positive reviews, intercept complaints, and grow.
          </p>
          
          <div className="flex items-center justify-center pt-2">
            <a
              href="#book-demo"
              className="inline-flex items-center justify-center px-8 py-4.5 font-bold text-white bg-[#1857D6] hover:bg-[#154fc4] rounded-xl transition-all shadow-[0_4px_14px_rgba(24,87,214,0.35)] hover:shadow-[0_8px_22px_rgba(24,87,214,0.5)] gap-2 uppercase tracking-widest text-xs border-none cursor-pointer"
            >
              Schedule Your Live Demo Now
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-8 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Clout Reputation Logo"
            className="h-6 w-6 rounded-md object-contain mix-blend-multiply opacity-80"
          />
          <span>&copy; {new Date().getFullYear()} Clout Reputation. All rights reserved.</span>
        </div>
        <div className="flex items-center space-x-6 font-bold uppercase tracking-widest text-[9px]">
          <span>Modern Enterprise Reputation Management</span>
        </div>
      </footer>

      {/* Hidden Lock for Super Admins */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link
          href="/superadmin"
          className="block p-1.5 text-slate-350 hover:text-slate-500 transition-colors"
        >
          <Lock size={12} />
        </Link>
      </div>
    </div>
  );
}
