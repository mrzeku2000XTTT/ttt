import React from "react";
import { ArrowRight, ImagePlus, Loader2 } from "lucide-react";
import ETADirectorVisual from "./ETADirectorVisual";

const inputClass = "eta-director-input";

export default function ETABrief({ brief, onChange, files, onFiles, onGenerate, loading, status, elapsed, error }) {
  const set = (key) => (event) => onChange({ ...brief, [key]: event.target.value });
  return (
    <main className="eta-director-main">
      <div className="eta-director-form-wrap">
        <form onSubmit={onGenerate} className="eta-director-form eta-director-form-stack">
          <div className="eta-director-grid"><input className={inputClass} value={brief.name} onChange={set("name")} placeholder="Product name" required /><input className={inputClass} value={brief.url} onChange={set("url")} placeholder="Product link (optional)" type="url" /></div>
          <textarea className={inputClass} value={brief.description} onChange={set("description")} placeholder="What does the product do, which features matter, and what should viewers remember?" required />
          <div className="eta-director-grid"><input className={inputClass} value={brief.audience} onChange={set("audience")} placeholder="Target audience" required /><input className={inputClass} value={brief.style} onChange={set("style")} placeholder="Visual style and motion language" required /></div>
          <div className="eta-director-grid"><select className={inputClass} value={brief.duration} onChange={set("duration")}><option value="15">15 seconds</option><option value="25">25 seconds</option><option value="30">30 seconds</option><option value="60">60 seconds</option></select><select className={inputClass} value={brief.format} onChange={set("format")}><option>16:9 landscape</option><option>9:16 vertical</option><option>1:1 square</option></select></div>
          <label className="eta-director-upload"><ImagePlus className="h-4 w-4" /><span>{files.length ? `${files.length} reference image${files.length === 1 ? "" : "s"} selected` : "Add screenshots or visual references"}</span><input className="hidden" type="file" accept="image/*" multiple onChange={(e) => onFiles(Array.from(e.target.files || []))} /></label>
          {error && <p className="eta-director-error">{error}</p>}
          <button disabled={loading} className="eta-director-submit">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />{status} · {elapsed}s</> : <>Generate scene plan <ArrowRight className="h-4 w-4" /></>}</button>
        </form>
      </div>
      <ETADirectorVisual />
    </main>
  );
}