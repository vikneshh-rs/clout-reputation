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
    <div className="flex flex-col items-center text-center w-full z-20">
      {/* Business Name */}
      <h1
        className="
          mt-[8px]
          md:mt-[10px]
          text-white
          font-extrabold
          tracking-[-0.02em]
          leading-[1.1]
          drop-shadow-sm
          animate-headerSlide
          text-[24px]
          md:text-[28px]
        "
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          maxWidth: "340px",
          color: "#FFFFFF",
        }}
      >
        {name}
      </h1>

      {/* Subtitle */}
      <p
        className="
          mt-[4px]
          md:mt-[6px]
          text-white
          font-normal
          tracking-normal
          leading-[1.4]
          animate-headerSlide
          text-[13px]
          md:text-[15px]
        "
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#FFFFFF",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}