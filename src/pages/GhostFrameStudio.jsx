import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Plus, Play, Pause, RefreshCw, Download, Settings, ChevronRight,
  ChevronLeft, Sparkles, AlertTriangle, Check, Loader2, Trash2, Edit2, X
} from "lucide-react";

const DEFAULT_CHAR_A = `short dark cropped hair, glasses, light beard, light-to-medium brown skin tone, white dress shirt with sleeves down, fitted dark vest, dark trousers, calm composed expression`;
const DEFAULT_CHAR_B = `translucent glowing blue-cyan humanoid figure, circuit-board patterns running through his body like veins, faint particle/static texture at the edges, no distinct facial features — just a soft glowing outline where a face would be, slightly taller/more slender than the human, scarecrow-like angular posture, emits soft blue light onto nearby surfaces`;
const DEFAULT_STYLE = `Clean cel-shaded anime art style (Invincible-adjacent), warm golden-hour lighting, painterly soft-focus backgrounds, glowing light particles drifting through the air, cinematic atmosphere, 1920x1080`;
const DEFAULT_ENV = `Golden wheat field at sunset, sun low on the horizon, wheat gently swaying, long shadows, no other people or structures in frame`;
const DEFAULT_CONSTRAINT = `No real, named public figures. No literal crypto/brand references in visuals. All meaning stays purely thematic (speed, light, network pulses) — never named, never shown as text/logos in-frame.`;

function buildPrompt(frame, shotRun, project) {
  const n = frame.frame_number;
  const total = shotRun.frame_count;
  return `[STYLE BLOCK]
${project.locked_style}

[ENVIRONMENT BLOCK]
${project.locked_environment}

[CAMERA]
${shotRun.camera_notes || "Static camera, low eye-level angle, no pan."}

Frame ${n} of ${total} in a continuous motion sequence titled "${shotRun.name}".

Character A — The Chosen One: ${project.locked_character_a}
Character B — Ghost of the Grid (if present this frame): ${project.locked_character_b}

Sequence motion context: ${shotRun.motion_notes}
This specific frame's position: interpolate ${n}/${total} between the starting state ("${shotRun.starting_state}") and ending state ("${shotRun.ending_state}").
${frame.manual_notes ? `Frame-specific note: ${frame.manual_notes}` : ""}

Continuity requirement: character proportions, facial features, clothing details, and circuit pattern design must remain IDENTICAL to the reference frame image provided (previous frame ${n - 1}) — only the pose, motion progress, and lighting intensity should change. Do not redesign any character element.

Constraints: ${project.constraint_notes}`;
}

// ── Tabs ──
const TABS = ["Project", "Shot Runs", "Filmstrip", "Export"];

export default function GhostFrameStudio() {
  const [tab, setTab] = useState(0);
  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [shotRuns, setShotRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [frames, setFrames] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingFrame, setGeneratingFrame] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState("");
  const [showNewRun, setShowNewRun] = useState(false);
  const [newRun, setNewRun] = useState({ name: "", frame_count: 10, starting_state: "", ending_state: "", motion_notes: "", camera_notes: "" });
  const stopRef = useRef(false);

  // ── Load / create project ──
  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.GhostFrameProject.list();
        if (list.length > 0) {
          setProject(list[0]);
        } else {
          const p = await base44.entities.GhostFrameProject.create({
            title: "Ghost of the Grid",
            locked_character_a: DEFAULT_CHAR_A,
            locked_character_b: DEFAULT_CHAR_B,
            locked_style: DEFAULT_STYLE,
            locked_environment: DEFAULT_ENV,
            constraint_notes: DEFAULT_CONSTRAINT,
          });
          setProject(p);
        }
      } catch (e) { console.error(e); }
      setLoadingProject(false);
    })();
  }, []);

  useEffect(() => {
    if (!project) return;
    base44.entities.GhostShotRun.filter({ project_id: project.id }, "order").then(setShotRuns).catch(console.error);
  }, [project]);

  useEffect(() => {
    if (!selectedRun) return;
    base44.entities.GhostFrame.filter({ shot_run_id: selectedRun.id }, "frame_number").then(setFrames).catch(console.error);
  }, [selectedRun]);

  const saveProject = async (updates) => {
    const updated = await base44.entities.GhostFrameProject.update(project.id, updates);
    setProject(updated);
  };

  const createShotRun = async () => {
    if (!newRun.name.trim()) return;
    const run = await base44.entities.GhostShotRun.create({ ...newRun, project_id: project.id, order: shotRuns.length });
    setShotRuns(prev => [...prev, run]);
    setSelectedRun(run);
    setNewRun({ name: "", frame_count: 10, starting_state: "", ending_state: "", motion_notes: "", camera_notes: "" });
    setShowNewRun(false);
    setTab(2);
    // Create draft frames
    const draftFrames = [];
    for (let i = 1; i <= run.frame_count; i++) {
      const f = await base44.entities.GhostFrame.create({
        shot_run_id: run.id, project_id: project.id, frame_number: i,
        auto_generated_prompt: buildPrompt({ frame_number: i, manual_notes: "" }, run, project),
        status: "draft",
      });
      draftFrames.push(f);
    }
    setFrames(draftFrames);
    setSelectedFrame(draftFrames[0]);
    setEditingPrompt(draftFrames[0].auto_generated_prompt);
  };

  const selectFrame = (f) => {
    setSelectedFrame(f);
    setEditingPrompt(f.auto_generated_prompt || "");
  };

  const generateSingleFrame = async (frame, refImageUrl) => {
    setGeneratingFrame(frame.frame_number);
    const updated = await base44.entities.GhostFrame.update(frame.id, { status: "generating" });
    setFrames(prev => prev.map(f => f.id === frame.id ? { ...f, status: "generating" } : f));
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: editingPrompt || frame.auto_generated_prompt,
        ...(refImageUrl ? { existing_image_urls: [refImageUrl] } : {}),
      });
      const done = await base44.entities.GhostFrame.update(frame.id, {
        generated_image_url: res.url,
        status: "done",
        reference_frame_image: refImageUrl || null,
        auto_generated_prompt: editingPrompt || frame.auto_generated_prompt,
      });
      setFrames(prev => prev.map(f => f.id === frame.id ? done : f));
      if (selectedFrame?.id === frame.id) setSelectedFrame(done);
      return res.url;
    } catch (e) {
      await base44.entities.GhostFrame.update(frame.id, { status: "needs_regen" });
      setFrames(prev => prev.map(f => f.id === frame.id ? { ...f, status: "needs_regen" } : f));
      return null;
    } finally {
      setGeneratingFrame(null);
    }
  };

  const generateAll = async () => {
    stopRef.current = false;
    setGeneratingAll(true);
    let prevImageUrl = null;
    // get last frame of previous shot run if any
    const runIndex = shotRuns.findIndex(r => r.id === selectedRun.id);
    if (runIndex > 0) {
      const prevRun = shotRuns[runIndex - 1];
      const prevFrames = await base44.entities.GhostFrame.filter({ shot_run_id: prevRun.id }, "-frame_number");
      if (prevFrames[0]?.generated_image_url) prevImageUrl = prevFrames[0].generated_image_url;
    }
    for (const frame of frames) {
      if (stopRef.current) break;
      if (frame.status === "done") { prevImageUrl = frame.generated_image_url || prevImageUrl; continue; }
      const url = await generateSingleFrame(frame, prevImageUrl);
      if (url) prevImageUrl = url;
    }
    setGeneratingAll(false);
  };

  const enhancePrompt = async () => {
    if (!selectedFrame) return;
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a cinematic image prompt expert. Enhance this frame prompt to be more vivid, specific, and ensure character consistency. Keep all the constraints. Frame prompt:\n\n${editingPrompt}`,
        model: "claude_sonnet_4_6",
      });
      setEditingPrompt(typeof res === "string" ? res : editingPrompt);
    } catch (e) { console.error(e); }
  };

  const exportPrompts = () => {
    const text = frames.map(f => `FRAME ${String(f.frame_number).padStart(3, "0")}\n${f.auto_generated_prompt}\n${"─".repeat(60)}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${selectedRun?.name || "shotrun"}_prompts.txt`; a.click();
  };

  const markNeedsRegen = async (frame) => {
    const updated = await base44.entities.GhostFrame.update(frame.id, { status: "needs_regen" });
    setFrames(prev => prev.map(f => f.id === frame.id ? updated : f));
  };

  const statusColor = (status) => ({
    draft: "rgba(255,255,255,0.2)",
    generating: "#f59e0b",
    done: "#22c55e",
    needs_regen: "#ef4444",
  }[status] || "rgba(255,255,255,0.2)");

  if (loadingProject) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
          <Film className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-base tracking-tight">Ghost Frame Studio</span>
        {selectedRun && <span className="text-xs text-white/40 ml-1">· {selectedRun.name}</span>}
        <div className="ml-auto flex items-center gap-2">
          {tab === 2 && selectedRun && (
            <>
              <button onClick={() => { stopRef.current = true; }} disabled={!generatingAll}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:text-white disabled:opacity-30 transition-all">
                <Pause className="w-3 h-3" /> Stop
              </button>
              <button onClick={generateAll} disabled={generatingAll}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold text-black disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                {generatingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Generate All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-5 gap-1">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-xs font-bold tracking-wider transition-all ${tab === i ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/40 hover:text-white/70"}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── TAB 0: PROJECT SETUP ── */}
        {tab === 0 && project && (
          <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">
            <h2 className="text-lg font-black mb-1">{project.title}</h2>
            <p className="text-xs text-white/40 mb-6">These locked blocks feed into every generated prompt. Edit rarely, if ever.</p>
            {[
              { label: "CHARACTER A — The Chosen One", key: "locked_character_a" },
              { label: "CHARACTER B — Ghost of the Grid", key: "locked_character_b" },
              { label: "VISUAL STYLE BASELINE", key: "locked_style" },
              { label: "ENVIRONMENT BASELINE", key: "locked_environment" },
              { label: "CONSTRAINTS", key: "constraint_notes" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-[10px] font-black tracking-widest text-white/40 mb-1.5">{label}</label>
                <textarea
                  value={project[key] || ""}
                  onChange={e => setProject(prev => ({ ...prev, [key]: e.target.value }))}
                  onBlur={() => saveProject({ [key]: project[key] })}
                  rows={4}
                  className="w-full text-sm text-white/80 px-3 py-2.5 rounded-xl resize-none outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "#0ea5e9" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 1: SHOT RUNS ── */}
        {tab === 1 && (
          <div className="max-w-3xl mx-auto px-5 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">Shot Runs</h2>
              <button onClick={() => setShowNewRun(true)}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-full font-bold text-black"
                style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                <Plus className="w-3.5 h-3.5" /> New Shot Run
              </button>
            </div>

            <div className="space-y-3">
              {shotRuns.length === 0 && (
                <div className="text-center py-16 text-white/30">
                  <Film className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No shot runs yet. Create your first one.</p>
                </div>
              )}
              {shotRuns.map(run => (
                <div key={run.id}
                  onClick={() => { setSelectedRun(run); setTab(2); }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-white/8 hover:border-cyan-500/30 cursor-pointer transition-all"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)" }}>
                    <Film className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white">{run.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">{run.frame_count} frames · {run.starting_state?.slice(0, 40)}…</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                </div>
              ))}
            </div>

            {/* New run modal */}
            <AnimatePresence>
              {showNewRun && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                  onClick={e => e.target === e.currentTarget && setShowNewRun(false)}>
                  <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                    className="w-full max-w-lg rounded-2xl p-6 space-y-4"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-lg">New Shot Run</h3>
                      <button onClick={() => setShowNewRun(false)}><X className="w-4 h-4 text-white/40" /></button>
                    </div>
                    {[
                      { label: "NAME", key: "name", placeholder: "e.g. The Rise — standing + merge" },
                      { label: "STARTING STATE (frame 1)", key: "starting_state", placeholder: "Man crouching in wheat field…" },
                      { label: "ENDING STATE (final frame)", key: "ending_state", placeholder: "Man standing, Guardian dissolved, eyes glowing cyan…" },
                      { label: "MOTION NOTES", key: "motion_notes", placeholder: "Describe what changes frame to frame…" },
                      { label: "CAMERA NOTES", key: "camera_notes", placeholder: "Static camera, low eye-level angle…" },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-[10px] font-black tracking-widest text-white/40 mb-1">{label}</label>
                        <textarea value={newRun[key]} onChange={e => setNewRun(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder} rows={key === "name" ? 1 : 2}
                          className="w-full text-sm text-white/80 px-3 py-2 rounded-lg resize-none outline-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] font-black tracking-widest text-white/40 mb-1">FRAME COUNT: {newRun.frame_count}</label>
                      <input type="range" min={2} max={20} value={newRun.frame_count}
                        onChange={e => setNewRun(p => ({ ...p, frame_count: Number(e.target.value) }))}
                        className="w-full accent-cyan-400" />
                    </div>
                    <button onClick={createShotRun}
                      className="w-full py-3 rounded-xl font-black text-black text-sm"
                      style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                      CREATE & BUILD FRAMES
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── TAB 2: FILMSTRIP ── */}
        {tab === 2 && (
          <div className="flex h-full" style={{ minHeight: "calc(100vh - 7rem)" }}>
            {/* Filmstrip */}
            <div className="w-full sm:w-64 border-r border-white/8 overflow-y-auto flex-shrink-0">
              {!selectedRun ? (
                <div className="p-6 text-center text-white/30">
                  <p className="text-sm">Select a Shot Run first</p>
                  <button onClick={() => setTab(1)} className="mt-3 text-xs text-cyan-400 hover:underline">Go to Shot Runs →</button>
                </div>
              ) : (
                <>
                  <div className="px-3 py-3 border-b border-white/8">
                    <div className="text-[10px] font-black tracking-widest text-white/30">SHOT RUN</div>
                    <div className="text-sm font-bold text-white mt-0.5">{selectedRun.name}</div>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {frames.map(f => (
                      <button key={f.id} onClick={() => selectFrame(f)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all text-left ${selectedFrame?.id === f.id ? "bg-white/10 border border-cyan-500/30" : "hover:bg-white/5 border border-transparent"}`}>
                        <div className="w-12 h-9 rounded flex-shrink-0 overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          {f.generated_image_url
                            ? <img src={f.generated_image_url} alt={`frame ${f.frame_number}`} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                              {f.status === "generating" ? <Loader2 className="w-3 h-3 animate-spin text-amber-400" /> : <Film className="w-3 h-3 text-white/20" />}
                            </div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white/80">Frame {String(f.frame_number).padStart(2, "0")}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(f.status) }} />
                            <span className="text-[10px] text-white/30 capitalize">{f.status}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Frame detail panel */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!selectedFrame ? (
                <div className="h-full flex items-center justify-center text-white/20 text-sm">Select a frame from the filmstrip</div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-5">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-lg">Frame {String(selectedFrame.frame_number).padStart(2, "0")}</h3>
                    <div className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                      style={{ background: statusColor(selectedFrame.status) + "22", color: statusColor(selectedFrame.status), border: `1px solid ${statusColor(selectedFrame.status)}44` }}>
                      {selectedFrame.status}
                    </div>
                  </div>

                  {/* Image preview */}
                  {selectedFrame.generated_image_url && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video">
                      <img src={selectedFrame.generated_image_url} alt={`Frame ${selectedFrame.frame_number}`} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Prompt editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black tracking-widest text-white/40">PROMPT</label>
                      <button onClick={enhancePrompt}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                        <Sparkles className="w-3 h-3" /> Enhance with Claude
                      </button>
                    </div>
                    <textarea value={editingPrompt} onChange={e => setEditingPrompt(e.target.value)}
                      rows={10}
                      className="w-full text-xs text-white/70 px-3 py-2.5 rounded-xl resize-none outline-none font-mono"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "#0ea5e9" }} />
                  </div>

                  {/* Manual notes */}
                  <div>
                    <label className="block text-[10px] font-black tracking-widest text-white/40 mb-1.5">MANUAL NOTES (optional)</label>
                    <input value={selectedFrame.manual_notes || ""}
                      onChange={e => {
                        const v = e.target.value;
                        base44.entities.GhostFrame.update(selectedFrame.id, { manual_notes: v });
                        setSelectedFrame(prev => ({ ...prev, manual_notes: v }));
                        setFrames(prev => prev.map(f => f.id === selectedFrame.id ? { ...f, manual_notes: v } : f));
                      }}
                      placeholder="e.g. Make the glow brighter here"
                      className="w-full text-sm text-white/70 px-3 py-2 rounded-lg outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>

                  {/* Reference frame */}
                  {selectedFrame.reference_frame_image && (
                    <div>
                      <label className="block text-[10px] font-black tracking-widest text-white/40 mb-1.5">REFERENCE FRAME (previous)</label>
                      <img src={selectedFrame.reference_frame_image} alt="ref" className="w-32 h-20 object-cover rounded-lg border border-white/10" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={async () => {
                        const prevFrame = frames.find(f => f.frame_number === selectedFrame.frame_number - 1);
                        await generateSingleFrame(selectedFrame, prevFrame?.generated_image_url || null);
                      }}
                      disabled={!!generatingFrame}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-black disabled:opacity-40 transition-all"
                      style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                      {generatingFrame === selectedFrame.frame_number ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Generate / Regen
                    </button>
                    <button onClick={() => markNeedsRegen(selectedFrame)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all">
                      <AlertTriangle className="w-4 h-4" /> Flag Drift
                    </button>
                    {selectedFrame.generated_image_url && (
                      <a href={selectedFrame.generated_image_url} download={`frame_${String(selectedFrame.frame_number).padStart(3, "0")}.png`}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all">
                        <Download className="w-4 h-4" /> Save Frame
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: EXPORT ── */}
        {tab === 3 && (
          <div className="max-w-2xl mx-auto px-5 py-10 space-y-6">
            <h2 className="text-xl font-black mb-2">Export</h2>
            <p className="text-sm text-white/40">{selectedRun ? `Exporting: ${selectedRun.name}` : "Select a Shot Run from the Shot Runs tab first."}</p>

            <div className="space-y-3">
              <div className="p-5 rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="font-bold mb-1">Export All Prompts (.txt)</div>
                <p className="text-sm text-white/40 mb-4">Numbered list of all frame prompts — paste into any AI tool.</p>
                <button onClick={exportPrompts} disabled={!selectedRun || frames.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-black disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                  <Download className="w-4 h-4" /> Download Prompts TXT
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="font-bold mb-1">Generated Frames</div>
                <p className="text-sm text-white/40 mb-4">Download individual frames below. Right-click → Save Image As to rename them frame_001.png etc.</p>
                <div className="grid grid-cols-4 gap-2">
                  {frames.filter(f => f.generated_image_url).map(f => (
                    <a key={f.id} href={f.generated_image_url}
                      download={`frame_${String(f.frame_number).padStart(3, "0")}.png`}
                      className="relative group rounded-lg overflow-hidden border border-white/10 aspect-video block">
                      <img src={f.generated_image_url} alt={`frame ${f.frame_number}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Download className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute bottom-0.5 left-0.5 text-[8px] font-bold text-white/60 bg-black/40 px-1 rounded">
                        {String(f.frame_number).padStart(3, "0")}
                      </div>
                    </a>
                  ))}
                  {frames.filter(f => f.generated_image_url).length === 0 && (
                    <div className="col-span-4 text-center py-8 text-white/20 text-sm">No generated frames yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}