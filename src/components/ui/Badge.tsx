import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  children: React.ReactNode;
}

export default function Badge({
  variant = 'neutral',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border';

  const variants = {
    primary: 'bg-[#EFF3FF] text-[#073AFE] border-[#DBEAFE]',
    success: 'bg-[#ECFDF5] text-[#10B981] border-[#D1FAE5]',
    warning: 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]',
    error: 'bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2]',
    neutral: 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB]',
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
