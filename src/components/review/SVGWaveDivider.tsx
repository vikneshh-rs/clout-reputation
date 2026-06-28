import React from "react";

export default function SVGWaveDivider() {
  return (
    <div className="absolute bottom-[-18px] left-0 w-full h-[100px] overflow-hidden pointer-events-none select-none z-10">

      {/* Gloss Highlight */}
      <svg
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path
          fill="rgba(255,255,255,0.28)"
          d="
            M0,82
            C180,132
            420,168
            720,108
            C990,58
            1210,38
            1440,82
            L1440,220
            L0,220
            Z
          "
        />
      </svg>

      {/* Main White Wave */}
      <svg
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path
          fill="#FFFFFF"
          d="
            M0,96
            C220,150
            460,188
            720,122
            C980,60
            1210,42
            1440,92
            L1440,220
            L0,220
            Z
          "
        />
      </svg>
    </div>
  );
}