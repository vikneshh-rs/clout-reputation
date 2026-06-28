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
        px-7
        pt-8
        pb-8
        animate-slideUp
      "
    >
      {/* Handle */}
      <div className="mx-auto mb-7 h-1.5 w-12 rounded-full bg-slate-300" />

      {/* Title */}
      <h2 className="text-center text-[28px] font-bold tracking-tight text-slate-900">
        We're sorry.
      </h2>

      <p className="mt-3 text-center text-[16px] leading-7 text-slate-500">
        We'd love to know how we can improve your experience.
      </p>

      {/* Feedback */}
      <div className="mt-8">
        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MessageSquareText size={16} />
          Your Feedback
        </label>

        <textarea
          rows={5}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us about your experience..."
          className="
            w-full
            resize-none
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-4
            py-4
            text-[16px]
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
      <label className="mt-7 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={callback}
          onChange={(e) => setCallback(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-slate-300 accent-[#073AFE]"
        />

        <span className="text-[15px] leading-6 text-slate-600">
          I'd like the management to contact me regarding my experience.
        </span>
      </label>

      {/* Expand Fields */}
      {callback && (
        <div className="mt-7 space-y-5 animate-fadeIn">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your Name"
            className="
              h-14
              w-full
              rounded-xl
              border
              border-slate-200
              px-4
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
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="WhatsApp Number"
              className="
                h-14
                w-full
                rounded-xl
                border
                border-slate-200
                pl-11
                pr-4
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

      <div className="flex-1" />

      {/* Submit */}
      <button
        disabled={loading}
        type="submit"
        className="
          mt-8
          h-[54px]
          w-full
          rounded-2xl
          bg-[#073AFE]
          text-white
          text-[16px]
          font-semibold
          transition-all
          duration-200
          hover:scale-[1.01]
          active:scale-[0.98]
          disabled:cursor-not-allowed
          disabled:bg-slate-300
        "
      >
        {loading ? "Submitting..." : "Send Feedback"}
      </button>
    </form>
  );
}