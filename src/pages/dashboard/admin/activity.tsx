import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string | null;
  user: string;
  role: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
}

export default function ActivityLogsPage(props: any) {
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = props;

  // State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API Filters
  const [dateFilter, setDateFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('ALL');

  // Client-side Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);
      if (actionTypeFilter !== 'ALL') params.append('actionType', actionTypeFilter);

      const res = await fetch(`/api/super-admin/activities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        setError('Failed to fetch activity logs.');
      }
    } catch (err) {
      setError('Network error fetching activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchLogs();
    }
  }, [user, dateFilter, actionTypeFilter]);

  const handleClearFilters = () => {
    setDateFilter('');
    setActionTypeFilter('ALL');
    setSearchQuery('');
    setRoleFilter('ALL');
  };

  // Perform client-side filter
  const filteredLogs = logs.filter((log) => {
    // 1. Role Filter
    const matchesRole = roleFilter === 'ALL' || log.role === roleFilter;

    // 2. Search Query (matches description, actor name, or action)
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      log.description.toLowerCase().includes(query) ||
      log.user.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query);

    return matchesRole && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-['Source_Sans_Pro']">
        <Loader2 className="animate-spin h-8 w-8 text-[#1853AB]" />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-['Source_Sans_Pro']">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-1">Super Admin permissions required.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Security & Activity Logs" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Activity Logs - Clout Reputation</title>
      </Head>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-xs text-slate-500 mt-0.5">Audit trail of all administrative and representative actions across the platform.</p>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-[#1853AB] font-semibold text-[10px] transition-colors self-start sm:self-auto"
          title="Reload logs list"
        >
          <RefreshCw size={12} />
          <span>Reload</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200/50 text-rose-700 text-xs flex items-start">
          <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table Card */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-8">
        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Database size={16} className="text-[#1853AB]" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Audit Log</h4>
          </div>

          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:flex-grow-0">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search size={12} className="text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actor or description"
                className="pl-8 pr-3 py-1.5 w-full sm:w-56 text-xs border border-slate-200 rounded-xl bg-white focus:border-[#1853AB] focus:outline-none focus:ring-2 focus:ring-[#1853AB]/10"
              />
            </div>

            {/* Date Filter (API) */}
            <div className="relative flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden">
              <Calendar size={12} className="text-slate-400 ml-2" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="p-1.5 text-xs bg-transparent focus:outline-none cursor-pointer text-slate-700"
              />
            </div>

            {/* Action Type Filter (API) */}
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl bg-white px-2.5 py-1.5 focus:border-[#1853AB] focus:outline-none font-medium text-slate-700"
            >
              <option value="ALL">All Actions</option>
              <option value="Business">Business Actions</option>
              <option value="Representative">REP Actions</option>
              <option value="QR">QR Inventory</option>
              <option value="Subscription">Subscription</option>
              <option value="Callback">Callbacks</option>
            </select>

            {/* Role Filter (Client-side) */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl bg-white px-2.5 py-1.5 focus:border-[#1853AB] focus:outline-none font-medium text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="REP">Representatives</option>
              <option value="BUSINESS">Businesses</option>
              <option value="SYSTEM">System/Cron</option>
            </select>

            {/* Clear Filters Button */}
            {(dateFilter || actionTypeFilter !== 'ALL' || searchQuery || roleFilter !== 'ALL') && (
              <button
                onClick={handleClearFilters}
                className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Directory List Table */}
        <div className="overflow-x-auto font-['Source_Sans_Pro']">
          {loading && logs.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-6 w-6 text-[#1853AB] mx-auto mb-2" />
              <span className="text-xs text-slate-400">Retrieving audit logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No audit logs match current filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 w-40">Timestamp</th>
                  <th className="px-6 py-3 w-44">Actor (User)</th>
                  <th className="px-6 py-3 w-28">Role</th>
                  <th className="px-6 py-3 w-40">Action Category</th>
                  <th className="px-6 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{log.user}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        log.role === 'SUPER_ADMIN'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                          : log.role === 'REP'
                          ? 'bg-blue-50 text-blue-700 border border-blue-150'
                          : log.role === 'BUSINESS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-medium text-slate-700">
                      {log.action}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
