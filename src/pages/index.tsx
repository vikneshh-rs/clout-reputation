import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
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
  type: 'spring' as const,
  stiffness: 90,
  damping: 18,
  mass: 1
};

export default function LandingPage() {
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
    // Simulate API registration delay
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
          }
          body, p, span, div, a, button, select, input, textarea {
            font-family: 'Plus Jakarta Sans', sans-serif !important;
          }
        `}</style>
      </Head>

      {/* BACKGROUND GLOW SYSTEM (radial ambient glows + grid mask) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Fine background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        
        {/* Layered radial glow elements */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#1857D6]/10 to-cyan-500/5 blur-[120px] opacity-70" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1857D6]/5 blur-[100px] opacity-50" />
        <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-600/5 to-indigo-500/5 blur-[120px] opacity-60" />
      </div>

      {/* FLOATING GLASS NAVIGATION HEADER */}
      <header className="relative z-50 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-6">
        <div className="bg-white/72 backdrop-blur-xl border border-white/55 rounded-2xl px-6 py-4 flex items-center justify-between shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#1857D6] text-white rounded-xl">
              <QrCode size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0F172A] font-display">Clout Reputation</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            <a href="#how-it-works" className="hover:text-[#1857D6] transition-colors">How It Works</a>
            <a href="#product-showcase" className="hover:text-[#1857D6] transition-colors">Platform</a>
            <a href="#features" className="hover:text-[#1857D6] transition-colors">Features</a>
            <a href="#analytics" className="hover:text-[#1857D6] transition-colors">Analytics</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors uppercase tracking-wider"
            >
              Sign In
            </Link>
            <a
              href="#book-demo"
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#1857D6] hover:bg-[#154fc4] rounded-xl transition-all shadow-[0_4px_12px_rgba(24,87,214,0.2)] hover:shadow-[0_6px_16px_rgba(24,87,214,0.35)] uppercase tracking-wider cursor-pointer border-none"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Massive vertical padding) */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-36 lg:py-44 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-6 space-y-8 text-left">
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#1857D6]/8 border border-[#1857D6]/15 text-[#1857D6] gap-2 shadow-sm uppercase tracking-wider">
            <Sparkles size={12} className="animate-pulse" />
            QR-Powered Feedback Engine
          </div>

          <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-[#0F172A] leading-[1.05] font-display">
            Collect More <span className="text-[#1857D6]">5-Star Reviews.</span> Before Problems Go Public.
          </h1>

          <p className="text-[#64748B] text-lg sm:text-xl leading-relaxed max-w-xl">
            Turn customer feedback into private growth. Distribute smart QR codes to route positive sentiment straight to Google, and privately resolve unhappy guests on the spot.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <a
              href="#book-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 font-bold text-white bg-[#1857D6] hover:bg-[#154fc4] rounded-xl transition-all shadow-[0_4px_14px_rgba(24,87,214,0.25)] hover:shadow-[0_8px_20px_rgba(24,87,214,0.4)] gap-2 group cursor-pointer border-none text-sm uppercase tracking-wider"
            >
              Book a Demo
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 font-bold text-[#0F172A] bg-white/72 backdrop-blur-xl border border-white/55 rounded-xl hover:bg-white transition-all shadow-sm text-sm uppercase tracking-wider"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Right Column: Floating High-Fidelity Glassmorphic Mockup Stack */}
        <div className="lg:col-span-6 relative h-[500px] w-full flex items-center justify-center">
          {/* Card 1: Review Growth Chart Mockup (Back Layer) */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -2 }}
            animate={{ opacity: 1, y: -20, rotate: -3 }}
            transition={{ ...springTransition, delay: 0.1 }}
            className="absolute top-10 left-4 w-72 bg-white/72 backdrop-blur-xl border border-white/55 rounded-2xl p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] animate-float"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Google Review Velocity</span>
              <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/8 px-2 py-0.5 rounded-full">+148%</span>
            </div>
            <div className="flex items-baseline space-x-1.5 mb-2">
              <span className="text-2xl font-extrabold text-[#0F172A]">842</span>
              <span className="text-[10px] text-[#64748B]">new 5-stars</span>
            </div>
            {/* Small Sparkline SVG */}
            <svg className="w-full h-16 text-[#1857D6]" viewBox="0 0 100 30" fill="none">
              <path d="M0,25 Q15,22 30,10 T60,18 T90,2 T100,5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M0,25 Q15,22 30,10 T60,18 T90,2 T100,5 L100,30 L0,30 Z" fill="url(#blueGlow)" opacity="0.1" />
              <defs>
                <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1857D6" />
                  <stop offset="100%" stopColor="#1857D6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Card 2: Satisfaction Score Gauge (Center/Foreground Layer) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 40 }}
            transition={{ ...springTransition, delay: 0.2 }}
            className="absolute z-20 w-80 bg-white/72 backdrop-blur-xl border border-white/55 rounded-2xl p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-[#1857D6]/8 text-[#1857D6] rounded-lg">
                <Activity size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">Satisfaction Score</h4>
                <p className="text-[9px] text-[#64748B]">Real-time customer feedback sentiment</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-4xl font-extrabold text-[#0F172A] tracking-tight">4.92</div>
                <div className="flex text-[#1857D6]">
                  <Star size={10} className="fill-current" />
                  <Star size={10} className="fill-current" />
                  <Star size={10} className="fill-current" />
                  <Star size={10} className="fill-current" />
                  <Star size={10} className="fill-current" />
                </div>
              </div>
              <div className="w-16 h-16 relative flex items-center justify-center">
                {/* SVG Radial Progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                  <circle cx="32" cy="32" r="26" stroke="#1857D6" strokeWidth="6" fill="transparent"
                    strokeDasharray={163.3} strokeDashoffset={16.3} strokeLinecap="round" />
                </svg>
                <span className="absolute text-[10px] font-bold text-[#1857D6]">98.4%</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Recent Activity / Live redirect (Right / Top Layer) */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: 2 }}
            animate={{ opacity: 1, x: 20, rotate: 3 }}
            transition={{ ...springTransition, delay: 0.3 }}
            className="absolute top-0 right-4 w-72 bg-white/72 backdrop-blur-xl border border-white/55 rounded-2xl p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[10px] font-bold text-[#0F172A]">Live Sentiment Funnel</span>
              </div>
              <span className="text-[9px] text-[#64748B]">Just scanned</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <div className="space-y-0.5">
                  <strong className="block text-[#0F172A]">Luxe Salon</strong>
                  <span className="text-[9px] text-[#64748B]">QR-LUXE</span>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="flex text-[#1857D6] justify-end"><Star size={8} className="fill-current" /><Star size={8} className="fill-current" /><Star size={8} className="fill-current" /><Star size={8} className="fill-current" /><Star size={8} className="fill-current" /></div>
                  <span className="text-[9px] text-[#10B981] font-semibold bg-[#10B981]/8 px-1.5 py-0.5 rounded">Redirected to Google</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST SECTION (Minimalist, wide spacing) */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-16 border-t border-slate-200/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-widest block">Trusted Brands</span>
            <p className="text-xs text-[#64748B] mt-1 font-medium">Powering customer experiences across hundreds of locations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-6 opacity-60">
            {['RESTAURANTS', 'CAFES', 'CLINICS', 'HOTELS', 'SALONS'].map((label) => (
              <span key={label} className="text-sm font-extrabold tracking-widest text-[#0F172A] border border-slate-200 bg-white/40 px-3 py-1.5 rounded-lg shadow-sm font-display">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE HOW IT WORKS SECTION (Whitespace: 144px / py-36) */}
      <section id="how-it-works" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-36 border-t border-slate-200/50">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">How It Works</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-display">
            A Smart Review Funnel. Powered by physical stickers.
          </h2>
          <p className="text-[#64748B] text-base max-w-lg mx-auto">
            Try the sentiment simulator below to see how customer scores are routed in real-time.
          </p>
        </div>

        {/* 3 Step Description Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/72 backdrop-blur-xl border border-white/55 rounded-2xl p-8 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-300">
            <span className="text-3xl font-extrabold text-[#1857D6]/20 font-display block mb-4">01</span>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">Customer Scans QR</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Place premium, custom-branded QR stickers at tables, payment checkouts, or exit doors. Customers scan using their phone camera in under 2 seconds.
            </p>
          </div>

          <div className="bg-white/72 backdrop-blur-xl border border-white/55 rounded-2xl p-8 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-300">
            <span className="text-3xl font-extrabold text-[#1857D6]/20 font-display block mb-4">02</span>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">Rating Submission</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Customers rate their experience on a beautifully responsive, lightweight interface. No app download or account creation required.
            </p>
          </div>

          <div className="bg-white/72 backdrop-blur-xl border border-white/55 rounded-2xl p-8 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-300">
            <span className="text-3xl font-extrabold text-[#1857D6]/20 font-display block mb-4">03</span>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">Intelligent Sentiment Routing</h3>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Happy customers are immediately redirected to your Google listing to post reviews. Unhappy ratings open a private callback queue to recover their satisfaction.
            </p>
          </div>
        </div>

        {/* INTERACTIVE SENTIMENT SIMULATOR (Custom High-End B2B Showcase) */}
        <div className="bg-white/72 backdrop-blur-xl border border-white/55 rounded-3xl p-8 lg:p-12 shadow-[0_8px_30px_rgba(15,23,42,0.03)] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Simulator Left: Star Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1857D6]/8 text-[#1857D6] mb-3 uppercase tracking-wider">
                Live Interactive Sandbox
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A] leading-tight font-display">Test the Routing Engine</h3>
              <p className="text-xs text-[#64748B] mt-2">
                Click a rating below to simulate what a guest experiences after scanning a sticker on-site.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Select Score</label>
              <div className="flex items-center space-x-3">
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
                        ? 'bg-[#1857D6] text-white shadow-[0_4px_12px_rgba(24,87,214,0.3)] scale-105' 
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-350 hover:text-[#1857D6] hover:scale-102'
                    }`}
                  >
                    <Star size={20} className={selectedRating === stars || (selectedRating && selectedRating >= stars) ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>
            </div>

            {selectedRating && (
              <button
                type="button"
                onClick={resetFeedbackWidget}
                className="text-xs font-semibold text-[#1857D6] hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
              >
                Reset Simulator
              </button>
            )}
          </div>

          {/* Simulator Right: Conditional Funnel Outputs (Framer Motion Animation) */}
          <div className="lg:col-span-7 bg-[#F8FAFC] border border-slate-200/60 rounded-2xl p-6 min-h-[300px] flex flex-col justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {/* State A: Idle State */}
              {selectedRating === null && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-8 space-y-3"
                >
                  <div className="mx-auto w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 bg-white">
                    <Star size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">Select a Rating Star</h4>
                    <p className="text-xs text-[#64748B] max-w-xs mx-auto mt-1">
                      Choose a star value on the left to see the sentiment funnel routing actions live.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* State B: Positive Rating (4-5 Stars) -> Direct Google Redirect */}
              {selectedRating !== null && selectedRating >= 4 && (
                <motion.div
                  key="positive"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ ...springTransition }}
                  className="space-y-6"
                >
                  <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5">
                    <CheckCircle className="flex-shrink-0 text-[#10B981] mt-0.5" size={16} />
                    <div>
                      <strong className="block font-bold">Positive Sentiment Detected ({selectedRating} Stars)</strong>
                      <span className="text-[11px]">The customer is highly satisfied. The platform automatically triggers a direct Google Review redirect.</span>
                    </div>
                  </div>

                  {/* Redirection Preview Screen Mockup */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                      <span className="font-bold text-[#0F172A]">Review Funnel Screen</span>
                      <span className="text-[9px] text-[#64748B]">Mobile View</span>
                    </div>
                    <div className="text-center py-4 space-y-3">
                      <div className="text-xl font-bold text-slate-900 font-display">Thank you for your rating!</div>
                      <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                        We are redirecting you to our Google Reviews page to share your experience with the community.
                      </p>
                      {/* Simulated Loading bar */}
                      <div className="w-36 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden relative">
                        <div className="absolute top-0 left-0 h-full bg-[#1857D6] w-2/3 rounded-full animate-[pulseGlow_1.5s_infinite]" />
                      </div>
                      <span className="inline-block text-[10px] text-[#1857D6] font-bold uppercase tracking-wider pt-2">
                        Redirecting to google reviews...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* State C: Negative/Critical Rating (1-3 Stars) -> Private Feedback & Callback Request Form */}
              {selectedRating !== null && selectedRating <= 3 && (
                <motion.div
                  key="negative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ ...springTransition }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                    <PhoneCall className="flex-shrink-0 text-amber-600 mt-0.5" size={16} />
                    <div>
                      <strong className="block font-bold">Critical Sentiment Detected ({selectedRating} Stars)</strong>
                      <span className="text-[11px]">The customer had a subpar experience. The review funnel captures details privately for manager recovery.</span>
                    </div>
                  </div>

                  {!feedbackSubmitted ? (
                    <form onSubmit={handleFeedbackSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
                        <span className="font-bold text-[#0F172A]">Private Feedback Sheet</span>
                        <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">Private Capture</span>
                      </div>
                      
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
                          placeholder="Your Phone Number"
                          className="text-xs border border-slate-200 rounded-lg p-2 focus:border-[#1857D6] focus:outline-none"
                        />
                        <textarea
                          required
                          rows={2}
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="Please tell us what went wrong..."
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
                        <label htmlFor="callbackCheck" className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                          Request instant callback from a manager
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
                    <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm space-y-3">
                      <div className="mx-auto w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-200/50 rounded-full flex items-center justify-center">
                        <Check size={20} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900">Feedback Received</h4>
                        <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                          Thank you {feedbackName}. Your response has been privately logged. A manager will contact you at {feedbackPhone} shortly.
                        </p>
                      </div>
                      <div className="pt-2 text-[10px] text-zinc-400 italic">
                        *This rating was kept private and was not posted on Google.
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Section Contextual CTA */}
        <div className="text-center pt-8">
          <a
            href="#book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-wider"
          >
            <span>Schedule a Live Workflow Walkthrough</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* BESPOKE PRODUCT SHOWCASE (Whitespace: 144px / py-36) */}
      <section id="product-showcase" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-36 border-t border-slate-200/50 bg-[#FAFAFA]/50">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Platform Tour</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-display">
            A Command Center for Multi-site Reputation
          </h2>
          <p className="text-[#64748B] text-base max-w-lg mx-auto">
            Manage QR inventory, monitor active representatives, and track callback requests from a secure, unified dashboard.
          </p>
        </div>

        {/* High-Fidelity Mockup representing Super Admin Portal UI */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-6 shadow-[0_12px_45px_rgba(15,23,42,0.04)] overflow-hidden">
          {/* Mockup Windows Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-slate-200" />
              <span className="w-3 h-3 rounded-full bg-slate-200" />
              <span className="w-3 h-3 rounded-full bg-slate-200" />
              <span className="text-xs font-bold text-[#64748B] pl-4 font-mono">admin.cloutreputation.com/qr-inventory</span>
            </div>
            <span className="px-2.5 py-0.5 bg-blue-50 text-[10px] font-bold text-[#1857D6] rounded-full uppercase tracking-wider">Super Admin</span>
          </div>

          {/* Mockup Portal Body Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[480px]">
            {/* Sidebar Mockup (Col span 3) */}
            <div className="lg:col-span-3 border-r border-slate-100 pr-4 hidden lg:block space-y-6">
              <div className="flex items-center space-x-2.5 px-2">
                <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Navigation</span>
              </div>
              <div className="space-y-1">
                {[
                  { label: 'Dashboard', icon: Activity, active: false },
                  { label: 'QR Inventory', icon: QrCode, active: true },
                  { label: 'REPs Management', icon: Users, active: false },
                  { label: 'Businesses', icon: Building2, active: false },
                  { label: 'Platform Analytics', icon: TrendingUp, active: false }
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      item.active 
                        ? 'bg-[#1857D6] text-white shadow-sm' 
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={14} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Mockup Area (Col span 9) */}
            <div className="lg:col-span-9 space-y-6">
              {/* Row 1: Dashboard KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total QRs', val: '43' },
                  { label: 'Unassigned', val: '39', color: 'text-slate-500' },
                  { label: 'Assigned', val: '4', color: 'text-[#1857D6]' },
                  { label: 'Damaged/Other', val: '0', color: 'text-rose-500' }
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 shadow-sm">
                    <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">{kpi.label}</span>
                    <span className={`text-2xl font-extrabold block mt-1 ${kpi.color || 'text-[#0F172A]'}`}>{kpi.val}</span>
                  </div>
                ))}
              </div>

              {/* Row 2: Table Representation */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Inventory List</span>
                  <span className="text-[9px] text-[#64748B] font-semibold">Showing 4 assigned sites</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-slate-500 font-sans">
                    <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150">
                      <tr>
                        <th className="px-4 py-2.5">QR Code</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Assigned Business</th>
                        <th className="px-4 py-2.5 text-right">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { code: 'QR-BELLA', status: 'ASSIGNED', biz: 'Bella Italia', date: '6/15/2026' },
                        { code: 'QR-LUXE', status: 'ASSIGNED', biz: 'Luxe Salon', date: '6/15/2026' },
                        { code: 'QR-PARIS', status: 'ASSIGNED', biz: 'Cafe Paris', date: '6/15/2026' },
                        { code: 'QR-000004', status: 'UNASSIGNED', biz: 'None', date: '6/23/2026', unassigned: true }
                      ].map((row) => (
                        <tr key={row.code} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-bold text-[#1857D6]">{row.code}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                              row.unassigned 
                                ? 'bg-slate-100 text-slate-700' 
                                : 'bg-blue-50 text-[#1857D6] border border-blue-100'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#0F172A]">{row.biz}</td>
                          <td className="px-4 py-3 text-right text-slate-400 font-medium">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Contextual CTA */}
        <div className="text-center pt-10">
          <a
            href="#book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-wider"
          >
            <span>Tour the Admin &amp; Rep Dashboards</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* BESPOKE FEATURE GRID SECTION (Whitespace: 144px / py-36) */}
      <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-36 border-t border-slate-200/50">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Capabilities</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-display">
            Built for High-Velocity B2B Operations
          </h2>
          <p className="text-[#64748B] text-base max-w-lg mx-auto">
            Everything your representative agents and managers need to monitor, deploy, and scale customer sentiment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Smart Funnel Routing', desc: 'Positive experiences route straight to Google, while critical feedback goes privately to managers.', icon: Star },
            { title: 'QR Batch Manager', desc: 'Create, track, and print physical QR code sheets in clean, audited inventory lists.', icon: QrCode },
            { title: 'Multi-Location Support', desc: 'Monitor satisfaction scores and callback queues across multiple retail sites.', icon: Building2 },
            { title: 'Callback Requests', desc: 'Trigger instant notifications for customer callback requests to resolve issues privately.', icon: PhoneCall },
            { title: 'REP Onboarding Audits', desc: 'Audit representative actions, tracking which agents generated and assigned specific QR batches.', icon: Users },
            { title: 'Executive Analytics', desc: 'Unified control panel featuring satisfaction trends, conversion rates, and conversion velocities.', icon: TrendingUp },
            { title: 'Role-Based Portals', desc: 'Differentiated dashboard views and RBAC security rules for Admin, REP, and Merchant accounts.', icon: Shield },
            { title: 'Callback Resolution Queue', desc: 'Log manager action timestamps, recording who resolved callback issues and when.', icon: Layers }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/72 backdrop-blur-xl border border-white/55 rounded-2xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:shadow-[0_10px_35px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 transition-all duration-300 group"
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
        <div className="text-center pt-12">
          <a
            href="#book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-wider"
          >
            <span>Request Developer Docs &amp; Early Access</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* EXECUTIVE ANALYTICS SECTION (Whitespace: 144px / py-36) */}
      <section id="analytics" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-36 border-t border-slate-200/50 bg-[#FAFAFA]/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Side: Text and Metrics */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Business Intelligence</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-display">
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
                  <div className="flex justify-between text-xs font-bold text-[#0F172A]">
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
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-wider"
              >
                <span>See Analytics in Action</span>
                <ChevronRight size={14} />
              </a>
            </div>
          </div>

          {/* Right Side: Glassmorphic Chart Mockup (Executive Dashboard visualization) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_12px_45px_rgba(15,23,42,0.03)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-[#0F172A]">Reputation Velocity Trends</h4>
                <p className="text-[9px] text-[#64748B]">Satisfaction conversion compared by month</p>
              </div>
              <span className="text-[10px] font-bold text-[#1857D6] bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">B2B BI Engine</span>
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

            {/* Feed list representing conversion insights */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Top Positive Trigger</span>
                <strong className="block text-[#0F172A] mt-0.5">Service Speed</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Top Private Complaint</span>
                <strong className="block text-[#0F172A] mt-0.5">Wait Time</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION (Massive whitespace, glassmorphic card slider) */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-36 border-t border-slate-200/50">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Success Stories</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-display">
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
              className="bg-white/72 backdrop-blur-xl border border-white/55 rounded-2xl p-8 shadow-[0_4px_25px_rgba(15,23,42,0.02)] flex flex-col justify-between"
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
        <div className="text-center pt-10">
          <a
            href="#book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-wider"
          >
            <span>Read all Client Case Studies</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* CONVERSION DEMO & EARLY ACCESS SECTION (Replacing Pricing grid entirely) */}
      <section id="book-demo" className="relative z-10 w-full max-w-4xl mx-auto px-6 lg:px-8 py-36 border-t border-slate-200/50">
        <div className="bg-white/72 backdrop-blur-xl border border-white/55 rounded-3xl p-8 lg:p-12 shadow-[0_12px_45px_rgba(15,23,42,0.04)] space-y-8 relative overflow-hidden">
          {/* Decorative ambient background inside form card */}
          <div className="absolute top-0 right-0 w-52 h-52 bg-[#1857D6]/5 blur-3xl pointer-events-none rounded-full" />

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
                  <label htmlFor="leadName" className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Full Name</label>
                  <input
                    id="leadName"
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full text-xs border border-slate-250 rounded-xl px-3 py-2.5 bg-white focus:border-[#1857D6] focus:outline-none"
                    placeholder="e.g. Jean Picard"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="leadEmail" className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Business Email</label>
                  <input
                    id="leadEmail"
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="w-full text-xs border border-slate-250 rounded-xl px-3 py-2.5 bg-white focus:border-[#1857D6] focus:outline-none"
                    placeholder="name@company.com"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="leadCompany" className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Company Name</label>
                  <input
                    id="leadCompany"
                    type="text"
                    required
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    className="w-full text-xs border border-slate-250 rounded-xl px-3 py-2.5 bg-white focus:border-[#1857D6] focus:outline-none"
                    placeholder="e.g. Cafe Paris Group"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="leadIndustry" className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Industry</label>
                  <select
                    id="leadIndustry"
                    value={leadIndustry}
                    onChange={(e) => setLeadIndustry(e.target.value)}
                    className="w-full text-xs border border-slate-250 rounded-xl px-3 py-2.5 bg-white focus:border-[#1857D6] focus:outline-none"
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
                  className="w-full bg-[#1857D6] hover:bg-[#154fc4] text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(24,87,214,0.25)] hover:shadow-[0_6px_18px_rgba(24,87,214,0.35)] disabled:opacity-50 uppercase tracking-wider cursor-pointer border-none"
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
                <h4 className="text-lg font-bold text-[#0F172A]">Request Logged Successfully</h4>
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
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-8 py-36 text-center">
        <div className="bg-[#0F172A] border border-slate-900 rounded-3xl p-12 lg:p-16 shadow-[0_8px_30px_rgba(15,23,42,0.06)] space-y-8 relative overflow-hidden">
          {/* Custom glows for contrast context */}
          <div className="absolute top-[-20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-[#1857D6]/20 blur-[80px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-cyan-600/10 blur-[80px]" />

          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto font-display">
            Ready to Amplify Your Brand Reputation?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Join modern businesses utilizing Clout Reputation to collect more positive reviews, intercept complaints, and grow.
          </p>
          
          <div className="flex items-center justify-center pt-2">
            <a
              href="#book-demo"
              className="inline-flex items-center justify-center px-7 py-4 font-bold text-white bg-[#1857D6] hover:bg-[#154fc4] rounded-xl transition-all shadow-[0_4px_14px_rgba(24,87,214,0.3)] hover:shadow-[0_8px_20px_rgba(24,87,214,0.45)] gap-2 uppercase tracking-wider text-xs border-none cursor-pointer"
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
        <div className="flex items-center space-x-6 font-bold uppercase tracking-wider text-[9px]">
          <span>Modern Enterprise Reputation Management</span>
        </div>
      </footer>

      {/* Hidden Lock for Super Admins */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link
          href="/superadmin"
          className="block p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <Lock size={12} />
        </Link>
      </div>
    </div>
  );
}
