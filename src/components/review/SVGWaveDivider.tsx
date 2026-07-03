import React from "react";

export default function SVGWaveDivider() {
  return (
    <div className="absolute -bottom-[2px] left-0 w-full h-[48px] md:h-[55px] overflow-hidden pointer-events-none select-none z-10">
      {/* Gloss Highlight */}
      <svg
        viewBox="0 0 1440 95"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path
          fill="rgba(255,255,255,0.22)"
          d="
            M0,63
            C360,79 560,79 720,64
            C880,49 1080,49 1440,69
            L1440,95
            L0,95
            Z
          "
        />
      </svg>

      {/* Main White Wave */}
      <svg
        viewBox="0 0 1440 95"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <path
          fill="#FFFFFF"
          d="
            M0,77
            C360,93 560,93 720,78
            C880,63 1080,63 1440,83
            L1440,95
            L0,95
            Z
          "
        />
      </svg>
    </div>
  );
}