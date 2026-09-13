import React from "react";
import { ArrowRight, ImagePlus, Loader2 } from "lucide-react";

const inputClass = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring";

export default function ETABrief({ brief, onChange, files, onFiles, onGenerate, loading, status, elapsed, error }) {
  const set = (key) => (event) => onChange({ ...brief, [key]: event.target.value });
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[0.8fr_1.2fr] lg:py-16">
      <section>
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">ATE · Automated Timeline Experience</p>
        <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-6xl">Describe the launch. ETA directs the motion.</h1>
        <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground">Turn a product brief, link, and visual references into an editable sequence of scenes, motion, pacing, narration, and transitions.</p>
      </section>
      <form onSubmit={onGenerate} className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2"><input className={inputClass} value={brief.name} onChange={set("name")} placeholder="Product name" required /><input className={inputClass} value={brief.url} onChange={set("url")} placeholder="Product link (optional)" type="url" /></div>
        <textarea className={`${inputClass} min-h-32 resize-y`} value={brief.description} onChange={set("description")} placeholder="What does the product do, which features matter, and what should viewers remember?" required />
        <div className="grid gap-4 sm:grid-cols-2"><input className={inputClass} value={brief.audience} onChange={set("audience")} placeholder="Target audience" required /><input className={inputClass} value={brief.style} onChange={set("style")} placeholder="Visual style and motion language" required /></div>
        <div className="grid gap-4 sm:grid-cols-2"><select className={inputClass} value={brief.duration} onChange={set("duration")}><option value="15">15 seconds</option><option value="25">25 seconds</option><option value="30">30 seconds</option><option value="60">60 seconds</option></select><select className={inputClass} value={brief.format} onChange={set("format")}><option>16:9 landscape</option><option>9:16 vertical</option><option>1:1 square</option></select></div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground"><ImagePlus className="h-4 w-4" /><span>{files.length ? `${files.length} reference image${files.length === 1 ? "" : "s"} selected` : "Add screenshots or visual references"}</span><input className="hidden" type="file" accept="image/*" multiple onChange={(e) => onFiles(Array.from(e.target.files || []))} /></label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />{status} · {elapsed}s</> : <>Generate scene plan <ArrowRight className="h-4 w-4" /></>}</button>
      </form>
    </main>
  );
}