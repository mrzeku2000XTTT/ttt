import React from "react";
import { ETA_COMPONENTS } from "@/lib/etaPlan";

const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring";
export default function ETASceneCard({ scene, index, onChange }) {
  const set = (key) => (event) => onChange({ ...scene, [key]: key === "duration" ? Number(event.target.value) : event.target.value });
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Scene {String(index + 1).padStart(2, "0")}</p>
        <input className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-right text-xs" type="number" min="1" step="0.5" value={scene.duration} onChange={set("duration")} aria-label="Scene duration in seconds" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select className={field} value={scene.component} onChange={set("component")}>{ETA_COMPONENTS.map((item) => <option key={item}>{item}</option>)}</select>
        <input className={field} value={scene.purpose} onChange={set("purpose")} placeholder="Scene purpose" />
      </div>
      <input className={`${field} mt-3 font-semibold`} value={scene.headline} onChange={set("headline")} placeholder="Headline" />
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <textarea className={`${field} min-h-24 resize-y`} value={scene.visual} onChange={set("visual")} placeholder="Visual direction" />
        <textarea className={`${field} min-h-24 resize-y`} value={scene.voiceover} onChange={set("voiceover")} placeholder="Voiceover" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><input className={field} value={scene.motion} onChange={set("motion")} placeholder="Motion and easing" /><input className={field} value={scene.transition} onChange={set("transition")} placeholder="Match transition" /></div>
    </article>
  );
}