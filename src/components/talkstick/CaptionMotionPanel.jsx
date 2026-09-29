import React, { useEffect, useState } from "react";
import { MOTION_MODES, MOTION_STYLES, groupWords } from "./captionMotion";

/**
 * The motion controls for the caption: how the words are cut up, how each card
 * arrives, and when.
 *
 * The words are timed off the voice track itself, so once a track is loaded the
 * readout underneath names the card that is on screen right now — which is what
 * turns the sync offset into something you dial in by eye instead of by guesswork.
 */
export default function CaptionMotionPanel({ caption, onChange, engine }) {
  const mode = caption.anim || "off";
  const style = caption.motionStyle || "pop";
  const chunk = caption.chunk ?? 3;
  const offset = caption.syncOffset || 0;
  const words = String(caption.text || "").split(/\s+/).filter(Boolean).length;
  const cards = groupWords(caption.text, mode, chunk).length;
  const [now, setNow] = useState(null);

  // The renderer already works out which card the voice is on; this only reads it
  // back a few times a second, so the caption itself never re-renders per frame.
  useEffect(() => {
    if (mode === "off") {
      setNow(null);
      return undefined;
    }
    const timer = setInterval(() => {
      const seen = engine?.cue?.current;
      setNow(seen?.total ? seen : null);
    }, 120);
    return () => clearInterval(timer);
  }, [mode, engine]);

  const readout = () => {
    if (!engine?.audioFile) return "Load a voice track and the words follow it.";
    if (!now) return "Press play and the words follow the voice.";
    return (
      <>
        On screen now: <b>“{now.text}”</b> · card {now.index + 1} of {now.total}
      </>
    );
  };

  return (
    <>
      <h3 className="ts-sub">Text motion</h3>
      <div className="ts-parts" role="radiogroup" aria-label="How the caption is cut">
        {MOTION_MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={mode === item.id}
            className={`ts-part ${mode === item.id ? "is-active" : ""}`}
            onClick={() => onChange({ anim: item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "off" ? (
        <p className="ts-hint">
          The whole caption sits on the frame. Cut it to <b>One word</b> or a <b>Phrase</b> and the words follow the
          voice — the caption shows only what is being said at that moment.
        </p>
      ) : (
        <>
          <h3 className="ts-sub">Arrival</h3>
          <div className="ts-parts" role="radiogroup" aria-label="Arrival animation">
            {MOTION_STYLES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={style === item.id}
                className={`ts-part ${style === item.id ? "is-active" : ""}`}
                onClick={() => onChange({ motionStyle: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>

          {mode === "chunk" && (
            <>
              <label className="ts-label" htmlFor="ts-motion-chunk">
                Words per card <b>{chunk}</b>
              </label>
              <input
                id="ts-motion-chunk"
                className="ts-range"
                type="range"
                min="2"
                max="6"
                step="1"
                value={chunk}
                onChange={(event) => onChange({ chunk: Number(event.target.value) })}
              />
            </>
          )}

          <label className="ts-label" htmlFor="ts-motion-offset">
            Sync{" "}
            <b>
              {offset > 0 ? "+" : ""}
              {offset.toFixed(2)}s
            </b>
          </label>
          <input
            id="ts-motion-offset"
            className="ts-range"
            type="range"
            min="-3"
            max="3"
            step="0.05"
            value={offset}
            onChange={(event) => onChange({ syncOffset: Number(event.target.value) })}
          />

          <p className={`ts-motion-now ${now ? "is-live" : ""}`}>{readout()}</p>

          <p className="ts-hint">
            {words} word{words === 1 ? "" : "s"} cut into {cards} card{cards === 1 ? "" : "s"} across the track. Sync
            nudges every card earlier or later so the words land with the voice.
          </p>
        </>
      )}
    </>
  );
}