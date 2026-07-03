import React from "react";
import GoogleBadge from "./GoogleBadge";
import BusinessHeader from "./BusinessHeader";
import SVGWaveDivider from "./SVGWaveDivider";
import PoweredByFooter from "./PoweredByFooter";

interface DigitalReviewCardProps {
  businessName: string;
  subtitle?: string;
  isRating?: boolean;
  children: React.ReactNode;
}

export default function DigitalReviewCard({
  businessName,
  subtitle = "How was your experience?",
  isRating = false,
  children,
}: DigitalReviewCardProps) {
  return (
    <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-[#F8FAFC] flex items-center justify-center p-4">
      <div
        className={`
          relative
          w-[calc(100vw-32px)]
          md:w-[400px]
          max-w-[400px]
          ${isRating ? 'aspect-square h-[calc(100vw-32px)] md:h-[400px]' : 'min-h-[450px] md:min-h-[470px]'}
          bg-white
          rounded-[32px]
          overflow-hidden
          shadow-[0_24px_80px_rgba(15,23,42,0.10)]
          flex
          flex-col
          animate-cardFadeIn
        `}
      >
        {/* ===========================
            BLUE HEADER
        ============================ */}
        <div
          className="
            relative
            h-[155px]
            md:h-[180px]
            bg-[#073AFE]
            rounded-t-[32px]
            overflow-hidden
            flex
            flex-col
            items-center
          "
        >
          {/* Header Content */}
          <div
            className="
              relative
              z-20
              flex
              flex-col
              items-center
              w-full
              pt-[12px]
              md:pt-[18px]
            "
          >
            <GoogleBadge />

            <BusinessHeader
              name={businessName}
              subtitle={subtitle}
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
          <div
            className="
              flex-1
              flex
              flex-col
              justify-start
            "
          >
            {children}
          </div>

          {/* Footer */}
          <PoweredByFooter isRating={isRating} />
        </div>
      </div>
    </div>
  );
}