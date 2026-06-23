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
  const [feedbackComment, setFeedbackComment] = useState('');
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
    setFeedbackComment('');
    setFeedbackSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#1857D6] selection:text-white relative overflow-hidden flex flex-col justify-between">
      <Head>
        <title>Clout Reputation | QR-Powered B2B Reputation Management Platform</title>
        <meta name="description" content="Turn customer feedback into business growth using QR-powered reviews, funnel routing, sentiment analytics, and customer recovery." />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,900&display=swap" rel="stylesheet" />
        <style>{`
          h1, .font-display {
            font-family: 'Cabinet Grotesk', sans-serif !important;
            letter-spacing: -0.04em !important;
          }
          body, p, span, div, a, button, select, input, textarea {
            font-family: 'Inter', sans-serif !important;
          }
          .glass-mac-frosted {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.44) 0%, rgba(255, 255, 255, 0.16) 100%);
            backdrop-filter: blur(28px) saturate(130%);
            border: 1px solid rgba(255, 255, 255, 0.55);
            box-shadow: 0 12px 40px -10px rgba(15, 23, 42, 0.03);
          }
          .glass-mac-frosted-dark {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.82) 100%);
            backdrop-filter: blur(28px) saturate(125%);
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
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-40 xl:py-48 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Typography Showcase */}
        <div className="lg:col-span-5 space-y-10 text-left">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-[#1857D6]/8 border border-[#1857D6]/15 text-[#1857D6] gap-2 shadow-sm uppercase tracking-widest">
            <Sparkles size={11} className="animate-pulse" />
            Autonomous Sentiment Funnel
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-[84px] xl:text-[104px] font-black tracking-tight text-[#0F172A] leading-[0.9] font-display text-glow">
            Collect More <br/>
            <span className="text-[#1857D6]">5-Star Reviews.</span> <br/>
            Before Problems <br/>
            Become Public.
          </h1>

          <p className="text-[#64748B] text-base sm:text-lg leading-relaxed max-w-xl">
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

        {/* Right Column: Massive Product Composition (Dashboard & Floating Overlay Cards) */}
        <div className="lg:col-span-7 relative h-[600px] lg:h-[800px] w-full flex items-center justify-center lg:justify-start mt-16 lg:mt-0">
          {/* Atmospheric Glow Layer behind product */}
          <div className="absolute -inset-20 z-0 pointer-events-none select-none">
            <div className="absolute top-[15%] left-[10%] w-[550px] h-[550px] rounded-full bg-[#1857D6]/20 blur-[130px] animate-pulse" />
            <div className="absolute bottom-[15%] right-[5%] w-[500px] h-[500px] rounded-full bg-cyan-400/15 blur-[110px]" />
            <div className="absolute top-[30%] left-[40%] w-[450px] h-[450px] rounded-full bg-indigo-500/18 blur-[120px]" />
          </div>

          {/* Main Dashboard Mockup (Tilted/Offset Scale Representation) */}
          <motion.div
            style={{ y: heroCard2Y }}
            className="relative z-10 w-full lg:w-[850px] xl:w-[950px] origin-center lg:translate-x-12 xl:translate-x-20 select-none"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-[420px] lg:h-[550px] rounded-2xl border border-white/50 bg-white/45 backdrop-filter backdrop-blur-[28px] shadow-[0_50px_100px_-20px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col"
            >
              {/* Mock macOS Titlebar */}
              <div className="h-10 border-b border-slate-200/50 bg-white/30 flex items-center px-4 justify-between">
                <div className="flex space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
                  <span className="w-3 h-3 rounded-full bg-[#10B981]/80" />
                </div>
                <div className="text-[10px] font-semibold text-[#64748B] bg-white/40 border border-slate-200/20 rounded-md px-6 py-0.5 font-sans uppercase tracking-widest">
                  app.cloutreputation.com
                </div>
                <div className="w-12" />
              </div>

              {/* Mock Dashboard Layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-16 border-r border-slate-200/50 bg-white/20 flex flex-col items-center py-6 space-y-6">
                  <div className="p-2 bg-[#1857D6]/10 text-[#1857D6] rounded-xl">
                    <QrCode size={16} />
                  </div>
                  <div className="text-[#64748B] hover:text-[#1857D6] transition-colors p-1.5">
                    <Layers size={15} />
                  </div>
                  <div className="text-[#64748B] hover:text-[#1857D6] transition-colors p-1.5">
                    <Star size={15} />
                  </div>
                  <div className="text-[#64748B] hover:text-[#1857D6] transition-colors p-1.5">
                    <Users size={15} />
                  </div>
                  <div className="text-[#64748B] hover:text-[#1857D6] transition-colors p-1.5">
                    <TrendingUp size={15} />
                  </div>
                </div>

                {/* Main Panel */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col space-y-6">
                  {/* Upper Stats grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/45 border border-slate-100 rounded-xl p-3">
                      <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Reviews Routed</span>
                      <strong className="text-base lg:text-lg font-bold text-[#0F172A] block font-display">1,482</strong>
                      <span className="text-[7px] text-[#10B981] font-bold">+18.2% this month</span>
                    </div>
                    <div className="bg-white/45 border border-slate-100 rounded-xl p-3">
                      <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Average Rating</span>
                      <div className="flex items-center space-x-1">
                        <strong className="text-base lg:text-lg font-bold text-[#0F172A] font-display">4.92</strong>
                        <div className="flex text-[#1857D6]"><Star size={7} className="fill-current" /></div>
                      </div>
                      <span className="text-[7px] text-[#64748B] font-medium">98.4% satisfaction</span>
                    </div>
                    <div className="bg-white/45 border border-slate-100 rounded-xl p-3">
                      <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Feedback Capture</span>
                      <strong className="text-base lg:text-lg font-bold text-[#0F172A] block font-display">92.7%</strong>
                      <span className="text-[7px] text-[#1857D6] font-bold">Autonomous routing</span>
                    </div>
                  </div>

                  {/* Inner Dashboard content */}
                  <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
                    {/* Scan Log */}
                    <div className="bg-white/50 border border-slate-200/50 rounded-xl p-4 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest">Active Scan Stream</h4>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                      </div>
                      <div className="space-y-2 flex-1 overflow-hidden">
                        {[
                          { b: 'Luxe Salon', c: 'QR-LUXE', s: 'Routed to Google', r: 5, t: '2m ago', active: true },
                          { b: 'Cafe Paris', c: 'QR-PARIS', s: 'Private Recovery Form', r: 2, t: '15m ago', active: false },
                          { b: 'Prime Steak', c: 'QR-STEAK', s: 'Routed to Google', r: 5, t: '48m ago', active: true }
                        ].map((scan, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/35 border border-slate-100/50 text-[9px]">
                            <div className="space-y-0.5">
                              <strong className="block text-[#0F172A] font-semibold">{scan.b}</strong>
                              <span className="text-[7px] font-mono text-[#64748B]">{scan.c}</span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <div className="flex text-[#1857D6] justify-end">
                                {[...Array(scan.r)].map((_, idx) => (
                                  <Star key={idx} size={6} className="fill-current" />
                                ))}
                              </div>
                              <span className={`text-[6px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider block ${scan.active ? 'text-[#10B981] bg-[#10B981]/5' : 'text-amber-600 bg-amber-50'}`}>
                                {scan.s}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* QR Scan Speed / Chart Mockup */}
                    <div className="bg-white/50 border border-slate-200/50 rounded-xl p-4 flex flex-col min-h-0">
                      <h4 className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest mb-3">Sentiment Funnel Flow</h4>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] text-[#64748B]">
                            <span>Positive Sentiment (4-5 Stars)</span>
                            <span className="font-bold text-[#1857D6]">88%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#1857D6] h-full rounded-full" style={{ width: '88%' }} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] text-[#64748B]">
                            <span>Neutral / Critical (1-3 Stars)</span>
                            <span className="font-bold text-amber-600">12%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: '12%' }} />
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between text-[8px] text-[#64748B]">
                          <span>Automatic Google Redirects</span>
                          <span className="font-bold text-[#10B981] uppercase tracking-wider">Enabled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Card 1: Satisfaction Sentiment Indicator (Top Left / Mid Plane) */}
          <motion.div
            style={{ y: heroCard1Y }}
            className="absolute top-[30px] left-[-30px] xl:left-[-50px] z-30 select-none hidden sm:block"
          >
            <motion.div
              animate={{ y: [0, 10, 0], x: [0, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="w-64 glass-mac-frosted rounded-2xl p-5 shadow-2xl border border-white/60"
            >
              <div className="flex items-center space-x-3 mb-3.5">
                <div className="p-2.5 bg-[#1857D6]/8 text-[#1857D6] rounded-xl">
                  <Activity size={14} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Sentiment Score</h4>
                  <p className="text-[7px] text-[#64748B] uppercase tracking-wider font-bold">Real-time status</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-3xl font-black text-[#0F172A] font-display">4.92</div>
                  <div className="flex text-[#1857D6] space-x-0.5">
                    <Star size={8} className="fill-current" />
                    <Star size={8} className="fill-current" />
                    <Star size={8} className="fill-current" />
                    <Star size={8} className="fill-current" />
                    <Star size={8} className="fill-current" />
                  </div>
                </div>
                <div className="w-12 h-12 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="4.5" fill="transparent" />
                    <circle cx="24" cy="24" r="20" stroke="#1857D6" strokeWidth="4.5" fill="transparent"
                      strokeDasharray={125.6} strokeDashoffset={12.5} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-[8px] font-black text-[#1857D6]">98%</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Card 2: QR Scanner Distribution (Bottom Left / Foreground Plane) */}
          <motion.div
            style={{ y: heroCard2Y }}
            className="absolute bottom-[20px] left-[-10px] xl:left-[-30px] z-40 select-none hidden sm:block"
          >
            <motion.div
              animate={{ y: [0, -12, 0], x: [0, 3, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="w-72 glass-mac-frosted rounded-2xl p-5 shadow-2xl border border-white/60"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-widest">QR Scan Volume</span>
                <span className="text-[8px] font-bold text-[#10B981] bg-[#10B981]/8 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#0F172A] font-semibold">Luxe Salon (QR-LUXE)</span>
                  <span className="font-mono text-[#64748B]">512 scans</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#0F172A] font-semibold">Cafe Paris (QR-PARIS)</span>
                  <span className="font-mono text-[#64748B]">329 scans</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#0F172A] font-semibold">Prime Steak (QR-STEAK)</span>
                  <span className="font-mono text-[#64748B]">184 scans</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Card 3: Analytics Velocity Chart (Top Right / Deep Plane) */}
          <motion.div
            style={{ y: heroCard3Y }}
            className="absolute top-[-20px] right-[-10px] xl:right-[-40px] z-20 select-none hidden md:block"
          >
            <motion.div
              animate={{ y: [0, -8, 0], x: [0, -4, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-72 glass-mac-frosted rounded-2xl p-5 shadow-2xl border border-white/60"
            >
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-widest">Review Velocity</span>
                <span className="text-[8px] font-bold text-[#10B981] bg-[#10B981]/8 px-2 py-0.5 rounded-full">+148%</span>
              </div>
              <div className="flex items-baseline space-x-1.5 mb-2.5">
                <span className="text-2xl font-black text-[#0F172A] font-display">842</span>
                <span className="text-[8px] text-[#64748B] uppercase font-bold tracking-widest">New 5-Stars</span>
              </div>
              <svg className="w-full h-16 text-[#1857D6]" viewBox="0 0 100 30" fill="none">
                <path d="M0,25 Q15,22 30,10 T60,18 T90,2 T100,5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M0,25 Q15,22 30,10 T60,18 T90,2 T100,5 L100,30 L0,30 Z" fill="url(#heroRedesignBlueGlow)" opacity="0.1" />
                <defs>
                  <linearGradient id="heroRedesignBlueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1857D6" />
                    <stop offset="100%" stopColor="#1857D6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
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
                      <MessageSquare className="flex-shrink-0 text-amber-600 mt-0.5" size={14} />
                      <span className="text-[11px] leading-relaxed">
                        <strong>Critical score ({selectedRating} stars) detected.</strong> The review funnel captures feedback privately to protect your public rating.
                      </span>
                    </div>

                    {!feedbackSubmitted ? (
                      <form onSubmit={handleFeedbackSubmit} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-[8px] font-bold text-[#64748B] uppercase tracking-widest">Your Name</label>
                            <input
                              type="text"
                              required
                              value={feedbackName}
                              onChange={(e) => setFeedbackName(e.target.value)}
                              placeholder="e.g. Sarah"
                              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-[#1857D6] focus:outline-none bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[8px] font-bold text-[#64748B] uppercase tracking-widest">Private Comments</label>
                            <textarea
                              required
                              rows={3}
                              value={feedbackComment}
                              onChange={(e) => setFeedbackComment(e.target.value)}
                              placeholder="How can we resolve your issue?"
                              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-[#1857D6] focus:outline-none resize-none bg-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#0F172A] hover:bg-black text-white text-xs font-bold py-3 rounded-lg transition-colors cursor-pointer border-none uppercase tracking-widest"
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
                          Logged privately. Thank you for your feedback, our team will review it internally.
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
              { num: '03', title: 'Booster Routing', desc: 'Positive ratings route directly to Google, while critical feedback goes privately to your internal team.' }
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
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Brand Experience</span>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] tracking-tight font-display">
            A Command Center for Your Location's Reputation
          </h2>
          <p className="text-[#64748B] text-base max-w-lg mx-auto">
            Monitor guest reviews in real-time, track sentiment velocity, and recover unhappy diners privately before they post online.
          </p>
        </div>

        {/* Asymmetrical Mockup Container with Parallax overlays */}
        <div className="relative w-full max-w-5xl mx-auto h-[620px] flex items-center justify-center">
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
                <span className="text-[10px] font-bold text-[#64748B] pl-4 font-mono">bella-italia.cloutrep.com/dashboard</span>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-50 text-[9px] font-bold text-[#1857D6] rounded-full uppercase tracking-widest">Merchant Portal</span>
            </div>

            {/* Mockup Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[350px]">
              {/* Sidebar Mockup */}
              <div className="lg:col-span-3 border-r border-slate-100 pr-4 hidden lg:block space-y-5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block px-2">Bella Italia</span>
                <div className="space-y-1">
                  {[
                    { label: 'Overview', active: true },
                    { label: 'Live Reviews', active: false },
                    { label: 'Sentiment Trends', active: false },
                    { label: 'Feedback Setup', active: false }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold cursor-default ${
                        item.active ? 'bg-[#1857D6] text-white shadow-sm' : 'text-[#64748B]'
                      }`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Contents */}
              <div className="lg:col-span-9 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Average Rating', v: '4.92', c: 'text-[#0F172A]', s: '★ 98% positive' },
                    { l: 'Review Volume', v: '1,248', c: 'text-[#1857D6]', s: '+24% this month' },
                    { l: 'Private Recoveries', v: '43', c: 'text-[#10B981]', s: '100% resolved' }
                  ].map((kpi) => (
                    <div key={kpi.l} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-wider block mb-0.5">{kpi.l}</span>
                      <strong className={`text-base lg:text-lg font-bold block ${kpi.c}`}>{kpi.v}</strong>
                      <span className="text-[7px] text-[#64748B] font-medium block">{kpi.s}</span>
                    </div>
                  ))}
                </div>

                {/* Split grid: comments vs graph */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Feed */}
                  <div className="border border-slate-150 rounded-xl p-4 bg-white space-y-3">
                    <h4 className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest">Live Feedback Stream</h4>
                    <div className="space-y-2">
                      {[
                        { customer: 'Sarah Connor', text: 'Best lasagna in the city. Outstanding service!', source: 'Google', rating: 5, status: 'Routed' },
                        { customer: 'Jean Picard', text: 'Wait time was 25 minutes, but manager solved it.', source: 'Private', rating: 2, status: 'Recovered' },
                        { customer: 'Marcus A.', text: 'Tiramisu is legendary. Highly recommend.', source: 'Yelp', rating: 5, status: 'Routed' }
                      ].map((review, i) => (
                        <div key={i} className="p-2 border border-slate-100 rounded-lg text-[9px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F172A]">{review.customer}</span>
                            <span className="text-[7px] text-[#64748B]">{review.source}</span>
                          </div>
                          <p className="text-[#64748B] text-[8px] italic">"{review.text}"</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                            <div className="flex text-[#1857D6] space-x-0.5">
                              {[...Array(review.rating)].map((_, idx) => (
                                <Star key={idx} size={6} className="fill-current" />
                              ))}
                            </div>
                            <span className={`text-[6px] font-bold px-1 py-0.2 rounded uppercase tracking-wider ${
                              review.status === 'Recovered' ? 'text-[#10B981] bg-[#10B981]/8' : 'text-[#1857D6] bg-blue-50'
                            }`}>{review.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sentiment Velocity Graph */}
                  <div className="border border-slate-150 rounded-xl p-4 bg-white flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest">Sentiment Velocity</h4>
                      <span className="text-[8px] font-bold text-[#1857D6]">30 Day View</span>
                    </div>
                    {/* SVG Chart area */}
                    <div className="flex-1 min-h-[120px] flex items-end">
                      <svg className="w-full h-24 text-[#1857D6]" viewBox="0 0 100 40" fill="none">
                        <path d="M0,35 Q15,32 30,15 T60,25 T90,5 T100,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                        <path d="M0,35 Q15,32 30,15 T60,25 T90,5 T100,8 L100,40 L0,40 Z" fill="url(#showcaseBlueGlow)" opacity="0.1" />
                        
                        {/* Secondary dot line representing recovery events */}
                        <path d="M0,38 C20,38 40,28 60,18 C80,8 90,12 100,5" stroke="#10B981" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
                        <defs>
                          <linearGradient id="showcaseBlueGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1857D6" />
                            <stop offset="100%" stopColor="#1857D6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[7px] text-[#64748B] font-bold uppercase tracking-wider">
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1857D6]" />
                        <span>Google Reviews</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        <span>Private Recoveries</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Overlapping Floating Component: Private Recovery Funnel */}
          <motion.div
            style={{ y: showcaseOverlapY }}
            className="absolute z-20 bottom-10 right-0 w-80 glass-mac-frosted rounded-2xl p-5 shadow-2xl border border-white/60 select-none"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-[#10B981]/8 text-[#10B981] rounded-lg">
                <CheckCircle size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Private Recovery Funnel</h4>
                <p className="text-[8px] text-[#64748B]">Auto-intercept negative scans</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Guest:</span>
                  <strong className="text-black font-semibold">Jean Picard</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Score:</span>
                  <span className="text-amber-600 font-bold">★★☆☆☆ (2 Stars)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Action:</span>
                  <span className="text-[8px] font-bold text-[#10B981] bg-[#10B981]/5 px-1.5 py-0.5 rounded">Sent Comp Voucher</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50">
                <div className="flex items-center space-x-2 text-[#1857D6]">
                  <Check size={12} className="stroke-[3px]" />
                  <span className="font-bold uppercase tracking-wider">Saved Reputation</span>
                </div>
                <span className="text-[#64748B] font-medium text-[8px]">100% Private</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section Contextual CTA */}
        <div className="text-center pt-20">
          <a
            href="#book-demo"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1857D6] hover:underline uppercase tracking-widest"
          >
            <span>Schedule a Live Location Walkthrough</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </section>

      {/* BESPOKE FEATURE GRID SECTION (Whitespace: py-40, Bento Grid visual architecture) */}
      <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-40 border-t border-slate-200/40">
        <div className="text-center max-w-3xl mx-auto mb-24 space-y-4">
          <span className="text-xs font-bold text-[#1857D6] uppercase tracking-widest">Capabilities</span>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] tracking-tight font-display">
            Built for High-Velocity B2B Operations
          </h2>
          <p className="text-[#64748B] text-base max-w-lg mx-auto">
            Everything your representative agents and managers need to monitor, deploy, and scale customer sentiment.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Card 1: Smart Funnel Routing (cols 3) */}
          <div className="md:col-span-3 glass-mac-frosted rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl transition-all duration-300 h-[320px]">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#1857D6] flex items-center justify-center mb-3">
                <Star size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Smart Funnel Routing</h3>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-xs">
                Positive reviews are guided to public channels, while constructive feedback opens a private direct channel with managers.
              </p>
            </div>
            
            {/* Funnel Routing Visual Mockup */}
            <div className="w-full flex items-center justify-center space-x-4 mt-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[8px] font-bold text-[#0F172A] flex items-center space-x-1.5 shadow-sm">
                <span>Scan QR</span>
              </div>
              <span className="text-slate-350 text-[10px]">➔</span>
              <div className="flex flex-col space-y-2 text-[7px] font-bold">
                <div className="bg-[#10B981]/10 text-[#10B981] px-2 py-1 rounded border border-[#10B981]/20 flex items-center space-x-1">
                  <span>★★★★★</span>
                  <span>➔</span>
                  <span className="bg-[#1857D6] text-white px-1 rounded font-sans">Google</span>
                </div>
                <div className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded border border-amber-500/20 flex items-center space-x-1">
                  <span>★★☆☆☆</span>
                  <span>➔</span>
                  <span className="bg-[#0F172A] text-white px-1 rounded font-sans">Private</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Executive Analytics (cols 3) */}
          <div className="md:col-span-3 glass-mac-frosted rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl transition-all duration-300 h-[320px]">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#1857D6] flex items-center justify-center mb-3">
                <TrendingUp size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Executive Analytics</h3>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-xs">
                Visualize satisfaction scores, scan velocity rates, and conversion curves from a high-fidelity control deck.
              </p>
            </div>

            {/* Mini SVG graph visual */}
            <div className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 h-24 flex items-end">
              <svg className="w-full h-full text-[#1857D6]" viewBox="0 0 100 30" fill="none">
                <path d="M0,28 Q15,10 30,22 T60,5 T90,15 T100,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M0,28 Q15,10 30,22 T60,5 T90,15 T100,2 L100,30 L0,30 Z" fill="url(#bentoGraphGlow)" opacity="0.08" />
                <defs>
                  <linearGradient id="bentoGraphGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1857D6" />
                    <stop offset="100%" stopColor="#1857D6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Card 3: Multi-Location Support (cols 2) */}
          <div className="md:col-span-2 glass-mac-frosted rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl transition-all duration-300 h-[340px]">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#1857D6] flex items-center justify-center mb-3">
                <Building2 size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Multi-Location Support</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Compare rating indexes and response rates across all your locations in a single console.
              </p>
            </div>

            {/* List location metrics */}
            <div className="space-y-1.5 mt-4 bg-white/40 border border-slate-100 rounded-2xl p-3 text-[9px] font-sans">
              {[
                { n: 'Bella Italia', r: '4.92', p: '98%' },
                { n: 'Luxe Salon', r: '4.85', p: '96%' },
                { n: 'Bistro Hub', r: '4.90', p: '97%' }
              ].map((loc, i) => (
                <div key={i} className="flex justify-between items-center p-1.5 border-b border-slate-100 last:border-0">
                  <span className="font-bold text-[#0F172A]">{loc.n}</span>
                  <div className="flex space-x-2 text-[#64748B]">
                    <span>★ {loc.r}</span>
                    <span className="text-[#10B981] font-bold">{loc.p}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: QR Batch Manager & Onboarding (cols 4) */}
          <div className="md:col-span-4 glass-mac-frosted rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl transition-all duration-300 h-[340px]">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#1857D6] flex items-center justify-center mb-3">
                <QrCode size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">QR Batch Manager & Auditing</h3>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-md">
                Generate batches of physical QR codes, track representative onboarding steps, and audit active assignments within an immutable security log.
              </p>
            </div>

            {/* Sticker generation overlay visuals */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { id: 'QR-BELLA', status: 'Active', color: 'border-l-4 border-l-[#10B981]' },
                { id: 'QR-PARIS', status: 'Active', color: 'border-l-4 border-l-[#10B981]' },
                { id: 'QR-000004', status: 'Pending', color: 'border-l-4 border-l-amber-500' }
              ].map((qr, i) => (
                <div key={i} className={`bg-slate-50 border border-slate-155 rounded-xl p-3 text-[9px] ${qr.color}`}>
                  <div className="font-mono font-bold text-[#1857D6] mb-1">{qr.id}</div>
                  <div className="flex justify-between text-[7px] text-[#64748B] font-bold uppercase tracking-wider">
                    <span>Sticker</span>
                    <span className={qr.status === 'Active' ? 'text-[#10B981]' : 'text-amber-600'}>{qr.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Role-Based Portals (cols 3) */}
          <div className="md:col-span-3 glass-mac-frosted rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl transition-all duration-300 h-[300px]">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#1857D6] flex items-center justify-center mb-3">
                <Shield size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Role-Based Portals</h3>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-xs">
                Different interfaces custom-tailored for super admins, representative field agents, and business store managers.
              </p>
            </div>

            {/* Selector Visuals */}
            <div className="flex space-x-2 mt-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-[8px] font-bold justify-between">
              <span className="bg-white border border-slate-200 text-[#1857D6] px-2.5 py-1.5 rounded-lg shadow-sm">Admin Console</span>
              <span className="text-[#64748B] px-2.5 py-1.5">Representative App</span>
              <span className="text-[#64748B] px-2.5 py-1.5">Merchant Panel</span>
            </div>
          </div>

          {/* Card 6: Private Feedback Resolution (cols 3) */}
          <div className="md:col-span-3 glass-mac-frosted rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl transition-all duration-300 h-[300px]">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#1857D6] flex items-center justify-center mb-3">
                <Layers size={16} />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Private Feedback Resolution</h3>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-xs">
                Track resolution progress, log auto-compensations, and verify guest satisfaction from a unified inbox view.
              </p>
            </div>

            {/* Resolved timeline stream */}
            <div className="space-y-2 mt-4 text-[8px] font-medium border-l border-slate-200 pl-4 relative">
              <div className="relative">
                <span className="absolute left-[-20px] top-0.5 w-2 h-2 rounded-full bg-[#1857D6]" />
                <span className="font-bold text-[#0F172A]">10:14 AM</span> — Negative Scan Intercepted
              </div>
              <div className="relative">
                <span className="absolute left-[-20px] top-0.5 w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-bold text-[#0F172A]">10:15 AM</span> — Compensation Voucher Sent
              </div>
              <div className="relative">
                <span className="absolute left-[-20px] top-0.5 w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="font-bold text-[#0F172A]">10:19 AM</span> — Customer Feedback Resolved
              </div>
            </div>
          </div>
        </div>

        {/* Section Contextual CTA */}
        <div className="text-center pt-24">
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
