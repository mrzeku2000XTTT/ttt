import React from "react";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/17f6a9185_generated_image.png";

export default function NudgeLandingFooter() {
  return (
    <footer className="border-t border-[#f0f0f0] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="NUDGE" className="h-6 w-6 rounded-md object-cover" />
            <span className="text-[11px] font-bold tracking-[0.28em] text-black">NUDGE</span>
          </div>
          <p className="mt-3 max-w-sm text-[12px] leading-relaxed text-[#8a8a94]">
            Built for anyone whose day is already written down somewhere — and who would rather read it
            back the way their phone would tell it to them.
          </p>
        </div>

        <div className="max-w-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">How it treats your data</p>
          <p className="mt-3 text-[12px] leading-relaxed text-[#666666]">
            Schedules, briefs and notifications are written to this browser's own storage and nowhere else.
            The text is sent to the AI only when you press the button, and nothing is kept server-side.
          </p>
        </div>
      </div>
    </footer>
  );
}