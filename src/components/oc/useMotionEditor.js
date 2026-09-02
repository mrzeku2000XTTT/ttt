import { useState, useRef, useEffect, useCallback, useMemo } from "react";

const EPS = 0.001;

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const linear = (t) => t;

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
  const fn = b.ease === "linear" ? linear : easeInOut;
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

export function useMotionEditor({ canvasW = 1280, canvasH = 720 } = {}) {
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(5);
  const rafRef = useRef(null);
  const lastTs = useRef(null);

  useEffect(() => {
    if (!playing) { lastTs.current = null; return; }
    const tick = (ts) => {
      if (lastTs.current == null) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;
      setTime((t) => {
        let nt = t + dt;
        if (nt >= duration) nt = 0;
        return nt;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration]);

  const addObject = useCallback((type, extra) => {
    const cx = canvasW / 2, cy = canvasH / 2;
    let base;
    if (type === "text") base = { x: cx, y: cy, width: 420, height: 100, text: "Text", color: "#1d1d1f", fontSize: 64, scale: 1, rotation: 0, opacity: 1 };
    else if (type === "rect") base = { x: cx, y: cy, width: 240, height: 240, color: "#0A84FF", radius: 22, scale: 1, rotation: 0, opacity: 1 };
    else if (type === "ellipse") base = { x: cx, y: cy, width: 240, height: 240, color: "#30D158", scale: 1, rotation: 0, opacity: 1 };
    else if (type === "image") base = { x: cx, y: cy, width: 360, height: 360, src: extra?.src || "", scale: 1, rotation: 0, opacity: 1 };
    const obj = { id: uid(), type, name: type[0].toUpperCase() + type.slice(1), base, keyframes: {} };
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

  return {
    objects, selectedId, selectedObject, time, playing, duration,
    setDuration, seek, togglePlay, stop, setPlaying,
    addObject, updateBase, setKeyframe, setValue, removeKeyframe, clearPropKeyframes,
    deleteObject, duplicateObject, bringToFront, selectObject: setSelectedId,
    canvasW, canvasH,
  };
}