import React, { useState } from "react";
import { MessageSquareText, Phone } from "lucide-react";

interface RecoveryFormProps {
  loading?: boolean;
  onSubmit: (data: {
    feedback: string;
    requestCallback: boolean;
    customerName?: string;
    phone?: string;
  }) => void;
}

export default function RecoveryForm({
  loading = false,
  onSubmit,
}: RecoveryFormProps) {
  const [feedback, setFeedback] = useState("");
  const [callback, setCallback] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    onSubmit({
      feedback,
      requestCallback: callback,
      customerName: callback ? customerName : undefined,
      phone: callback ? phone : undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        flex
        flex-col
        h-full
        px-0
        pt-3
        pb-3
        animate-slideUp
      "
    >
      {/* Handle */}
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />

      {/* Title */}
      <h2 className="text-center text-[20px] md:text-[24px] font-bold tracking-tight text-slate-900">
        {"We're sorry we didn't meet your expectations."}
      </h2>

      <p className="mt-1 text-center text-[13px] md:text-[14px] leading-normal text-slate-500">
        Your feedback helps us improve. Please tell us about your experience.
      </p>

      {/* Feedback */}
      <div className="mt-3">
        <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <MessageSquareText size={14} />
          Your Feedback
        </label>

        <textarea
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us what happened..."
          className="
            w-full
            resize-none
            rounded-xl
            border
            border-slate-200
            bg-white
            px-3
            py-2.5
            text-[14px]
            outline-none
            transition-all
            duration-200
            focus:border-[#073AFE]
            focus:ring-4
            focus:ring-[#073AFE]/10
          "
          required
        />
      </div>

      {/* Callback */}
      <label className="mt-3.5 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={callback}
          onChange={(e) => setCallback(e.target.checked)}
          className="mt-0.5 h-4.5 w-4.5 rounded border-slate-300 accent-[#073AFE]"
        />

        <span className="text-[13px] md:text-[14.5px] leading-tight text-slate-600">
          {"I'd like to request a callback from the management."}
        </span>
      </label>

      {/* Expand Fields */}
      {callback && (
        <div className="mt-3.5 space-y-3 animate-fadeIn">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your Name"
            className="
              h-11
              w-full
              rounded-xl
              border
              border-slate-200
              px-4
              text-sm
              outline-none
              transition-all
              focus:border-[#073AFE]
              focus:ring-4
              focus:ring-[#073AFE]/10
            "
            required
          />

          <div className="relative">
            <Phone
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="WhatsApp Number"
              className="
                h-11
                w-full
                rounded-xl
                border
                border-slate-200
                pl-11
                pr-4
                text-sm
                outline-none
                transition-all
                focus:border-[#073AFE]
                focus:ring-4
                focus:ring-[#073AFE]/10
              "
              required
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-[12px]" />

      {/* Submit */}
      <button
        disabled={loading}
        type="submit"
        className="
          mt-4
          h-11
          w-full
          rounded-xl
          bg-[#073AFE]
          text-white
          text-[15px]
          font-semibold
          transition-all
          duration-200
          hover:scale-[1.01]
          active:scale-[0.98]
          disabled:cursor-not-allowed
          disabled:bg-slate-300
        "
      >
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}