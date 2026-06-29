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
          mt-[16px]
          md:mt-[24px]
          text-white
          font-extrabold
          tracking-[-0.03em]
          leading-[1.05]
          drop-shadow-sm
          animate-headerSlide
        "
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "56px",
          maxWidth: "340px",
          color: "#FFFFFF",
        }}
      >
        {name}
      </h1>

      {/* Subtitle */}
      <p
        className="
          mt-[8px]
          md:mt-[16px]
          text-white
          font-normal
          tracking-normal
          leading-[1.4]
          animate-headerSlide
        "
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "24px",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}