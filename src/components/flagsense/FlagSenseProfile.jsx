import React from "react";
import { Lock, ShieldAlert, Trash2, Users, Compass } from "lucide-react";
import { CATEGORIES } from "@/lib/flagSenseData";

const GOAL_LABELS = {
  partner: "Understand my partner",
  myself: "Understand myself",
  communication: "Improve communication",
  healthier: "Build healthier relationships",
  curious: "Just curious",
};
const WHO_LABELS = { me: "Me", relationship: "My relationship", both: "Both" };

export default function FlagSenseProfile({ state, onReset }) {
  const answered = Object.keys(state.answers || {}).length;
  const reflected = Object.keys(state.reflect || {}).length;
  const interests = (state.interests || []).map((id) => CATEGORIES.find((c) => c.id === id)?.label).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-md px-6 pt-4 pb-10">
      <p className="fs-label">Profile</p>
      <h1 className="mb-6 text-[26px] font-bold tracking-tight">You</h1>

      <div className="mb-4 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Compass className="h-4 w-4 text-neutral-400" />
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">Your setup</p>
        </div>
        <div className="space-y-2.5 text-[13.5px]">
          <Row label="Here for" value={GOAL_LABELS[state.goal] || "—"} />
          <Row label="This is for" value={WHO_LABELS[state.who] || "—"} />
          <Row label="Scenarios answered" value={String(answered)} />
          <Row label="Reflections done" value={String(reflected)} />
          {interests.length > 0 && <Row label="Topics you picked" value={interests.join(", ")} />}
        </div>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
        <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
        <div>
          <p className="mb-1 text-[14px] font-semibold">Private by design</p>
          <p className="text-[12.5px] leading-relaxed text-neutral-500">
            FlagSense keeps everything on this device — no account, no cloud, nothing shared. Your answers are yours alone.
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
        <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--fs-red))]" />
        <div>
          <p className="mb-1 text-[14px] font-semibold">Conflict isn't the same as a safety concern</p>
          <p className="text-[12.5px] leading-relaxed text-neutral-500">
            FlagSense helps with everyday relationship behavior. It never diagnoses people. If you're facing threats,
            coercion, stalking, or violence, please reach out to someone you trust or a local support resource — that's
            beyond what any app should handle.
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
        <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
        <div>
          <p className="mb-1 text-[14px] font-semibold">It works for both sides</p>
          <p className="text-[12.5px] leading-relaxed text-neutral-500">
            Sometimes the red flag is someone else's behavior. Sometimes it's ours. And sometimes what looks like a red
            flag just needs context. FlagSense is built for all three.
          </p>
        </div>
      </div>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-5 py-3 text-[13px] font-semibold text-neutral-600 transition-colors hover:border-[hsl(var(--fs-red))] hover:text-[hsl(var(--fs-red))]"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Reset all progress
      </button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}