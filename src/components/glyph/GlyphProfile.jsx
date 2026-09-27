import React, { useCallback, useEffect, useState } from 'react';
import { LayoutGrid, User, X } from 'lucide-react';
import GlyphProfileTab from './GlyphProfileTab';
import GlyphGalleryTab from './GlyphGalleryTab';
import { addWorks, isSeeded, markSeeded, readGallery, removeWork } from './glyphGalleryStore';
import { buildBackups, buildInspirations, workFromParams } from './glyphInspirations';
import { sampleSource } from './glyphSampleSource';

// Profile and gallery: who the shelf belongs to, and what is on it. The pieces
// live on the device, so the shelf comes back exactly as it was after a refresh.
export default function GlyphProfile({
  owner,
  wallet,
  source,
  onUse,
  onCount,
  onClose,
  initialTab = 'gallery',
  autoInspire = false,
}) {
  const [tab, setTab] = useState(initialTab);
  const [works, setWorks] = useState(() => readGallery(owner));
  const [ideas, setIdeas] = useState([]);
  const [busy, setBusy] = useState(false);
  const [stocking, setStocking] = useState(false);

  // Ideas are built from the picture in the studio; with nothing loaded, the
  // built-in one stands in, so inspiration is never blocked by an empty canvas.
  const picture = useCallback(() => source || sampleSource(), [source]);

  const inspire = useCallback(() => {
    setBusy(true);
    window.setTimeout(() => {
      try {
        setIdeas(buildInspirations(picture(), 8));
      } catch (e) {
        /* a failed batch is not worth an error banner — the shelf is still there */
      }
      setBusy(false);
    }, 30);
  }, [picture]);

  // A brand-new gallery is stocked once, and the first batch of ideas is built
  // when the panel was opened for exactly that.
  useEffect(() => {
    let alive = true;
    const first = !isSeeded(owner);
    if (first) setStocking(true);
    if (autoInspire) setBusy(true);
    window.setTimeout(() => {
      if (!alive) return;
      if (first) {
        try {
          setWorks(addWorks(owner, buildBackups(sampleSource(), 6)));
        } catch (e) {
          /* an empty shelf beats a broken panel */
        }
        markSeeded(owner);
        setStocking(false);
      }
      if (autoInspire) {
        try {
          setIdeas(buildInspirations(picture(), 8));
        } catch (e) {
          /* ignore */
        }
      }
      setBusy(false);
    }, 30);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  useEffect(() => {
    onCount?.(works.length);
  }, [works.length, onCount]);

  const keep = useCallback(
    (work) => {
      setWorks(addWorks(owner, [workFromParams(picture(), work.params, work.kind === 'starter' ? 'starter' : 'idea')]));
    },
    [owner, picture],
  );

  const drop = useCallback((work) => setWorks(removeWork(owner, work.id)), [owner]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: 'rgba(4,7,12,0.95)', backdropFilter: 'blur(16px)' }}>
      <div className="flex shrink-0 items-center gap-1.5 px-3 py-3 sm:px-5" style={{ borderBottom: '1px solid var(--g-line)' }}>
        {[
          { id: 'gallery', label: 'Gallery', icon: LayoutGrid },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`glyph-btn ${tab === t.id ? 'glyph-btn-primary' : 'glyph-btn-ghost'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
        <span className="glyph-muted ml-auto hidden text-[10px] sm:inline">kept on this device</span>
        <button onClick={onClose} className="glyph-pill ml-1 flex h-8 w-8 items-center justify-center rounded-full" title="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {tab === 'gallery' ? (
          <GlyphGalleryTab
            ideas={ideas}
            works={works}
            busy={busy}
            stocking={stocking}
            onInspire={inspire}
            onUse={onUse}
            onKeep={keep}
            onRemove={drop}
          />
        ) : (
          <GlyphProfileTab wallet={wallet} works={works} onInspire={() => { setTab('gallery'); inspire(); }} />
        )}
      </div>
    </div>
  );
}