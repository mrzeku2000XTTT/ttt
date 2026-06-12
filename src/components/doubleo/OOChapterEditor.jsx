import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, Loader2, BookOpen, Film, Wand2, Plus, Clapperboard, Scissors, ChevronRight, Eye, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

// ─── helpers ────────────────────────────────────────────────────────────────

function buildChapterList(count) {
  const list = [];
  list.push({ num: 0, label: "Prologue", type: "prologue", content: "", enhanced: null, scenes: [], expanded: false });
  for (let i = 1; i <= count; i++) {
    list.push({ num: i, label: `Chapter ${i}`, type: "chapter", content: "", enhanced: null, scenes: [], expanded: false });
  }
  list.push({ num: count + 1, label: "Epilogue", type: "epilogue", content: "", enhanced: null, scenes: [], expanded: false });
  return list;
}

function calcPagesNeeded(targetPages, chapterCount) {
  // distribute pages across chapters (prologue/epilogue get less)
  const mainChapters = chapterCount;
  const prologuePages = Math.max(3, Math.round(targetPages * 0.06));
  const epiloguePages = Math.max(3, Math.round(targetPages * 0.06));
  const remaining = targetPages - prologuePages - epiloguePages;
  const perChapter = Math.round(remaining / mainChapters);
  return { prologuePages, epiloguePages, perChapter };
}

// ─── main component ──────────────────────────────────────────────────────────

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
  const [enhancing, setEnhancing] = useState(null);
  const [buildingScenes, setBuildingScenes] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("oo_chapters", JSON.stringify(chapters)); } catch {}
  }, [chapters]);

  const updateContent = (idx, content) => {
    setChapters(prev => prev.map((c, i) => i === idx ? { ...c, content } : c));
  };

  // ── Ask AI how many pages needed for user's intent ──────────────────────
  const calcPages = async () => {
    if (!pageInput.trim()) return;
    setPageCalcLoading(true);
    const userIntent = roughDraft?.logline || roughDraft?.premise || pageInput;
    try {
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional book editor. Based on this story concept and user request, calculate the realistic page count for a proper novel.

Story: "${roughDraft?.title || "Untitled"}"
Logline: "${userIntent}"
User says: "${pageInput}"
Chapters: ${count}
Genre: ${roughDraft?.genre || "fiction"}

Calculate:
1. How many pages this story NEEDS to feel complete and cinematic (min 40)
2. How many scenes per chapter (avg)
3. Words per page estimate
4. Total word count estimate

Return JSON: { recommendedPages: number, reasoning: string (1 sentence), scenesPerChapter: number, wordsPerPage: number, totalWords: number }`,
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
      const fallback = parseInt(pageInput) || 60;
      setTargetPages(fallback);
      setShowPagePrompt(false);
    }
    setPageCalcLoading(false);
  };

  // ── Enhance chapter + build scenes ───────────────────────────────────────
  const enhanceChapter = async (idx) => {
    const ch = chapters[idx];
    setEnhancing(idx);

    const pageDist = targetPages ? calcPagesNeeded(targetPages, count) : null;
    const myPages = ch.type === "prologue" ? pageDist?.prologuePages : ch.type === "epilogue" ? pageDist?.epiloguePages : pageDist?.perChapter;
    const scenesHint = pageCalcResult?.scenesPerChapter || 3;

    const draftCtx = roughDraft ? `Title: "${roughDraft.title}" | Genre: ${roughDraft.genre || "fiction"} | Tone: ${roughDraft.tone || "dramatic"} | Logline: ${roughDraft.logline || ""} | Main Characters: ${JSON.stringify(roughDraft.mainCharacters || [])} | Setting: ${JSON.stringify(roughDraft.setting || {})} | Core Conflict: ${roughDraft.coreConflict || ""}` : "";
    const prevChapters = chapters.slice(0, idx).filter(c => c.enhanced).map(c => `${c.label} (${c.enhanced?.sceneCount} scenes): ${c.enhanced?.chapterSummary || c.content?.slice(0, 120)}`).join(" → ");

    try {
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a master novelist and screenwriter. Your job: write a CHAPTER BLUEPRINT for a cinematic novel — one that reads like a published book but is structured like a movie.

STORY BIBLE:
${draftCtx}

CONTINUITY:
${prevChapters ? `Previous chapters: ${prevChapters}` : "This is the opening."}

THIS CHAPTER: ${ch.label} (${ch.type})
User notes: "${ch.content || "(none — generate based on story arc)"}"
Target pages for this chapter: ${myPages || "8-12"}
Number of scenes to create: ${scenesHint} (AI decides exact count based on pacing)

INSTRUCTIONS:
1. Write an OPENING PARAGRAPH (150-180 words) that sounds like a real published novel — NOT AI. Natural rhythm, sensory details, character voice. NO clichés.
2. Decide scene count for this chapter (${scenesHint} ± 1)
3. For each scene: title, pages, summary, characters present, camera angle direction, lighting, emotional beat, cut type going INTO next scene
4. Generate a chapterSummary (2 sentences for the story bible)

Return JSON:
{
  "openingParagraph": "...",
  "mood": "...",
  "lighting": "...",
  "cameraNote": "...",
  "pageEstimate": number,
  "chapterSummary": "...",
  "sceneCount": number,
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene title",
      "pages": 3,
      "summary": "What happens in 2 sentences",
      "charactersPresent": ["name1"],
      "cameraAngle": "e.g. Low angle, tracking shot",
      "lighting": "e.g. Overcast, flat light, shadows ahead",
      "emotionalBeat": "e.g. Rising tension",
      "prose": "Opening sentence of this scene (40 words, literary quality)",
      "cutToNext": "CUT TO / SMASH CUT / DISSOLVE TO / MATCH CUT"
    }
  ]
}

CRITICAL: Return ONLY valid JSON. The prose must feel like a real book, not an AI summary.`,
        model: "claude_sonnet_4_6"
      });

      let enhanced;
      try {
        const str = typeof raw === "string" ? raw : JSON.stringify(raw);
        const jsonMatch = str.match(/\{[\s\S]*\}/);
        enhanced = JSON.parse(jsonMatch ? jsonMatch[0] : str);
      } catch {
        enhanced = { openingParagraph: "Chapter content processing...", mood: "dramatic", lighting: "natural", cameraNote: "wide shot", pageEstimate: myPages || 8, sceneCount: scenesHint, scenes: [], chapterSummary: ch.content?.slice(0, 100) || "" };
      }

      setChapters(prev => prev.map((c, i) => i === idx ? { ...c, enhanced } : c));
    } catch (e) {
      console.error(e);
    }
    setEnhancing(null);
  };

  const totalPages = chapters.reduce((sum, c) => sum + (c.enhanced?.pageEstimate || 0), 0);
  const completedChapters = chapters.filter(c => c.enhanced).length;

  return (
    <div className="max-w-4xl mx-auto px-4" style={{ color: "#fff" }}>

      {/* Header */}
      <div className="py-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-[800] text-white">Chapter + Scene Editor</h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {roughDraft?.title || "Your Story"} · {chapters.length} sections · ~{totalPages || "?"} pages built
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Page count badge / set button */}
          <button onClick={() => { setShowPagePrompt(true); setPageInput(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: targetPages ? "rgba(48,209,88,0.12)" : "rgba(255,255,255,0.06)", color: targetPages ? "#30d158" : "rgba(255,255,255,0.5)", border: targetPages ? "1px solid rgba(48,209,88,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
            <BookOpen className="w-3 h-3" />
            {targetPages ? `${targetPages} pages` : "Set pages"}
          </button>
          <div className="text-right">
            <div className="text-[22px] font-[900] text-white">{completedChapters}/{chapters.length}</div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>done</div>
          </div>
        </div>
      </div>

      {/* Page count prompt modal */}
      <AnimatePresence>
        {showPagePrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-6" style={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-[18px] font-[800] text-white mb-1">How long should this book be?</h3>
              <p className="text-[12px] mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>Tell me what you want or ask 00 to calculate the right length for your story.</p>
              {pageCalcResult && (
                <div className="mb-4 p-3 rounded-2xl text-[12px]" style={{ background: "rgba(10,132,255,0.08)", border: "1px solid rgba(10,132,255,0.2)" }}>
                  <p className="font-semibold text-white mb-1">00's recommendation: <span style={{ color: "#0a84ff" }}>{pageCalcResult.recommendedPages} pages</span></p>
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>{pageCalcResult.reasoning}</p>
                  <p className="mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>~{pageCalcResult.wordsPerPage} words/page · {pageCalcResult.scenesPerChapter} scenes/chapter · {pageCalcResult.totalWords?.toLocaleString()} total words</p>
                </div>
              )}
              <textarea
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                placeholder={`e.g. "40 pages" or "I want it to feel like a full novel" or "make it movie-length"`}
                rows={3}
                className="w-full rounded-2xl p-3 text-[13px] resize-none outline-none text-white placeholder-white/30"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowPagePrompt(false)}
                  className="flex-1 py-2.5 rounded-2xl text-[13px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
                <button onClick={calcPages} disabled={pageCalcLoading || !pageInput.trim()}
                  className="flex-1 py-2.5 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "#0a84ff" }}>
                  {pageCalcLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {pageCalcLoading ? "Calculating..." : "Calculate"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full mb-6 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" style={{ background: "#0a84ff" }}
          animate={{ width: `${(completedChapters / chapters.length) * 100}%` }}
          transition={{ duration: 0.5 }} />
      </div>

      {/* Chapter list */}
      <div className="space-y-2">
        {chapters.map((ch, idx) => (
          <ChapterCard
            key={idx} chapter={ch} idx={idx}
            isActive={activeChapter === idx}
            isEnhancing={enhancing === idx}
            targetPages={targetPages}
            pageCalcResult={pageCalcResult}
            chapterCount={count}
            onActivate={() => setActiveChapter(activeChapter === idx ? -1 : idx)}
            onContentChange={(val) => updateContent(idx, val)}
            onEnhance={() => enhanceChapter(idx)}
          />
        ))}
      </div>

      <div className="mt-8 mb-4 p-5 rounded-2xl border text-center" style={{ background: "#1c1c1e", borderColor: "rgba(255,255,255,0.06)" }}>
        <BookOpen className="w-6 h-6 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>Complete all chapters to unlock full export</p>
      </div>
    </div>
  );
}

// ─── Chapter Card ────────────────────────────────────────────────────────────

function ChapterCard({ chapter, idx, isActive, isEnhancing, onActivate, onContentChange, onEnhance, targetPages, pageCalcResult, chapterCount }) {
  const typeLabel = { prologue: "PROLOGUE", chapter: "CHAPTER", epilogue: "EPILOGUE" };
  const typeBadge = {
    prologue: { bg: "rgba(191,90,242,0.15)", color: "#bf5af2", border: "rgba(191,90,242,0.25)" },
    chapter:  { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.1)" },
    epilogue: { bg: "rgba(10,132,255,0.12)", color: "#0a84ff", border: "rgba(10,132,255,0.25)" },
  }[chapter.type];

  return (
    <motion.div layout className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "#1c1c1e" }}>
      {/* Header */}
      <button onClick={onActivate}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:brightness-110">
        <div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
          style={{ background: typeBadge.bg, color: typeBadge.color, border: `1px solid ${typeBadge.border}` }}>
          {typeLabel[chapter.type]}
        </div>
        <span className="flex-1 text-[14px] font-[700] text-white">{chapter.label}</span>
        {chapter.enhanced?.sceneCount && (
          <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "#30d158" }}>
            <Clapperboard className="w-3 h-3" /> {chapter.enhanced.sceneCount} scenes
          </span>
        )}
        {chapter.enhanced?.pageEstimate && (
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>~{chapter.enhanced.pageEstimate}p</span>
        )}
        {isActive ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />}
      </button>

      {/* Body */}
      <AnimatePresence>
        {isActive && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="pt-4">
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Your idea for this {chapter.type}
                </label>
                <textarea
                  value={chapter.content}
                  onChange={e => onContentChange(e.target.value)}
                  placeholder={`Rough notes for ${chapter.label}… Even one sentence. AI will expand it.`}
                  rows={3}
                  className="w-full text-[13px] text-white placeholder-white/20 rounded-2xl p-3 outline-none resize-none leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                />
              </div>

              <button onClick={onEnhance} disabled={isEnhancing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-bold text-white disabled:opacity-50 transition-all"
                style={{ background: isEnhancing ? "rgba(10,132,255,0.3)" : "#0a84ff" }}>
                {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {isEnhancing ? "00 is writing scenes…" : "Build Chapter + Scenes"}
              </button>

              {/* Enhanced output */}
              {chapter.enhanced && !isEnhancing && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                  {/* Opening prose */}
                  <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>📖 Opening Prose</p>
                    <p className="text-[14px] leading-[1.8] text-white font-[400]" style={{ fontFamily: "Georgia, serif" }}>
                      {chapter.enhanced.openingParagraph}
                    </p>
                  </div>

                  {/* Cinematic details */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Mood", val: chapter.enhanced.mood, icon: "🎭" },
                      { label: "Lighting", val: chapter.enhanced.lighting, icon: "💡" },
                      { label: "Camera", val: chapter.enhanced.cameraNote, icon: "🎬" },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{item.icon} {item.label}</div>
                        <div className="text-[11px] font-semibold text-white">{item.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Scene breakdown */}
                  {chapter.enhanced.scenes?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                        🎬 {chapter.enhanced.scenes.length} Scene{chapter.enhanced.scenes.length > 1 ? "s" : ""}
                      </p>
                      {chapter.enhanced.scenes.map((scene, si) => (
                        <SceneCard key={si} scene={scene} isLast={si === chapter.enhanced.scenes.length - 1} />
                      ))}
                    </div>
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

// ─── Scene Card ──────────────────────────────────────────────────────────────

function SceneCard({ scene, isLast }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-110 transition-all">
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
          style={{ background: "rgba(10,132,255,0.15)", color: "#0a84ff" }}>
          {scene.sceneNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-[700] text-white truncate">{scene.title}</p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{scene.pages}p · {scene.emotionalBeat}</p>
        </div>
        <div className="flex items-center gap-2">
          {scene.charactersPresent?.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
              {scene.charactersPresent.slice(0, 2).join(", ")}{scene.charactersPresent.length > 2 ? `+${scene.charactersPresent.length - 2}` : ""}
            </span>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              {/* Scene prose */}
              {scene.prose && (
                <div className="pt-3">
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>📝 Scene Opening</p>
                  <p className="text-[13px] leading-[1.8] text-white" style={{ fontFamily: "Georgia, serif" }}>{scene.prose}</p>
                </div>
              )}

              {/* Summary */}
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>📋 Summary</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{scene.summary}</p>
              </div>

              {/* Cinematic details */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>🎬 Camera</p>
                  <p className="text-[11px] font-semibold text-white">{scene.cameraAngle}</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>💡 Lighting</p>
                  <p className="text-[11px] font-semibold text-white">{scene.lighting}</p>
                </div>
              </div>

              {/* Characters */}
              {scene.charactersPresent?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>👤 Characters</p>
                  <div className="flex flex-wrap gap-1.5">
                    {scene.charactersPresent.map((c, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: "rgba(10,132,255,0.12)", color: "#0a84ff", border: "1px solid rgba(10,132,255,0.2)" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cut to next */}
              {!isLast && scene.cutToNext && (
                <div className="flex items-center gap-2 pt-1">
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