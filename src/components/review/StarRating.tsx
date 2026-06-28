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
    <div className="flex items-center justify-center gap-[20px] animate-slideUp" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
      {[1, 2, 3, 4, 5].map((starValue, index) => {
        const isFilled = hoverRating !== null ? starValue <= hoverRating : starValue <= rating;
        const isSelected = starValue === rating;
        
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
            style={{ width: '70px', height: '70px' }}
            className={`transition-all duration-200 ease-out focus:outline-none flex items-center justify-center rounded-2xl focus:ring-4 focus:ring-[#073afe]/10 cursor-pointer ${
              disabled 
                ? 'cursor-not-allowed opacity-60' 
                : isSelected 
                ? 'scale-105 active:scale-95' 
                : 'hover:scale-110 active:scale-95'
            }`}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star 
              size={62} 
              style={{ transitionDuration: '220ms', transitionDelay }}
              className={`transition-colors ease-out ${
                isFilled 
                  ? 'fill-[#FBBF24] text-[#FBBF24]' 
                  : 'text-[#D1D5DB] stroke-[1.25px]'
              }`} 
            />
          </button>
        );
      })}
    </div>
  );
}
