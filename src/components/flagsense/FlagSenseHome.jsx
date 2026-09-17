import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { SCENARIOS, AXES, CATEGORIES } from "@/lib/flagSenseData";
import { todayLesson, buildFeed, axisScores } from "@/lib/flagSenseStore";

export default function FlagSenseHome({ state, onStart, onOpenTab, lessonSeen, onLessonDone, onSayIt, onCoach }) {
  const lesson = todayLesson();
  const scores = axisScores(state);
  const feed = buildFeed(SCENARIOS, state, "answers", 5);
  const featured = feed[0] || SCENARIOS[0];
  const cat = CATEGORIES.find((c) => c.id === featured.category);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto w-full max-w-md px-6 pt-4 pb-10">
      <p className="mb-1 flex items-center gap-2 text-[13px] font-medium text-neutral-500">
        {hour < 12 ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        {greeting}.
      </p>
      <h1 className="mb-6 text-[26px] font-bold tracking-tight">Ready for today's check-in?</h1>

      {feed.length > 0 ? (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onStart(feed, "answers")}
          className="mb-4 block w-full rounded-[1.75rem] border border-black/[0.06] bg-card p-7 text-left shadow-[0_24px_70px_-35px_rgba(0,0,0,0.35)] transition-shadow hover:shadow-[0_24px_70px_-25px_rgba(0,0,0,0.4)]"
        >
          <div className="mb-5 flex items-center justify-between">
            {cat && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-600">
                <cat.icon className="h-3 w-3" />
                {cat.label}
              </span>
            )}
            <span className="text-[11px] font-medium text-neutral-400">{feed.length} today</span>
          </div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Today's scenario</p>
          <p className="text-[19px] font-semibold leading-[1.35] tracking-tight">{featured.scenario}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-semibold text-neutral-900">
            Start swiping <ArrowRight className="h-4 w-4" />
          </span>
        </motion.button>
      ) : (
        <div className="mb-4 rounded-[1.75rem] border border-black/[0.06] bg-card p-7 text-center shadow-sm">
          <p className="text-[15px] font-semibold">You've worked through every scenario.</p>
          <p className="mt-1 text-[13px] text-neutral-500">New ones land soon — try Explore or Say It Better in the meantime.</p>
        </div>
      )}

      <div className="mb-4 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
        <p className="fs-label">Today's thought</p>
        <p className="mb-4 text-[15.5px] font-semibold leading-snug">"{lesson.thought}"</p>
        <div className="mb-4 space-y-2">
          <div className="rounded-2xl bg-[hsl(var(--fs-green)/0.07)] p-3.5">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--fs-green))]">Healthy</p>
            <p className="text-[13.5px] leading-relaxed">"{lesson.healthy}"</p>
          </div>
          <div className="rounded-2xl bg-[hsl(var(--fs-red)/0.05)] p-3.5">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--fs-red))]">Unhealthy</p>
            <p className="text-[13.5px] leading-relaxed">"{lesson.unhealthy}"</p>
          </div>
        </div>
        <button
          onClick={onLessonDone}
          className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          {lessonSeen ? "Got it ✓" : "Got it →"}
        </button>
      </div>

      <div className="mb-4 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="fs-label">Your growth</p>
          <button onClick={() => onOpenTab("progress")} className="text-[11.5px] font-semibold text-neutral-500 hover:text-neutral-900">
            Details →
          </button>
        </div>
        <div className="space-y-3.5">
          {AXES.map((axis) => {
            const s = scores.find((x) => x.id === axis.id);
            return (
              <div key={axis.id}>
                <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-neutral-600">{axis.label}</span>
                  <span className="font-semibold tabular-nums">{s?.value == null ? "—" : `${s.value}%`}</span>
                </div>
                <div className="fs-bar">
                  <div
                    className="fs-bar-fill bg-neutral-800"
                    style={{ width: `${s?.value ?? 0}%`, opacity: s?.value == null ? 0.12 : 1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => onOpenTab("explore")}
        className="mb-3 flex w-full items-center justify-between rounded-[1.75rem] border border-black/[0.06] bg-card p-6 text-left shadow-sm transition-colors hover:border-black/15"
      >
        <span>
          <span className="fs-label">Continue learning</span>
          <span className="block text-[15px] font-semibold">Browse all {SCENARIOS.length} scenarios by topic</span>
        </span>
        <ArrowRight className="h-4 w-4 text-neutral-400" />
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onSayIt}
          className="rounded-[1.4rem] border border-black/[0.06] bg-card p-5 text-left shadow-sm transition-colors hover:border-black/15"
        >
          <p className="mb-1 text-[14px] font-semibold">Say it better</p>
          <p className="text-[11.5px] leading-snug text-neutral-500">Turn a raw reaction into a healthier sentence</p>
        </button>
        <button
          onClick={onCoach}
          className="rounded-[1.4rem] border border-black/[0.06] bg-card p-5 text-left shadow-sm transition-colors hover:border-black/15"
        >
          <p className="mb-1 text-[14px] font-semibold">AI coach</p>
          <p className="text-[11.5px] leading-snug text-neutral-500">Reflect out loud — it listens, never judges</p>
        </button>
      </div>
    </div>
  );
}