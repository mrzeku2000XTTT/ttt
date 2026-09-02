import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Upload, Sparkles, Copy, Check, Plus, History, ArrowRight, ChevronDown, ChevronUp, Loader2, ImageIcon, Zap } from "lucide-react";

const PRESETS = [
  "Teen hangout room",
  "Man cave",
  "Minimalist office",
  "Cottagecore bedroom",
  "Kids' playroom",
  "Industrial loft",
  "Scandinavian living room",
  "Home gym",
];

const ANGLES = [
  { label: "Wide establishing shot", desc: "full room view from the main doorway, eye-level, showing the entire space" },
  { label: "Corner detail", desc: "45-degree angle where two walls meet, mid-shot" },
  { label: "Material close-up", desc: "tight close-up of the key surface material and texture" },
  { label: "CCTV overhead", desc: "high-mounted CCTV security-camera angle, wide lens, top-down surveillance view of the whole room, slight fisheye distortion" },
];
const MORE_ANGLES = [
  { label: "Low angle", desc: "floor-level shot looking upward, dramatic perspective" },
  { label: "High angle", desc: "overhead birds-eye view of the whole room" },
  { label: "Window-side", desc: "shot taken from beside the window, side light" },
  { label: "Doorway frame", desc: "framed composition through the open doorway" },
  { label: "Detail still life", desc: "styled still-life of a decor object on a surface" },
  { label: "Symmetric center", desc: "dead-center symmetrical composition" },
];

function SpatialMark({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round">
      <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" />
      <line x1="50" y1="6" x2="50" y2="50" />
      <line x1="88" y1="28" x2="50" y2="50" />
      <line x1="88" y1="72" x2="50" y2="50" />
      <line x1="50" y1="94" x2="50" y2="50" />
      <line x1="12" y1="72" x2="50" y2="50" />
      <line x1="12" y1="28" x2="50" y2="50" />
      <path d="M50 34 L56 50 L50 66 L44 50 Z" fill="#fff" stroke="#fff" />
    </svg>
  );
}

function extractSection(text, header) {
  const lines = (text || "").split("\n");
  let capturing = false, out = [];
  for (const ln of lines) {
    if (/^(PRESERVE|PROMPT|NEGATIVE PROMPT|NOTES):\s*$/.test(ln.trim())) {
      if (capturing) break;
      if (ln.trim().startsWith(header)) capturing = true;
      continue;
    }
    if (capturing) out.push(ln);
  }
  return out.join("\n").trim() || (text || "").trim();
}

export default function Spatial() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [userEmail, setUserEmail] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [transform, setTransform] = useState("");
  const [keepLayout, setKeepLayout] = useState(true);
  const [includeNegative, setIncludeNegative] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState("");
  const [output, setOutput] = useState(null);
  const [images, setImages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [view, setView] = useState("studio");
  const [history, setHistory] = useState([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        if (u?.email) setUserEmail(u.email);
      } catch { /* not logged in */ }
    })();
  }, []);

  const refreshHistory = async () => {
    if (!userEmail) return;
    try {
      const list = await base44.entities.SpatialRoom.filter({ user_email: userEmail }, "-created_date", 30);
      setHistory(list || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { if (userEmail) refreshHistory(); }, [userEmail]);

  const onFile = (f) => {
    if (!f) return;
    setFileObj(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
  };
  const onDrop = (e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); };
  const removeImage = () => {
    setFileObj(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildPrompt = (t, keep, neg) => `You are an expert prompt engineer for AI image generators (Midjourney, Stable Diffusion, DALL·E-style tools). Given a photo of a real room and a requested transformation, you write a single, highly detailed, ready-to-paste image generation prompt.

Rules:
- Closely observe the photo: room shape, wall/window/door positions, ceiling height, camera angle, light sources, floor material, fixed architectural features.
- Build a prompt that keeps those fixed elements ${keep ? "exact and unchanged" : "as loose reference only"}, and applies the transformation to furniture, decor, color palette, materials, and mood.
- Be concrete: name specific furniture, materials, colors (hex or descriptive), lighting, textures. Avoid vague words.
- Write it so it produces consistent results across multiple camera angles and regenerations (fixed room geometry, fixed lighting, fixed materials).
- Output using exactly these plain-text section headers, nothing before or after:

PRESERVE:
(2-4 sentences of fixed room geometry/camera/architecture to hold constant)

PROMPT:
(full detailed scene prompt, 80-150 words, ready to paste into a text-to-image generator)

${neg ? "NEGATIVE PROMPT:\n(comma-separated list of things to avoid)\n" : ""}NOTES:
(1-2 sentences on keeping results consistent across regenerations)

Do not include preamble or markdown outside these sections.

Requested transformation: ${t}`;

  const genOne = async (angle, scenePrompt, refUrls) => {
    const r = await base44.integrations.Core.GenerateImage({
      prompt: `${scenePrompt}\n\nCamera angle: ${angle.label} — ${angle.desc}. CRITICAL: the reference image is the structural anchor — reuse the EXACT same room architecture: wall layout, window position and shape, ceiling height, wall paneling/molding, doorways, and floor. Do not move, resize, add, or remove walls or windows. Only change furniture, decor, materials, colors, and mood per the transformation. Keep lighting direction consistent with the reference.`,
      existing_image_urls: refUrls?.length ? refUrls : undefined,
    });
    return r?.url;
  };

  const generateRoom = async () => {
    if (!fileObj) { setError("Upload a room photo first."); return; }
    if (!transform.trim()) { setError("Describe what you want the room to become."); return; }
    setGenerating(true); setError(null); setOutput(null); setImages([]); setShowPrompt(false);
    try {
      setGenStep("Uploading photo…");
      const up = await base44.integrations.Core.UploadFile({ file: fileObj });
      const photoUrl = up?.file_url || up?.url;
      if (!photoUrl) throw new Error("Upload failed.");

      setGenStep("Reading the room & writing prompt…");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(transform.trim(), keepLayout, includeNegative),
        file_urls: [photoUrl],
        model: "claude_sonnet_4_6",
      });
      const promptText = typeof res === "string" ? res : (res?.text || res?.response || JSON.stringify(res));
      if (!promptText?.trim()) throw new Error("No prompt was returned.");
      setOutput(promptText.trim());
      const scene = extractSection(promptText, "PROMPT");

      let roomId = null;
      if (userEmail) {
        const rec = await base44.entities.SpatialRoom.create({
          user_email: userEmail, title: transform.trim().slice(0, 80),
          transform: transform.trim(), prompt: promptText.trim(), photo_url: photoUrl, images: [],
        });
        roomId = rec?.id;
      }
      setCurrentRoom({ id: roomId, transform: transform.trim(), prompt: promptText.trim(), photo_url: photoUrl, images: [] });

      const refUrls = photoUrl ? [photoUrl] : [];
      const newImgs = [];
      for (let i = 0; i < ANGLES.length; i++) {
        setGenStep(`Generating B-roll ${i + 1} of ${ANGLES.length} — ${ANGLES[i].label}…`);
        const url = await genOne(ANGLES[i], scene, refUrls);
        if (url) {
          newImgs.push({ angle: ANGLES[i].label, label: ANGLES[i].label, url });
          if (refUrls.length === 1) refUrls.push(url);
          setImages([...newImgs]);
        }
      }

      if (roomId) {
        await base44.entities.SpatialRoom.update(roomId, { images: newImgs });
        refreshHistory();
      }
      setCurrentRoom((c) => ({ ...c, images: newImgs }));
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setGenerating(false); setGenStep("");
    }
  };

  const more = async () => {
    if (!output || !currentRoom) return;
    setGenerating(true); setError(null);
    try {
      const scene = extractSection(output, "PROMPT");
      const refUrls = [currentRoom?.photo_url, images[0]?.url].filter(Boolean);
      const start = images.length;
      const newImgs = [...images];
      const count = 2;
      for (let i = 0; i < count; i++) {
        const a = MORE_ANGLES[(start + i) % MORE_ANGLES.length];
        setGenStep(`Generating more B-roll — ${a.label}…`);
        const url = await genOne(a, scene, refUrls);
        if (url) {
          newImgs.push({ angle: a.label, label: a.label, url });
          setImages([...newImgs]);
        }
      }
      if (currentRoom.id) {
        await base44.entities.SpatialRoom.update(currentRoom.id, { images: newImgs });
        refreshHistory();
      }
      setCurrentRoom((c) => ({ ...c, images: newImgs }));
    } catch (err) {
      setError(err?.message || "Could not generate more shots.");
    } finally {
      setGenerating(false); setGenStep("");
    }
  };

  const newRoom = () => {
    removeImage();
    setTransform(""); setOutput(null); setImages([]); setCurrentRoom(null);
    setShowPrompt(false); setError(null); setView("studio");
  };

  const loadRoom = (r) => {
    setCurrentRoom(r);
    setOutput(r.prompt); setImages(r.images || []); setTransform(r.transform || "");
    setPreviewUrl(r.photo_url || null); setFileObj(null);
    setShowPrompt(false); setError(null); setView("studio");
  };

  const copy = async () => {
    if (!output) return;
    try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  const renderPromptSections = () => {
    if (!output) return null;
    const parts = output.split(/^(PRESERVE:|PROMPT:|NEGATIVE PROMPT:|NOTES:)/m).filter(Boolean);
    return parts.map((chunk, i) => {
      const isHeader = /^(PRESERVE:|PROMPT:|NEGATIVE PROMPT:|NOTES:)$/.test(chunk);
      if (isHeader) {
        const body = parts[i + 1]?.trim() || "";
        return (
          <div key={i} className="mb-3 last:mb-0">
            <div className="text-[10px] tracking-[0.18em] text-white/45 mb-1">{chunk.replace(":", "")}</div>
            <div className="text-[13px] leading-[1.6] text-white/85 whitespace-pre-wrap">{body}</div>
          </div>
        );
      }
      return null;
    });
  };

  const hasResult = currentRoom && (images.length > 0 || generating);

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        <div className="flex items-center gap-2">
          <SpatialMark size={26} />
          <span className="text-[13px] tracking-[0.3em] text-white/70">SPATIAL</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={newRoom} className="flex items-center gap-1 h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-[12px] transition-colors" title="New room">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
          <button onClick={() => setView(view === "history" ? "studio" : "history")} className={`flex items-center gap-1 h-8 px-3 rounded-full text-[12px] transition-colors ${view === "history" ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"}`} title="History">
            <History className="w-3.5 h-3.5" /> History
          </button>
          <Link to="/AppStoreV2" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Exit to App Store">
            <X className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-4 pt-20 pb-24">
        {/* History view */}
        {view === "history" ? (
          <div>
            <div className="text-[11px] tracking-[0.2em] text-white/45 mb-3">YOUR ROOMS</div>
            {!userEmail ? (
              <div className="text-[13px] text-white/50 border border-white/10 rounded-lg p-4">Log in to save and view your room history.</div>
            ) : history.length === 0 ? (
              <div className="text-[13px] text-white/50 border border-white/10 rounded-lg p-4">No saved rooms yet. Generate one to see it here.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {history.map((r) => (
                  <button key={r.id} onClick={() => loadRoom(r)} className="text-left rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                    <div className="aspect-[4/3] bg-white/5">
                      {r.images?.[0]?.url ? <img src={r.images[0].url} alt={r.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-white/30" /></div>}
                    </div>
                    <div className="p-2.5">
                      <div className="text-[12px] text-white/90 truncate">{r.title}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{r.images?.length || 0} shots</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : !hasResult ? (
          /* Studio form */
          <>
            <div className="flex flex-col items-center text-center mb-8 pt-2">
              <SpatialMark size={58} />
              <h1 className="mt-3.5 text-[30px] leading-[1.05] tracking-[-0.01em]" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}>SPATIAL AI</h1>
              <div className="mt-1 text-[10px] tracking-[0.42em] text-white/55">ROOM TRANSFORM</div>
              <p className="mt-4 text-[13.5px] leading-[1.55] text-white/60 max-w-[42ch]">
                Upload a room photo, describe the transformation, and Spatial generates consistent B-roll shots from every angle — saved to your account.
              </p>
            </div>

            <section className="mb-6">
              <div className="text-[11px] tracking-[0.2em] text-white/45 mb-2.5">1 · ROOM PHOTO</div>
              {!previewUrl ? (
                <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
                  className={`rounded-lg border border-dashed cursor-pointer transition-colors py-9 px-5 text-center ${dragging ? "border-white/70 bg-white/10" : "border-white/25 hover:border-white/50 hover:bg-white/[0.04]"}`}>
                  <div className="w-11 h-11 mx-auto mb-3 rounded-full border border-white/40 flex items-center justify-center"><Upload className="w-4 h-4 text-white/80" /></div>
                  <div className="text-[13px] text-white/80"><span className="text-white font-medium">Tap to upload</span> or drop a photo</div>
                  <div className="text-[11px] text-white/40 mt-1">PNG · JPG</div>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-white/15">
                  <img src={previewUrl} alt="room" className="block w-full max-h-[260px] object-cover" />
                  <button onClick={removeImage} className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 backdrop-blur flex items-center justify-center hover:bg-black/90 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </section>

            <section className="mb-5">
              <div className="text-[11px] tracking-[0.2em] text-white/45 mb-2.5">2 · WHAT SHOULD IT BECOME?</div>
              <textarea value={transform} onChange={(e) => setTransform(e.target.value)} placeholder="e.g. turn this into a cozy reading nook with warm wood tones and a window seat"
                className="w-full text-[14px] leading-[1.5] bg-white/[0.04] border border-white/15 rounded-lg px-3.5 py-3 text-white placeholder-white/35 outline-none focus:border-white/40 focus:bg-white/[0.06] transition-colors resize-y min-h-[64px]" />
              <div className="flex flex-wrap gap-2 mt-3">
                {PRESETS.map((p) => (
                  <button key={p} onClick={() => setTransform(`turn this into a ${p.toLowerCase()}`)} className="text-[12px] px-3 py-1.5 rounded-full border border-white/20 text-white/75 hover:bg-white hover:text-black hover:border-white transition-colors">{p}</button>
                ))}
              </div>
            </section>

            <section className="mb-6 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-white/70"><input type="checkbox" checked={keepLayout} onChange={(e) => setKeepLayout(e.target.checked)} className="w-4 h-4 accent-white" /> Keep layout &amp; camera angle exact</label>
              <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-white/70"><input type="checkbox" checked={includeNegative} onChange={(e) => setIncludeNegative(e.target.checked)} className="w-4 h-4 accent-white" /> Include a negative prompt</label>
            </section>

            <button onClick={generateRoom} disabled={generating}
              className="w-full flex items-center justify-center gap-2 text-[15px] font-medium py-3.5 rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              {generating ? (<><Loader2 className="w-4 h-4 animate-spin" /> {genStep || "Working…"}</>) : (<><Sparkles className="w-4 h-4" /> Generate room B-roll</>)}
            </button>
            {!userEmail && <div className="mt-3 text-[11px] text-white/40 text-center">Log in to auto-save rooms to your account.</div>}
          </>
        ) : (
          /* Result view */
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0">
                <div className="text-[10px] tracking-[0.2em] text-white/45 mb-0.5">ROOM</div>
                <div className="text-[15px] truncate" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{currentRoom?.transform}</div>
              </div>
              <button onClick={newRoom} className="flex items-center gap-1 h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-[12px] transition-colors flex-shrink-0"><Plus className="w-3.5 h-3.5" /> New room</button>
            </div>

            {/* B-roll grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {images.map((img, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-white/10 aspect-[4/3] bg-white/5">
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="text-[10px] text-white/80 truncate">{img.label}</div>
                  </div>
                </div>
              ))}
              {generating && (
                <div className="relative rounded-lg overflow-hidden border border-white/10 aspect-[4/3] bg-white/5 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-white/60" />
                  <div className="text-[10px] text-white/50 px-3 text-center">{genStep || "Generating…"}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={more} disabled={generating} className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 disabled:opacity-40 transition-colors">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} More B-roll
              </button>
              <button onClick={() => navigate("/RMX?from=spatial")} className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium transition-colors" title="Open in RMX Ultra">
                <Zap className="w-4 h-4" /> Push to RMX Ultra <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Collapsible prompt */}
            <div className="mt-5 rounded-lg border border-white/15 bg-white/[0.03]">
              <button onClick={() => setShowPrompt(!showPrompt)} className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-white/80 hover:bg-white/[0.04] transition-colors">
                <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> {showPrompt ? "Hide prompt" : "Show prompt"}</span>
                <div className="flex items-center gap-2">
                  {showPrompt && <span onClick={(e) => { e.stopPropagation(); copy(); }} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-white/20 text-white/80 hover:bg-white hover:text-black transition-colors">{copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}</span>}
                  {showPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {showPrompt && <div className="px-4 pb-4 border-t border-white/10 pt-3">{renderPromptSections()}</div>}
            </div>
          </>
        )}

        {error && <div className="mt-5 text-[13px] text-red-300 border border-red-400/30 rounded-lg px-3.5 py-3 bg-red-400/10">{error}</div>}
      </div>
    </div>
  );
}