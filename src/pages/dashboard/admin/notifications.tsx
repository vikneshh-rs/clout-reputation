import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Bell, 
  Search, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  Download, 
  Copy, 
  X, 
  CheckCircle, 
  Eye, 
  TrendingUp, 
  Cpu, 
  Calendar,
  Layers,
  Check,
  Building,
  ChevronDown
} from 'lucide-react';
import { 
  NotificationBadge, 
  NotificationTimeline, 
  HealthStatusCard 
} from '@/components/ui/NotificationComponents';

interface Job {
  id: string;
  status: string;
  retryCount: number;
  notificationType: string;
  eventType: string;
  provider: string;
  recipient: string;
  payload: any;
  scheduledFor: string | null;
  processedAt: string | null;
  errorMessage: string | null;
  providerMessageId: string | null;
  providerStatus: string | null;
  providerResponse: any | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  processingTimeMs: number | null;
  createdAt: string;
  business: {
    id: string;
    name: string;
    slug: string;
  };
  review?: {
    id: string;
    customerName: string | null;
    rating: number;
  } | null;
}

export default function NotificationsAdmin(props: any) {
  const { theme, toggleTheme } = props;

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [cronStatus, setCronStatus] = useState<any>(null);
  
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [period, setPeriod] = useState('30d');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Drawer
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [jobLogs, setJobLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Statistics
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch(`/api/super-admin/notifications/stats?period=${period}`);
      if (res.ok) {
        const payload = await res.json();
        setStats(payload.summary);
        setProviders(payload.providers || []);
        setCronStatus(payload.cronStatus);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Jobs List
  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      setError('');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status,
        provider,
        notificationType,
        sortBy,
        sortOrder
      });

      const res = await fetch(`/api/super-admin/notifications/jobs?${params.toString()}`);
      if (res.ok) {
        const payload = await res.json();
        setJobs(payload.jobs || []);
        setTotalPages(payload.totalPages || 1);
        setTotalCount(payload.totalCount || 0);
      } else {
        setError('Failed to fetch notification queue list.');
      }
    } catch (err) {
      setError('Network error fetching notification jobs.');
    } finally {
      setLoadingJobs(false);
    }
  };

  // Trigger retry
  const handleRetry = async (jobId: string) => {
    try {
      setRetryingId(jobId);
      const res = await fetch('/api/super-admin/notifications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      if (res.ok) {
        setSuccess('Notification job reset to PENDING successfully.');
        setTimeout(() => setSuccess(''), 4000);
        // Refresh local items
        fetchJobs();
        fetchStats();
        if (selectedJob && selectedJob.id === jobId) {
          // Update selected job state in drawer
          setSelectedJob({
            ...selectedJob,
            status: 'PENDING',
            errorMessage: null
          });
          // Refresh logs
          fetchLogs(jobId);
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to queue retry.');
      }
    } catch (err) {
      setError('Network error attempting retry.');
    } finally {
      setRetryingId(null);
    }
  };

  // Fetch attempt logs for details drawer
  const fetchLogs = async (jobId: string) => {
    try {
      setLoadingLogs(true);
      const res = await fetch(`/api/super-admin/notifications/logs?jobId=${jobId}`);
      if (res.ok) {
        const payload = await res.json();
        setJobLogs(payload.logs || []);
      }
    } catch (err) {
      console.error('Failed loading attempt logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Open Drawer Details
  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setDrawerOpen(true);
    fetchLogs(job.id);
  };

  // Copy UUID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export CSV
  const handleExport = () => {
    if (jobs.length === 0) return;
    
    // Construct CSV Header
    const headers = ['Notification ID', 'Business', 'Recipient', 'Provider', 'Type', 'Event', 'Status', 'Retries', 'Queued At', 'Completed At', 'Duration (ms)', 'Error Message'];
    const rows = jobs.map(j => [
      j.id,
      j.business?.name || '',
      j.recipient,
      j.provider,
      j.notificationType,
      j.eventType,
      j.status,
      j.retryCount,
      j.queuedAt,
      j.completedAt || '',
      j.processingTimeMs || '',
      j.errorMessage || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `notification_jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  useEffect(() => {
    fetchJobs();
  }, [page, search, status, provider, notificationType, sortBy, sortOrder]);

  return (
    <DashboardLayout title="Notification Engine Control" theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Notification Management - Cloutation</title>
      </Head>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, inspect, and manage delivery dispatches, provider integrations, andpg_cron execution loops.
          </p>
        </div>

        {/* Timeline selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 border border-slate-200/80 rounded-2xl shadow-sm">
          <label htmlFor="period-stats" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
            Period
          </label>
          <select
            id="period-stats"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer pr-1"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2.5 font-medium animate-fadeIn">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2.5 font-medium animate-fadeIn">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-100 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] p-5 flex justify-between items-center group">
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Generated</span>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none">
              {loadingStats ? <Loader2 className="animate-spin h-5 w-5 text-slate-300" /> : stats?.totalNotifications ?? 0}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-[#073afe] border border-blue-100/30 rounded-2xl group-hover:scale-105 transition-all">
            <Bell size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] p-5 flex justify-between items-center group">
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Queue</span>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none">
              {loadingStats ? <Loader2 className="animate-spin h-5 w-5 text-slate-300" /> : stats?.queueLength ?? 0}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 border border-amber-100/30 rounded-2xl group-hover:scale-105 transition-all">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] p-5 flex justify-between items-center group">
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Delivery Success</span>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none">
              {loadingStats ? <Loader2 className="animate-spin h-5 w-5 text-slate-300" /> : `${stats?.successRate ?? 100}%`}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100/30 rounded-2xl group-hover:scale-105 transition-all">
            <CheckCircle size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] p-5 flex justify-between items-center group">
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Avg Latency</span>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-none">
              {loadingStats ? <Loader2 className="animate-spin h-5 w-5 text-slate-300" /> : `${stats?.avgProcessingTime ?? 0}ms`}
            </h3>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 border border-violet-100/30 rounded-2xl group-hover:scale-105 transition-all">
            <Cpu size={18} />
          </div>
        </div>
      </div>

      {/* Advanced metrics & Health section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Queue Metrics widget */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <Layers size={14} className="text-slate-400" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Queue Metrics</h4>
          </div>
          <div className="space-y-3 text-xs text-slate-500 font-medium flex-grow pt-2">
            <div className="flex justify-between">
              <span>Waiting (Pending):</span>
              <strong className="text-slate-900">{stats?.pending ?? 0} jobs</strong>
            </div>
            <div className="flex justify-between">
              <span>Currently Processing:</span>
              <strong className="text-slate-900">{stats?.processing ?? 0} jobs</strong>
            </div>
            <div className="flex justify-between">
              <span>Throughput (24h):</span>
              <strong className="text-slate-950 font-bold text-emerald-600">+{stats?.throughput?.recent24h ?? 0} ({stats?.throughput?.messagesPerHour ?? 0}/hr)</strong>
            </div>
            <div className="flex justify-between">
              <span>Longest Pending wait:</span>
              <strong className="text-slate-900">
                {stats?.longestWaitingTimeMs ? `${Math.round(stats.longestWaitingTimeMs / 60000)} mins` : 'None'}
              </strong>
            </div>
          </div>
        </div>

        {/* Dynamic Provider Health */}
        {providers.map((p, idx) => (
          <HealthStatusCard
            key={idx}
            name={p.name}
            status={p.status}
            successRate={p.successRate}
            avgLatencyMs={p.avgLatencyMs}
            lastCallTime={p.lastCallTime}
            lastError={p.lastError}
          />
        ))}

        {/* Cron Monitor */}
        {cronStatus && (
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full bg-emerald-500`} />
                <h4 className="text-xs font-bold text-slate-900">Database pg_cron</h4>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-100 bg-emerald-50 text-emerald-700">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-500 font-medium">
              <div className="flex justify-between">
                <span>Last Run:</span>
                <strong className="text-slate-950">{new Date(cronStatus.lastRun).toLocaleTimeString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Next Scheduled Run:</span>
                <strong className="text-slate-950">{new Date(cronStatus.nextRun).toLocaleTimeString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Last Execution Duration:</span>
                <strong className="text-slate-950">{cronStatus.lastExecutionDurationMs}ms</strong>
              </div>
              <div className="flex justify-between">
                <span>Errors / Skipped:</span>
                <strong className="text-rose-600 font-bold">{cronStatus.failedExecutions}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Jobs Queue Section */}
      <div className="bg-white border border-slate-100 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
        {/* Filter bar */}
        <div className="p-6 border-b border-slate-100/80 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2.5">
            <Cpu size={16} className="text-[#073afe]" />
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-sans">Dispatch Queue</h4>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:flex-grow-0">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={13} className="text-slate-400" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search ID, recipient, customer..."
                className="pl-9 pr-3.5 py-2 w-full sm:w-56 text-xs border border-slate-200 rounded-xl focus:border-[#073afe] focus:outline-none transition-all bg-white"
              />
            </div>

            {/* Filter Status */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#073afe] focus:outline-none font-bold text-slate-700 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="PERMANENTLY_FAILED">Permanently Failed</option>
            </select>

            {/* Filter Type */}
            <select
              value={notificationType}
              onChange={(e) => { setNotificationType(e.target.value); setPage(1); }}
              className="px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#073afe] focus:outline-none font-bold text-slate-700 bg-white"
            >
              <option value="">All Types</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>

            {/* Filter Provider */}
            <select
              value={provider}
              onChange={(e) => { setProvider(e.target.value); setPage(1); }}
              className="px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#073afe] focus:outline-none font-bold text-slate-700 bg-white"
            >
              <option value="">All Providers</option>
              <option value="TWILIO">Twilio</option>
              <option value="META">Meta</option>
            </select>

            {/* Export */}
            <button
              onClick={handleExport}
              disabled={jobs.length === 0}
              className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer border-none"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          {loadingJobs && jobs.length === 0 ? (
            <div className="p-16 text-center">
              <Loader2 className="animate-spin h-6 w-6 text-[#073afe] mx-auto mb-2" />
              <span className="text-xs text-slate-400 font-semibold">Scanning dispatcher database...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 font-medium">
              No notifications matching the active filters were found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-sans">
              <thead className="bg-slate-50/50 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Recipient & Business</th>
                  <th className="px-6 py-3.5">Details</th>
                  <th className="px-6 py-3.5">Type & Provider</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/30 transition-colors">
                    {/* Recipient info */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <strong className="block text-slate-900 font-bold truncate max-w-[160px]">{job.recipient}</strong>
                        <span className="block text-[10px] text-slate-400 font-semibold">{job.business?.name}</span>
                      </div>
                    </td>

                    {/* Details/Customer */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <strong className="block text-slate-700 font-semibold truncate max-w-[160px]">
                          {job.review?.customerName || 'Anonymous Guest'}
                        </strong>
                        <span className="block text-[10px] text-slate-400">
                          {job.review?.rating ? `${job.review.rating} ★ Rating` : 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Channel & Provider */}
                    <td className="px-6 py-4">
                      <div className="space-y-1 font-mono uppercase text-[9px] font-bold text-slate-500">
                        <div>{job.notificationType}</div>
                        <div className="text-slate-400">{job.provider}</div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <NotificationBadge status={job.status} />
                        {job.retryCount > 0 && (
                          <div className="text-[9px] text-slate-400 font-semibold pl-1">
                            {job.retryCount} Retries
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-slate-600 font-medium">
                        {job.processingTimeMs ? `${job.processingTimeMs}ms` : '-'}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {new Date(job.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewJob(job)}
                          className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-650 cursor-pointer transition-all hover:scale-105"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        
                        {(job.status === 'FAILED' || job.status === 'PERMANENTLY_FAILED') && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            disabled={retryingId === job.id}
                            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[#073afe] cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                            title="Retry Dispatch"
                          >
                            <RotateCw size={13} className={retryingId === job.id ? 'animate-spin' : ''} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total jobs)
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-250 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-250 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Details Drawer */}
      {drawerOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full h-full shadow-2xl flex flex-col animate-slideRight">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-[#073afe] rounded-xl">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-sans">Notification Details</h3>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    {selectedJob.id}
                    <button 
                      onClick={() => handleCopyId(selectedJob.id)} 
                      className="text-slate-400 hover:text-slate-600 focus:outline-none ml-1 cursor-pointer"
                    >
                      {copiedId === selectedJob.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {(selectedJob.status === 'FAILED' || selectedJob.status === 'PERMANENTLY_FAILED') && (
                  <button
                    onClick={() => handleRetry(selectedJob.id)}
                    disabled={retryingId === selectedJob.id}
                    className="px-3 py-1.5 border border-slate-250 bg-white hover:bg-slate-50 text-[#073afe] font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-sm transition-all"
                  >
                    <RotateCw size={11} className={retryingId === selectedJob.id ? 'animate-spin' : ''} />
                    <span>Retry</span>
                  </button>
                )}
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-450 focus:outline-none"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 text-xs text-slate-600">
              {/* Overview Card */}
              <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[20px] space-y-3.5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Overview</span>
                  <NotificationBadge status={selectedJob.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Business</span>
                    <strong className="text-slate-800 font-bold block mt-0.5">{selectedJob.business?.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Recipient</span>
                    <strong className="text-slate-800 font-bold block mt-0.5">{selectedJob.recipient}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Provider & Channel</span>
                    <span className="font-mono uppercase text-slate-700 block mt-0.5">
                      {selectedJob.provider} ({selectedJob.notificationType})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Event Trigger</span>
                    <span className="font-mono text-slate-700 block mt-0.5">{selectedJob.eventType}</span>
                  </div>
                </div>
              </div>

              {/* Payload pretty JSON */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 font-sans">
                  Payload JSON
                </h4>
                <pre className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl font-mono text-[10.5px] leading-relaxed text-slate-700 overflow-x-auto max-h-56">
                  {JSON.stringify(selectedJob.payload, null, 2)}
                </pre>
              </div>

              {/* Provider Response Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 font-sans">
                  Provider Feedback
                </h4>
                <div className="space-y-2.5 bg-slate-50/30 border border-slate-100 p-4.5 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Message ID</span>
                    <span className="font-mono text-slate-700 block mt-0.5">{selectedJob.providerMessageId || 'None'}</span>
                  </div>
                  {selectedJob.errorMessage && (
                    <div className="p-3 bg-rose-50/50 border border-rose-100 text-rose-700 rounded-xl font-mono text-[10px] leading-normal break-all">
                      {selectedJob.errorMessage}
                    </div>
                  )}
                  {selectedJob.providerResponse && (
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Raw Response</span>
                      <pre className="p-3 bg-white border border-slate-200/50 rounded-xl font-mono text-[9px] text-slate-600 overflow-x-auto max-h-40">
                        {JSON.stringify(selectedJob.providerResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Attempt logs timeline */}
              <div className="space-y-4">
                <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 font-sans">
                  Audit Attempt logs
                </h4>
                {loadingLogs ? (
                  <div className="py-6 flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4 text-[#073afe]" />
                    <span className="text-xs text-slate-400 font-medium">Retrieving audit timeline...</span>
                  </div>
                ) : (
                  <NotificationTimeline logs={jobLogs} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
