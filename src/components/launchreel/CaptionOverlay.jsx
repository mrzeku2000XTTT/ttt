import React, { useState, useEffect } from "react";
import { Captions, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Auto-captions: uploads the video audio to TranscribeAudio,
 * then splits the transcript into time-synced caption chunks.
 */
export default function CaptionOverlay({ videoUrl, videoRef, onCaptions, onCurrentCaption }) {
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!videoUrl) return;
    setLoading(true);
    setError("");
    try {
      // Upload the video file to get a URL for transcription
      const blob = await fetch(videoUrl).then((r) => r.blob());
      const file = new File([blob], "recording.mp4", { type: blob.type });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Transcribe
      const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
      const text = typeof transcript === "string" ? transcript : transcript?.text || "";

      // Split into ~6-word chunks for word-by-word display
      const words = text.split(/\s+/).filter(Boolean);
      const chunks = [];
      for (let i = 0; i < words.length; i += 6) {
        chunks.push({
          text: words.slice(i, i + 6).join(" "),
          start: (i / words.length) * 100,
          end: ((i + 6) / words.length) * 100,
        });
      }
      setCaptions(chunks);
      setEnabled(true);
      onCaptions?.(chunks);
    } catch (err) {
      setError("Could not transcribe audio. Try a recording with clear speech.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync current caption to video time
  useEffect(() => {
    if (!enabled || !captions.length || !videoRef?.current) return;
    const v = videoRef.current;
    const onTime = () => {
      if (!v.duration) return;
      const pct = (v.currentTime / v.duration) * 100;
      const active = captions.find((c) => pct >= c.start && pct < c.end);
      onCurrentCaption?.(active?.text || "");
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [enabled, captions, videoRef, onCurrentCaption]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Captions className="w-4 h-4 text-cyan-400" />
        <span className="text-white font-semibold text-sm">Auto-Captions</span>
        {enabled && (
          <span className="ml-auto text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            ACTIVE
          </span>
        )}
      </div>

      {!enabled ? (
        <button
          onClick={generate}
          disabled={loading || !videoUrl}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-semibold hover:from-cyan-500/30 hover:to-purple-500/30 transition-all disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Transcribing audio…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate captions</>
          )}
        </button>
      ) : (
        <div className="text-[11px] text-white/40 leading-relaxed bg-white/5 rounded-lg p-3 max-h-24 overflow-y-auto">
          {captions.map((c, i) => (
            <span key={i} className="mr-1">{c.text}</span>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-[11px]">{error}</p>}
    </div>
  );
}