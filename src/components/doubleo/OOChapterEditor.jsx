import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, Loader2, BookOpen, Film, Wand2, Clapperboard, Scissors, Zap, Check, Edit3, Save, X, Bot, Play, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

function buildChapterList(count) {
  const list = [];
  list.push({ num: 0, label: "Prologue", type: "prologue", content: "", enhanced: null });
  for (let i = 1; i <= count; i++) {
    list.push({ num: i, label: `Chapter ${i}`, type: "chapter", content: "", enhanced: null });
  }
  list.push({ num: count + 1, label: "Epilogue", type: "epilogue", content: "", enhanced: null });
  return list;
}

function calcPagesNeeded(targetPages, chapterCount) {
  const prologuePages = Math.max(3, Math.round(targetPages * 0.06));
  const epiloguePages = Math.max(3, Math.round(targetPages * 0.06));
  const remaining = targetPages - prologuePages - epiloguePages;
  const perChapter = Math.round(remaining / chapterCount);
  return { prologuePages, epiloguePages, perChapter };
}

async function buildChapterPrompt({ ch, idx, roughDraft, chapters, targetPages, count, pageCalcResult }) {
  const pageDist = targetPages ? calcPagesNeeded(targetPages, count) : null;
  const myPages = ch.type === "prologue" ? pageDist?.prologuePages : ch.type === "epilogue" ? pageDist?.epiloguePages : pageDist?.perChapter;
  const scenesHint = pageCalcResult?.scenesPerChapter || 3;
  const draftCtx = roughDraft
    ? `Title: "${roughDraft.title}" | Genre: ${roughDraft.genre || "fiction"} | Tone: ${roughDraft.tone || "dramatic"} | Logline: ${roughDraft.logline || ""} | Characters: ${JSON.stringify(roughDraft.mainCharacters || [])} | Conflict: ${roughDraft.coreConflict || ""}`
    : "No draft provided";
  const prevChapters = chapters.slice(0, idx).filter(c => c.enhanced).map(c => `${c.label}: ${c.enhanced?.chapterSummary || c.content?.slice(0, 100)}`).join(" → ");

  return {
    prompt: `You are a master novelist and self-critiquing AI. Write a CHAPTER BLUEPRINT for a cinematic novel.

STORY BIBLE: ${draftCtx}
CONTINUITY: ${prevChapters || "This is the opening chapter."}
THIS CHAPTER: ${ch.label} (${ch.type})
User notes: "${ch.content || "(generate from story arc)"}"
Target pages: ${myPages || 8}
Scenes to create: ${scenesHint} ± 1 (you decide based on pacing)

SELF-CRITIQUE PROCESS: First internally check — does each scene logically follow the previous? Are characters consistent? Is pacing right? Then output the final result only.

Return JSON:
{
  "openingParagraph": "150-180 word opening that reads like a published novel — NOT AI. Real sensory detail, character voice.",
  "mood": "one word mood",
  "lighting": "cinematic lighting direction",
  "cameraNote": "cinematography note",
  "pageEstimate": number,
  "chapterSummary": "2 sentences for story bible",
  "sceneCount": number,
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene title",
      "pages": 3,
      "summary": "2 sentence summary",
      "charactersPresent": ["name"],
      "cameraAngle": "e.g. Low angle tracking shot",
      "lighting": "e.g. Overcast, flat shadows",
      "emotionalBeat": "e.g. Rising dread",
      "prose": "40-word literary scene opening",
      "cutToNext": "CUT TO / SMASH CUT / DISSOLVE TO / MATCH CUT"
    }
  ]
}
CRITICAL: ONLY valid JSON. Natural literary prose. No AI clichés.`,
    model: "claude_sonnet_4_6"
  };
}

export default function OOChapterEditor({ roughDraft }) {
  const [targetPages, setTargetPages] = useState(() => {
    try { return parseInt(localStorage.getItem("oo_target_pages") || "0") || 0; } catch { return 0; }
  });
  const [showPagePrompt, setShowPagePrompt] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const [pageCalcLoading, setPageCalcLoading] = useState(false);
  const [pageCalcResult, setPageCalcResult] = useState(() => {
    try { return JSON.parse(localStorage.getItem("oo_page_calc") || "null"); } catch { return null; }
  });

  const count = roughDraft?.chapterCount || 12;

  const [chapters, setChapters] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("oo_chapters") || "null");
      if (saved && saved.length > 0) return saved;
    } catch {}
    return buildChapterList(count);
  });

  const [activeChapter, setActiveChapter] = useState(-1);
  const [enhancing, setEnhancing] = useState(new Set());
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState({ done: 0, total: 0, current: "" });

  useEffect(() => {
    try { localStorage.setItem("oo_chapters", JSON.stringify(chapters)); } catch {}
  }, [chapters]);

  const updateContent = (idx, content) => {
    setChapters(prev => prev.map((c, i) => i === idx ? { ...c, content } : c));
  };

  const updateEnhanced = (idx, enhanced) => {
    setChapters(prev => prev.map((c, i) => i === idx ? { ...c, enhanced } : c));
  };

  // Single chapter enhance
  const enhanceChapter = async (idx) => {
    const ch = chapters[idx];
    setEnhancing(prev => new Set([...prev, idx]));
    try {
      const { prompt, model } = await buildChapterPrompt({ ch, idx, roughDraft, chapters, targetPages, count, pageCalcResult });
      const raw = await base44.integrations.Core.InvokeLLM({ prompt, model });
      const str = typeof raw === "string" ? raw : JSON.stringify(raw);
      const jsonMatch = str.match(/\{[\s\S]*\}/);
      const enhanced = JSON.parse(jsonMatch ? jsonMatch[0] : str);
      updateEnhanced(idx, enhanced);
    } catch (e) {
      console.error(e);
    }
    setEnhancing(prev => { const n = new Set(prev); n.delete(idx); return n; });
  };

  // Auto decide ALL — parallel with batching (4 at a time to avoid rate limits)
  const autoDecideAll = async () => {
    setAutoRunning(true);
    const total = chapters.length;
    setAutoProgress({ done: 0, total, current: "Starting parallel agents…" });

    const BATCH = 4;
    let done = 0;

    for (let b = 0; b < chapters.length; b += BATCH) {
      const batch = chapters.slice(b, b + BATCH).map((ch, rel) => ({ ch, idx: b + rel }));

      setAutoProgress({ done, total, current: `Running agents for ${batch.map(x => x.ch.label).join(", ")}…` });

      // Mark all in batch as enhancing
      setEnhancing(prev => new Set([...prev, ...batch.map(x => x.idx)]));

      await Promise.all(batch.map(async ({ ch, idx }) => {
        try {
          const { prompt, model } = await buildChapterPrompt({ ch, idx, roughDraft, chapters, targetPages, count, pageCalcResult });
          const raw = await base44.integrations.Core.InvokeLLM({ prompt, model });
          const str = typeof raw === "string" ? raw : JSON.stringify(raw);
          const jsonMatch = str.match(/\{[\s\S]*\}/);
          const enhanced = JSON.parse(jsonMatch ? jsonMatch[0] : str);
          updateEnhanced(idx, enhanced);
        } catch (e) {
          console.error(`Failed ${ch.label}`, e);
        } finally {
          done++;
          setAutoProgress(p => ({ ...p, done, current: `${done}/${total} chapters built` }));
          setEnhancing(prev => { const n = new Set(prev); n.delete(idx); return n; });
        }
      }));
    }

    setAutoRunning(false);
    setAutoProgress({ done: total, total, current: "All chapters built!" });
  };

  const calcPages = async () => {
    if (!pageInput.trim()) return;
    setPageCalcLoading(true);
    try {
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional book editor. Based on this story concept, calculate realistic page count for a novel.
Story: "${roughDraft?.title || "Untitled"}" | Genre: ${roughDraft?.genre || "fiction"} | Chapters: ${count}
Logline: "${roughDraft?.logline || ""}"
User request: "${pageInput}"
Return JSON: { recommendedPages: number, reasoning: string, scenesPerChapter: number, wordsPerPage: number, totalWords: number }`,
        response_json_schema: { type: "object", properties: { recommendedPages: { type: "number" }, reasoning: { type: "string" }, scenesPerChapter: { type: "number" }, wordsPerPage: { type: "number" }, totalWords: { type: "number" } } }
      });
      const result = typeof raw === "object" ? raw : JSON.parse(raw);
      const pages = result.recommendedPages || 60;
      setTargetPages(pages);
      setPageCalcResult(result);
      localStorage.setItem("oo_target_pages", String(pages));
      localStorage.setItem("oo_page_calc", JSON.stringify(result));
      setShowPagePrompt(false);
    } catch {
      setTargetPages(parseInt(pageInput) || 60);
      setShowPagePrompt(false);
    }
    setPageCalcLoading(false);
  };

  const totalPages = chapters.reduce((sum, c) => sum + (c.enhanced?.pageEstimate || 0), 0);
  const completedChapters = chapters.filter(c => c.enhanced).length;

  return (
    <div className="max-w-4xl mx-auto px-4" style={{ color: "#fff" }}>

      {/* Header */}
      <div className="py-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[20px] font-[800] text-white">Chapter + Scene Editor</h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {roughDraft?.title || "Your Story"} · {chapters.length} sections · ~{totalPages || "?"} pages
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setShowPagePrompt(true); setPageInput(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: targetPages ? "rgba(48,209,88,0.12)" : "rgba(255,255,255,0.06)", color: targetPages ? "#30d158" : "rgba(255,255,255,0.5)", border: targetPages ? "1px solid rgba(48,209,88,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
            <BookOpen className="w-3 h-3" />{targetPages ? `${targetPages}p` : "Set pages"}
          </button>

          {/* AUTO DECIDE ALL */}
          <button
            onClick={autoDecideAll}
            disabled={autoRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold text-white disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg, #bf5af2, #0a84ff)", boxShadow: autoRunning ? "none" : "0 0 20px rgba(191,90,242,0.35)" }}>
            {autoRunning
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Building {autoProgress.done}/{autoProgress.total}</>
              : <><Bot className="w-3.5 h-3.5" /> Auto Decide All</>}
          </button>

          <div className="text-right">
            <div className="text-[22px] font-[900] text-white">{completedChapters}/{chapters.length}</div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>done</div>
          </div>
        </div>
      </div>

      {/* Auto progress bar */}
      {autoRunning && (
        <div className="mb-4 p-3 rounded-2xl" style={{ background: "rgba(191,90,242,0.08)", border: "1px solid rgba(191,90,242,0.2)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4" style={{ color: "#bf5af2" }} />
            <p className="text-[12px] font-semibold" style={{ color: "#bf5af2" }}>{autoProgress.current}</p>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #bf5af2, #0a84ff)" }}
              animate={{ width: `${autoProgress.total ? (autoProgress.done / autoProgress.total) * 100 : 0}%` }}
              transition={{ duration: 0.4 }} />
          </div>
        </div>
      )}

      {/* Page count modal */}
      <AnimatePresence>
        {showPagePrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-6" style={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-[18px] font-[800] text-white mb-1">How long should this book be?</h3>
              <p className="text-[12px] mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Tell 00 what you want and it'll calculate the right length.</p>
              {pageCalcResult && (
                <div className="mb-4 p-3 rounded-2xl text-[12px]" style={{ background: "rgba(10,132,255,0.08)", border: "1px solid rgba(10,132,255,0.2)" }}>
                  <p className="font-semibold text-white mb-0.5">Recommendation: <span style={{ color: "#0a84ff" }}>{pageCalcResult.recommendedPages} pages</span></p>
                  <p style={{ color: "rgba(255,255,255,0.45)" }}>{pageCalcResult.reasoning}</p>
                </div>
              )}
              <textarea value={pageInput} onChange={e => setPageInput(e.target.value)}
                placeholder={`e.g. "40 pages" or "full novel length"`}
                rows={2} className="w-full rounded-2xl p-3 text-[13px] resize-none outline-none text-white placeholder-white/30"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowPagePrompt(false)} className="flex-1 py-2.5 rounded-2xl text-[13px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>Cancel</button>
                <button onClick={calcPages} disabled={pageCalcLoading || !pageInput.trim()}
                  className="flex-1 py-2.5 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "#0a84ff" }}>
                  {pageCalcLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {pageCalcLoading ? "Calculating…" : "Calculate"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full mb-5 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" style={{ background: "#0a84ff" }}
          animate={{ width: `${(completedChapters / chapters.length) * 100}%` }} transition={{ duration: 0.5 }} />
      </div>

      {/* Chapter list */}
      <div className="space-y-2">
        {chapters.map((ch, idx) => (
          <ChapterCard key={idx} chapter={ch} idx={idx}
            isActive={activeChapter === idx}
            isEnhancing={enhancing.has(idx)}
            onActivate={() => setActiveChapter(activeChapter === idx ? -1 : idx)}
            onContentChange={(val) => updateContent(idx, val)}
            onEnhance={() => enhanceChapter(idx)}
            onSaveEnhanced={(enhanced) => updateEnhanced(idx, enhanced)}
          />
        ))}
      </div>

      {completedChapters === chapters.length && chapters.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-4 p-5 rounded-2xl text-center"
          style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.12), rgba(48,209,88,0.08))", border: "1px solid rgba(10,132,255,0.3)" }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Check className="w-5 h-5" style={{ color: "#30d158" }} />
            <p className="text-[14px] font-[800] text-white">All chapters complete!</p>
          </div>
          <p className="text-[12px] mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
            {chapters.length} sections · ~{totalPages} pages · ready for next stage
          </p>
          <Link to="/DoubleONotes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-white transition-all hover:brightness-110"
            style={{ background: "#0a84ff", boxShadow: "0 0 24px rgba(10,132,255,0.4)" }}>
            Continue to Notes <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="mt-8 mb-4 p-5 rounded-2xl border text-center" style={{ background: "#1c1c1e", borderColor: "rgba(255,255,255,0.06)" }}>
          <BookOpen className="w-6 h-6 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>{completedChapters}/{chapters.length} chapters done · complete all to continue</p>
        </div>
      )}
    </div>
  );
}

// ─── Chapter Card ────────────────────────────────────────────────────────────

function ChapterCard({ chapter, idx, isActive, isEnhancing, onActivate, onContentChange, onEnhance, onSaveEnhanced }) {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);

  const typeBadge = {
    prologue: { bg: "rgba(191,90,242,0.15)", color: "#bf5af2", border: "rgba(191,90,242,0.25)", label: "PROLOGUE" },
    chapter:  { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.1)", label: "CHAPTER" },
    epilogue: { bg: "rgba(10,132,255,0.12)", color: "#0a84ff", border: "rgba(10,132,255,0.25)", label: "EPILOGUE" },
  }[chapter.type];

  const startEdit = () => {
    setEditData(JSON.parse(JSON.stringify(chapter.enhanced)));
    setEditMode(true);
  };

  const saveEdit = () => {
    onSaveEnhanced(editData);
    setEditMode(false);
  };

  return (
    <motion.div layout className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "#1c1c1e" }}>
      <button onClick={onActivate} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:brightness-110 transition-all">
        <div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
          style={{ background: typeBadge.bg, color: typeBadge.color, border: `1px solid ${typeBadge.border}` }}>
          {typeBadge.label}
        </div>
        <span className="flex-1 text-[14px] font-[700] text-white">{chapter.label}</span>
        {isEnhancing && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#0a84ff" }} />}
        {chapter.enhanced?.sceneCount && !isEnhancing && (
          <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "#30d158" }}>
            <Clapperboard className="w-3 h-3" /> {chapter.enhanced.sceneCount} scenes
          </span>
        )}
        {chapter.enhanced?.pageEstimate && (
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>~{chapter.enhanced.pageEstimate}p</span>
        )}
        {isActive ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />}
      </button>

      <AnimatePresence>
        {isActive && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="pt-4">
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Your notes for this {chapter.type}</label>
                <textarea value={chapter.content} onChange={e => onContentChange(e.target.value)}
                  placeholder={`Rough notes… Even one word. AI will do the rest.`} rows={2}
                  className="w-full text-[13px] text-white placeholder-white/20 rounded-2xl p-3 outline-none resize-none leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }} />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={onEnhance} disabled={isEnhancing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-bold text-white disabled:opacity-50 transition-all"
                  style={{ background: isEnhancing ? "rgba(10,132,255,0.3)" : "#0a84ff" }}>
                  {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  {isEnhancing ? "Agents writing…" : "Build Scenes"}
                </button>
                {chapter.enhanced && !isEnhancing && !editMode && (
                  <button onClick={startEdit}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-semibold transition-all"
                    style={{ background: "rgba(255,214,10,0.1)", color: "#ffd60a", border: "1px solid rgba(255,214,10,0.2)" }}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit Output
                  </button>
                )}
                {editMode && (
                  <>
                    <button onClick={saveEdit} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-bold text-white transition-all" style={{ background: "#30d158" }}>
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={() => setEditMode(false)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-semibold transition-all" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                )}
              </div>

              {/* Enhanced output — edit mode vs read mode */}
              {chapter.enhanced && !isEnhancing && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {editMode && editData ? (
                    <EditableEnhanced data={editData} onChange={setEditData} />
                  ) : (
                    <ReadEnhanced enhanced={chapter.enhanced} />
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Read-only enhanced view ─────────────────────────────────────────────────

function ReadEnhanced({ enhanced }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>📖 Opening Prose</p>
        <p className="text-[14px] leading-[1.8] text-white" style={{ fontFamily: "Georgia, serif" }}>{enhanced.openingParagraph}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[{ label: "Mood", val: enhanced.mood, icon: "🎭" }, { label: "Lighting", val: enhanced.lighting, icon: "💡" }, { label: "Camera", val: enhanced.cameraNote, icon: "🎬" }].map(item => (
          <div key={item.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{item.icon} {item.label}</div>
            <div className="text-[11px] font-semibold text-white">{item.val}</div>
          </div>
        ))}
      </div>
      {enhanced.scenes?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>🎬 {enhanced.scenes.length} Scene{enhanced.scenes.length > 1 ? "s" : ""}</p>
          {enhanced.scenes.map((scene, si) => (
            <SceneCard key={si} scene={scene} isLast={si === enhanced.scenes.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Editable enhanced view ───────────────────────────────────────────────────

function EditableEnhanced({ data, onChange }) {
  const updateField = (field, val) => onChange(prev => ({ ...prev, [field]: val }));
  const updateScene = (si, field, val) => {
    const scenes = data.scenes.map((s, i) => i === si ? { ...s, [field]: val } : s);
    onChange(prev => ({ ...prev, scenes }));
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl" style={{ background: "rgba(255,214,10,0.04)", border: "1px solid rgba(255,214,10,0.15)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,214,10,0.7)" }}>✏️ Opening Prose</p>
        <textarea value={data.openingParagraph} onChange={e => updateField("openingParagraph", e.target.value)} rows={5}
          className="w-full text-[14px] leading-[1.8] text-white bg-transparent outline-none resize-none" style={{ fontFamily: "Georgia, serif" }} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["mood", "🎭 Mood"], ["lighting", "💡 Lighting"], ["cameraNote", "🎬 Camera"]].map(([field, label]) => (
          <div key={field} className="p-3 rounded-xl" style={{ background: "rgba(255,214,10,0.04)", border: "1px solid rgba(255,214,10,0.12)" }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,214,10,0.6)" }}>{label}</div>
            <input value={data[field] || ""} onChange={e => updateField(field, e.target.value)}
              className="w-full text-[11px] font-semibold text-white bg-transparent outline-none" />
          </div>
        ))}
      </div>
      {data.scenes?.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,214,10,0.6)" }}>✏️ Edit Scenes</p>
          {data.scenes.map((scene, si) => (
            <div key={si} className="p-4 rounded-2xl space-y-3" style={{ background: "rgba(255,214,10,0.04)", border: "1px solid rgba(255,214,10,0.12)" }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: "rgba(255,214,10,0.15)", color: "#ffd60a" }}>{scene.sceneNumber}</div>
                <input value={scene.title} onChange={e => updateScene(si, "title", e.target.value)}
                  className="flex-1 text-[13px] font-bold text-white bg-transparent outline-none" />
              </div>
              <textarea value={scene.prose} onChange={e => updateScene(si, "prose", e.target.value)} rows={3}
                className="w-full text-[13px] leading-relaxed text-white bg-transparent outline-none resize-none" style={{ fontFamily: "Georgia, serif" }} />
              <textarea value={scene.summary} onChange={e => updateScene(si, "summary", e.target.value)} rows={2}
                className="w-full text-[12px] leading-relaxed bg-transparent outline-none resize-none" style={{ color: "rgba(255,255,255,0.6)" }} />
              <div className="grid grid-cols-2 gap-2">
                {[["cameraAngle", "🎬 Camera"], ["lighting", "💡 Lighting"], ["emotionalBeat", "💫 Beat"], ["cutToNext", "✂️ Cut"]].map(([f, l]) => (
                  <div key={f} className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>{l}</p>
                    <input value={scene[f] || ""} onChange={e => updateScene(si, f, e.target.value)} className="w-full text-[11px] text-white bg-transparent outline-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Scene Card ──────────────────────────────────────────────────────────────

function SceneCard({ scene, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-110 transition-all">
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: "rgba(10,132,255,0.15)", color: "#0a84ff" }}>{scene.sceneNumber}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-[700] text-white truncate">{scene.title}</p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{scene.pages}p · {scene.emotionalBeat}</p>
        </div>
        {scene.charactersPresent?.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full hidden sm:block" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
            {scene.charactersPresent.slice(0, 2).join(", ")}{scene.charactersPresent.length > 2 ? `+${scene.charactersPresent.length - 2}` : ""}
          </span>
        )}
        {open ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="px-4 pb-4 space-y-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              {scene.prose && (
                <p className="text-[13px] leading-[1.8] text-white" style={{ fontFamily: "Georgia, serif" }}>{scene.prose}</p>
              )}
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{scene.summary}</p>
              <div className="grid grid-cols-2 gap-2">
                {[["🎬 Camera", scene.cameraAngle], ["💡 Lighting", scene.lighting]].map(([l, v]) => (
                  <div key={l} className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>{l}</p>
                    <p className="text-[11px] font-semibold text-white">{v}</p>
                  </div>
                ))}
              </div>
              {scene.charactersPresent?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {scene.charactersPresent.map((c, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: "rgba(10,132,255,0.12)", color: "#0a84ff", border: "1px solid rgba(10,132,255,0.2)" }}>{c}</span>
                  ))}
                </div>
              )}
              {!isLast && scene.cutToNext && (
                <div className="flex items-center gap-2">
                  <Scissors className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(255,69,58,0.7)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,69,58,0.7)" }}>{scene.cutToNext}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}