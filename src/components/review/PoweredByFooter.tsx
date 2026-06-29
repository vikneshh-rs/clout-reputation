import React from "react";

interface PoweredByFooterProps {
  isRating?: boolean;
}

export default function PoweredByFooter({ isRating = false }: PoweredByFooterProps) {
  return (
    <div className="w-full mt-auto pb-[16px] md:pb-[32px] flex flex-col items-center">
      {/* Divider */}
      <div className={`mx-auto h-[1px] w-[82%] bg-[#E5E7EB] ${isRating ? 'mt-[48px] md:mt-[120px]' : 'mt-[32px] md:mt-[40px]'}`} />

      {/* Footer */}
      <div className="mt-[24px] md:mt-[38px] flex items-center justify-center gap-1.5 text-[11px] md:text-[16px] font-semibold uppercase tracking-[0.04em] md:tracking-[0.06em] text-[#6B7280] whitespace-nowrap flex-nowrap">
        <span>POWERED BY</span>
        <span className="text-[#073AFE] text-[13px] md:text-[18px] leading-none select-none">★</span>
        <span>CLOUTATION</span>
      </div>
    </div>
  );
}