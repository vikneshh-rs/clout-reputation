import React from 'react';

export default function PoweredBy() {
  return (
    <div className="w-full mt-[96px] select-none pointer-events-none">
      {/* Horizontal Separator */}
      <div className="border-t border-slate-100 w-[90%] mx-auto mb-5" />
      
      {/* Footer Branding */}
      <div className="text-center text-[15px] font-semibold text-[#6B7280]/60 font-sans flex items-center justify-center gap-1.5 uppercase">
        <span>Powered by</span>
        {/* Styled star-like mark in brand blue */}
        <svg className="w-3.5 h-3.5 text-[#073afe] fill-[#073afe]" viewBox="0 0 24 24">
          <path d="M12 2L14.39 8.26L21 9L16 13.14L17.5 19.5L12 16L6.5 19.5L8 13.14L3 9L9.61 8.26L12 2Z" />
        </svg>
        <span className="font-semibold text-slate-700 tracking-wider">Cloutation</span>
      </div>
    </div>
  );
}
