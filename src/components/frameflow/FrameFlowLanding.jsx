import React from "react";
import { Store } from "lucide-react";
import FrameFlowMark from "./FrameFlowMark";
import FrameFlowLandingHero from "./FrameFlowLandingHero";
import FrameFlowLandingSections from "./FrameFlowLandingSections";
import FrameFlowLandingFooter from "./FrameFlowLandingFooter";

export default function FrameFlowLanding({ onSeed, onEnter, onExit }) {
  return (
    <div className="frameflow-page">
      <header className="sticky top-0 z-30 border-b border-[#292c30] bg-[#0b0c0d]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <FrameFlowMark />
            <div className="leading-tight">
              <p className="text-[12px] tracking-[0.18em] uppercase">FrameFlow</p>
              <p className="ff-dim text-[11px]">Hand-drawn motion frames</p>
            </div>
          </div>

          <nav className="ff-dim hidden items-center gap-6 text-[11px] tracking-[0.1em] uppercase md:flex">
            <a href="#workflow" className="transition-colors hover:text-[#f2f2ef]">
              Workflow
            </a>
            <a href="#produces" className="transition-colors hover:text-[#f2f2ef]">
              What it produces
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" className="ff-btn" onClick={onExit}>
              <Store className="h-3.5 w-3.5" />
              Store
            </button>
            <button type="button" className="ff-btn ff-btn-primary" onClick={onEnter}>
              Open studio
            </button>
          </div>
        </div>
      </header>

      <FrameFlowLandingHero onSeed={onSeed} onEnter={onEnter} onExit={onExit} />
      <FrameFlowLandingSections onEnter={onEnter} />
      <FrameFlowLandingFooter />
    </div>
  );
}