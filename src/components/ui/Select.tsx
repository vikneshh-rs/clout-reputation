import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
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
        <select
          id={id}
          ref={ref}
          className={`block w-full h-12 text-sm bg-white border border-[#D1D5DB] rounded-xl transition-all duration-200 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10 text-[#111827] px-4 ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-xs text-[#EF4444] font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
