import React from "react";

interface BusinessHeaderProps {
  name: string;
  subtitle?: string;
}

export default function BusinessHeader({
  name,
  subtitle = "How was your experience?",
}: BusinessHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center w-full mt-8 px-8 z-20">
      {/* Business Name */}
      <h1
        className="
          text-white
          font-extrabold
          tracking-[-0.03em]
          leading-[1.05]
          drop-shadow-sm
          animate-headerSlide
        "
        style={{
          fontSize: "clamp(40px, 4vw, 46px)",
          maxWidth: "340px",
        }}
      >
        {name}
      </h1>

      {/* Subtitle */}
      <p
        className="
          mt-5
          text-white/95
          font-medium
          tracking-tight
          animate-headerSlide
        "
        style={{
          fontSize: "20px",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}