import React, { useEffect, useRef, useState } from "react";
import { Music, Upload, X, Volume2, VolumeX } from "lucide-react";

/**
 * MusicTrack — MP3/audio ingestion for Cháoxiào.
 *
 * - Accepts MP3/WAV/M4A/AAC/OGG via upload OR external URL (e.g. ?audio= from Katagami).
 * - Plays in sync with the timeline playhead — seeks when scrubbed, plays/pauses
 *   with the preview, and respects user mute.
 * - Lives ABOVE the timeline so it visually represents an audio "lane" without
 *   being a draggable keyframe track.
 *
 * Props:
 *   playhead    — current timeline time in seconds (drives audio seek)
 *   playing     — boolean, true when the timeline is in playback
 *   duration    — timeline duration; audio plays only within [0, duration]
 *   externalUrl — optional preloaded audio URL (from Katagami handoff)
 */
export default function MusicTrack({ playhead = 0, playing = false, duration = 4, externalUrl = null }) {
  const audioRef = useRef(null);
  const fileRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [name, setName] = useState("");
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState(null);

  // Load externalUrl from Katagami handoff
  useEffect(() => {
    if (externalUrl && !src) {
      setSrc(externalUrl);
      setName("Katagami audio");
    }
  }, [externalUrl, src]);

  // Cleanup any blob URL on unmount or replace
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Sync audio element with timeline state
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !src) return;
    a.volume = muted ? 0 : volume;
  }, [muted, volume, src]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !src) return;
    // Seek when playhead jumps (scrub) — only seek if drift > 100ms
    if (Math.abs((a.currentTime || 0) - playhead) > 0.15) {
      try { a.currentTime = Math.max(0, Math.min(playhead, a.duration || playhead)); } catch { /* ignore */ }
    }
  }, [playhead, src]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !src) return;
    if (playing) {
      a.play().catch(() => { /* autoplay block — silent */ });
    } else {
      a.pause();
    }
  }, [playing, src]);

  // Stop audio when playhead reaches duration end
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !src) return;
    if (playhead >= duration) a.pause();
  }, [playhead, duration, src]);

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(mp3|wav|m4a|aac|ogg)$/i.test(file.name)) {
      setError("Please pick an audio file (MP3, WAV, M4A, AAC, OGG)");
      return;
    }
    setError(null);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSrc(url);
    setName(file.name);
    e.target.value = "";
  };

  const clearAudio = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSrc(null);
    setName("");
    setError(null);
  };

  return (
    <div className="rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl p-3 mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 pr-1">
          <Music className="w-3 h-3" /> Music
        </div>

        {!src ? (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold"
              title="Upload an MP3 / audio file to play with the preview"
            >
              <Upload className="w-3 h-3" /> Upload MP3
            </button>
            <span className="text-[10px] text-white/40">No track loaded</span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 px-2 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold max-w-[220px]">
              <Music className="w-3 h-3 flex-shrink-0" />
              <span className="truncate" title={name}>{name || "Audio"}</span>
              <button
                onClick={clearAudio}
                className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500/40 opacity-70 hover:opacity-100"
                title="Remove track"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>

            <button
              onClick={() => setMuted((m) => !m)}
              className={`w-7 h-7 flex items-center justify-center rounded-full border text-[11px] ${
                muted
                  ? "bg-white/5 border-white/10 text-white/50"
                  : "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
              }`}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-emerald-400"
              title={`Volume ${Math.round(volume * 100)}%`}
            />

            <button
              onClick={() => fileRef.current?.click()}
              className="ml-auto flex items-center gap-1 h-7 px-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-[10px] font-bold"
              title="Replace audio"
            >
              <Upload className="w-3 h-3" /> Replace
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-1.5 text-[10px] text-red-300">{error}</div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
        onChange={onPickFile}
        className="hidden"
      />

      {/* Hidden audio element — controlled programmatically by playhead/playing */}
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="auto"
          loop={false}
        />
      )}
    </div>
  );
}