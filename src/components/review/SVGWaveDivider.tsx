import React from "react";

export default function SVGWaveDivider() {
  const svg1 = `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -100 420 250' preserveAspectRatio='none'%3E%3Cpath fill='black' d='M -5 5 C 156 -47 149 115 420 14 L 420 150 L -5 150 Z'/%3E%3C/svg%3E`;
  const svg2 = `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -100 420 250' preserveAspectRatio='none'%3E%3Cpath fill='black' d='M -5 17 C 156 -35 149 127 420 26 L 420 150 L -5 150 Z'/%3E%3C/svg%3E`;

  const mask1 = `url("data:image/svg+xml,${svg1}")`;
  const mask2 = `url("data:image/svg+xml,${svg2}")`;

  return (
    <div className="absolute -bottom-[2px] left-0 w-full h-[65px] overflow-hidden pointer-events-none select-none z-10">
      {/* Layer 1 Underlay (Light Blue) */}
      <div
        className="absolute inset-0 w-full h-full bg-[#DCEBFF]"
        style={{
          WebkitMaskImage: mask1,
          maskImage: mask1,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />

      {/* Layer 2 Foreground (Pure White) */}
      <div
        className="absolute inset-0 w-full h-full bg-white"
        style={{
          WebkitMaskImage: mask2,
          maskImage: mask2,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
    </div>
  );
}