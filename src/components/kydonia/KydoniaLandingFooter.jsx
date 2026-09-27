import React from "react";
import KydoniaMark from "./KydoniaMark";

export default function KydoniaLandingFooter({ onExit }) {
  return (
    <footer className="border-t border-[#23262d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <KydoniaMark />
          <div>
            <p className="text-[13px] tracking-[0.14em]">KYDONIA</p>
            <p className="kyd-sans text-[11px] text-[#8f8a83]">
              Built for researchers, students and writers who need the source, not a summary.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <p className="kyd-sans max-w-sm text-[11px] text-[#8f8a83]">
            Public pages only · robots.txt honoured · fetched once, indexed on your device, never
            shared.
          </p>
          <button type="button" className="kyd-btn" onClick={onExit}>
            Back to the store
          </button>
        </div>
      </div>
    </footer>
  );
}