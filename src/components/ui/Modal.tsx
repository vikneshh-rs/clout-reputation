import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className={`relative bg-white w-full ${sizes[size]} rounded-[20px] shadow-[0px_25px_60px_rgba(15,23,42,0.15)] overflow-hidden transition-all z-50 border border-[#E5E7EB]`}>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#EEF2F7]">
          <h3 className="text-lg font-bold text-[#111827] font-sans">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#6B7280] hover:text-[#111827] transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
