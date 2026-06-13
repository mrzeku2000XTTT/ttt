import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, BookOpen, Image, Loader2, CheckCircle2, Download, Copy, Sparkles, Eye, EyeOff, AlertCircle, Play, Zap, Film } from "lucide-react";
import { base44 } from "@/api/base44Client";

function loadChapters() {
  try { return JSON.parse(localStorage.getItem("oo_chapters") || "[]"); } catch { return []; }
}
function loadDraft() {
  try { return JSON.parse(localStorage.getItem("oo_rough_draft") || "null"); } catch { return null; }
}
function saveChapters(chapters) {
  try { localStorage.setItem("oo_chapters", JSON.stringify(chapters)); } catch {}
}

function buildSceneImagePrompt(scene, chapter, draft) {
  const style = draft?.genre === "sci-fi" ? "cinematic sci-fi digital art" : draft?.genre === "fantasy" ? "cinematic fantasy illustration" : "cinematic dramatic photography";
  return `${style}, ${scene.cameraAngle || "wide shot"}, ${scene.lighting || "dramatic lighting"}, ${scene.emotionalBeat || ""}, ${scene.summary || scene.title}, ${draft?.tone || "dramatic"} mood, high detail, ultra-cinematic, 16:9 film frame, no text`;
}

export default function DoubleOWorkshop() {
  const [chapters, setChapters] = useState(loadChapters);
  const [draft, setDraft] = useState(loadDraft);
  const [readingMode, setReadingMode] = useState(false);
  const [renderingAll, setRenderingAll] = useState(false);
  const [renderProgress, setRenderProgress] = useState({ done: 0, total: 0 });
  const [copied, setCopied] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(null);

  const allScenes = chapters.flatMap((ch, ci) =>
    (ch.enhanced?.scenes || []).map((s, si) => ({ ...s, chapterLabel: ch.label, chapterIdx: ci, sceneIdx: si }))
  );

  const totalScenes = allScenes.length;
  const renderedScenes = allScenes.filter(s => chapters[s.chapterIdx]?.enhanced?.scenes?.[s.sceneIdx]?.imageUrl).length;

  const updateSceneImage = (chapterIdx, sceneIdx, imageUrl) => {
    setChapters(prev => {
      const updated = prev.map((ch, ci) => {
        if (ci !== chapterIdx) return ch;
        const scenes = (ch.enhanced?.scenes || []).map((s, si) =>
          si === sceneIdx ? { ...s, imageUrl } : s
        );
        return { ...ch, enhanced: { ...ch.enhanced, scenes } };
      });
      saveChapters(updated);
      return updated;
    });
  };

  // Render a single scene image
  const renderScene = async (scene, chapterIdx, sceneIdx) => {
    const prompt = buildSceneImagePrompt(scene, chapters[chapterIdx], draft);
    const result = await base44.integrations.Core.GenerateImage({ prompt });
    updateSceneImage(chapterIdx, sceneIdx, result.url);
    return result.url;
  };

  // Render ALL scenes in parallel batches of 3
  const renderAll = async () => {
    setRenderingAll(true);
    const tasks = [];
    chapters.forEach((ch, ci) => {
      (ch.enhanced?.scenes || []).forEach((s, si) => {
        if (!s.imageUrl) tasks.push({ scene: s, ci, si });
      });
    });

    setRenderProgress({ done: 0, total: tasks.length });
    let done = 0;
    const BATCH = 3;

    for (let b = 0; b < tasks.length; b += BATCH) {
      const batch = tasks.slice(b, b + BATCH);
      await Promise.all(batch.map(async ({ scene, ci, si }) => {
        try {
          await renderScene(scene, ci, si);
        } catch {}
        done++;
        setRenderProgress(p => ({ ...p, done }));
      }));
    }

    setRenderingAll(false);
  };

  const copyAll = () => {
    const lines = [];
    lines.push(draft?.title ? draft.title.toUpperCase() : "UNTITLED");
    if (draft?.logline) lines.push(`\n${draft.logline}\n`);
    chapters.forEach(ch => {
      if (!ch.enhanced) return;
      lines.push(`\n\n${"═".repeat(50)}`);
      lines.push(ch.label.toUpperCase());
      lines.push("═".repeat(50));
      if (ch.enhanced.openingParagraph) lines.push(`\n${ch.enhanced.openingParagraph}`);
      (ch.enhanced.scenes || []).forEach(s => {
        lines.push(`\n\n— ${s.title} —`);
        if (s.prose) lines.push(s.prose);
        if (s.expandedProse) lines.push(s.expandedProse);
        lines.push(`\n[${s.summary}]`);
      });
    });
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadTxt = () => {
    const lines = [];
    lines.push(draft?.title?.toUpperCase() || "UNTITLED");
    chapters.forEach(ch => {
      if (!ch.enhanced) return;
      lines.push(`\n\n${"═".repeat(60)}\n${ch.label.toUpperCase()}\n${"═".repeat(60)}`);
      if (ch.enhanced.openingParagraph) lines.push(`\n${ch.enhanced.openingParagraph}`);
      (ch.enhanced.scenes || []).forEach(s => {
        lines.push(`\n\n— ${s.title} —\n${s.prose || ""}`);
        if (s.expandedProse) lines.push(s.expandedProse);
        lines.push(`\n[${s.summary}]`);
      });
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${draft?.title || "story"}.txt`;
    a.click();
  };

  const filledChapters = chapters.filter(c => c.enhanced);

  return (
    <div className="min-h-screen text-white" style={{ background: "#000" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-5 py-4 flex items-center justify-between gap-3"
        style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <Link to="/DoubleO" className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
            <ChevronLeft className="w-3.5 h-3.5" /> Studio
          </Link>
          <div>
            <h1 className="text-[18px] font-[900] text-white">Workshop</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {draft?.title || "Untitled"} · {filledChapters.length}/{chapters.length} chapters · {totalScenes} scenes · {renderedScenes} visuals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setReadingMode(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: readingMode ? "rgba(255,214,10,0.15)" : "rgba(255,255,255,0.06)", color: readingMode ? "#ffd60a" : "rgba(255,255,255,0.5)", border: readingMode ? "1px solid rgba(255,214,10,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
            {readingMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {readingMode ? "Show Meta" : "Read Mode"}
          </button>
          <button onClick={copyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.06)", color: copied ? "#30d158" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={downloadTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Download className="w-3 h-3" /> .txt
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 pb-32">

        {/* Story overview glass widget */}
        {draft && !readingMode && (
          <div className="mb-8 p-5 rounded-3xl flex items-start gap-5"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Story Bible</p>
              <h2 className="text-[22px] font-[900] text-white leading-tight">{draft.title || "Untitled"}</h2>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>{draft.logline}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[draft.genre, draft.tone, `${draft.chapterCount || "?"} chapters`].filter(Boolean).map(tag => (
                  <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(10,132,255,0.12)", color: "#0a84ff", border: "1px solid rgba(10,132,255,0.2)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              {[
                { label: "Chapters", val: filledChapters.length, color: "#0a84ff" },
                { label: "Scenes", val: totalScenes, color: "#bf5af2" },
                { label: "Visuals", val: renderedScenes, color: "#30d158" },
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-[20px] font-[900]" style={{ color: stat.color }}>{stat.val}</div>
                  <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Render All Visuals CTA */}
        {!readingMode && totalScenes > 0 && (
          <div className="mb-8 p-5 rounded-3xl flex items-center justify-between gap-4"
            style={{ background: "linear-gradient(135deg, rgba(191,90,242,0.1), rgba(10,132,255,0.08))", border: "1px solid rgba(191,90,242,0.25)" }}>
            <div>
              <p className="text-[14px] font-[800] text-white">Render All Scene Visuals</p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {renderedScenes}/{totalScenes} rendered · AI generates a cinematic image for each scene using camera angle, lighting &amp; prose
              </p>
              {renderingAll && (
                <div className="mt-2 w-64 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #bf5af2, #0a84ff)" }}
                    animate={{ width: `${renderProgress.total ? (renderProgress.done / renderProgress.total) * 100 : 0}%` }}
                    transition={{ duration: 0.4 }} />
                </div>
              )}
            </div>
            <button onClick={renderAll} disabled={renderingAll}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold text-white disabled:opacity-60 flex-shrink-0 transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #bf5af2, #0a84ff)", boxShadow: renderingAll ? "none" : "0 0 24px rgba(191,90,242,0.4)" }}>
              {renderingAll
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {renderProgress.done}/{renderProgress.total}</>
                : <><Film className="w-4 h-4" /> Render All</>}
            </button>
          </div>
        )}

        {/* Empty state */}
        {filledChapters.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-[15px] font-[700] text-white mb-2">No chapters built yet</p>
            <p className="text-[13px] mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>Go to Chapters tab and build your scenes first.</p>
            <Link to="/DoubleO" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold text-white" style={{ background: "#0a84ff" }}>
              ← Back to Studio
            </Link>
          </div>
        )}

        {/* Chapters */}
        <div className="space-y-16">
          {chapters.filter(ch => ch.enhanced).map((ch, ci) => (
            <ChapterBlock key={ci} chapter={ch} chapterIdx={chapters.indexOf(ch)} draft={draft}
              readingMode={readingMode} onRenderScene={renderScene} onUpdateImage={updateSceneImage} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Block ────────────────────────────────────────────────────────────

function ChapterBlock({ chapter, chapterIdx, draft, readingMode, onRenderScene, onUpdateImage }) {
  const typeBadge = {
    prologue: { color: "#bf5af2", border: "rgba(191,90,242,0.3)" },
    chapter:  { color: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.12)" },
    epilogue: { color: "#0a84ff", border: "rgba(10,132,255,0.3)" },
  }[chapter.type] || { color: "#fff", border: "rgba(255,255,255,0.1)" };

  return (
    <div>
      {/* Chapter header */}
      <div className="mb-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ color: typeBadge.color, border: `1px solid ${typeBadge.border}`, background: `${typeBadge.color}15` }}>
            {chapter.type}
          </span>
          {!readingMode && chapter.enhanced.pageEstimate && (
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>~{chapter.enhanced.pageEstimate} pages</span>
          )}
        </div>
        <h2 className="text-[28px] font-[900] text-white uppercase tracking-tight">{chapter.label}</h2>
        {!readingMode && chapter.enhanced.chapterSummary && (
          <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>{chapter.enhanced.chapterSummary}</p>
        )}
        {!readingMode && (
          <div className="flex gap-3 mt-2 flex-wrap">
            {[["🎭", chapter.enhanced.mood], ["💡", chapter.enhanced.lighting], ["🎬", chapter.enhanced.cameraNote]].filter(([,v]) => v).map(([icon, val]) => (
              <span key={val} className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{icon} {val}</span>
            ))}
          </div>
        )}
      </div>

      {/* Opening prose */}
      {chapter.enhanced.openingParagraph && (
        <p className="text-[16px] leading-[1.9] text-white mb-10"
          style={{ fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.9)" }}>
          {chapter.enhanced.openingParagraph}
        </p>
      )}

      {/* Scenes */}
      <div className="space-y-12">
        {(chapter.enhanced.scenes || []).map((scene, si) => (
          <SceneBlock key={si} scene={scene} sceneIdx={si} chapterIdx={chapterIdx}
            draft={draft} readingMode={readingMode}
            onRender={() => onRenderScene(scene, chapterIdx, si)}
            onImageUpdate={(url) => onUpdateImage(chapterIdx, si, url)} />
        ))}
      </div>
    </div>
  );
}

// ─── Scene Block ──────────────────────────────────────────────────────────────

function SceneBlock({ scene, sceneIdx, chapterIdx, draft, readingMode, onRender, onImageUpdate }) {
  const [rendering, setRendering] = useState(false);

  const handleRender = async () => {
    setRendering(true);
    try { await onRender(); } catch {}
    setRendering(false);
  };

  return (
    <div className="relative">
      {/* Scene image */}
      {scene.imageUrl ? (
        <div className="mb-6 rounded-2xl overflow-hidden relative group" style={{ aspectRatio: "16/9" }}>
          <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Scene {scene.sceneNumber}</p>
              <p className="text-[14px] font-[800] text-white">{scene.title}</p>
            </div>
            {!readingMode && (
              <button onClick={handleRender} disabled={rendering}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                {rendering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                Re-render
              </button>
            )}
          </div>
        </div>
      ) : !readingMode ? (
        <div className="mb-6 rounded-2xl flex items-center justify-center"
          style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
          <div className="text-center">
            <Image className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-[12px] mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Scene {scene.sceneNumber} — {scene.title}</p>
            <button onClick={handleRender} disabled={rendering}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold text-white mx-auto"
              style={{ background: rendering ? "rgba(191,90,242,0.3)" : "#bf5af2" }}>
              {rendering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
              {rendering ? "Rendering…" : "Render Visual"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Scene title (reading mode) */}
      {(readingMode || !scene.imageUrl) && (
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4"
          style={{ color: "rgba(255,255,255,0.25)" }}>
          ◆ Scene {scene.sceneNumber} — {scene.title}
        </p>
      )}

      {/* Prose */}
      {scene.prose && (
        <p className="text-[16px] leading-[1.9] mb-4"
          style={{ fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.85)" }}>
          {scene.prose}
        </p>
      )}

      {/* Summary (non-reading mode) */}
      {!readingMode && scene.summary && (
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
          {scene.summary}
        </p>
      )}

      {/* Cinematic meta row */}
      {!readingMode && (
        <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          {scene.cameraAngle && <span>🎬 {scene.cameraAngle}</span>}
          {scene.lighting && <span>💡 {scene.lighting}</span>}
          {scene.emotionalBeat && <span>💫 {scene.emotionalBeat}</span>}
          {scene.cutToNext && !readingMode && (
            <span className="font-bold uppercase tracking-widest" style={{ color: "rgba(255,69,58,0.6)" }}>✂ {scene.cutToNext}</span>
          )}
        </div>
      )}

      {/* Cut divider */}
      {scene.cutToNext && (
        <div className="mt-8 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
          {!readingMode && <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "rgba(255,255,255,0.15)" }}>{scene.cutToNext}</span>}
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
      )}
    </div>
  );
}