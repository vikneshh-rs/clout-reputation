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
    <div className="flex h-full flex-col items-center text-center px-8 pt-12 pb-6 animate-fadeIn">

      {/* Success Icon */}
      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-green-50">
        <CheckCircle2
          size={42}
          className="text-green-600"
          strokeWidth={2.2}
        />
      </div>

      {/* Title */}
      <h2 className="mt-8 text-[32px] font-extrabold tracking-tight text-slate-900">
        Thank You!
      </h2>

      {/* Description */}
      <p className="mt-4 max-w-[300px] text-[17px] leading-7 text-slate-500">
        {positive
          ? "We appreciate your support. You'll be redirected to Google Reviews shortly."
          : "Your feedback has been shared with the management. Thank you for helping us improve."}
      </p>

      {/* Positive Flow */}
      {positive && (
        <>
          {/* Countdown */}
          <div className="mt-8 w-full max-w-[220px]">
            <div className="mb-2 flex justify-between text-sm text-slate-500">
              <span>Redirecting...</span>
              <span>{countdown}s</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
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
              mt-10
              flex
              h-[54px]
              w-full
              max-w-[300px]
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-[#073AFE]
              text-white
              font-semibold
              transition-all
              duration-200
              hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            Continue to Google Reviews
            <ArrowUpRight size={18} />
          </button>
        </>
      )}

      {/* Negative Flow */}
      {!positive && (
        <div className="mt-10 rounded-2xl bg-slate-50 px-5 py-4">
          <p className="text-sm leading-6 text-slate-500">
            Our management team will review your feedback and work to improve
            your future experience.
          </p>
        </div>
      )}
    </div>
  );
}