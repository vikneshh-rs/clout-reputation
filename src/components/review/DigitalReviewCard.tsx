import React from "react";
import GoogleBadge from "./GoogleBadge";
import BusinessHeader from "./BusinessHeader";
import SVGWaveDivider from "./SVGWaveDivider";
import PoweredByFooter from "./PoweredByFooter";

interface DigitalReviewCardProps {
  businessName: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function DigitalReviewCard({
  businessName,
  subtitle = "How was your experience?",
  children,
}: DigitalReviewCardProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
      <div
        className="
          relative
          w-full
          max-w-[420px]
          h-[720px]
          bg-white
          rounded-[32px]
          overflow-hidden
          shadow-[0_24px_70px_rgba(15,23,42,0.10)]
          flex
          flex-col
        "
      >
        {/* ===========================
            BLUE HEADER
        ============================ */}
        <div
          className="
            relative
            h-[340px]
            bg-[#073AFE]
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
              pt-[38px]
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
            px-8
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
          <PoweredByFooter />
        </div>
      </div>
    </div>
  );
}