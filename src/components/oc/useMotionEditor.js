import { useState, useRef, useEffect, useCallback, useMemo } from "react";

const EPS = 0.001;

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const linear = (t) => t;

// Easing functions used by interpolate() and the EasingControl graph.
export const EASES = {
  linear: (t) => t,
  smooth: easeInOut,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  elastic: (t) => { if (t === 0 || t === 1) return t; const c4 = (2 * Math.PI) / 3; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1; },
  bounce: (t) => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; else if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; } else if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; } else { t -= 2.625 / d1; return n1 * t * t + 0.984375; } },
};

export const EASE_LABELS = [
  { value: "smooth", label: "Smooth" },
  { value: "linear", label: "Linear" },
  { value: "easeIn", label: "Ease In" },
  { value: "easeOut", label: "Ease Out" },
  { value: "easeInOut", label: "Ease In Out" },
  { value: "back", label: "Back" },
  { value: "elastic", label: "Elastic" },
  { value: "bounce", label: "Bounce" },
];

const sortKfs = (kfs) => [...kfs].sort((a, b) => a.t - b.t);

export function interpolate(kfs, t) {
  if (!kfs || kfs.length === 0) return undefined;
  if (kfs.length === 1) return kfs[0].v;
  if (t <= kfs[0].t) return kfs[0].v;
  const last = kfs[kfs.length - 1];
  if (t >= last.t) return last.v;
  let i = 0;
  while (i < kfs.length - 1 && kfs[i + 1].t <= t) i++;
  const a = kfs[i], b = kfs[i + 1];
  const span = b.t - a.t || EPS;
  const lt = (t - a.t) / span;
  const fn = EASES[b.ease] || EASES.smooth;
  return a.v + (b.v - a.v) * fn(lt);
}

export function valueAt(obj, prop, t) {
  const kfs = obj.keyframes?.[prop];
  if (!kfs || kfs.length === 0) return obj.base[prop];
  return interpolate(kfs, t);
}

export function propsAtTime(obj, t) {
  return {
    x: valueAt(obj, "x", t) ?? obj.base.x,
    y: valueAt(obj, "y", t) ?? obj.base.y,
    scale: valueAt(obj, "scale", t) ?? obj.base.scale ?? 1,
    rotation: valueAt(obj, "rotation", t) ?? obj.base.rotation ?? 0,
    opacity: valueAt(obj, "opacity", t) ?? obj.base.opacity ?? 1,
  };
}

export const ANIM_PROPS = ["x", "y", "scale", "rotation", "opacity"];

let _seq = 0;
const uid = () => `o${Date.now().toString(36)}${(_seq++).toString(36)}`;

export function useMotionEditor() {
  const [canvasW, setCanvasW] = useState(1280);
  const [canvasH, setCanvasH] = useState(720);
  const setCanvasSize = useCallback((w, h) => { setCanvasW(Math.round(w)); setCanvasH(Math.round(h)); }, []);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(5);
  const rafRef = useRef(null);
  const lastTs = useRef(null);

  // A single RAF loop drives both playback and "record" mode.
  // In record mode the playhead auto-advances while you drag an object,
  // so a single drag paints a real motion path as keyframes.
  useEffect(() => {
    if (!playing) { lastTs.current = null; return; }
    const tick = (ts) => {
      if (lastTs.current == null) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;
      setTime((t) => {
        let nt = t + dt;
        if (recording) return Math.min(duration, nt); // clamp at end while recording a motion path
        if (nt >= duration) nt = 0; // loop on playback
        return nt;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, recording, duration]);

  const addObject = useCallback((type, extra) => {
    const cx = canvasW / 2, cy = canvasH / 2;
    const sw = Math.min(canvasW, canvasH);
    let base;
    if (type === "text") base = { x: cx, y: cy, width: Math.round(sw * 0.6), height: Math.round(sw * 0.15), text: "Text", color: "#1d1d1f", fontSize: Math.max(24, Math.round(sw * 0.09)), scale: 1, rotation: 0, opacity: 1 };
    else if (type === "rect") base = { x: cx, y: cy, width: Math.round(sw * 0.3), height: Math.round(sw * 0.3), color: "#0A84FF", radius: Math.round(sw * 0.03), scale: 1, rotation: 0, opacity: 1 };
    else if (type === "ellipse") base = { x: cx, y: cy, width: Math.round(sw * 0.3), height: Math.round(sw * 0.3), color: "#30D158", scale: 1, rotation: 0, opacity: 1 };
    else if (type === "image") base = { x: cx, y: cy, width: Math.round(sw * 0.4), height: Math.round(sw * 0.4), src: extra?.src || "", scale: 1, rotation: 0, opacity: 1 };
    else if (type === "video") base = { x: cx, y: cy, width: Math.round(sw * 0.5), height: Math.round(sw * 0.28), src: extra?.src || "", scale: 1, rotation: 0, opacity: 1 };
    else if (type === "device") {
      const d = extra?.device || "iphone";
      const dims = { iphone: [0.3, 0.62], ipad: [0.5, 0.7], macbook: [0.62, 0.42], monitor: [0.56, 0.38] }[d] || [0.4, 0.4];
      base = { x: cx, y: cy, width: Math.round(sw * dims[0]), height: Math.round(sw * dims[1]), device: d, src: extra?.src || "", mediaType: extra?.mediaType || "", scale: 1, rotation: 0, opacity: 1 };
    }
    const obj = { id: uid(), type, name: type === "device" ? (extra?.device ? extra.device[0].toUpperCase() + extra.device.slice(1) : "Device") : type[0].toUpperCase() + type.slice(1), base, keyframes: {} };
    setObjects((o) => [...o, obj]);
    setSelectedId(obj.id);
    setPlaying(false);
    return obj.id;
  }, [canvasW, canvasH]);

  const updateBase = useCallback((id, patch) => {
    setObjects((os) => os.map((o) => (o.id === id ? { ...o, base: { ...o.base, ...patch } } : o)));
  }, []);

  const setKeyframe = useCallback((id, prop, t, v, ease) => {
    setObjects((os) => os.map((o) => {
      if (o.id !== id) return o;
      const kfs = o.keyframes[prop] ? [...o.keyframes[prop]] : [];
      const idx = kfs.findIndex((k) => Math.abs(k.t - t) < EPS);
      if (idx >= 0) kfs[idx] = { ...kfs[idx], v, ease: ease ?? kfs[idx].ease };
      else kfs.push({ t, v, ease: ease ?? "smooth" });
      return { ...o, keyframes: { ...o.keyframes, [prop]: sortKfs(kfs) } };
    }));
  }, []);

  const setValue = useCallback((id, prop, v) => {
    if (ANIM_PROPS.includes(prop)) setKeyframe(id, prop, time, v);
    else updateBase(id, { [prop]: v });
  }, [time, setKeyframe, updateBase]);

  const removeKeyframe = useCallback((id, prop, t) => {
    setObjects((os) => os.map((o) => {
      if (o.id !== id) return o;
      const kfs = (o.keyframes[prop] || []).filter((k) => Math.abs(k.t - t) >= EPS);
      return { ...o, keyframes: { ...o.keyframes, [prop]: kfs } };
    }));
  }, []);

  const clearPropKeyframes = useCallback((id, prop) => {
    setObjects((os) => os.map((o) => (o.id === id ? { ...o, keyframes: { ...o.keyframes, [prop]: [] } } : o)));
  }, []);

  // Set the easing of every keyframe sitting at time `t` on object `id`
  // (the outgoing segment's curve). Used by the Inspector's Transition easing control.
  const setEase = useCallback((id, t, ease) => {
    setObjects((os) => os.map((o) => {
      if (o.id !== id) return o;
      const kf = {};
      Object.entries(o.keyframes).forEach(([prop, arr]) => {
        kf[prop] = arr.map((k) => (Math.abs(k.t - t) < EPS ? { ...k, ease } : k));
      });
      return { ...o, keyframes: kf };
    }));
  }, []);

  const deleteObject = useCallback((id) => {
    setObjects((os) => os.filter((o) => o.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  }, []);

  const duplicateObject = useCallback((id) => {
    setObjects((os) => {
      const o = os.find((x) => x.id === id);
      if (!o) return os;
      const copy = { ...o, id: uid(), name: o.name + " Copy", base: { ...o.base, x: o.base.x + 48, y: o.base.y + 48 }, keyframes: JSON.parse(JSON.stringify(o.keyframes)) };
      return [...os, copy];
    });
  }, []);

  const bringToFront = useCallback((id) => {
    setObjects((os) => {
      const o = os.find((x) => x.id === id);
      return o ? [...os.filter((x) => x.id !== id), o] : os;
    });
  }, []);

  const seek = useCallback((t) => setTime(Math.max(0, Math.min(duration, t))), [duration]);
  const togglePlay = useCallback(() => setPlaying((p) => !p), []);
  const stop = useCallback(() => { setPlaying(false); setTime(0); }, []);

  const selectedObject = useMemo(() => objects.find((o) => o.id === selectedId) || null, [objects, selectedId]);

  // Apply an After-Effects-style motion preset: writes a full set of keyframes
  // across the timeline for the selected object (auto-keyframed + timelined).
  const applyPreset = useCallback((name) => {
    const o = objects.find((x) => x.id === selectedId);
    if (!o) return;
    const dur = duration;
    const cx = o.base.x, cy = o.base.y;
    const s0 = o.base.scale ?? 1, r0 = o.base.rotation ?? 0;
    const setK = (prop, pts) => pts.forEach(([t, v, ease]) => setKeyframe(o.id, prop, t, v, ease));
    switch (name) {
      case "fadeIn": setK("opacity", [[0, 0, "linear"], [dur * 0.2, 1, "smooth"], [dur, 1, "linear"]]); break;
      case "fadeOut": setK("opacity", [[0, 1, "linear"], [dur * 0.8, 1, "smooth"], [dur, 0, "linear"]]); break;
      case "slideInLeft":
        setK("x", [[0, cx - canvasW, "linear"], [dur * 0.25, cx, "smooth"], [dur, cx, "linear"]]);
        setK("opacity", [[0, 0, "linear"], [dur * 0.15, 1, "smooth"], [dur, 1, "linear"]]); break;
      case "slideInRight":
        setK("x", [[0, cx + canvasW, "linear"], [dur * 0.25, cx, "smooth"], [dur, cx, "linear"]]);
        setK("opacity", [[0, 0, "linear"], [dur * 0.15, 1, "smooth"], [dur, 1, "linear"]]); break;
      case "scalePop":
        setK("scale", [[0, 0, "smooth"], [dur * 0.15, s0 * 1.15, "smooth"], [dur * 0.3, s0, "smooth"], [dur, s0, "linear"]]);
        setK("opacity", [[0, 0, "linear"], [dur * 0.1, 1, "smooth"], [dur, 1, "linear"]]); break;
      case "spin": setK("rotation", [[0, r0, "linear"], [dur, r0 + 360, "linear"]]); break;
      case "bounce": setK("y", [[0, cy, "smooth"], [dur * 0.25, cy - canvasH * 0.25, "smooth"], [dur * 0.5, cy, "smooth"], [dur * 0.75, cy - canvasH * 0.1, "smooth"], [dur, cy, "smooth"]]); break;
      case "float": setK("y", [[0, cy, "smooth"], [dur * 0.5, cy - canvasH * 0.06, "smooth"], [dur, cy, "smooth"]]); break;
      default: break;
    }
  }, [objects, selectedId, duration, canvasW, canvasH, setKeyframe]);

  return {
    objects, selectedId, selectedObject, time, playing, recording, duration,
    setDuration, seek, togglePlay, stop, setPlaying, setRecording,
    addObject, updateBase, setKeyframe, setValue, removeKeyframe, clearPropKeyframes,
    deleteObject, duplicateObject, bringToFront, selectObject: setSelectedId,
    canvasW, canvasH, setCanvasSize, applyPreset, setEase,
  };
}