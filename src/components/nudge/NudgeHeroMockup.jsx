import React from "react";
import AppleNotification from "./AppleNotification";
import { SAMPLE_BRIEF } from "./nudgeSample";
import "./nudge.css";

/**
 * The hero preview: the app's real lock screen, built in HTML from a real run of
 * the agent — so it stays sharp and shows the actual output rather than a picture
 * of it.
 */
export default function NudgeHeroMockup() {
  return (
    <div className="nudge-studio is-light">
      <div className="mx-auto w-full max-w-[318px] rounded-[42px] border border-[#e6e6ec] bg-white p-2.5 shadow-[0_30px_70px_-30px_rgba(20,20,60,.35)]">
        <div className="relative overflow-hidden rounded-[34px] bg-[#f4f4f8]">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 22% 0%, rgba(255,205,235,.95), transparent 62%)," +
                "radial-gradient(110% 76% at 88% 16%, rgba(200,222,255,.95), transparent 64%)," +
                "radial-gradient(120% 90% at 50% 112%, rgba(255,236,200,.9), transparent 62%)",
            }}
          />
          <div className="relative px-3 pt-7 pb-3">
            <p className="text-center text-[44px] font-light leading-none tracking-[-.035em] text-[#101014]">9:41</p>
            <p className="mt-1 text-center text-[11px] font-semibold text-[#101014]">{SAMPLE_BRIEF.dateLabel}</p>

            <div className="mt-4 flex max-h-[330px] flex-col gap-1.5 overflow-hidden">
              {SAMPLE_BRIEF.notifications.slice(0, 4).map((n, i) => (
                <AppleNotification key={i} note={n} expanded={false} animate={false} />
              ))}
            </div>

            <span className="mx-auto mt-3 block h-1 w-[92px] rounded-full bg-black/35" />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] tracking-[.14em] text-[#a3a3a3] font-semibold uppercase">
        {SAMPLE_BRIEF.headline}
      </p>
    </div>
  );
}