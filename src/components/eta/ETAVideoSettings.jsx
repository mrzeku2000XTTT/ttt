import React from 'react';
import { Film, Upload } from 'lucide-react';
import ETAFormField, { etaInput } from './ETAFormField';

export default function ETAVideoSettings({ advanced, setAdvanced }) {
  const choose = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAdvanced('videoMedia', { url: URL.createObjectURL(file), type: file.type, name: file.name });
  };

  return <section className="space-y-5 rounded-2xl border border-border bg-card p-4">
    <h2 className="text-sm font-semibold">Video</h2>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide">Video file</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="grid h-24 w-36 place-items-center overflow-hidden rounded-xl border border-border bg-muted/40">
          {advanced.videoMedia?.url ? <video src={advanced.videoMedia.url} muted playsInline className="h-full w-full object-cover" /> : <div className="text-center text-muted-foreground"><Film className="mx-auto h-5 w-5"/><p className="mt-2 text-xs">None</p></div>}
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary/40 px-4 py-3 text-sm font-semibold text-primary">
          <Upload className="h-4 w-4"/> Choose Media
          <input type="file" accept="video/*" className="hidden" onChange={choose}/>
        </label>
      </div>
      {advanced.videoMedia?.name && <p className="mt-2 truncate text-[11px] text-muted-foreground">{advanced.videoMedia.name}</p>}
    </div>
    <ETAFormField label="Object fit">
      <select className={etaInput} value={advanced.videoObjectFit || 'fill'} onChange={(event) => setAdvanced('videoObjectFit', event.target.value)}>
        <option value="cover">Cover (fill frame, may crop)</option>
        <option value="contain">Contain (fit, letterbox)</option>
        <option value="fill">Fill (stretch)</option>
      </select>
    </ETAFormField>
  </section>;
}