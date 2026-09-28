import React, { useState } from "react";
import { BringToFront, Loader2, SendToBack, Sparkles, Trash2 } from "lucide-react";
import { isBehind, KIND_BACKGROUND, KIND_LABELS, KIND_PROP } from "./sceneAssets";

/**
 * Everything around the character: a background plate, props, and the generator
 * that makes them. Anything added here can be picked up and moved on the stage.
 */
export default function ScenePanel({
  assets,
  selectedId,
  onSelect,
  onChange,
  onDelete,
  onGenerate,
  onAddFiles,
  generating,
  error,
}) {
  const [subject, setSubject] = useState("");
  const [kind, setKind] = useState(KIND_PROP);
  const [transparent, setTransparent] = useState(true);

  const selected = assets.find((asset) => asset.id === selectedId) || null;

  const make = () => {
    if (!subject.trim() || generating) return;
    onGenerate({ subject, kind, transparent: kind === KIND_PROP && transparent });
  };

  return (
    <>
      <p className="ts-hint">
        Generate a prop or a backdrop, or drag any image straight onto the stage. Props are cut out of the white sheet
        they are drawn on, so they land transparent and ready to move.
      </p>

      <textarea
        className="ts-prompt"
        rows={2}
        placeholder="A weathered wooden signpost"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />

      <h3 className="ts-sub">What to make</h3>
      <div className="ts-parts ts-parts-2" role="radiogroup" aria-label="Asset kind">
        <button
          type="button"
          role="radio"
          aria-checked={kind === KIND_PROP}
          className={`ts-part ${kind === KIND_PROP ? "is-active" : ""}`}
          onClick={() => setKind(KIND_PROP)}
        >
          Prop
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={kind === KIND_BACKGROUND}
          className={`ts-part ${kind === KIND_BACKGROUND ? "is-active" : ""}`}
          onClick={() => setKind(KIND_BACKGROUND)}
        >
          Background
        </button>
      </div>

      {kind === KIND_PROP && (
        <label className="ts-check">
          <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} />
          Cut out the white background
        </label>
      )}

      <button
        type="button"
        className="ts-btn ts-btn-primary"
        onClick={make}
        disabled={generating || !subject.trim()}
      >
        {generating ? <Loader2 className="ts-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {generating ? "Generating…" : "Generate"}
      </button>

      {error && <p className="ts-note">{error}</p>}

      <label className="ts-file">
        Or add an image from your device
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            onAddFiles(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
      </label>

      {assets.length > 0 && (
        <>
          <h3 className="ts-sub">In this scene</h3>
          <div className="ts-asset-list">
            {assets.map((asset) => (
              <div key={asset.id} className={`ts-asset-row ${asset.id === selectedId ? "is-active" : ""}`}>
                <button type="button" className="ts-asset-pick" onClick={() => onSelect(asset.id)}>
                  <img className="ts-asset-thumb" src={asset.url} alt="" />
                  <span className="ts-asset-name">{asset.name}</span>
                  <span className="ts-asset-kind">{KIND_LABELS[asset.kind]}</span>
                </button>
                <button
                  type="button"
                  className="ts-asset-del"
                  title={`Remove ${asset.name}`}
                  onClick={() => onDelete(asset.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <>
          <h3 className="ts-sub">Selected · {selected.name}</h3>
          <label className="ts-label" htmlFor="ts-asset-size">
            Size <b>{Math.round(selected.width)}%</b>
          </label>
          <input
            id="ts-asset-size"
            className="ts-range"
            type="range"
            min="3"
            max="220"
            value={selected.width}
            onChange={(event) => onChange(selected.id, { width: Number(event.target.value) })}
          />

          <label className="ts-label" htmlFor="ts-asset-y">
            Height <b>{Math.round(selected.y)}%</b>
          </label>
          <input
            id="ts-asset-y"
            className="ts-range"
            type="range"
            min="-10"
            max="110"
            value={selected.y}
            onChange={(event) => onChange(selected.id, { y: Number(event.target.value) })}
          />

          <h3 className="ts-sub">Layer</h3>
          <button
            type="button"
            className="ts-btn ts-btn-quiet"
            disabled={selected.kind === KIND_BACKGROUND}
            onClick={() => onChange(selected.id, { back: !isBehind(selected) })}
          >
            {isBehind(selected) ? (
              <BringToFront className="h-3.5 w-3.5" />
            ) : (
              <SendToBack className="h-3.5 w-3.5" />
            )}
            {isBehind(selected) ? "Bring to front" : "Send to back"}
          </button>
          <p className="ts-hint">
            {selected.kind === KIND_BACKGROUND
              ? "A background always sits behind the character."
              : isBehind(selected)
                ? "Behind the character — it never covers the artwork."
                : "In front of the character."}
          </p>

          <button type="button" className="ts-btn ts-btn-quiet" onClick={() => onDelete(selected.id)}>
            <Trash2 className="h-3.5 w-3.5" />
            Remove {selected.name.toLowerCase()}
          </button>
        </>
      )}
    </>
  );
}