import React from "react";
import { CheckCircle2, ArrowUpRight } from "lucide-react";

interface SuccessScreenProps {
  positive?: boolean;
  countdown?: number;
  onContinue?: () => void;
}

export default function SuccessScreen({
  positive = false,
  countdown = 2,
  onContinue,
}: SuccessScreenProps) {
  return (
    <div className="flex h-full flex-col items-center text-center px-0 pt-6 pb-4 animate-fadeIn">

      {/* Success Icon */}
      <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-green-50">
        <CheckCircle2
          size={32}
          className="text-green-600"
          strokeWidth={2.2}
        />
      </div>

      {/* Title */}
      <h2 className="mt-4 text-[24px] font-extrabold tracking-tight text-slate-900">
        Thank You!
      </h2>

      {/* Description */}
      <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-slate-500">
        {positive
          ? "We appreciate your support. You'll be redirected to Google Reviews shortly."
          : "Your feedback has been submitted successfully. Our management team will review it and use it to improve your future experience."}
      </p>

      {/* Positive Flow */}
      {positive && (
        <>
          {/* Countdown */}
          <div className="mt-4 w-full max-w-[220px]">
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>Redirecting...</span>
              <span>{countdown}s</span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#073AFE] transition-all duration-1000"
                style={{
                  width: `${((2 - countdown) / 2) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="
              mt-5
              flex
              h-11
              w-full
              max-w-[260px]
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[#073AFE]
              text-white
              text-sm
              font-semibold
              transition-all
              duration-200
              hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            Continue to Google Reviews
            <ArrowUpRight size={16} />
          </button>
        </>
      )}

      {/* Negative Flow */}
      {!positive && (
        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs leading-relaxed text-slate-500 font-medium">
            ❤️ Every feedback matters.
          </p>
        </div>
      )}
    </div>
  );
}