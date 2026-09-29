import React, { useRef, useState } from "react";
import { Captions, Loader2, Pause, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TextTemplatePicker from "./TextTemplatePicker";
import CaptionMotionPanel from "./CaptionMotionPanel";

const clock = (value) => {
  const total = Number.isFinite(value) ? Math.max(0, value) : 0;
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

/**
 * The timeline under the stage.
 *
 * It plays, pauses and scrubs the voice track, and turns the words in it into a
 * caption. The caption is painted onto the canvas rather than laid over it, so
 * it lands in the exported frame exactly as it looks here.
 */
export default function TalkStickTransport({ engine, caption, onCaption }) {
  const scrubRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const patch = (next) => onCaption({ ...caption, ...next });

  const transcribe = () => {
    if (!engine.audioFile || busy) return;
    setBusy(true);
    setError("");
    // Transcribing means wanting the words to follow the voice, so a caption still
    // sitting as one block starts moving with the track.
    const follow = (caption.anim || "off") === "off" ? { anim: "chunk" } : {};
    const tidy = (value) => String(value || "").replace(/\s+/g, " ").trim();

    base44.integrations.Core.UploadPublicFile({ file: engine.audioFile })
      .then(({ file_url }) =>
        // The recogniser hands back the moment each word was spoken, so the caption
        // is cut from the voice itself instead of estimated from the words.
        base44.functions
          .invoke("talkStickTranscribe", { audio_url: file_url })
          .then(({ data }) => {
            if (!data?.words?.length) throw new Error(data?.error || "No speech found");
            patch({ text: tidy(data.text), words: data.words, ...follow });
          })
          .catch(() =>
            // No timings came back — the words still follow the track, shared out
            // across it by how long each one takes to say.
            base44.integrations.Core.TranscribeAudio({ audio_url: file_url }).then((result) => {
              const spoken = typeof result === "string" ? result : result?.text || "";
              patch({ text: tidy(spoken).slice(0, 1500), words: null, ...follow });
            }),
          ),
      )
      .catch(() => setError("That audio could not be transcribed."))
      .finally(() => setBusy(false));
  };

  return (
    <section className="ts-transport">
      <div className="ts-transport-bar">
        <span className="ts-transport-label">Timeline</span>
        <button
          type="button"
          className="ts-transport-play"
          onClick={engine.togglePlay}
          disabled={!engine.audioFile}
          title={engine.playing ? "Pause" : "Play"}
        >
          {engine.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <input
          ref={scrubRef}
          className="ts-scrub"
          type="range"
          min="0"
          max={engine.duration || 0}
          step="0.02"
          defaultValue="0"
          disabled={!engine.audioFile}
          aria-label="Audio position"
          onPointerDown={() => {
            engine.scrubbing.current = true;
          }}
          onPointerUp={() => {
            engine.scrubbing.current = false;
          }}
          onChange={(event) => engine.seek(Number(event.target.value))}
        />
        <span className="ts-time">{clock(engine.duration)}</span>
      </div>

      <p className="ts-hint">
        {engine.audioFile
          ? "Play, pause and drag the bar to scrub the voice track — the mouth follows wherever you land."
          : "Load an audio file in Voice and the timeline appears here, ready to scrub."}
      </p>

      <h3 className="ts-sub">Caption</h3>
      <div className="ts-caption-row">
        <input
          className="ts-input"
          type="text"
          placeholder="Type a caption, or transcribe the audio"
          value={caption.text}
          onChange={(event) =>
            // Typing new words means the old timings no longer describe them.
            patch({ text: event.target.value, words: null })
          }
        />
        <button
          type="button"
          className="ts-btn ts-btn-compact"
          onClick={transcribe}
          disabled={!engine.audioFile || busy}
        >
          {busy ? <Loader2 className="ts-spin" /> : <Captions className="h-3.5 w-3.5" />}
          {busy ? "Transcribing…" : "Transcribe"}
        </button>
      </div>
      {error && <p className="ts-note">{error}</p>}

      <CaptionMotionPanel caption={caption} onChange={patch} engine={engine} />

      <h3 className="ts-sub">Text library</h3>
      <TextTemplatePicker
        value={caption.template}
        colour={caption.color}
        accent={caption.accent}
        onChange={(template) => patch({ template })}
      />

      <div className="ts-row">
        <div>
          <label className="ts-label" htmlFor="ts-cap-colour">
            Text
          </label>
          <input
            id="ts-cap-colour"
            className="ts-colour"
            type="color"
            value={caption.color}
            onChange={(event) => patch({ color: event.target.value })}
          />
        </div>
        <div>
          <label className="ts-label" htmlFor="ts-cap-accent">
            Accent
          </label>
          <input
            id="ts-cap-accent"
            className="ts-colour"
            type="color"
            value={caption.accent}
            onChange={(event) => patch({ accent: event.target.value })}
          />
        </div>
      </div>
    </section>
  );
}