import React from "react";

interface BusinessHeaderProps {
  name: string;
  subtitle?: string;
  dark?: boolean;
}

export default function BusinessHeader({
  name,
  subtitle = "How was your experience today",
  dark = false,
}: BusinessHeaderProps) {
  const nameLength = name ? name.length : 0;
  let fontSizeClass = "text-[32px] md:text-[40px]";
  if (nameLength > 20) {
    fontSizeClass = "text-[18px] md:text-[20px]";
  } else if (nameLength > 12) {
    fontSizeClass = "text-[26px] md:text-[40px]";
  }

  return (
    <div className={`flex flex-col w-full z-20 ${dark ? 'items-center text-center mt-6 mb-4' : 'items-start text-left ml-2'}`}>
      {/* Business Name */}
      <h1
        className={`
          mt-0
          font-extrabold
          tracking-[-0.02em]
          leading-[1.1]
          drop-shadow-sm
          animate-headerSlide
          ${fontSizeClass}
        `}
        style={{
          fontFamily: "'Google Sans Flex', 'Inter', sans-serif",
          maxWidth: "240px",
          color: dark ? "#111827" : "#FFFFFF",
        }}
      >
        {name}
      </h1>

      {/* Subtitle */}
      <p
        className="
          mt-[4px]
          font-normal
          tracking-normal
          leading-[1.4]
          animate-headerSlide
          text-[14px]
          md:text-[15px]
        "
        style={{
          fontFamily: "'Google Sans Flex', 'Inter', sans-serif",
          color: dark ? "#4B5563" : "#FFFFFF",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}