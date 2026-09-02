import React from "react";
import { valueAt, ANIM_PROPS } from "./useMotionEditor";

function Row({ label, children, hasKf, onToggleKf, ease, onEase }) {
  return (
    <div className="py-2.5 border-b border-black/[0.05] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-[#1d1d1f]" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>{label}</span>
        <div className="flex items-center gap-1.5">
          {ease && (
            <select
              value={ease}
              onChange={(e) => onEase(e.target.value)}
              className="text-[11px] bg-black/[0.04] rounded-md px-1.5 py-0.5 text-[#86868b] outline-none"
            >
              <option value="smooth">Smooth</option>
              <option value="linear">Linear</option>
            </select>
          )}
          <button
            onClick={onToggleKf}
            title="Toggle keyframe at playhead"
            className={`w-3.5 h-3.5 rotate-45 transition-colors ${hasKf ? "bg-[#0A84FF]" : "bg-transparent border border-black/20"}`}
            style={{ borderRadius: 2 }}
          />
        </div>
      </div>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, step = 1, suffix }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number" value={Math.round(value * 100) / 100} step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 bg-black/[0.04] rounded-lg px-2.5 py-1.5 text-[13px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0A84FF]/30 tabular-nums"
        style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}
      />
      {suffix && <span className="text-[11px] text-[#86868b]">{suffix}</span>}
    </div>
  );
}

function Slider({ value, onChange, min, max, step }) {
  return (
    <input
      type="range" value={value} min={min} max={max} step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[#0A84FF]"
    />
  );
}

export default function Inspector({ editor }) {
  const { selectedObject: o, time, setValue, setKeyframe, removeKeyframe, clearPropKeyframes, deleteObject, duplicateObject, bringToFront, updateBase } = editor;
  if (!o) {
    return (
      <div className="flex w-full md:w-72 flex-shrink-0 border-l border-black/[0.06] bg-white/70 backdrop-blur-xl items-center justify-center p-6">
        <p className="text-[13px] text-[#86868b] text-center leading-relaxed" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
          Add an object, then drag it around the canvas. Keyframes are written automatically at the playhead — move the playhead and drag again to create motion.
        </p>
      </div>
    );
  }

  const kfHere = (prop) => (o.keyframes[prop] || []).some((k) => Math.abs(k.t - time) < 0.001);
  const kfAt = (prop) => (o.keyframes[prop] || []).find((k) => Math.abs(k.t - time) < 0.001);

  const toggleKf = (prop) => {
    if (kfHere(prop)) removeKeyframe(o.id, prop, time);
    else setKeyframe(o.id, prop, time, valueAt(o, prop, time) ?? o.base[prop]);
  };

  const animated = [
    { key: "x", label: "Position X", step: 1 },
    { key: "y", label: "Position Y", step: 1 },
    { key: "scale", label: "Scale", step: 0.05, min: 0.1, max: 4, slider: true },
    { key: "rotation", label: "Rotation", step: 1, min: -180, max: 180, suffix: "°", slider: true },
    { key: "opacity", label: "Opacity", step: 0.01, min: 0, max: 1, suffix: "%", slider: true, pct: true },
  ];

  return (
    <div className="w-full md:w-72 flex-shrink-0 border-l border-black/[0.06] bg-white/70 backdrop-blur-xl overflow-y-auto" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/[0.05]">
        <span className="text-[13px] font-semibold text-[#1d1d1f]">{o.name}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => bringToFront(o.id)} title="Bring to front" className="w-7 h-7 rounded-lg hover:bg-black/[0.05] text-[#86868b] flex items-center justify-center text-[14px]">⇧</button>
          <button onClick={() => duplicateObject(o.id)} title="Duplicate" className="w-7 h-7 rounded-lg hover:bg-black/[0.05] text-[#86868b] flex items-center justify-center text-[14px]">⧉</button>
          <button onClick={() => deleteObject(o.id)} title="Delete" className="w-7 h-7 rounded-lg hover:bg-red-500/10 text-red-500 flex items-center justify-center text-[14px]">✕</button>
        </div>
      </div>

      <div className="px-4">
        {/* Static content props */}
        {o.type === "text" && (
          <>
            <div className="py-2.5 border-b border-black/[0.05]">
              <div className="text-[12px] font-medium text-[#1d1d1f] mb-1.5">Text</div>
              <textarea value={o.base.text} onChange={(e) => updateBase(o.id, { text: e.target.value })} rows={2}
                className="w-full bg-black/[0.04] rounded-lg px-2.5 py-2 text-[13px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0A84FF]/30 resize-none" />
            </div>
            <div className="py-2.5 border-b border-black/[0.05]">
              <div className="text-[12px] font-medium text-[#1d1d1f] mb-1.5">Color</div>
              <input type="color" value={o.base.color} onChange={(e) => updateBase(o.id, { color: e.target.value })} className="w-9 h-9 rounded-lg border border-black/10 bg-transparent cursor-pointer" />
            </div>
            <div className="py-2.5 border-b border-black/[0.05]">
              <div className="text-[12px] font-medium text-[#1d1d1f] mb-1.5">Font size</div>
              <Slider value={o.base.fontSize} min={12} max={200} step={1} onChange={(v) => updateBase(o.id, { fontSize: v })} />
              <div className="text-[11px] text-[#86868b] mt-0.5 tabular-nums">{o.base.fontSize}px</div>
            </div>
          </>
        )}
        {(o.type === "rect" || o.type === "ellipse") && (
          <div className="py-2.5 border-b border-black/[0.05]">
            <div className="text-[12px] font-medium text-[#1d1d1f] mb-1.5">Color</div>
            <input type="color" value={o.base.color} onChange={(e) => updateBase(o.id, { color: e.target.value })} className="w-9 h-9 rounded-lg border border-black/10 bg-transparent cursor-pointer" />
          </div>
        )}
        {(o.type === "image" || o.type === "video") && (
          <div className="py-2.5 border-b border-black/[0.05]">
            <div className="text-[12px] font-medium text-[#1d1d1f] mb-1.5">{o.type === "video" ? "Video URL" : "Image URL"}</div>
            <input value={o.base.src} onChange={(e) => updateBase(o.id, { src: e.target.value })} placeholder="https://…"
              className="w-full bg-black/[0.04] rounded-lg px-2.5 py-2 text-[12px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0A84FF]/30" />
          </div>
        )}

        {/* Animated props */}
        <div className="pt-2 pb-1">
          <div className="text-[11px] uppercase tracking-wide text-[#86868b] font-semibold mb-1">Motion</div>
          {animated.map(({ key, label, step, min, max, suffix, slider, pct }) => {
            const v = valueAt(o, key, time) ?? o.base[key];
            const here = kfHere(key);
            const k = kfAt(key);
            return (
              <Row key={key} label={label} hasKf={here} onToggleKf={() => toggleKf(key)} ease={here ? k.ease : null}
                onEase={(e) => setKeyframe(o.id, key, time, v, e)}>
                {slider ? (
                  <>
                    <Slider value={pct && key === "opacity" ? v * 100 : v} min={min} max={pct && key === "opacity" ? 100 : max} step={step}
                      onChange={(val) => setValue(o.id, key, pct && key === "opacity" ? val / 100 : val)} />
                    <div className="flex justify-between mt-0.5">
                      <NumInput value={v} step={step} onChange={(val) => setValue(o.id, key, val)} suffix={suffix} />
                      {(o.keyframes[key] || []).length > 0 && (
                        <button onClick={() => clearPropKeyframes(o.id, key)} className="text-[10px] text-[#86868b] hover:text-red-500 px-1.5">clear</button>
                      )}
                    </div>
                  </>
                ) : (
                  <NumInput value={v} step={step} onChange={(val) => setValue(o.id, key, val)} suffix={suffix} />
                )}
              </Row>
            );
          })}
        </div>
      </div>
    </div>
  );
}