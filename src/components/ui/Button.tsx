import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyle =
    'inline-flex items-center justify-center text-sm font-semibold h-11 px-4 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white focus:ring-[#2563EB]/40 border border-transparent',
    secondary: 'bg-white hover:bg-[#F8FAFC] text-[#111827] border border-[#D1D5DB] focus:ring-slate-500/20',
    ghost: 'bg-transparent hover:bg-[#EFF6FF] text-[#4B5563] hover:text-[#2563EB] border border-transparent focus:ring-blue-500/10',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
