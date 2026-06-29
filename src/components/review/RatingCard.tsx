import React from "react";
import StarRating from "./StarRating";

interface RatingCardProps {
  rating: number;
  onChange: (rating: number) => void;
  submitting?: boolean;
}

export default function RatingCard({
  rating,
  onChange,
  submitting = false,
}: RatingCardProps) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        w-full
        animate-fadeIn
      "
    >
      {/* Stars */}
      <div className="mt-[48px] md:mt-[90px] max-w-[340px] mx-auto w-full">
        <StarRating
          rating={rating}
          onChange={onChange}
          disabled={submitting}
        />
      </div>

      {/* Helper Text */}
      <p
        className="
          mt-[24px]
          md:mt-[32px]
          text-center
          text-[18px]
          leading-6
          font-normal
          text-[#6B7280]
          select-none
        "
      >
        Tap a star to share your experience
      </p>
    </div>
  );
}