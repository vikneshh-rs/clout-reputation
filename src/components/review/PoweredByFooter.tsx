import React from "react";

interface PoweredByFooterProps {
  isRating?: boolean;
}

export default function PoweredByFooter({ isRating = false }: PoweredByFooterProps) {
  return (
    <div className="w-full mt-auto pb-4 md:pb-6 flex flex-col items-center">
      {/* Divider */}
      <div className={`mx-auto h-[1px] w-[82%] bg-[#E5E7EB] ${isRating ? 'mt-6 md:mt-8' : 'mt-4 md:mt-6'}`} />

      {/* Footer */}
      <div className="mt-3 md:mt-4 flex items-center justify-center gap-1.5 text-[11px] md:text-[16px] font-semibold uppercase tracking-[0.04em] md:tracking-[0.06em] text-[#6B7280] whitespace-nowrap flex-nowrap">
        <span>POWERED BY</span>
        <img
          src="/uploads/42dfb975-8311-4487-a90b-fbac0cf0e815.png"
          alt="Logo"
          className="w-[14px] h-[14px] md:w-[18px] md:h-[18px] object-contain select-none pointer-events-none"
        />
        <span>CLOUTATION</span>
      </div>
    </div>
  );
}