import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'standard' | 'glass';
  hoverLift?: boolean;
  children: React.ReactNode;
}

export default function Card({
  variant = 'standard',
  hoverLift = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const baseStyle = 'rounded-[20px] p-6 transition-all duration-300';
  
  const variants = {
    standard: 'bg-white border border-[#E5E7EB] shadow-[0px_4px_20px_rgba(15,23,42,0.06)]',
    glass: 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0px_8px_30px_rgba(15,23,42,0.08)]',
  };

  const hoverStyle = hoverLift 
    ? 'hover:-translate-y-[3px] hover:shadow-[0px_12px_40px_rgba(15,23,42,0.12)]' 
    : '';

  return (
    <div
      className={`${baseStyle} ${variants[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
