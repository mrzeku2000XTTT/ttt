import React, { useRef, useState } from 'react';
import { Loader2, Paperclip, Send, Link2, ImagePlus, X, Magnet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import invokeProtectedOperation from '@/components/integrations/invokeProtectedOperation';
import { EASE_NAMES, keysToTracks, makeLayer } from './morphEngine';
import { SEQUENCES, applySequence } from './morphSequences';
import { UI_MORPHS, applyMorphPreset } from './morphMorphs';

const URL_RE = /(https?:\/\/[^\s<>"')]+)/gi;
const IMG_RE = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;
const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star', 'burst'];
const LABEL = { upload: 'Uploading…', scrape: 'Reading the link…', direct: 'Directing…' };

const uid = (p) => `${p}${Math.random().toString(36).slice(2, 7)}`;
const hostOf = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; }
};

/**
 * The smart composer. One box that takes plain instructions, pasted/dropped
 * images and links — it uploads the images into the scene, scrapes the links,
 * then hands everything to the director (a protected backend function).
 */
export default function MorphSmartInput({
  scene,
  onScene,
  onSequences,
  onAddImage,
  autoEase,
  ease,
  onToggleAutoEase,
  onEaseChange,
  compact = false,
}) {
  const [text, setText] = useState('');
  const [items, setItems] = useState([]); // { id, kind: 'image' | 'link', name, url }
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const links = text.match(URL_RE) || [];
  const pendingLinks = links.filter((u) => !items.some((i) => i.url === u));

  const addFiles = async (files) => {
    const imgs = files.filter((f) => f.type?.startsWith('image/')).slice(0, 3);
    if (!imgs.length) return;
    setBusy('upload');
    setError(null);
    try {
      for (const f of imgs) {
        const res = await base44.integrations.Core.UploadPublicFile({ file: f });
        const url = res?.file_url;
        if (!url) continue;
        const name = (f.name || 'Image').replace(/\.[^.]+$/, '').slice(0, 28) || 'Image';
        setItems((l) => [...l, { id: uid('A'), kind: 'image', name, url }]);
        onAddImage?.(url, name);
      }
    } catch (e) {
      setError(e?.message || 'That image could not be uploaded.');
    } finally {
      setBusy(null);
    }
  };

  const onPaste = (e) => {
    const files = Array.from(e.clipboardData?.files || []);
    const img = files.find((f) => f.type?.startsWith('image/'));
    if (img) {
      e.preventDefault();
      addFiles([img]);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) addFiles(files);
  };

  const buildScene = (data, idea) => {
    const produced = (Array.isArray(data?.layers) ? data.layers : []).slice(0, 6);
    const known = new Map(scene.layers.map((l) => [l.id, l]));
    const next = [];

    produced.forEach((l) => {
      const type = l.type === 'text' ? 'text' : l.type === 'image' ? 'image' : 'shape';
      if (type === 'image') {
        const base = l.id ? known.get(l.id) : null;
        if (base) {
          known.delete(l.id);
          next.push({ ...base, tracks: keysToTracks(l.keys, autoEase ? ease : 'linear') });
        }
        return;
      }
      next.push(makeLayer({
        type,
        name: String(l.name || (type === 'text' ? 'Title' : 'Shape')).slice(0, 40),
        shape: SHAPES.includes(l.shape) ? l.shape : 'circle',
        morphTo: SHAPES.includes(l.morphTo) ? l.morphTo : 'star',
        color: /^#[0-9a-f]{6}$/i.test(l.color || '') ? l.color : '#ffffff',
        text: String(l.text || '').slice(0, 40),
        size: Math.min(1, Math.max(0.03, Number(l.size) || 0.2)),
        tracks: keysToTracks(l.keys, autoEase ? ease : 'linear'),
      }));
    });

    // Never drop an image the user pasted in — carry over anything untouched.
    known.forEach((l) => { if (l.type === 'image') next.push(l); });

    if (!next.length) return null;
    return {
      name: String(data?.name || idea || 'Untitled animation').slice(0, 60),
      duration: Math.min(20, Math.max(2, Number(data?.duration) || 6)),
      layers: next,
    };
  };

  const send = async () => {
    const idea = text.trim();
    if (busy || (!idea && !items.length && !pendingLinks.length)) return;
    setError(null);
    try {
      const contexts = [];
      for (const url of pendingLinks.slice(0, 2)) {
        if (IMG_RE.test(url)) {
          setBusy('upload');
          const name = decodeURIComponent(url.split('/').pop() || 'Image').slice(0, 28);
          setItems((l) => [...l, { id: uid('A'), kind: 'image', name, url }]);
          onAddImage?.(url, name);
          continue;
        }
        setBusy('scrape');
        const res = await base44.functions.invoke('fetchUrlContent', { url });
        const d = res?.data || {};
        if (d.error) {
          contexts.push(`LINK ${url}: could not be read (${d.error})`);
          continue;
        }
        contexts.push([
          `LINK ${d.url || url}`,
          `TITLE: ${d.title || ''}`,
          `SUMMARY: ${d.metaDescription || ''}`,
          `CONTENT: ${String(d.textContent || '').slice(0, 2500)}`,
        ].join('\n'));
        setItems((l) => [...l, { id: uid('K'), kind: 'link', name: hostOf(url), url }]);
      }

      if (!idea && !items.length && !contexts.length) return;

      setBusy('direct');
      const images = items.filter((i) => i.kind === 'image').map((i) => i.url);
      const existing = scene.layers
        .filter((l) => l.type === 'image')
        .map((l) => ({ id: l.id, name: l.name }));

      const out = await invokeProtectedOperation('morphDirector', {
        idea,
        context: contexts.join('\n\n').slice(0, 8000),
        images,
        existing,
        catalog: SEQUENCES.map(({ name, label, description }) => ({ name, label, description })),
        presets: UI_MORPHS.map(({ id, label }) => ({ id, label })),
      });

      // The director may hand back prebuilt sequences instead of — or as well as
      // — new layers. Chain every one it asked for, in order.
      const names = (Array.isArray(out?.sequences) ? out.sequences : [])
        .map((s) => (typeof s === 'string' ? s : s?.name))
        .filter((n) => SEQUENCES.some((s) => s.name === n));

      // A UI morph the director chose lands exactly the way it does from the
      // panel: real geometry, the morph between the two, and its cover image —
      // which the director may have swapped for one of the attached images.
      const preset = UI_MORPHS.find((p) => p.id === out?.preset);
      const withPreset = preset
        ? applyMorphPreset(scene, preset.id, out?.presetImage ? { image: out.presetImage } : {})
        : null;

      const built = out?.scene?.layers?.length ? buildScene(out.scene, idea) : null;
      const dyn = out?.dynamics && typeof out.dynamics === 'object' ? out.dynamics : null;
      const marks = Array.isArray(out?.markers) ? out.markers : [];
      // "sequence" means: animate the logo already on screen, don't replace it.
      const animateCurrent = out?.mode === 'sequence' && names.length && scene.layers.length > 0;

      if (withPreset) onScene(names.reduce((s, n) => applySequence(s, n, {}), withPreset), dyn, marks);
      else if (animateCurrent || (!built && names.length)) onSequences?.(names, dyn, marks);
      else if (built) onScene(names.reduce((s, n) => applySequence(s, n, {}), built), dyn, marks);
      else if (dyn || marks.length) onSequences?.([], dyn, marks);
      else throw new Error('The director returned nothing usable — try rephrasing.');

      setText('');
      setItems([]);
    } catch (e) {
      setError(e?.message || 'The director could not build that.');
    } finally {
      setBusy(null);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="px-2 pb-2 pt-1.5">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-2xl border border-white/12 bg-white/[0.03] focus-within:border-white/30 transition-colors"
      >
        {(items.length > 0 || pendingLinks.length > 0) && (
          <div className="flex flex-wrap gap-1.5 px-2 pt-2">
            {items.map((it) => (
              <span
                key={it.id}
                className="flex items-center gap-1.5 max-w-[190px] pl-1 pr-1.5 py-0.5 rounded-full border border-white/15 bg-white/[0.06] text-[10px] text-white/70"
              >
                {it.kind === 'image'
                  ? <img src={it.url} alt="" className="w-4 h-4 rounded-full object-cover" />
                  : <Link2 className="w-3 h-3 shrink-0" />}
                <span className="truncate">{it.name}</span>
                <button
                  onClick={() => setItems((l) => l.filter((x) => x.id !== it.id))}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {pendingLinks.map((u) => (
              <span
                key={u}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/15 bg-white/[0.04] text-[10px] text-white/50"
              >
                <Link2 className="w-3 h-3" />
                will read {hostOf(u)}
              </span>
            ))}
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          rows={compact ? 2 : 1}
          placeholder="Describe the animation, paste an image, or drop a link…"
          className="w-full bg-transparent px-3 py-2 text-[12px] leading-relaxed text-white placeholder:text-white/25 outline-none resize-none"
        />

        <div className="flex items-center gap-1.5 px-2 pb-2">
          <button
            onClick={() => fileRef.current?.click()}
            title="Attach an image"
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(Array.from(e.target.files || []))}
          />

          <button
            onClick={onToggleAutoEase}
            title="Auto-ease every keyframe"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
              autoEase ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-ease</span>
          </button>

          {autoEase && (
            <select
              value={ease}
              onChange={(e) => onEaseChange(e.target.value)}
              className="bg-white/[0.05] border border-white/10 rounded-lg px-1.5 py-1 text-[10px] text-white/80 outline-none"
            >
              {EASE_NAMES.map((n) => <option key={n} value={n} className="bg-black">{n}</option>)}
            </select>
          )}

          <span className="ml-auto text-[10px] text-white/30 truncate">
            {busy ? LABEL[busy] : 'AI director'}
          </span>

          <button
            onClick={send}
            disabled={!!busy || (!text.trim() && !items.length && !pendingLinks.length)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-[11px] font-bold disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 px-1 pt-1 text-[10px] text-red-400">
          <ImagePlus className="w-3 h-3 mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}