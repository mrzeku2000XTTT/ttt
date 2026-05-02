import React, { useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, ImageIcon, Sparkles, Loader2, RefreshCw, Plus, Type, Bot } from "lucide-react";
import html2canvas from "html2canvas";
import { BACKGROUND_PRESETS } from "@/components/ultramock/MockBackground";
import MockControls from "@/components/ultramock/MockControls";
import MockTimeline from "@/components/ultramock/MockTimeline";
import FreeCanvas from "@/components/ultramock/FreeCanvas";
import TextControls from "@/components/ultramock/TextControls";
import MockAgent from "@/components/ultramock/MockAgent";

const newId = () => `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const makeItem = (partial = {}) => ({
  id: newId(),
  kind: "device",
  device: "iphone",
  media: null,
  x: 50, y: 50,
  scale: 1,
  rotX: 0,
  rotY: 0,
  cornerRadius: 1, // multiplier — 0 = sharp, 1 = default, up to 2 = extra round
  ...partial,
});

const makeText = (partial = {}) => ({
  id: newId(),
  kind: "text",
  text: "Your tagline here",
  x: 50, y: 12,
  fontSize: 48,
  fontWeight: 900,
  color: "#ffffff",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  animation: "none",
  typeSpeed: 14,
  loopDelay: 1.5,
  boxWidth: 90, // max width of the text box as % of canvas (90 ≈ "auto")
  ...partial,
});

export default function UltraMockPage() {
  const [items, setItems] = useState([makeItem()]);
  const [selectedId, setSelectedId] = useState(null);
  const [placementMode, setPlacementMode] = useState(false);
  const [background, setBackground] = useState("sunset");
  const [padding, setPadding] = useState(60);
  const [duration, setDuration] = useState(4);
  const [exporting, setExporting] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const canvasRef = useRef(null);
  const timelineRef = useRef(null);

  const selected = items.find((i) => i.id === selectedId) || null;

  const backgroundCss = useMemo(() => {
    return (BACKGROUND_PRESETS.find((b) => b.id === background) || BACKGROUND_PRESETS[0]).css;
  }, [background]);

  const updateItem = useCallback((id, partial) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...partial } : it)));
  }, []);

  const addAt = useCallback((x, y) => {
    const item = makeItem({ x, y });
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    setPlacementMode(false);
  }, []);

  const addText = useCallback(() => {
    const item = makeText();
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    setPlacementMode(false);
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  // Upload media (image OR video) into the selected item
  const onUploadMedia = useCallback((file) => {
    if (!selectedId) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      alert("Only images or videos (MP4/WebM/MOV) are supported.");
      return;
    }
    // Use object URL for video so it streams smoothly; data URL for image
    if (isVideo) {
      const url = URL.createObjectURL(file);
      updateItem(selectedId, { media: { url, type: "video", name: file.name } });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => updateItem(selectedId, { media: { url: e.target.result, type: "image", name: file.name } });
      reader.readAsDataURL(file);
    }
  }, [selectedId, updateItem]);

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null, scale: 2, useCORS: true, logging: false,
      });
      const link = document.createElement("a");
      link.download = `ultramock-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Try simpler media.");
    }
    setExporting(false);
  };

  // Capture frame for the timeline recorder
  const captureFrame = useCallback(async () => {
    if (!canvasRef.current) return null;
    return await html2canvas(canvasRef.current, {
      backgroundColor: null, scale: 1.5, useCORS: true, logging: false,
    });
  }, []);

  const reset = () => {
    setItems([makeItem()]);
    setSelectedId(null);
    setPlacementMode(false);
    setBackground("sunset");
    setPadding(60);
  };

  // Snapshot of state for the agent's vision/context
  const getStateSnapshot = useCallback(() => ({
    background,
    padding,
    duration,
    selected_id: selectedId,
    items: items.map((it) => ({
      id: it.id,
      kind: it.kind,
      ...(it.kind === "text"
        ? { text: it.text, x: it.x, y: it.y, fontSize: it.fontSize, color: it.color, animation: it.animation, boxWidth: it.boxWidth }
        : { device: it.device, x: it.x, y: it.y, scale: it.scale, rotX: it.rotX, rotY: it.rotY, cornerRadius: it.cornerRadius, has_media: !!it.media }),
    })),
  }), [items, selectedId, background, padding, duration]);

  // Agent tool handlers — bind tool names → page state mutations
  const agentHandlers = useMemo(() => ({
    add_device: (a = {}) => {
      const it = makeItem({
        device: a.device || "iphone",
        x: typeof a.x === "number" ? a.x : 50,
        y: typeof a.y === "number" ? a.y : 50,
      });
      setItems((prev) => [...prev, it]);
      setSelectedId(it.id);
      return { id: it.id };
    },
    add_text: (a = {}) => {
      const it = makeText({
        text: a.text || "Your text",
        x: typeof a.x === "number" ? a.x : 50,
        y: typeof a.y === "number" ? a.y : 12,
        fontSize: a.fontSize || 48,
        color: a.color || "#ffffff",
        animation: a.animation || "none",
      });
      setItems((prev) => [...prev, it]);
      setSelectedId(it.id);
      return { id: it.id };
    },
    update_item: (a = {}) => {
      const id = a.id || selectedId;
      if (!id) throw new Error("no item selected");
      const { id: _ignore, ...rest } = a;
      updateItem(id, rest);
      return { id };
    },
    select_item: (a = {}) => {
      let id = a.id;
      if (!id && typeof a.index === "number" && items[a.index]) id = items[a.index].id;
      if (!id) throw new Error("item not found");
      setSelectedId(id);
      return { id };
    },
    remove_item: (a = {}) => {
      const id = a.id || selectedId;
      if (!id) throw new Error("no item to remove");
      removeItem(id);
      return { id };
    },
    set_background: (a = {}) => { if (a.background) setBackground(a.background); return { background: a.background }; },
    set_padding: (a = {}) => { if (typeof a.padding === "number") setPadding(Math.max(20, Math.min(160, a.padding))); return { padding: a.padding }; },
    set_duration: (a = {}) => { if (typeof a.seconds === "number") setDuration(Math.max(1, Math.min(30, a.seconds))); return { duration: a.seconds }; },
    apply_preset: (a = {}) => {
      if (!timelineRef.current) throw new Error("no timeline available — select a device first");
      const ok = timelineRef.current.applyPresetById(a.preset_id, a.mode === "chain" ? "append" : "replace");
      if (!ok) throw new Error(`unknown preset: ${a.preset_id}`);
      return { applied: a.preset_id };
    },
    chain_presets: async (a = {}) => {
      if (!timelineRef.current) throw new Error("no timeline available — select a device first");
      const ids = Array.isArray(a.preset_ids) ? a.preset_ids : [];
      // First clear, then chain in order
      timelineRef.current.clearKeyframes();
      const applied = [];
      for (let i = 0; i < ids.length; i++) {
        // first one in replace, then append the rest
        const mode = i === 0 ? "replace" : "append";
        const ok = timelineRef.current.applyPresetById(ids[i], mode);
        if (ok) applied.push(ids[i]);
        await new Promise((r) => setTimeout(r, 120));
      }
      return { applied };
    },
    clear_timeline: () => { timelineRef.current?.clearKeyframes(); return { ok: true }; },
    render_mp4: async () => {
      if (!timelineRef.current) throw new Error("no timeline");
      await timelineRef.current.recordVideo();
      return { rendered: true };
    },
  }), [items, selectedId, updateItem, removeItem]);

  // Timeline animates the SELECTED device's rotX/rotY/scale.
  // Text layers don't use the rotation timeline — hidden when text is selected.
  const timelineProps = (selected && selected.kind !== "text") ? {
    rotX: selected.rotX,
    rotY: selected.rotY,
    scale: selected.scale,
    x: selected.x,
    y: selected.y,
    setRotX: (v) => updateItem(selected.id, { rotX: v }),
    setRotY: (v) => updateItem(selected.id, { rotY: v }),
    setScale: (v) => updateItem(selected.id, { scale: v }),
    setX: (v) => updateItem(selected.id, { x: v }),
    setY: (v) => updateItem(selected.id, { y: v }),
  } : null;

  return (
    <div className="fixed inset-0 bg-zinc-950 overflow-y-auto">
      {/* Top bar */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <Link to="/AppStoreV2" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden shadow-lg ring-1 ring-white/20">
            <img
              src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/15c852849_generated_image.png"
              alt="Cháoxiào"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white font-black text-base tracking-tight">Cháoxiào <span className="text-white/40 font-normal text-[11px] ml-1">嘲笑</span></span>
          <span className="hidden sm:inline-flex px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-[9px] font-bold tracking-widest uppercase">
            Multi-Device · Video
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAgentOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-fuchsia-500/30"
            title="Open Cháoxiào AI agent — describes what you want, it builds it"
          >
            <Bot className="w-3.5 h-3.5" /> Ask AI
          </button>
          <button
            onClick={() => setPlacementMode((p) => !p)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold transition-all ${
              placementMode
                ? "bg-cyan-400 text-black shadow-lg shadow-cyan-500/30"
                : "bg-white/5 hover:bg-white/10 border border-white/10 text-white/70"
            }`}
            title="Click on the canvas to drop a new device"
          >
            <Plus className="w-3.5 h-3.5" /> Add Device
          </button>
          <button
            onClick={addText}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold"
            title="Add a text layer"
          >
            <Type className="w-3.5 h-3.5" /> Add Text
          </button>
          <button
            onClick={reset}
            className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleExportPNG}
            disabled={exporting}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-pink-500/30"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? "Exporting…" : "Export PNG"}
          </button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-0">
        {/* Canvas */}
        <div className="p-4 lg:p-8 flex flex-col items-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl"
          >
            <div className="rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
              <FreeCanvas
                ref={canvasRef}
                items={items}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onUpdateItem={updateItem}
                onAddAt={addAt}
                onRemove={removeItem}
                background={background}
                padding={padding}
                placementMode={placementMode}
                backgroundCss={backgroundCss}
              />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-white/30 text-[10px] font-medium mt-3">
              <ImageIcon className="w-3 h-3" />
              Click "+ Add Device" then click the canvas · Drag devices freely · Animate the selected one below
            </div>

            {/* Timeline only animates the selected device */}
            {timelineProps && (
              <MockTimeline
                ref={timelineRef}
                {...timelineProps}
                duration={duration}
                setDuration={setDuration}
                captureFrame={captureFrame}
              />
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <aside className="border-t lg:border-t-0 lg:border-l border-white/10 bg-black/40 backdrop-blur-xl p-5 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-y-auto">
          {selected?.kind === "text" ? (
            <TextControls
              selected={selected}
              onUpdate={(partial) => updateItem(selected.id, partial)}
              onRemove={() => removeItem(selected.id)}
            />
          ) : (
            <MockControls
              background={background} setBackground={setBackground}
              padding={padding} setPadding={setPadding}
              selected={selected}
              onUpdate={(partial) => selected && updateItem(selected.id, partial)}
              onRemove={() => selected && removeItem(selected.id)}
              onUploadMedia={onUploadMedia}
            />
          )}
        </aside>
      </div>

      <MockAgent
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        getStateSnapshot={getStateSnapshot}
        canvasRef={canvasRef}
        handlers={agentHandlers}
      />
    </div>
  );
}