import React from "react";
import { ArrowRight, ShieldCheck, Sparkles, Compass } from "lucide-react";
import AppHeaderNav from "@/components/AppHeaderNav";

export const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/48ed8d14e_generated_image.png";
const HERO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/7817e9ec2_generated_image.png";

export default function FlagSenseLanding({ onBegin }) {
  return (
    <div className="flag-sense relative">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={LOGO} alt="" className="h-9 w-9 rounded-xl shadow-sm" />
            <span className="text-[17px] font-semibold tracking-tight">FlagSense</span>
          </div>
          <AppHeaderNav appPath="FlagSense" />
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <img src={HERO} alt="" className="mb-10 w-full rounded-3xl border border-black/5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]" />

          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Relationship self-awareness
          </p>
          <h1 className="mb-4 text-[40px] leading-[1.05] font-bold tracking-tight sm:text-[46px]">
            Understand.<br />Reflect.<br />Grow.
          </h1>
          <p className="mb-8 max-w-md text-[15px] leading-relaxed text-neutral-600">
            Learn how relationship behaviors affect both people — yours and theirs.
            No labels, no verdicts. Just understanding, and what to try instead.
          </p>

          <button
            onClick={onBegin}
            className="mb-10 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-[15px] font-semibold text-white shadow-lg transition-colors hover:bg-neutral-800 sm:w-auto"
          >
            Begin
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: Compass, t: "Notice", d: "Real situations, three honest responses — healthy, worth reflecting on, concerning." },
              { icon: Sparkles, t: "Reflect", d: "See how the other person might feel, and find a healthier alternative." },
              { icon: ShieldCheck, t: "Grow", d: "Private by design. Everything stays on your device — no account, no judgment." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t}>
                <Icon className="mb-2 h-4 w-4 text-neutral-400" />
                <p className="mb-1 text-[13px] font-semibold">{t}</p>
                <p className="text-[12.5px] leading-relaxed text-neutral-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}