import React, { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Scissors } from "lucide-react";
import KuttAssets from "@/components/kutt/KuttAssets";
import KuttPreview from "@/components/kutt/KuttPreview";
import KuttTimeline from "@/components/kutt/KuttTimeline";
import KuttAgent from "@/components/kutt/KuttAgent";
import KuttRemotionPreview from "@/components/kutt/KuttRemotionPreview";
import { exportTimeline } from "@/components/kutt/kuttExport";

const uid = () => `k_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export default function KuttPage() {
  const [assets, setAssets] = useState([]);
  const [clips, setClips] = useState([]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewEngine, setPreviewEngine] = useState("canvas"); // "canvas" | "remotion"

  // Adjustable split-view sizes
  const [agentW, setAgentW] = useState(340);
  const [timelineH, setTimelineH] = useState(220);
  const dragRef = useRef(null);

  const duration = Math.max(...clips.map((c) => c.start + c.duration), 10);

  const addAssets = useCallback((newAssets) => setAssets((prev) => [...prev, ...newAssets]), []);

  const addToTimeline = (asset) => {
    const track = asset.type === "audio" ? 2 : 0;
    const end = Math.max(0, ...clips.filter((c) => c.track === track).map((c) => c.start + c.duration));
    setClips((prev) => [...prev, { id: uid(), assetId: asset.id, track, start: end, duration: asset.duration || 4, trimIn: 0 }]);
  };

  // Divider dragging (vertical = agent panel width, horizontal = timeline height)
  const startDrag = (e, kind) => {
    e.preventDefault();
    dragRef.current = { kind, startX: e.clientX, startY: e.clientY, origW: agentW, origH: timelineH };
    const move = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.kind === "v") setAgentW(Math.max(240, Math.min(560, d.origW - (ev.clientX - d.startX))));
      if (d.kind === "h") setTimelineH(Math.max(120, Math.min(420, d.origH - (ev.clientY - d.startY))));
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const handleExport = async () => {
    if (clips.length === 0) {
      alert("Add clips to the timeline first — ask the Director agent to generate a video, or import media.");
      return;
    }
    if (exporting) return;
    setExporting(true);
    setExportProgress(0);
    setPlaying(false);
    try {
      const { url, ext } = await exportTimeline({ clips, assets, onProgress: setExportProgress });
      const a = document.createElement("a");
      a.href = url;
      a.download = `kutt-export.${ext || "mp4"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
    setExporting(false);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <Link to="/AppStoreV2" className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-black text-sm tracking-tight">KUTT</span>
          <span className="hidden sm:inline px-2 py-0.5 bg-fuchsia-500/20 border border-fuchsia-500/40 rounded-full text-fuchsia-300 text-[9px] font-bold tracking-widest uppercase">AI Video Editor</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-white/10 overflow-hidden text-[10px] font-bold">
            <button
              onClick={() => setPreviewEngine("canvas")}
              className={`px-2.5 py-1.5 ${previewEngine === "canvas" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"}`}
            >
              Canvas
            </button>
            <button
              onClick={() => setPreviewEngine("remotion")}
              className={`px-2.5 py-1.5 ${previewEngine === "remotion" ? "bg-fuchsia-500/30 text-fuchsia-200" : "text-white/40 hover:text-white/70"}`}
            >
              Remotion
            </button>
          </div>
          {exporting && (
            <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold">
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 transition-all" style={{ width: `${Math.round(exportProgress * 100)}%` }} />
              </div>
              {Math.round(exportProgress * 100)}%
            </div>
          )}
          <button
            data-agent-id="kutt-export"
            aria-label="Export"
            onClick={handleExport}
            disabled={exporting || clips.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-cyan-500/20"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: asset library */}
        <div className="w-56 flex-shrink-0 border-r border-white/10 hidden md:block">
          <KuttAssets assets={assets} onAddAssets={addAssets} onAddToTimeline={addToTimeline} />
        </div>

        {/* Center: preview + timeline stacked */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            {previewEngine === "remotion" ? (
              <KuttRemotionPreview assets={assets} clips={clips} duration={duration} />
            ) : (
              <KuttPreview
                assets={assets} clips={clips}
                playhead={playhead} setPlayhead={setPlayhead}
                playing={playing} setPlaying={setPlaying}
                duration={duration}
              />
            )}
          </div>
          {/* Horizontal divider */}
          <div onPointerDown={(e) => startDrag(e, "h")}
            className="h-1.5 cursor-row-resize bg-white/5 hover:bg-cyan-500/40 transition-colors flex-shrink-0" title="Drag to resize timeline" />
          <div style={{ height: timelineH }} className="flex-shrink-0">
            <KuttTimeline
              assets={assets} clips={clips} setClips={setClips}
              playhead={playhead} setPlayhead={setPlayhead}
              selectedId={selectedId} setSelectedId={setSelectedId}
              duration={duration}
            />
          </div>
        </div>

        {/* Vertical divider */}
        <div onPointerDown={(e) => startDrag(e, "v")}
          className="w-1.5 cursor-col-resize bg-white/5 hover:bg-fuchsia-500/40 transition-colors flex-shrink-0 hidden sm:block" title="Drag to resize agent panel" />

        {/* Right: Director agent */}
        <div style={{ width: agentW }} className="flex-shrink-0 hidden sm:block">
          <KuttAgent assets={assets} clips={clips} setClips={setClips} addAssets={addAssets} />
        </div>
      </div>

      {/* Mobile: agent below (small screens) */}
      <div className="sm:hidden h-64 border-t border-white/10">
        <KuttAgent assets={assets} clips={clips} setClips={setClips} addAssets={addAssets} />
      </div>
    </div>
  );
}