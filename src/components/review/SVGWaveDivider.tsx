import React from "react";

export default function SVGWaveDivider() {
  return (
    <div className="absolute -bottom-[1px] left-0 w-full h-[65px] overflow-hidden pointer-events-none select-none z-10">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 -100 420 250"
        preserveAspectRatio="none"
      >
        {/* Layer 1 Underlay (Light Blue) */}
        <path
          fill="#DCEBFF"
          d="M -5 5 C 156 -47 149 115 420 14 L 420 150 L -5 150 Z"
        />
        {/* Layer 2 Foreground (Pure White) */}
        <path
          fill="#ffffff"
          d="M -5 17 C 156 -35 149 127 420 26 L 420 150 L -5 150 Z"
        />
      </svg>
    </div>
  );
}