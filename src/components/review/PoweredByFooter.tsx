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
        <span className="text-[#073AFE] text-[13px] md:text-[18px] leading-none select-none">★</span>
        <span>CLOUTATION</span>
      </div>
    </div>
  );
}