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
      <div className="mt-14 max-w-[340px] mx-auto w-full">
        <StarRating
          rating={rating}
          onChange={onChange}
          disabled={submitting}
        />
      </div>

      {/* Helper Text */}
      <p
        className="
          mt-10
          text-center
          text-[17px]
          leading-6
          font-normal
          text-slate-500
          select-none
        "
      >
        Tap a star to share your experience
      </p>

      {/* Spacer */}
      <div className="flex-1 min-h-[80px]" />
    </div>
  );
}