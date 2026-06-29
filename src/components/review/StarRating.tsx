import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export default function StarRating({ rating, onChange, disabled = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  return (
    <div className="flex items-center justify-center gap-[8px] md:gap-[18px] animate-slideUp" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
      {[1, 2, 3, 4, 5].map((starValue, index) => {
        const isFilled = hoverRating !== null ? starValue <= hoverRating : starValue <= rating;
        
        // Sequential animation delay: 35ms per star from left to right for smooth filling
        const transitionDelay = isFilled ? `${index * 35}ms` : '0ms';

        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => !disabled && setHoverRating(starValue)}
            onMouseLeave={() => !disabled && setHoverRating(null)}
            className={`w-[50px] h-[50px] md:w-[70px] md:h-[70px] transition-all duration-200 ease-out focus:outline-none focus-visible:outline-none flex items-center justify-center rounded-2xl focus-visible:ring-4 focus-visible:ring-[#073afe]/20 cursor-pointer ${
              disabled 
                ? 'cursor-not-allowed opacity-60' 
                : 'hover:scale-[1.08] active:scale-[1.04]'
            }`}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star 
              size={62} 
              style={{ transitionDuration: '200ms', transitionDelay }}
              className={`w-[42px] h-[42px] md:w-[62px] md:h-[62px] transition-colors ease-out ${
                isFilled 
                  ? 'fill-[#FBBF24] stroke-[#FBBF24]' 
                  : 'fill-transparent stroke-[#D1D5DB] stroke-[1.5px]'
              }`} 
            />
          </button>
        );
      })}
    </div>
  );
}
