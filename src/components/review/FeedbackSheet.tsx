import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useDragControls, Variants } from "framer-motion";
import { MessageSquareText, Phone, CheckCircle2, X, User } from "lucide-react";

interface FeedbackSheetProps {
  isOpen: boolean;
  isSuccess: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: {
    feedback: string;
    requestCallback: boolean;
    customerName?: string;
    phone?: string;
  }) => void;
  business: {
    name: string;
    googleReviewUrl: string | null;
    googleMapsUrl: string | null;
  };
}

const FEEDBACK_TAGS = [
  "Staff Behaviour",
  "Service Quality",
  "Value for Money",
  "Cleanliness",
  "Pricing",
  "Facilities"
];

export default function FeedbackSheet({
  isOpen,
  isSuccess,
  loading,
  onClose,
  onSubmit,
  business,
}: FeedbackSheetProps) {
  const [feedback, setFeedback] = useState("");
  const [callback, setCallback] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [hasStartedSuccessDelay, setHasStartedSuccessDelay] = useState(false);
  const [showRedirectButtons, setShowRedirectButtons] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setShowRedirectButtons(true);
    } else {
      setShowRedirectButtons(false);
      setShowThankYou(false);
    }
  }, [isSuccess]);

  // References for accessibility and focus trap
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Drag states and controls
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const dragProgress = useTransform(y, [0, 300], [1, 0.7]);
  const [isDragging, setIsDragging] = useState(false);

  // Capture triggering element on mount/open
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      // Focus the textarea after transition
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 350);
      // Disable body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Accessibility: Focus trap & Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !isSuccess) {
        onClose();
      }

      if (e.key === "Tab" && isOpen && sheetRef.current) {
        const focusableElements = sheetRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, isSuccess, onClose]);

  // Handles auto-closing after success animation
  useEffect(() => {
    if (isSuccess && !hasStartedSuccessDelay) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500); // 1.5s delay for success presentation
      
      Promise.resolve().then(() => {
        setHasStartedSuccessDelay(true);
      });
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, hasStartedSuccessDelay, onClose]);

  // Toggle feedback tags/chips
  const handleChipClick = (tag: string) => {
    let newChips = [...selectedChips];
    if (newChips.includes(tag)) {
      newChips = newChips.filter((c) => c !== tag);
    } else {
      newChips.push(tag);
    }
    setSelectedChips(newChips);

    // Update textarea content intuitively without wiping user comments
    const chipsPrefix = newChips.length > 0 ? `${newChips.join(", ")} - ` : "";
    const cleanFeedback = feedback.replace(/^[^-]+ - /, "");
    setFeedback(`${chipsPrefix}${cleanFeedback}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      feedback,
      requestCallback: callback,
      customerName: callback ? customerName : undefined,
      phone: callback ? phone : undefined,
    });
  };

  // Drag handle width and opacity dynamic styles
  const handleWidth = useTransform(y, [-50, 0, 100], ["48px", "40px", "48px"]);
  const handleOpacity = useTransform(y, [-50, 0, 100], [1, 0.6, 1]);

  // Framer Motion Spring Config (tuned for iOS bottom sheet smoothness)
  const sheetSpring = {
    type: "spring",
    damping: 30,
    stiffness: 280,
    mass: 0.9,
  };

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const containerVariants: Variants = {
    hidden: { y: "100%", scale: 0.98, opacity: 0.9 },
    visible: {
      y: 0,
      scale: 1,
      opacity: 1,
      transition: {
        y: { type: "spring", damping: 30, stiffness: 280, mass: 0.9 },
        scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.3 },
      },
    },
    exit: {
      y: "100%",
      scale: 0.98,
      opacity: 0.8,
      transition: {
        y: { type: "tween", duration: 0.3, ease: [0.32, 0.94, 0.6, 1] },
        scale: { duration: 0.25 },
        opacity: { duration: 0.2 },
      },
    },
  };

  // Stagger variants for content entrance
  const listVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 },
    },
  };

  // Checkmark animation variants
  const checkmarkPathVariants: Variants = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: { duration: 0.45, ease: "easeInOut", delay: 0.1 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end overflow-hidden font-sans">
          {/* Backdrop Overlay */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            onClick={() => !loading && !isSuccess && onClose()}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3.5px] cursor-pointer"
          />

          {/* Premium Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.15, bottom: 0.8 }}
            style={{ y }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setIsDragging(false);
              const dismissThreshold = 140;
              const velocityThreshold = 450;
              if (info.offset.y > dismissThreshold || info.velocity.y > velocityThreshold) {
                onClose();
              } else {
                y.set(0);
              }
            }}
            className="relative w-full max-w-[500px] mx-auto bg-white rounded-t-[32px] shadow-[0_-12px_40px_rgba(15,23,42,0.12)] flex flex-col max-h-[92dvh] overflow-hidden select-none touch-none border border-slate-100"
          >
            {/* Drag Handle Container */}
            <div className="flex justify-center pt-3.5 pb-2.5 cursor-grab active:cursor-grabbing">
              <motion.div
                style={{ width: handleWidth, opacity: handleOpacity }}
                className="h-1.5 rounded-full bg-slate-300"
                animate={{ scaleX: isDragging ? 1.25 : 1 }}
                transition={{ duration: 0.2 }}
              />
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-1 scrollbar-none touch-pan-y">
              <AnimatePresence mode="wait">
                {!showThankYou ? (
                  <motion.form
                    key="form-content"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5"
                  >
                    {/* Header Group */}
                    <motion.div variants={itemVariants} className="text-center space-y-1.5">
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                        {"We'd like to make things right."}
                      </h2>
                      <p className="text-[13.5px] leading-relaxed text-slate-500 max-w-[360px] mx-auto">
                        Your feedback helps us improve. Please tell us what happened.
                      </p>
                    </motion.div>

                    {/* Tag Chips */}
                    <motion.div variants={itemVariants} className="space-y-2">
                      <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest block">
                        What could we improve?
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {FEEDBACK_TAGS.map((tag) => {
                          const isSelected = selectedChips.includes(tag);
                          return (
                            <motion.button
                              key={tag}
                              type="button"
                              onClick={() => handleChipClick(tag)}
                              whileHover={{ y: -1.5, scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              animate={{
                                backgroundColor: isSelected ? "#073AFE" : "#F1F5F9",
                                color: isSelected ? "#FFFFFF" : "#475569",
                                borderColor: isSelected ? "#073AFE" : "#E2E8F0",
                              }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="px-3.5 py-1.5 text-xs font-semibold rounded-full border border-slate-200 cursor-pointer flex items-center justify-center transition-colors"
                            >
                              {tag}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>

                    {/* Textarea Input */}
                    <motion.div variants={itemVariants} className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-650 uppercase tracking-wider">
                        <MessageSquareText size={13} className="text-[#073AFE]" />
                        Tell us more
                      </label>
                      <textarea
                        ref={textareaRef}
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us what happened..."
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14.5px] leading-relaxed text-slate-800 outline-none transition-all duration-250 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-slate-400"
                      />
                    </motion.div>


                    {/* Callback Consent Checkbox */}
                    <motion.label
                      variants={itemVariants}
                      className="flex cursor-pointer items-start gap-3.5 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={callback}
                        onChange={(e) => setCallback(e.target.checked)}
                        className="mt-0.5 h-4.5 w-4.5 rounded border-slate-300 text-[#073AFE] focus:ring-[#073AFE]/20 accent-[#073AFE]"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13.5px] font-semibold leading-tight text-slate-700">
                          Request a callback from the management
                        </span>
                        <span className="text-xs text-slate-400">
                          Enter your details, and our management team will contact you soon.
                        </span>
                      </div>
                    </motion.label>

                    {/* Expand Name/Phone Fields */}
                    <AnimatePresence>
                      {callback && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="space-y-3 overflow-hidden animate-fadeIn"
                        >
                          <div className="relative">
                            <User
                              size={16}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please enter your name.')}
                              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                              placeholder="Your Name"
                              required={callback}
                              className="h-11.5 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-slate-400"
                            />
                          </div>
                          <div className="relative">
                            <Phone
                              size={16}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              type="tel"
                              pattern="[0-9]{10}"
                              maxLength={10}
                              value={phone}
                              onChange={(e) => {
                                const numericVal = e.target.value.replace(/\D/g, "");
                                if (numericVal.length <= 10) {
                                  setPhone(numericVal);
                                }
                              }}
                              onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please enter a valid number.')}
                              onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                              placeholder="WhatsApp Number"
                              required={callback}
                              className="h-11.5 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-slate-400"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.div variants={itemVariants} className="pt-2">
                      {!showRedirectButtons ? (
                        <motion.button
                          disabled={loading}
                          type="submit"
                          whileHover={{ scale: 1.008 }}
                          whileTap={{ scale: 0.985 }}
                          className="w-full h-12 rounded-2xl bg-[#073AFE] text-white text-[15px] font-bold flex items-center justify-center gap-2.5 transition-all duration-200 hover:bg-[#0632d8] shadow-[0_4px_16px_rgba(7,58,254,0.22)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:shadow-none cursor-pointer"
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            "Submit Feedback"
                          )}
                        </motion.button>
                      ) : (
                        <div className="flex flex-row gap-3 w-full animate-fadeIn">
                          {/* Button 1: Redirect to Google (Lighter in color) */}
                          <button
                            type="button"
                            onClick={() => {
                              const targetUrl = business.googleMapsUrl || business.googleReviewUrl || `https://www.google.com/search?q=${encodeURIComponent(business.name)}`;
                              window.open(targetUrl, '_blank', 'noopener,noreferrer');
                              setShowThankYou(true);
                            }}
                            className="flex-1 h-12 rounded-2xl bg-blue-50 text-[#073AFE] hover:bg-blue-100 border border-blue-100 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            Redirect to Google
                          </button>

                          {/* Button 2: May be Later (Darker/solid color) */}
                          <button
                            type="button"
                            onClick={() => setShowThankYou(true)}
                            className="flex-1 h-12 rounded-2xl bg-[#073AFE] text-white hover:bg-[#0632d8] text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center"
                          >
                            May be Later
                          </button>
                        </div>
                      )}
                    </motion.div>

                    {/* Privacy Note */}
                    <motion.p variants={itemVariants} className="text-center text-[11px] text-slate-400 leading-normal px-6">
                      Private. Secure. Sent directly to management.
                    </motion.p>
                  </motion.form>
                ) : (
                  // Success confirmation state inside bottom sheet
                  <motion.div
                    key="success-content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center text-center py-8 px-4"
                  >
                    {/* Animated Checkmark SVG */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-5">
                      <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <motion.path
                          variants={checkmarkPathVariants}
                          initial="hidden"
                          animate="visible"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>

                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
                      Thank You!
                    </h2>
                    <p className="text-[14.5px] leading-relaxed text-slate-500 max-w-[320px]">
                      Your feedback has been submitted successfully. Our management team will review it and use it to improve your future experience.
                    </p>

                    <div className="mt-6 w-full max-w-[280px] rounded-2xl bg-slate-50 px-4 py-3.5 border border-slate-100 animate-fadeIn">
                      <p className="text-xs leading-relaxed text-slate-500 font-medium">
                        ❤️ Every feedback matters.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
