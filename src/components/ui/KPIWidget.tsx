import React from 'react';
import Card from './Card';

interface KPIWidgetProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  variant?: 'standard' | 'glass';
  hoverLift?: boolean;
  subtext?: React.ReactNode;
  className?: string;
}

export default function KPIWidget({
  label,
  value,
  icon,
  variant = 'standard',
  hoverLift = true,
  subtext,
  className = '',
}: KPIWidgetProps) {
  return (
    <Card
      variant={variant}
      hoverLift={hoverLift}
      className={`flex justify-between items-center group ${className}`}
    >
      <div className="space-y-2">
        <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
          {label}
        </span>
        <h3 className="text-3xl font-extrabold text-[#111827] leading-none tracking-tight">
          {value}
        </h3>
        {subtext && (
          <div className="flex items-center gap-1.5 text-xs text-[#4B5563] font-medium mt-1">
            {subtext}
          </div>
        )}
      </div>
      <div className="p-3 bg-[#EFF3FF] text-[#073AFE] rounded-xl group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
        {icon}
      </div>
    </Card>
  );
}
