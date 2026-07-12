import React from "react";
import GoogleBadge from "./GoogleBadge";
import BusinessHeader from "./BusinessHeader";
import SVGWaveDivider from "./SVGWaveDivider";
import PoweredByFooter from "./PoweredByFooter";

interface DigitalReviewCardProps {
  businessName: string;
  subtitle?: string;
  isRating?: boolean;
  sheetOpen?: boolean;
  children: React.ReactNode;
}

export default function DigitalReviewCard({
  businessName,
  subtitle = "How was your experience today",
  isRating = false,
  sheetOpen = false,
  children,
}: DigitalReviewCardProps) {
  return (
    <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-[#F8FAFC] flex items-center justify-center p-4">
      <div
        className={`
          relative
          w-full
          max-w-[420px]
          h-[370px]
          bg-white
          rounded-[32px]
          overflow-hidden
          shadow-[0_12px_40px_rgba(0,0,0,0.08)]
          border
          border-[rgba(0,0,0,0.08)]
          flex
          flex-col
          animate-cardFadeIn
          transition-all
          duration-500
          ease-[cubic-bezier(0.16,1,0.3,1)]
          ${sheetOpen ? 'scale-[0.98] -translate-y-2.5 brightness-[0.93]' : 'scale-100 translate-y-0 brightness-100'}
        `}
      >
        {/* ===========================
            BLUE HEADER
        ============================ */}
        <div
          className="
            relative
            h-[190px]
            bg-[#073AFE]
            rounded-t-[31px]
            overflow-hidden
            flex
            items-center
            px-6
            pb-8
          "
        >
          {/* Header Content */}
          <div className="flex items-center gap-6 z-20">
            <GoogleBadge />
            <BusinessHeader
              name={businessName}
              subtitle={subtitle}
              dark={false}
            />
          </div>

          {/* Wave */}
          <SVGWaveDivider />
        </div>

        {/* ===========================
            BODY
        ============================ */}
        <div
          className="
            flex-1
            flex
            flex-col
            px-6
            md:px-8
          "
        >
          {/* Rating / Success / Recovery */}
          <div className="flex-1 flex flex-col justify-start">
            {children}
          </div>

          {/* Footer */}
          <PoweredByFooter />
        </div>
      </div>
    </div>
  );
}