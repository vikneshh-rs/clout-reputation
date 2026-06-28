import React from "react";

export default function PoweredByFooter() {
  return (
    <div className="w-full mt-auto pb-8 px-8">
      {/* Divider */}
      <div className="mx-auto mb-8 h-px w-[84%] bg-slate-200" />

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-[14px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {/* Cloutation Star */}
        <span className="text-[#073AFE] text-base leading-none">
          ✦
        </span>

        <span>Powered by</span>

        <span className="text-slate-800 font-bold tracking-[0.16em]">
          CLOUTATION
        </span>
      </div>
    </div>
  );
}