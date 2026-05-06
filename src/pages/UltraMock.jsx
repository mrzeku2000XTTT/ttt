import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, ImageIcon, Sparkles, Loader2, RefreshCw, Plus, Type, Bot } from "lucide-react";
import html2canvas from "html2canvas";
import { BACKGROUND_PRESETS } from "@/components/ultramock/MockBackground";
import MockControls from "@/components/ultramock/MockControls";
import MockTimeline from "@/components/ultramock/MockTimeline";
import FreeCanvas from "@/components/ultramock/FreeCanvas";
import TextControls from "@/components/ultramock/TextControls";
import OverlayControls from "@/components/ultramock/OverlayControls";
import OverlayPicker from "@/components/ultramock/OverlayPicker";
import MockAgent from "@/components/ultramock/MockAgent";
import MockMobileBar from "@/components/ultramock/MockMobileBar";
import MockBottomSheet from "@/components/ultramock/MockBottomSheet";
import AutoRenderStatus from "@/components/ultramock/AutoRenderStatus";
import ScreenRecorder from "@/components/ultramock/ScreenRecorder";

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

const makeOverlay = (partial = {}) => ({
  id: newId(),
  kind: "overlay",
  overlayType: "preset",       // "preset" | "image"
  presetId: null,
  imageUrl: null,
  color: null,
  x: 50, y: 50,
  widthPct: 25,                // % of canvas width
  aspect: 1,                   // w/h
  rotation: 0,                 // 2D rotation (z-axis) from OverlayControls
  rotX: 0,                     // 3D tilt — animated by motion presets
  rotY: 0,                     // 3D spin — animated by motion presets
  scale: 1,                    // animated by motion presets
  opacity: 1,
  ...partial,
});

// Default template every user sees on first load
const DEFAULT_TTT_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/250a7d13f_0f6ddf56-7324-4499-875d-b02d69da9423.png";

const buildDefaultTemplate = () => [
  makeText({
    text: "Welcome to TTT",
    x: 50, y: 14,
    fontSize: 56,
    fontWeight: 900,
    color: "#ffffff",
    animation: "typewriter",
    typeSpeed: 14,
    loopDelay: 1.5,
    boxWidth: 90,
  }),
  makeItem({
    device: "iphone",
    x: 50, y: 55,
    scale: 0.85,
    rotX: 0,
    rotY: 0,
    media: { url: DEFAULT_TTT_LOGO, type: "image", name: "TTT Logo" },
  }),
];

export default function UltraMockPage() {
  const [items, setItems] = useState(() => buildDefaultTemplate());
  const [selectedId, setSelectedId] = useState(null);
  const [placementMode, setPlacementMode] = useState(false);
  const [background, setBackground] = useState("sunset");
  // Optional AI-generated image URL that overrides the preset gradient.
  // When set, MockBackground / FreeCanvas paint this image instead of the preset CSS.
  const [customBackground, setCustomBackground] = useState(null);
  const [generatingBackground, setGeneratingBackground] = useState(false);
  const [padding, setPadding] = useState(60);
  const [duration, setDuration] = useState(4);
  // Camera state — animated by the timeline's camera track
  const [camera, setCamera] = useState({ zoom: 1, x: 50, y: 50 });
  const [exporting, setExporting] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [overlayPickerOpen, setOverlayPickerOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  // Pinch-to-zoom on by default on mobile so users can frame the canvas with 2 fingers
  const [pinchEnabled, setPinchEnabled] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) return true;
    return false;
  });
  const canvasRef = useRef(null);
  const timelineRef = useRef(null);

  const selected = items.find((i) => i.id === selectedId) || null;

  const backgroundCss = useMemo(() => {
    if (customBackground) {
      // CSS background shorthand for an image: cover the whole canvas, centered.
      return `url("${customBackground}") center/cover no-repeat`;
    }
    return (BACKGROUND_PRESETS.find((b) => b.id === background) || BACKGROUND_PRESETS[0]).css;
  }, [background, customBackground]);

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

  // Add an overlay from a library preset
  const addOverlayPreset = useCallback((preset) => {
    const item = makeOverlay({
      overlayType: "preset",
      presetId: preset.id,
      color: preset.color,
      aspect: preset.defaultW / preset.defaultH,
      // sensible default size: ~28% wide for most things
      widthPct: 28,
    });
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
  }, []);

  // Add an overlay from an AI-generated / uploaded image URL
  const addOverlayImage = useCallback(({ url }) => {
    const img = new Image();
    img.onload = () => {
      const item = makeOverlay({
        overlayType: "image",
        imageUrl: url,
        aspect: img.width / img.height || 1,
        widthPct: 35,
      });
      setItems((prev) => [...prev, item]);
      setSelectedId(item.id);
    };
    img.onerror = () => {
      const item = makeOverlay({ overlayType: "image", imageUrl: url, aspect: 1, widthPct: 35 });
      setItems((prev) => [...prev, item]);
      setSelectedId(item.id);
    };
    img.src = url;
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  // Apply a media file to a target device id
  const applyMediaTo = useCallback((targetId, file) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      alert("Only images or videos (MP4/WebM/MOV) are supported.");
      return;
    }
    if (isVideo) {
      const url = URL.createObjectURL(file);
      updateItem(targetId, { media: { url, type: "video", name: file.name } });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => updateItem(targetId, { media: { url: e.target.result, type: "image", name: file.name } });
      reader.readAsDataURL(file);
    }
  }, [updateItem]);

  // Upload media (image OR video) into the selected item — used by sidebar
  const onUploadMedia = useCallback((file) => {
    if (!selectedId) return;
    applyMediaTo(selectedId, file);
  }, [selectedId, applyMediaTo]);

  // Smart upload from mobile bar: targets selected device, or first device, or auto-creates one
  const onMobileUpload = useCallback((file) => {
    let targetId = selectedId;
    const sel = items.find((i) => i.id === selectedId);
    if (!sel || sel.kind !== "device") {
      const firstDevice = items.find((i) => i.kind === "device");
      if (firstDevice) {
        targetId = firstDevice.id;
        setSelectedId(firstDevice.id);
      } else {
        const it = makeItem();
        setItems((prev) => [...prev, it]);
        setSelectedId(it.id);
        targetId = it.id;
      }
    }
    applyMediaTo(targetId, file);
  }, [items, selectedId, applyMediaTo]);

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

  // Capture frame for the timeline recorder.
  // We capture at scale 0.75 during recording to maximize FPS — html2canvas
  // is fundamentally slow (~80-150ms/frame at scale 1.5), so reducing the
  // raster size 4× cuts capture time enough to get smooth source frames that
  // the MediaRecorder can sample at 30fps without stuttering.
  const captureFrame = useCallback(async () => {
    if (!canvasRef.current) return null;
    return await html2canvas(canvasRef.current, {
      backgroundColor: null,
      scale: 0.75,
      useCORS: true,
      logging: false,
      // Skip cloning expensive elements / shadow effects we don't need pixel-perfect
      ignoreElements: (el) => el.classList?.contains?.("html2canvas-ignore"),
    });
  }, []);

  const reset = () => {
    setItems(buildDefaultTemplate());
    setSelectedId(null);
    setPlacementMode(false);
    setBackground("sunset");
    setCustomBackground(null);
    setPadding(60);
  };

  // Auto-render from URL params (used by NODA's "UltraMock MP4" node)
  // Reads ?auto=1&text=...&device=...&background=...&preset=...&duration=...&media=...&email=...
  // Then auto-builds the canvas, applies the preset, triggers MP4 download, and emails it.
  const [autoStatus, setAutoStatus] = useState(null); // { phase, message, error }
  const [renderMode, setRenderMode] = useState(false); // hides UI overlays for clean recording
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (autoRanRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto") !== "1") return;
    autoRanRef.current = true;

    const autoText = params.get("text") || "";
    const autoDevice = params.get("device") || "iphone";
    const autoBackground = params.get("background") || "sunset";
    const autoPreset = params.get("preset") || "spin";
    const autoDuration = Math.max(1, Math.min(60, Number(params.get("duration")) || 4));
    const autoMedia = params.get("media") || "";
    const autoEmail = (params.get("email") || "").trim();
    const autoSpeed = Math.max(0.25, Math.min(4, Number(params.get("speed")) || 1));
    const autoCamera = params.get("camera") || ""; // optional camera preset id
    // Multi-segment chain: comma-separated preset ids ("slide-in-left,zoomin,bounce")
    const autoChain = (params.get("chain") || "").split(",").map(s => s.trim()).filter(Boolean);

    // Render-mode hides outlines, ×, zoom controls, mobile bar — clean recording
    setRenderMode(true);
    setBackground(autoBackground);
    setDuration(autoDuration);

    // Build a fresh, simple template: tagline up top + one device in the middle
    const textItem = autoText
      ? makeText({
          text: autoText,
          x: 50, y: 14, fontSize: 56, fontWeight: 900, color: "#ffffff",
          animation: "typewriter", typeSpeed: 14, loopDelay: 1.5, boxWidth: 90,
        })
      : null;
    const deviceItem = makeItem({
      device: autoDevice,
      x: 50, y: 55, scale: 0.85,
      media: autoMedia ? { url: autoMedia, type: "image", name: "auto" } : null,
    });
    const fresh = textItem ? [textItem, deviceItem] : [deviceItem];
    setItems(fresh);
    // Don't select anything — keeps render frame clean (no cyan outline, no ×)
    setSelectedId(deviceItem.id);

    // Wait for canvas to settle, then apply preset & record
    const run = async () => {
      const validEmail = autoEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(autoEmail);
      setAutoStatus({ phase: "building", message: "Building canvas…" });
      // Give React a couple of paints to mount items
      await new Promise((r) => setTimeout(r, 800));
      try {
        if (autoChain.length > 0 && timelineRef.current?.applyPresetById) {
          // Multi-segment animation: chain presets back-to-back so the device gets
          // 4-10+ keyframes per segment over the full duration.
          timelineRef.current.clearKeyframes?.();
          for (let i = 0; i < autoChain.length; i++) {
            const mode = i === 0 ? "replace" : "append";
            timelineRef.current.applyPresetById(autoChain[i], mode);
            await new Promise((r) => setTimeout(r, 80));
          }
        } else if (timelineRef.current?.applyPresetById) {
          timelineRef.current.applyPresetById(autoPreset, "replace");
        }
        // Optional camera preset across the whole scene
        if (autoCamera && timelineRef.current?.applyCameraPresetById) {
          timelineRef.current.applyCameraPresetById(autoCamera, "replace");
        }
      } catch (e) { console.warn("preset apply failed", e); }
      // Wait for keyframes to commit, deselect to clear outline, then start recording
      await new Promise((r) => setTimeout(r, 200));
      setSelectedId(null);
      await new Promise((r) => setTimeout(r, 400));

      setAutoStatus({ phase: "recording", message: `Recording ${autoDuration}s MP4 (${autoSpeed}× speed)…` });
      let result = null;
      try {
        if (timelineRef.current?.recordVideo) {
          result = await timelineRef.current.recordVideo({ speed: autoSpeed });
        } else {
          throw new Error("Timeline not ready");
        }
      } catch (e) {
        console.error("[ultramock auto] recording failed:", e?.message, e?.stack);
        setAutoStatus({
          phase: "error",
          message: "Recording failed",
          error: e?.message || String(e) || "unknown error",
        });
        return;
      }

      if (!result?.blob) {
        console.error("[ultramock auto] recording returned no blob", result);
        setAutoStatus({
          phase: "error",
          message: "Recording produced no video",
          error: "MediaRecorder returned an empty blob. The canvas may not have rendered any frames — check browser console.",
        });
        return;
      }

      // If an email was requested, upload the blob and email a link
      if (validEmail) {
        try {
          setAutoStatus({ phase: "uploading", message: "Uploading MP4…" });
          console.log("[ultramock auto] uploading", { size: result.blob.size, type: result.mime, ext: result.ext });
          const { base44 } = await import("@/api/base44Client");
          const file = new File([result.blob], `ultramock-${Date.now()}.${result.ext}`, { type: result.mime });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          if (!file_url) throw new Error("Upload returned no URL");
          console.log("[ultramock auto] uploaded:", file_url);

          setAutoStatus({ phase: "sending", message: `Emailing ${autoEmail}…` });
          const subject = autoText ? `Your UltraMock: ${autoText.slice(0, 60)}` : "Your UltraMock video";
          const body = `<p>Your UltraMock video is ready 🎬</p>
<p><a href="${file_url}" style="background:#06b6d4;color:#000;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Download MP4</a></p>
<p style="font-size:12px;color:#666;">Or paste this link: <br/><a href="${file_url}">${file_url}</a></p>
${autoText ? `<p style="margin-top:20px;font-size:14px;">Tagline: <em>${autoText}</em></p>` : ""}
<p style="font-size:11px;color:#999;margin-top:24px;">Sent by NODA · UltraMock</p>`;
          await base44.integrations.Core.SendEmail({
            to: autoEmail,
            from_name: "NODA · UltraMock",
            subject,
            body,
          });
          console.log("[ultramock auto] email sent to", autoEmail);
          setAutoStatus({ phase: "done", message: `✅ MP4 emailed to ${autoEmail}`, fileUrl: file_url });
        } catch (e) {
          console.error("[ultramock auto] email send failed", e);
          setAutoStatus({ phase: "error", message: "Email failed", error: e?.message || "unknown error" });
        }
      } else if (autoEmail) {
        setAutoStatus({ phase: "error", message: "Invalid email address", error: autoEmail });
      } else {
        setAutoStatus({ phase: "done", message: "✅ MP4 ready" });
      }
    };
    run();
  }, []);

  // Snapshot of state for the agent's vision/context
  const getStateSnapshot = useCallback(() => ({
    background,
    custom_background_url: customBackground || null,
    padding,
    duration,
    selected_id: selectedId,
    camera: { zoom: camera.zoom, x: camera.x, y: camera.y },
    items: items.map((it) => ({
      id: it.id,
      kind: it.kind,
      ...(it.kind === "text"
        ? { text: it.text, x: it.x, y: it.y, fontSize: it.fontSize, color: it.color, animation: it.animation, boxWidth: it.boxWidth }
        : { device: it.device, x: it.x, y: it.y, scale: it.scale, rotX: it.rotX, rotY: it.rotY, cornerRadius: it.cornerRadius, has_media: !!it.media }),
    })),
  }), [items, selectedId, background, customBackground, padding, duration, camera]);

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
    set_background: (a = {}) => {
      if (a.background) setBackground(a.background);
      // Switching to a preset gradient should drop any custom AI image
      setCustomBackground(null);
      return { background: a.background };
    },
    generate_background: async (a = {}) => {
      const prompt = (a.prompt || "").trim();
      if (!prompt) throw new Error("prompt is required");
      setGeneratingBackground(true);
      try {
        const { base44 } = await import("@/api/base44Client");
        const fullPrompt = `Wide cinematic 16:10 background image for a device mockup scene. ${prompt}. High quality, detailed, professional, dramatic lighting. The image will sit behind device mockups so keep the focal subject offset/balanced and avoid putting critical detail in the dead center.`;
        const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
        const url = res?.url;
        if (!url) throw new Error("image generation returned no URL");
        setCustomBackground(url);
        return { url, prompt };
      } finally {
        setGeneratingBackground(false);
      }
    },
    clear_custom_background: () => {
      setCustomBackground(null);
      return { ok: true };
    },
    set_padding: (a = {}) => { if (typeof a.padding === "number") setPadding(Math.max(20, Math.min(160, a.padding))); return { padding: a.padding }; },
    set_duration: (a = {}) => { if (typeof a.seconds === "number") setDuration(Math.max(1, Math.min(30, a.seconds))); return { duration: a.seconds }; },
    apply_preset: async (a = {}) => {
      if (!timelineRef.current) throw new Error("no timeline available");
      // Auto-select first item if nothing is selected — the preset needs a target
      if (!selectedId) {
        const firstDevice = items.find((i) => i.kind === "device") || items[0];
        if (firstDevice) {
          setSelectedId(firstDevice.id);
          await new Promise((r) => setTimeout(r, 100));
        } else {
          throw new Error("no item on canvas to animate — add a device first");
        }
      }
      const known = ["spin","tilt","pop","float","reveal","flip","wobble","zoomin","zoomout","tilt-up","showcase","shake","barrel","slide-in-left","slide-in-right","slide-up","drop-in","fly-across","orbit","bounce","pendulum","zigzag","swoop","chat-zoom","typewriter-zoom","words-pop"];
      if (!known.includes(a.preset_id)) throw new Error(`unknown preset: ${a.preset_id}`);
      const ok = timelineRef.current.applyPresetById(a.preset_id, a.mode === "chain" ? "append" : "replace");
      if (!ok) throw new Error(`failed to apply ${a.preset_id} — no item selected`);
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
    apply_camera_preset: (a = {}) => {
      if (!timelineRef.current?.applyCameraPresetById) throw new Error("camera not available");
      const ok = timelineRef.current.applyCameraPresetById(a.preset_id, a.mode === "chain" ? "append" : "replace");
      if (!ok) throw new Error(`unknown camera preset: ${a.preset_id}`);
      return { applied: a.preset_id };
    },
    clear_camera: () => { timelineRef.current?.clearCameraTrack?.(); return { ok: true }; },
    analyze_youtube: async (a = {}) => {
      if (!a.url) throw new Error("url is required");
      const { base44 } = await import("@/api/base44Client");
      const res = await base44.functions.invoke("analyzeYouTubeForMotion", {
        url: a.url,
        focus_hint: a.focus_hint || "",
      });
      const data = res?.data || {};
      if (!data.success) throw new Error(data.error || "YouTube analysis failed");

      // Auto-execute the returned plan against the same agent handlers.
      // We dynamically import runTools to avoid a circular import.
      const { runTools } = await import("@/components/ultramock/mockAgentTools");
      // Filter out analyze_youtube/render_mp4 to avoid recursion or accidental exports.
      const safePlan = (data.agent_plan || []).filter(
        (c) => c.name !== "analyze_youtube" && c.name !== "render_mp4"
      );
      // Make sure something is selected so motion presets have a target
      if (!selectedId) {
        const firstDevice = items.find((i) => i.kind === "device");
        if (firstDevice) setSelectedId(firstDevice.id);
        await new Promise((r) => setTimeout(r, 80));
      }
      const results = await runTools(safePlan, agentHandlers);
      return {
        title: data.title,
        style_summary: data.style_summary,
        frame_breakdown: data.frame_breakdown || [],
        beats: data.beats,
        applied: safePlan.length,
        results,
      };
    },
    render_mp4: async () => {
      if (!timelineRef.current) throw new Error("no timeline");
      await timelineRef.current.recordVideo();
      return { rendered: true };
    },
  }), [items, selectedId, updateItem, removeItem]);

  // Multi-track timeline: every item gets its own animation lane.
  // Always render — even with no selection — so existing tracks remain visible.
  const showTimeline = items.length > 0;

  // Auto-open the controls bottom sheet on mobile when an item is selected
  const openMobileControls = useCallback(() => {
    if (selected) setMobileSheetOpen(true);
  }, [selected]);

  return (
    <div
      className="fixed inset-0 bg-zinc-950 overflow-y-auto"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        // Reserve space for the mobile bottom bar so canvas isn't hidden behind it
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Top bar — hidden during auto-render so the recording is clean */}
      <nav className={`sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/10 bg-black/80 backdrop-blur-xl ${renderMode ? "hidden" : ""}`}>
        <Link
          to="/AppStoreV2"
          className="flex items-center justify-center sm:gap-1.5 w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 text-white/60 hover:text-white text-sm flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
        </Link>
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial justify-center sm:justify-start">
          <div className="w-7 h-7 rounded-lg overflow-hidden shadow-lg ring-1 ring-white/20 flex-shrink-0">
            <img
              src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/15c852849_generated_image.png"
              alt="Cháoxiào"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white font-black text-sm sm:text-base tracking-tight truncate">
            Cháoxiào <span className="text-white/40 font-normal text-[10px] sm:text-[11px] ml-0.5">嘲笑</span>
          </span>
          <span className="hidden md:inline-flex px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-[9px] font-bold tracking-widest uppercase">
            Multi-Device · Video
          </span>
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => setAgentOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-fuchsia-500/30"
            title="Open Cháoxiào AI agent"
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
          >
            <Plus className="w-3.5 h-3.5" /> Add Device
          </button>
          <button
            onClick={() => setOverlayPickerOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-pink-500/30"
          >
            <Sparkles className="w-3.5 h-3.5" /> Overlay
          </button>
          <button
            onClick={addText}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold"
          >
            <Type className="w-3.5 h-3.5" /> Add Text
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <ScreenRecorder />
          <button
            onClick={handleExportPNG}
            disabled={exporting}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-pink-500/30"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? "Exporting…" : "Export PNG"}
          </button>
        </div>

        {/* Mobile: just the AI button in top bar (other actions are in bottom bar) */}
        <button
          onClick={() => setAgentOpen(true)}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-fuchsia-500 to-orange-500 text-white shadow-lg shadow-fuchsia-500/30 flex-shrink-0"
          aria-label="Ask AI"
        >
          <Bot className="w-4 h-4" />
        </button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-0">
        {/* Canvas */}
        <div className="p-2 sm:p-4 lg:p-8 flex flex-col items-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl"
          >
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
              <FreeCanvas
                ref={canvasRef}
                items={items}
                selectedId={renderMode ? null : selectedId}
                setSelectedId={setSelectedId}
                onUpdateItem={updateItem}
                onAddAt={addAt}
                onRemove={removeItem}
                background={background}
                padding={padding}
                placementMode={placementMode}
                backgroundCss={backgroundCss}
                locked={locked}
                pinchEnabled={pinchEnabled}
                camera={camera}
                isPlaying={previewPlaying}
                onTogglePlay={() => timelineRef.current?.togglePlay?.()}
                renderMode={renderMode}
              />
            </div>
            <div className="hidden sm:flex items-center justify-center gap-1.5 text-white/30 text-[10px] font-medium mt-3 px-2 text-center">
              <ImageIcon className="w-3 h-3 flex-shrink-0" />
              <span>Click "+ Add Device" then tap the canvas · Drag freely · Animate the selected one below</span>
            </div>
            {/* Mobile action bar — hidden in render mode */}
            {!renderMode && <MockMobileBar
              placementMode={placementMode}
              onTogglePlacement={() => setPlacementMode((p) => !p)}
              onAddText={addText}
              onOpenAgent={() => setAgentOpen(true)}
              onExport={handleExportPNG}
              onReset={reset}
              onOpenControls={openMobileControls}
              onUploadFile={onMobileUpload}
              exporting={exporting}
              hasSelection={!!selected}
              locked={locked}
              onToggleLock={() => setLocked((l) => !l)}
              pinchEnabled={pinchEnabled}
              onTogglePinch={() => setPinchEnabled((p) => !p)}
              onOpenOverlay={() => setOverlayPickerOpen(true)}
            />}

            <div className="sm:hidden flex items-center justify-center gap-1.5 text-white/30 text-[10px] font-medium mt-2 px-2 text-center">
              <ImageIcon className="w-3 h-3 flex-shrink-0" />
              <span>Pinch to zoom · Drag empty area to pan · Tap device to select</span>
            </div>

            {/* Multi-track timeline — visually hidden during auto-render so the
                recording frame stays clean, but STILL MOUNTED so timelineRef
                exposes applyPresetById/recordVideo to the auto-render flow. */}
            {showTimeline && (
              <div className={renderMode ? "hidden" : ""}>
                <MockTimeline
                  ref={timelineRef}
                  items={items}
                  selectedId={selectedId}
                  updateItem={updateItem}
                  duration={duration}
                  setDuration={setDuration}
                  captureFrame={captureFrame}
                  camera={camera}
                  setCamera={setCamera}
                  onPlayingChange={setPreviewPlaying}
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Desktop sidebar — hidden on mobile (replaced by bottom sheet) */}
        <aside className={`hidden ${renderMode ? "" : "lg:block"} border-l border-white/10 bg-black/40 backdrop-blur-xl p-5 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-y-auto`}>
          {selected?.kind === "text" ? (
            <TextControls
              selected={selected}
              onUpdate={(partial) => updateItem(selected.id, partial)}
              onRemove={() => removeItem(selected.id)}
            />
          ) : selected?.kind === "overlay" ? (
            <OverlayControls
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

      {/* Mobile controls bottom sheet */}
      <MockBottomSheet
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        title={
          selected?.kind === "text" ? "Edit Text"
            : selected?.kind === "overlay" ? "Edit Overlay"
            : selected ? "Edit Device"
            : "Canvas Settings"
        }
      >
        {selected?.kind === "text" ? (
          <TextControls
            selected={selected}
            onUpdate={(partial) => updateItem(selected.id, partial)}
            onRemove={() => { removeItem(selected.id); setMobileSheetOpen(false); }}
          />
        ) : selected?.kind === "overlay" ? (
          <OverlayControls
            selected={selected}
            onUpdate={(partial) => updateItem(selected.id, partial)}
            onRemove={() => { removeItem(selected.id); setMobileSheetOpen(false); }}
          />
        ) : (
          <MockControls
            background={background} setBackground={setBackground}
            padding={padding} setPadding={setPadding}
            selected={selected}
            onUpdate={(partial) => selected && updateItem(selected.id, partial)}
            onRemove={() => { if (selected) { removeItem(selected.id); setMobileSheetOpen(false); } }}
            onUploadMedia={onUploadMedia}
          />
        )}
      </MockBottomSheet>

      {/* Overlay picker (mobile bottom sheet / desktop modal) */}
      <OverlayPicker
        open={overlayPickerOpen}
        onClose={() => setOverlayPickerOpen(false)}
        onPickPreset={addOverlayPreset}
        onPickImage={addOverlayImage}
      />

      <MockAgent
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        getStateSnapshot={getStateSnapshot}
        canvasRef={canvasRef}
        handlers={agentHandlers}
      />

      {/* Auto-render progress overlay (shown when triggered by NODA workflow) */}
      <AutoRenderStatus status={autoStatus} />

      {/* AI background generation indicator */}
      {generatingBackground && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-500 text-white text-xs font-bold shadow-2xl shadow-fuchsia-500/40">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Generating AI background…
        </div>
      )}
    </div>
  );
}