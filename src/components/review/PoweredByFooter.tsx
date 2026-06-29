import React from "react";

interface PoweredByFooterProps {
  isRating?: boolean;
}

export default function PoweredByFooter({ isRating = false }: PoweredByFooterProps) {
  return (
    <div className="w-full mt-auto pb-[20px] md:pb-[32px] flex flex-col items-center">
      {/* Divider */}
      <div className={`mx-auto h-[1px] w-[82%] bg-[#E5E7EB] ${isRating ? 'mt-[64px] md:mt-[120px]' : 'mt-[32px] md:mt-[40px]'}`} />

      {/* Footer */}
      <div className="mt-[28px] md:mt-[38px] flex items-center justify-center gap-1.5 text-[16px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
        <span>POWERED BY</span>
        <span className="text-[#073AFE] text-[18px] leading-none select-none">★</span>
        <span>CLOUT REPUTATION</span>
      </div>
    </div>
  );
}