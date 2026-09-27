import React from "react";

/** The FRAMEFLOW mark — a hand-drawn frame pair with the movement between them. */
export default function FrameFlowMark({ className = "" }) {
  return (
    <span
      className={`inline-grid place-items-center h-8 w-8 rounded-[9px] border border-[#3b3f45] bg-[#151719] ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-[#c8ff4d]">
        <path d="M4 17 8 7l4 10 4-10 4 10" />
        <path d="M3 20h18" />
      </svg>
    </span>
  );
}