import React from "react";

export default function SVGWaveDivider() {
  return (
    <div className="absolute -bottom-[2px] left-0 w-full h-[65px] overflow-hidden pointer-events-none select-none z-10">
      {/* Layer 1 Underlay (Light Blue) */}
      <svg
        viewBox="0 -100 420 250"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path
          className="fill-[#DCEBFF]"
          d="M -5 5 C 156 -47 149 115 420 14 L 420 150 L -5 150 Z"
        />
      </svg>

      {/* Layer 2 Foreground (Pure White) */}
      <svg
        viewBox="0 -100 420 250"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path
          className="fill-white"
          d="M -5 17 C 156 -35 149 127 420 26 L 420 150 L -5 150 Z"
        />
      </svg>
    </div>
  );
}