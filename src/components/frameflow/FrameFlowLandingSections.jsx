import React from "react";
import { Camera, Film, Gauge, Layers, ListOrdered, PenTool, RefreshCw } from "lucide-react";

const FEATURES = [
  { icon: PenTool, title: "Style lock", body: "One hand-drawn language, carried across every frame." },
  { icon: RefreshCw, title: "Per-frame repair", body: "Regenerate one in-between, not the whole shot." },
  { icon: Film, title: "2–16 in-betweens", body: "Dial the spacing, then play it back at 6–24 fps." },
  { icon: Camera, title: "Timing & camera", body: "Easing curves and six camera moves per shot." },
  { icon: Layers, title: "Reference-locked", body: "Both endpoints are always kept in the sequence." },
];

const STEPS = [
  { title: "Upload both references", body: "A start frame and an end frame." },
  { title: "Describe the motion", body: "Or pick a preset — walk, run, head turn." },
  { title: "Generate the in-betweens", body: "Each frame placed by the easing curve." },
  { title: "Repair and play", body: "Regenerate any frame, then play at your fps." },
];

// Every figure below is a real value from the running studio.
const CARDS = [
  {
    icon: Film,
    title: "Generated sequence",
    body: "Start, the in-betweens you asked for, and the end frame — in order, on one strip.",
    sample: "2–16 in-betweens · start → end",
  },
  {
    icon: Gauge,
    title: "Frame-by-frame viewer",
    body: "Scrub the strip, step frame by frame, or play the sequence back at the shot's fps.",
    sample: "6–24 fps playback",
  },
  {
    icon: RefreshCw,
    title: "Single-frame regenerate",
    body: "A frame that breaks the linework gets rebuilt from its own neighbours and the two references.",
    sample: "one frame · not the whole shot",
  },
  {
    icon: ListOrdered,
    title: "The exact request",
    body: "Every generation shows the payload it sent — motion, timing, camera, preserve list and style lock.",
    sample: "task_type · style_lock · negative_prompt",
  },
];

export default function FrameFlowLandingSections({ onEnter }) {
  return (
    <>
      <section className="border-b border-[#292c30]">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-4 w-4 text-[#c8ff4d]" />
              <h3 className="mt-3 text-[13px]">{title}</h3>
              <p className="ff-dim mt-1 text-[12px] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="border-b border-[#292c30]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-[10px] tracking-[0.16em] text-[#c8ff4d] uppercase">Workflow</p>
          <h2 className="mt-3 text-[26px] sm:text-[32px]">Two references into a moving sequence</h2>
          <p className="ff-dim mt-3 max-w-xl text-[13px]">
            Four steps, and the movement stays under your control the whole way.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="ff-panel-2 p-5">
                <span className="ff-mono-num text-[12px] text-[#c8ff4d]">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-[14px]">{step.title}</h3>
                <p className="ff-dim mt-2 text-[12px] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="produces" className="border-b border-[#292c30]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-[10px] tracking-[0.16em] text-[#c8ff4d] uppercase">What it produces</p>
          <h2 className="mt-3 text-[26px] sm:text-[32px]">A sequence you can actually finish</h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map(({ icon: Icon, title, body, sample }) => (
              <div key={title} className="ff-panel p-5">
                <Icon className="h-4 w-4 text-[#c8ff4d]" />
                <h3 className="mt-3 text-[14px]">{title}</h3>
                <p className="ff-dim mt-2 text-[12px] leading-relaxed">{body}</p>
                <p className="ff-dim mt-4 border-t border-[#292c30] pt-3 text-[11px] text-[#b8d98a]">{sample}</p>
              </div>
            ))}

            <div className="rounded-[14px] border border-[#33401c] bg-gradient-to-br from-[#141a0b] to-[#0b0c0d] p-6">
              <h3 className="text-[15px]">FRAMEFLOW</h3>
              <p className="ff-dim mt-3 text-[12px] leading-relaxed">
                Two references in, a connected hand-drawn sequence out — with every frame still repairable.
              </p>
              <button type="button" className="ff-btn ff-btn-primary mt-6 w-full" onClick={onEnter}>
                Open the studio
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}