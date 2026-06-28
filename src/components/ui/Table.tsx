import React from 'react';

export function TableContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#E5E7EB] rounded-[16px] shadow-[0px_2px_8px_rgba(15,23,42,0.02)] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto w-full">
      <table className={`min-w-full divide-y divide-[#EEF2F7] text-left text-sm text-[#111827] ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`bg-[#F8FAFC] text-xs font-bold text-[#4B5563] uppercase tracking-wider ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody className={`divide-y divide-[#EEF2F7] bg-white ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr 
      onClick={onClick}
      className={`hover:bg-[#F8FAFC] transition-colors duration-150 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', isHeader = false }: { children: React.ReactNode; className?: string; isHeader?: boolean }) {
  if (isHeader) {
    return (
      <th scope="col" className={`px-6 py-4.5 font-bold ${className}`}>
        {children}
      </th>
    );
  }
  return (
    <td className={`px-6 py-4 text-[#4B5563] ${className}`}>
      {children}
    </td>
  );
}
