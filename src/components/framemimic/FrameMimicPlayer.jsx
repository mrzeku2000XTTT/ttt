import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import {
  Play, Pause, Repeat, Download, Loader2, SkipBack, SkipForward, FileCode2, PenLine, Layers,
} from "lucide-react";
import { buildCombinedHtml } from "./frameMimicHtmlExport";

// Renders each cloned HTML frame in a sandboxed-free same-origin iframe and
// exports the sequence as MP4 by rasterizing every frame (html2canvas) onto
// a canvas captured by MediaRecorder.

const setDoc = (iframe, html) =>
  new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setTimeout(resolve, 250); // let fonts/images settle
    };
    iframe.onload = finish;
    iframe.srcdoc = html;
    setTimeout(finish, 5000); // safety: identical consecutive frames may not re-fire load
  });

export default function FrameMimicPlayer({ frames, fps, width, height, onUpdate, seekIndex, onCurrentChange }) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const exportIframeRef = useRef(null);
  const refA = useRef(null);
  const refB = useRef(null);
  const framesRef = useRef(frames);

  // Crossfade layers — the previous frame stays visible (and opaque) while
  // the next one loads, so the preview never flashes white between frames.
  const [layerA, setLayerA] = useState(0);
  const [layerB, setLayerB] = useState(-1);
  const [topLayer, setTopLayer] = useState("A");
  const [fadeIn, setFadeIn] = useState(false);
  const [backVisible, setBackVisible] = useState(true);
  const fadeTimerRef = useRef(null);

  const docOf = (layer) => (layer === "A" ? refA : refB).current?.contentDocument;

  useEffect(() => { framesRef.current = frames; }, [frames]);

  // ── Live text editing — click any text in the preview and retype it ──
  const applyEditable = () => {
    const doc = docOf(topLayer);
    if (!doc?.body || !editMode) return;
    doc.body.contentEditable = "true";
    doc.body.style.outline = "none";
  };
  useEffect(applyEditable, [editMode, current, topLayer, fadeIn]);

  const saveEdits = () => {
    const doc = docOf(topLayer);
    const frame = framesRef.current[current];
    if (!doc?.documentElement || !frame?.html) return;
    doc.body.removeAttribute("contenteditable");
    doc.body.style.outline = "";
    const html = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    if (html !== frame.html) onUpdate?.(frame.index, html);
  };

  const goTo = (n) => {
    if (editMode) saveEdits();
    setCurrent(n);
    onCurrentChange?.(frames[n]?.index);
  };

  // Follow the frame strip's selection so the preview, refine input and
  // exports always act on the same frame.
  useEffect(() => {
    if (seekIndex == null) return;
    const pos = frames.findIndex((f) => f.index === seekIndex);
    if (pos >= 0 && pos !== current) {
      if (editMode) saveEdits();
      setCurrent(pos);
    }
  }, [seekIndex]);

  // Assign each frame to the back layer and fade it in once loaded —
  // the old frame stays fully visible underneath until then (no white flash).
  useEffect(() => {
    const shown = topLayer === "A" ? layerA : layerB;
    if (current === shown) return;
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setFadeIn(false);
    setBackVisible(true); // keep the old frame visible under the new one
    if (topLayer === "A") { setLayerB(current); setTopLayer("B"); }
    else { setLayerA(current); setTopLayer("A"); }
  }, [current]);

  const toggleEdit = () => {
    if (editMode) { saveEdits(); setEditMode(false); }
    else { setPlaying(false); setEditMode(true); }
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrent((c) => {
        if (c + 1 >= frames.length) {
          if (loop) {
            onCurrentChange?.(frames[0]?.index);
            return 0;
          }
          setPlaying(false);
          return c;
        }
        onCurrentChange?.(frames[c + 1]?.index);
        return c + 1;
      });
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [playing, loop, fps, frames.length]);

  const downloadFrameHtml = () => {
    const html = frames[current]?.html;
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `framemimic-frame-${current + 1}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCombinedHtml = () => {
    const exportFrames = framesRef.current.filter((f) => f.html);
    if (!exportFrames.length) return;
    const html = buildCombinedHtml(exportFrames, fps, width, height);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "framemimic.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("All frames exported as one animated HTML");
  };

  const exportMp4 = async () => {
    if (exporting || !frames.length) return;
    if (editMode) { saveEdits(); setEditMode(false); await new Promise((r) => setTimeout(r, 200)); }
    const exportFrames = framesRef.current;
    const mimeType = [
      "video/mp4;codecs=avc1.42E01E",
      "video/mp4;codecs=avc1",
      "video/mp4",
    ].find((t) => MediaRecorder.isTypeSupported?.(t));
    if (!mimeType) {
      toast.error("This browser can't record MP4 — try Chrome or Edge.");
      return;
    }

    setExporting(true);
    setExportMsg("Preparing…");
    setVideoUrl(null);

    try {
      // Phase 1 — rasterize every frame first, so the recording phase can run
      // at exact real-time pacing (same length & smoothness as the source).
      const shots = [];
      for (let i = 0; i < exportFrames.length; i++) {
        await setDoc(exportIframeRef.current, exportFrames[i].html);
        const doc = exportIframeRef.current.contentDocument;
        const shot = await html2canvas(doc.body, {
          width, height, scale: 1, backgroundColor: "#000", logging: false,
        });
        const blob = await new Promise((res) => shot.toBlob(res, "image/jpeg", 0.92));
        if (!blob) throw new Error(`Frame ${i + 1} could not be rendered`);
        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = () => rej(new Error(`Frame ${i + 1} could not be loaded`));
          img.src = URL.createObjectURL(blob);
        });
        shots.push({ img, url: img.src });
        setExportMsg(`Rendering ${i + 1}/${exportFrames.length}…`);
      }

      // Phase 2 — record the pre-rendered frames to MP4 at exact pacing.
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      const stream = canvas.captureStream(30);
      const chunks = [];
      const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
      rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      const stopped = new Promise((r) => { rec.onstop = r; });
      rec.start(500);

      for (let i = 0; i < shots.length; i++) {
        ctx.drawImage(shots[i].img, 0, 0, width, height);
        setExportMsg(`Recording ${i + 1}/${shots.length}…`);
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      await new Promise((r) => setTimeout(r, 200));
      rec.stop();
      await stopped;
      stream.getTracks().forEach((t) => t.stop());
      shots.forEach((s) => URL.revokeObjectURL(s.url));

      if (chunks.length) {
        const blob = new Blob(chunks, { type: mimeType });
        setVideoUrl(URL.createObjectURL(blob));
        toast.success("HTML video exported as MP4");
      } else {
        toast.error("No MP4 was recorded — try Chrome or Edge.");
      }
    } catch (err) {
      toast.error("Export failed: " + (err?.message || "unknown"));
    }
    setExportMsg("");
    setExporting(false);
  };

  const frame = frames[current];

  return (
    <div className="space-y-3">
      {/* Hidden render iframe for export (offscreen but rendered) */}
      <iframe
        ref={exportIframeRef}
        title="framemimic-export"
        className="fixed pointer-events-none"
        style={{ left: -10000, top: 0, width, height, zIndex: -1 }}
      />

      {/* Stage */}
      <div
        className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {frames[layerA]?.html && (
          <iframe
            key={`a-${layerA}`}
            ref={refA}
            title="frame preview A"
            srcDoc={frames[layerA].html}
            onLoad={() => {
              if (topLayer !== "A") return;
              setFadeIn(true);
              if (editMode) applyEditable();
              fadeTimerRef.current = setTimeout(() => setBackVisible(false), 170);
            }}
            className="absolute inset-0 w-full h-full transition-opacity duration-150"
            style={{
              opacity: topLayer === "A" ? (fadeIn ? 1 : 0) : backVisible ? 1 : 0,
              zIndex: topLayer === "A" ? 2 : 1,
            }}
          />
        )}
        {layerB >= 0 && frames[layerB]?.html && (
          <iframe
            key={`b-${layerB}`}
            ref={refB}
            title="frame preview B"
            srcDoc={frames[layerB].html}
            onLoad={() => {
              if (topLayer !== "B") return;
              setFadeIn(true);
              if (editMode) applyEditable();
              fadeTimerRef.current = setTimeout(() => setBackVisible(false), 170);
            }}
            className="absolute inset-0 w-full h-full transition-opacity duration-150"
            style={{
              opacity: topLayer === "B" ? (fadeIn ? 1 : 0) : backVisible ? 1 : 0,
              zIndex: topLayer === "B" ? 2 : 1,
            }}
          />
        )}
        {!frame?.html && (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">
            No frame
          </div>
        )}
      </div>

      {editMode && (
        <p className="text-[11px] text-white/50 flex items-center gap-1.5">
          <PenLine className="w-3 h-3" />
          Text editing is ON — click any text in the preview and retype it. Toggle the pen off to save.
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => goTo(Math.max(0, current - 1))}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70"
          title="Previous frame"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (editMode) { saveEdits(); setEditMode(false); }
            setPlaying((p) => !p);
          }}
          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={() => goTo(Math.min(frames.length - 1, current + 1))}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70"
          title="Next frame"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        <button
          onClick={() => setLoop((l) => !l)}
          className={`w-9 h-9 rounded-full border flex items-center justify-center ${
            loop ? "bg-white/10 border-white/30 text-white" : "bg-white/5 border-white/10 text-white/40"
          }`}
          title="Loop"
        >
          <Repeat className="w-4 h-4" />
        </button>

        <button
          onClick={toggleEdit}
          className={`w-9 h-9 rounded-full border flex items-center justify-center ${
            editMode ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/60 hover:text-white"
          }`}
          title={editMode ? "Turn off text editing (saves)" : "Edit text on this frame"}
        >
          <PenLine className="w-4 h-4" />
        </button>

        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          value={current}
          onChange={(e) => { setPlaying(false); goTo(Number(e.target.value)); }}
          className="flex-1 min-w-[120px] accent-white"
        />
        <span className="text-[11px] font-mono text-white/50 tabular-nums">
          {current + 1}/{frames.length}
        </span>

        <button
          onClick={downloadFrameHtml}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70"
          title="Download this frame's HTML"
        >
          <FileCode2 className="w-4 h-4" />
        </button>
        <button
          onClick={downloadCombinedHtml}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white"
          title="Download ALL frames as ONE animated HTML"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={exportMp4}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-white text-black text-xs font-bold disabled:opacity-40"
        >
          {exporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {exportMsg || "Exporting…"}
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" /> Export MP4
            </>
          )}
        </button>
      </div>

      {videoUrl && (
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <video src={videoUrl} controls className="w-full sm:w-64 rounded-lg border border-white/10" />
          <a
            href={videoUrl}
            download="framemimic.mp4"
            className="px-4 py-2 rounded-full border border-white/20 text-xs font-semibold text-white/80 hover:bg-white/5"
          >
            Download MP4
          </a>
        </div>
      )}
    </div>
  );
}