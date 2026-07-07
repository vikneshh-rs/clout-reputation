import React from 'react';
import { Smartphone, ShieldCheck, ShieldAlert, Check, X, Clock, Loader2 } from 'lucide-react';

interface BadgeProps {
  status: string;
}

export function NotificationBadge({ status }: BadgeProps) {
  const norm = status?.toUpperCase() || 'PENDING';
  let classes = 'bg-slate-50 text-slate-500 border-slate-200/60';
  let label = status;

  switch (norm) {
    case 'PENDING':
      classes = 'bg-amber-50 text-amber-700 border-amber-200/50';
      label = 'Pending';
      break;
    case 'PROCESSING':
      classes = 'bg-blue-50 text-blue-700 border-blue-200/50';
      label = 'Processing';
      break;
    case 'SENT':
    case 'COMPLETED':
      classes = 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      label = 'Sent';
      break;
    case 'FAILED':
      classes = 'bg-rose-50 text-rose-700 border-rose-200/50';
      label = 'Failed';
      break;
    case 'PERMANENTLY_FAILED':
    case 'PERMANENT_FAILURE':
      classes = 'bg-red-100 text-red-900 border-red-200';
      label = 'Permanent Failure';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${classes}`}>
      {label}
    </span>
  );
}

interface LogEntry {
  id: string;
  attemptNumber: number;
  previousStatus: string;
  newStatus: string;
  errorMessage: string | null;
  timestamp: string;
  processingDuration: number | null;
}

interface TimelineProps {
  logs: LogEntry[];
}

export function NotificationTimeline({ logs }: TimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No attempt logs available for this notification.
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-100 ml-3.5 pl-5 space-y-6">
      {logs.map((log) => {
        const isSuccess = log.newStatus === 'SENT';
        return (
          <div key={log.id} className="relative group">
            {/* Timeline node icon */}
            <span className={`absolute -left-[29px] top-0.5 rounded-full p-1 border text-white shadow-sm transition-transform duration-200 group-hover:scale-110 ${
              isSuccess 
                ? 'bg-emerald-500 border-emerald-450' 
                : 'bg-rose-500 border-rose-450'
            }`}>
              {isSuccess ? <Check size={10} /> : <X size={10} />}
            </span>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-xs font-bold text-slate-900">
                  Attempt #{log.attemptNumber}
                </strong>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Transitioned from <code className="bg-slate-50 border border-slate-200/50 px-1 py-0.2 rounded font-mono text-[10px]">{log.previousStatus}</code> to <code className="bg-slate-50 border border-slate-200/50 px-1 py-0.2 rounded font-mono text-[10px]">{log.newStatus}</code>
                {log.processingDuration !== null && (
                  <span className="ml-1.5 text-slate-400">({log.processingDuration}ms)</span>
                )}
              </p>
              {log.errorMessage && (
                <div className="mt-1.5 p-2 bg-rose-50/50 border border-rose-100/50 rounded-xl text-[10px] text-rose-700 font-mono break-all leading-normal">
                  Error: {log.errorMessage}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface HealthCardProps {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  successRate: number;
  avgLatencyMs?: number;
  lastCallTime?: string | null;
  lastError?: string | null;
}

export function HealthStatusCard({ name, status, successRate, avgLatencyMs, lastCallTime, lastError }: HealthCardProps) {
  let indicatorColor = 'bg-emerald-500';
  let labelColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
  let labelText = 'Operational';

  if (status === 'degraded') {
    indicatorColor = 'bg-amber-500';
    labelColor = 'text-amber-700 bg-amber-50 border-amber-100';
    labelText = 'Degraded';
  } else if (status === 'offline') {
    indicatorColor = 'bg-rose-500 animate-ping';
    labelColor = 'text-rose-700 bg-rose-50 border-rose-100';
    labelText = 'Offline';
  }

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${indicatorColor}`} />
          <h4 className="text-xs font-bold text-slate-900">{name}</h4>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${labelColor}`}>
          {labelText}
        </span>
      </div>

      <div className="mt-4.5 space-y-2 text-[11px] font-medium text-slate-500">
        <div className="flex justify-between">
          <span>Success Rate</span>
          <strong className="text-slate-950 font-bold">{successRate}%</strong>
        </div>
        {avgLatencyMs !== undefined && (
          <div className="flex justify-between">
            <span>Avg Response Time</span>
            <strong className="text-slate-950 font-bold">{avgLatencyMs}ms</strong>
          </div>
        )}
        {lastCallTime && (
          <div className="flex justify-between">
            <span>Last Activity</span>
            <strong className="text-slate-950 font-bold">{new Date(lastCallTime).toLocaleTimeString()}</strong>
          </div>
        )}
        {lastError && (
          <div className="mt-3 p-2 bg-rose-50/50 border border-rose-100/50 rounded-xl text-[10px] text-rose-700 font-mono leading-normal line-clamp-2">
            Last Error: {lastError}
          </div>
        )}
      </div>
    </div>
  );
}
