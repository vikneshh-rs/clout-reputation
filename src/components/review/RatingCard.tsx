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
      <div className="mt-6 md:mt-8 max-w-[340px] mx-auto w-full">
        <StarRating
          rating={rating}
          onChange={onChange}
          disabled={submitting}
        />
      </div>

      {/* Helper Text */}
      <p
        className="
          mt-3
          md:mt-4
          text-center
          text-sm
          md:text-base
          leading-normal
          font-normal
          text-[#6B7280]
          select-none
        "
      >
        Choose a rating from 1 to 5 stars.
      </p>
    </div>
  );
}