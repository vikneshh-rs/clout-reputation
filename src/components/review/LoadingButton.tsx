import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export default function LoadingButton({ loading = false, children, className = '', disabled, ...props }: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`w-full inline-flex items-center justify-center px-6 py-3.5 bg-[#073afe] hover:bg-[#0022d9] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer border border-transparent shadow-[0_2px_4px_rgba(7,58,254,0.04)] focus:outline-none focus:ring-4 focus:ring-[#073afe]/10 ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      ) : null}
      {children}
    </button>
  );
}
