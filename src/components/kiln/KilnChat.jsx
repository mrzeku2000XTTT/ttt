import React, { useEffect, useRef } from 'react';
import { ArrowUp, ImagePlus, Link2 } from 'lucide-react';
import KilnWorkBubble from './KilnWorkBubble';
import { IconSpark } from './KilnIcons';

function AgentMessage({ message }) {
  return (
    <div className="flex gap-2.5">
      <span className="kiln-pixel mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-[hsl(var(--k-ink))] text-[hsl(var(--k-bg))]">
        <IconSpark size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] leading-6 text-[hsl(var(--k-ink))]">{message.text}</p>
        {!!message.eta?.length && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.eta.map((entry) => (
              <span
                key={entry.id}
                title={entry.note}
                className="kiln-pixel border border-[hsl(var(--k-line))] bg-[hsl(var(--k-surface))] px-2 py-1 text-[10px] font-semibold"
              >
                {entry.component}
              </span>
            ))}
          </div>
        )}
        {!!message.sections?.length && (
          <p className="kiln-mono mt-2 text-[10px] text-[hsl(var(--k-muted))]">
            {message.sections.length} sections · {message.sections.reduce((sum, s) => sum + (s.itemCount || 0), 0)} items reproduced
          </p>
        )}
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div className="flex justify-end">
      <div className="kiln-pixel max-w-[86%] border border-[hsl(var(--k-line))] bg-[hsl(var(--k-bg))] p-2">
        {message.image && (
          <img
            src={message.image}
            alt="Source"
            className="mb-1.5 max-h-28 w-full rounded-[10px] object-cover"
          />
        )}
        <p className="kiln-mono break-all px-1 text-[11px] text-[hsl(var(--k-muted))]">{message.text}</p>
      </div>
    </div>
  );
}

export default function KilnChat({
  messages,
  busy,
  stage,
  elapsed,
  draft,
  setDraft,
  onSend,
  onPickFile,
  onPasteImage,
  hasSource,
}) {
  const scroll = useRef(null);
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy]);

  return (
    <section className="kiln-card flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[hsl(var(--k-line))] px-3 py-2">
        <span className="kiln-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--k-muted))]">
          Forge chat
        </span>
        <span className="kiln-mono ml-auto text-[10px] text-[hsl(var(--k-muted))]">ETA model loaded</span>
      </div>

      <div ref={scroll} className="kiln-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {!messages.length && !busy && (
          <div className="space-y-2 py-6 text-center">
            <p className="kiln-display text-[15px]">Drop a component, or paste a link.</p>
            <p className="mx-auto max-w-[240px] text-[11.5px] leading-5 text-[hsl(var(--k-muted))]">
              KILN reads the image, maps every block onto the ETA component model, and writes the working HTML.
            </p>
          </div>
        )}

        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AgentMessage key={message.id} message={message} />
          )
        )}

        {busy && <KilnWorkBubble stage={stage} elapsed={elapsed} />}
        <div ref={end} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
        className="border-t border-[hsl(var(--k-line))] p-2"
      >
        <div className="kiln-pixel border border-[hsl(var(--k-line))] bg-[hsl(var(--k-bg))] p-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onPaste={(event) => {
              const file = Array.from(event.clipboardData?.files || [])[0];
              if (file && file.type.startsWith('image/')) {
                event.preventDefault();
                onPasteImage(file);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            rows={2}
            disabled={busy}
            placeholder={
              hasSource
                ? 'Tell KILN what to change — or name an ETA component, preset or transition…'
                : 'Drop an image, paste a screenshot, or paste an image link…'
            }
            className="kiln-mono w-full resize-none bg-transparent text-[12px] leading-5 outline-none placeholder:text-[hsl(var(--k-muted))] disabled:opacity-50"
          />
          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPickFile}
              disabled={busy}
              title="Add an image"
              className="kiln-btn px-2.5 py-1.5"
            >
              <ImagePlus className="h-3.5 w-3.5" />
            </button>
            <span className="kiln-mono flex items-center gap-1 text-[10px] text-[hsl(var(--k-muted))]">
              <Link2 className="h-3 w-3" />
              link or file
            </span>
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="kiln-btn kiln-btn-primary ml-auto px-3 py-1.5"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              {hasSource ? 'Edit' : 'Build'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}