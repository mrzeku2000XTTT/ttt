import React, { useRef, useState } from 'react';
import { Boxes, ImagePlus, Upload, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { COMPONENTS } from './morphComponents';
import { MOTIONS } from './morphDynamics';
import MorphSequences from './MorphSequences';

const TABS = [
  { id: 'components', label: 'Components', icon: Boxes },
  { id: 'presets', label: 'Presets', icon: Wand2 },
  { id: 'assets', label: 'Assets', icon: ImagePlus },
];

/**
 * The library: ready-made vector components, the motion presets, and the
 * project's assets — all three behind one set of tabs.
 */
export default function MorphLibrary({
  scene,
  onAddComponent,
  onApplySequence,
  onApplyDynamics,
  onAddAsset,
  hasSelection,
}) {
  const [tab, setTab] = useState('components');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const assets = scene.layers.filter((l) => l.type === 'image' && l.src);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onAddAsset(file_url, file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setError(err?.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="border-b border-white/10">
      <div className="flex items-center gap-1 px-2.5 pt-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Library</span>
      </div>

      <div className="flex items-center gap-1 px-2.5 py-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                tab === t.id ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-2.5 pb-2.5">
        {tab === 'components' && (
          <div className="grid grid-cols-2 gap-1.5">
            {COMPONENTS.map((c) => (
              <button
                key={c.id}
                onClick={() => onAddComponent(c.make())}
                title={c.hint}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left hover:border-white/40 transition-colors"
              >
                <span className="block text-[10px] font-semibold text-white/85">{c.name}</span>
                <span className="block text-[9px] leading-tight text-white/35">{c.hint}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'presets' && (
          <div className="space-y-2">
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-white/30 mb-1">Behaviour</span>
              <div className="grid grid-cols-2 gap-1.5">
                {MOTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onApplyDynamics(m.id)}
                    title={m.hint}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left hover:border-white/40 transition-colors"
                  >
                    <span className="block text-[10px] font-semibold text-white/85">{m.label}</span>
                    <span className="block text-[9px] leading-tight text-white/35">{m.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="-mx-2.5 border-t border-white/10">
              <MorphSequences onApply={onApplySequence} hasSelection={hasSelection} />
            </div>
          </div>
        )}

        {tab === 'assets' && (
          <div className="space-y-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-2.5 text-[10px] text-white/55 hover:text-white hover:border-white/50 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3 h-3" />
              {busy ? 'Uploading…' : 'Upload an image'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
            {error && <p className="text-[9px] text-red-300">{error}</p>}

            {assets.length === 0 ? (
              <p className="text-[10px] text-white/30 py-1">No images in this project yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {assets.map((a) => (
                  <div key={a.id} className="rounded-lg overflow-hidden border border-white/10 bg-white/[0.03]">
                    <img src={a.src} alt={a.name} className="w-full h-14 object-cover" />
                    <span className="block truncate px-1 py-0.5 text-[9px] text-white/45">{a.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}