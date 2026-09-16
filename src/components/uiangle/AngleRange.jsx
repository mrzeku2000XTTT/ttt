import React from 'react';
export default function AngleRange({ label, value, min, max, step=.1, unit='', onChange, disabled=false }) {
  return <label className="block space-y-2 text-xs"><span className="flex justify-between gap-2 text-muted-foreground"><span>{label}</span><span className="font-mono text-foreground">{Number(value).toFixed(step < 1 ? 1 : 0)}{unit}</span></span><input disabled={disabled} aria-label={label} className="w-full accent-current" type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
}