import React from 'react';

export default function PoweredBy() {
  return (
    <div className="w-full mt-[96px] select-none pointer-events-none">
      {/* Horizontal Separator */}
      <div className="border-t border-slate-100 w-[90%] mx-auto mb-5" />
      
      {/* Footer Branding */}
      <div className="text-center text-[15px] font-semibold text-[#6B7280]/60 font-sans flex items-center justify-center gap-1.5 uppercase">
        <span>Powered by</span>
        <img
          src="/uploads/42dfb975-8311-4487-a90b-fbac0cf0e815.png"
          alt="Logo"
          className="w-3.5 h-3.5 object-contain select-none pointer-events-none"
        />
        <span className="font-semibold text-slate-700 tracking-wider">Cloutation</span>
      </div>
    </div>
  );
}
