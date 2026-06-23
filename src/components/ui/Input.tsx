import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = '', id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7280]">
              {icon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={`block w-full h-12 text-sm bg-white border border-[#D1D5DB] rounded-xl transition-all duration-200 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 placeholder-[#9CA3AF] text-[#111827] ${
              icon ? 'pl-10' : 'pl-4'
            } pr-4 ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-[#EF4444] font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
