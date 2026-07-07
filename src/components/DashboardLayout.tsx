import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Store,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  QrCode,
  BarChart3,
  MessageSquare,
  PhoneCall,
  Clock,
  ArrowLeft,
  Shield,
  ChevronRight,
  Bell
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<{
    highPriorityCount: number;
    mediumPriorityCount: number;
    unresolvedCount: number;
  } | null>(null);

  const businessId = router.query.businessId as string;
  const isReadOnly = router.query.readOnly === 'true';

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (user.role === 'SUPER_ADMIN' && businessId) {
          queryParams.append('businessId', businessId);
        }
        const res = await fetch(`/api/business/notifications?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications({
            highPriorityCount: data.highPriorityCount,
            mediumPriorityCount: data.mediumPriorityCount,
            unresolvedCount: data.unresolvedCount,
          });
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [user, businessId]);

  const navigation = (user?.role === 'SUPER_ADMIN' && isReadOnly && businessId)
    ? [
        { name: 'Business Dashboard', href: `/dashboard/business?businessId=${businessId}&readOnly=true`, icon: LayoutDashboard },
        { name: 'Reviews Feed', href: `/dashboard/business/reviews?businessId=${businessId}&readOnly=true`, icon: MessageSquare },
        { name: 'Customer Recovery', href: `/dashboard/business/recovery?businessId=${businessId}&readOnly=true`, icon: PhoneCall },
        { name: 'Profile Settings', href: `/dashboard/business/settings?businessId=${businessId}&readOnly=true`, icon: Settings },
        { name: 'Back to Admin', href: '/dashboard/admin/businesses', icon: ArrowLeft },
      ]
    : user?.role === 'SUPER_ADMIN'
    ? [
        { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        { name: 'QR Assets', href: '/dashboard/admin/qr', icon: QrCode },
        { name: 'REPs Management', href: '/dashboard/admin/reps', icon: Users },
        { name: 'User Accounts', href: '/dashboard/admin/users', icon: Shield },
        { name: 'Businesses', href: '/dashboard/admin/businesses', icon: Store },
        { name: 'Customer Recovery', href: '/dashboard/admin/recovery', icon: PhoneCall },
        { name: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
        { name: 'Subscriptions', href: '/dashboard/admin/subscriptions', icon: Clock },
        { name: 'Platform Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
        { name: 'Activity Logs', href: '/dashboard/admin/activity', icon: Clock },
      ]
    : user?.role === 'REP'
    ? [
        { name: 'Rep Dashboard', href: '/dashboard/rep', icon: LayoutDashboard },
        { name: 'Business Onboarding', href: '/dashboard/rep/onboarding', icon: Store },
        { name: 'Customer Recovery', href: '/dashboard/rep/recovery', icon: PhoneCall },
        { name: 'Assignment History', href: '/dashboard/rep/history', icon: Clock },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard/business', icon: LayoutDashboard },
        { name: 'Reviews', href: '/dashboard/business/reviews', icon: MessageSquare },
        { name: 'Customer Recovery', href: '/dashboard/business/recovery', icon: PhoneCall },
        { name: 'Settings', href: '/dashboard/business/settings', icon: Settings },
      ];

  const isActive = (href: string) => {
    const path = href.split('?')[0];
    return router.pathname === path;
  };

  const roleLabel = user?.role === 'SUPER_ADMIN'
    ? 'Super Admin'
    : user?.role === 'REP'
    ? 'Representative'
    : 'Business';

  const roleColor = user?.role === 'SUPER_ADMIN'
    ? 'bg-violet-100 text-violet-700 border border-violet-200'
    : user?.role === 'REP'
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    : 'bg-blue-100 text-[#073afe] border border-blue-200';

  const renderSidebarContent = () => (
    <>
      <div className="flex flex-col flex-grow overflow-y-auto">
        {/* Logo */}
        <div className="flex flex-col gap-2 px-5 py-[18px] border-b border-slate-100/50 items-start">
          <img src="/logo.png" alt="Cloutation" className="h-11 w-auto object-contain" />
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${roleColor}`}>
            {roleLabel}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center px-3.5 py-3 text-xs font-semibold rounded-[12px] transition-all duration-200 ease-out ${
                  active
                    ? 'bg-[#073AFE] text-white shadow-sm shadow-[#073AFE]/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                }`}
              >
                <Icon className={`mr-3 h-4.5 w-4.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                  active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                }`} size={16} />
                <span className="flex-1">{item.name}</span>
                {item.name === 'Customer Recovery' && notifications && (
                  <div className="flex items-center gap-1.5 ml-2 mr-1">
                    {notifications.highPriorityCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-red-600 rounded-full animate-pulse shadow-sm shadow-red-500/30">
                        {notifications.highPriorityCount}
                      </span>
                    )}
                    {notifications.mediumPriorityCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-orange-500 rounded-full shadow-sm shadow-orange-500/30">
                        {notifications.mediumPriorityCount}
                      </span>
                    )}
                  </div>
                )}
                {active && <ChevronRight size={12} className="text-white/80 animate-fadeIn" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="flex-shrink-0 border-t border-slate-100/50 p-3 bg-slate-50/40 backdrop-blur-md">
        <div className="flex items-center px-2.5 py-2.5 rounded-2xl hover:bg-slate-100/60 transition-colors group">
          <div className="h-8.5 w-8.5 rounded-full bg-[#073afe] flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-sm">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="ml-2.5 flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-950 truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-slate-450 truncate mt-0.5">{user?.email || roleLabel}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50/80 transition-all cursor-pointer shadow-sm border border-slate-100 bg-white"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200/50 bg-white/80 backdrop-blur-xl z-30 shadow-[4px_0_24px_rgba(15,23,42,0.015)]">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col max-w-[240px] w-full bg-white/90 backdrop-blur-xl border-r border-slate-200/50 z-50 shadow-2xl animate-slideUp">
            <div className="absolute top-3.5 right-3.5">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl border border-slate-200/60 bg-white text-slate-500 hover:bg-slate-550/10"
              >
                <X size={14} />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex flex-col flex-1 md:pl-60">

        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-20 md:hidden flex items-center justify-between h-14 px-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
          <img src="/logo.png" alt="Cloutation" className="h-8 w-auto object-contain" />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            <Menu size={16} />
          </button>
        </header>

        {/* Top Page Header Bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 flex items-center justify-between shadow-[0_4px_20px_rgba(15,23,42,0.015)]">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.role === 'SUPER_ADMIN'
                ? 'System Administration Panel'
                : user?.role === 'REP'
                ? 'Field Representative Portal'
                : 'Business Management Panel'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${roleColor}`}>
              <Shield size={11} className="fill-current" />
              {roleLabel} Portal
            </span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 py-6 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
