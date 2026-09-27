import React from "react";
import { ShieldCheck } from "lucide-react";
import FrameFlowMark from "./FrameFlowMark";

export default function FrameFlowLandingFooter() {
  return (
    <footer className="border-t border-[#292c30]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <FrameFlowMark />
          <div className="leading-tight">
            <p className="text-[12px] tracking-[0.16em] uppercase">FrameFlow</p>
            <p className="ff-dim text-[11px]">Hand-drawn motion frames</p>
          </div>
        </div>

        <p className="ff-dim max-w-md text-[11px] leading-relaxed">
          Built for animators, storyboard artists and anyone blocking movement between two drawings.
        </p>

        <p className="ff-dim flex items-center gap-2 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#c8ff4d]" />
          Reference frames are uploaded privately — access follows your app's permissions.
        </p>
      </div>
    </footer>
  );
}