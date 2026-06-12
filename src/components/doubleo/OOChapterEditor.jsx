import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, Loader2, BookOpen, Film, Wand2, ChevronRight, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DEFAULT_STRUCTURE = ["Prologue", "Chapter", "Epilogue"];

function buildChapterList(count) {
  const list = [];
  list.push({ num: 0, label: "Prologue", type: "prologue", content: "", enhanced: null, expanded: false });
  for (let i = 1; i <= count; i++) {
    list.push({ num: i, label: `Chapter ${i}`, type: "chapter", content: "", enhanced: null, expanded: false });
  }
  list.push({ num: count + 1, label: "Epilogue", type: "epilogue", content: "", enhanced: null, expanded: false });
  return list;
}

export default function OOChapterEditor({ roughDraft }) {
  const count = roughDraft?.chapterCount || 12;
  const [chapters, setChapters] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("oo_chapters") || "null");
      if (saved && saved.length > 0) return saved;
    } catch {}
    return buildChapterList(count);
  });
  const [activeChapter, setActiveChapter] = useState(0);
  const [enhancing, setEnhancing] = useState(null);
  const [agentThinking, setAgentThinking] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("oo_chapters", JSON.stringify(chapters)); } catch {}
  }, [chapters]);

  const updateContent = (idx, content) => {
    setChapters(prev => prev.map((c, i) => i === idx ? { ...c, content } : c));
  };

  const enhanceChapter = async (idx) => {
    const ch = chapters[idx];
    if (!ch.content.trim() && !roughDraft) return;
    setEnhancing(idx);
    setAgentThinking(idx);

    try {
      const draftCtx = roughDraft ? `Story: "${roughDraft.title}" | Genre: ${roughDraft.genre || "unknown"} | Tone: ${roughDraft.tone || "dramatic"} | Logline: ${roughDraft.logline || ""}` : "";
      const prevChapters = chapters.slice(0, idx).filter(c => c.content).map(c => `${c.label}: ${c.content.slice(0, 100)}`).join(" | ");

      const prompt = `You are 00's Co-Engineer. Enhance this chapter for a book that is ALSO being prepared for a movie adaptation.

${draftCtx}
${prevChapters ? `Previous chapters: ${prevChapters}` : ""}
Chapter: ${ch.label}
User's raw idea: "${ch.content || "(blank - generate based on story)"}"

Output a JSON object with:
- enhancedText: a full 2-paragraph enhanced version of this chapter's opening (200-300 words, literary quality, present tense, cinematic)
- mood: emotional mood (e.g. "tense", "bittersweet", "triumphant")
- lighting: cinematic lighting direction (e.g. "golden hour, harsh shadows")
- cameraNote: cinematography note (e.g. "slow dolly-in, wide establishing shot")
- suggestions: array of 3 short suggestions for what could happen in this chapter
- pageEstimate: estimated pages for this chapter (number)

Return ONLY valid JSON.`;

      const raw = await base44.integrations.Core.InvokeLLM({ prompt });
      let enhanced;
      try {
        const str = typeof raw === "string" ? raw : (raw?.response || "{}");
        const jsonMatch = str.match(/\{[\s\S]*\}/);
        enhanced = JSON.parse(jsonMatch ? jsonMatch[0] : str);
      } catch {
        enhanced = { enhancedText: "Enhancement processing...", mood: "unknown", lighting: "natural", cameraNote: "wide shot", suggestions: [], pageEstimate: 10 };
      }

      setChapters(prev => prev.map((c, i) => i === idx ? { ...c, enhanced } : c));
    } catch {}
    setEnhancing(null);
    setAgentThinking(null);
  };

  const totalPages = chapters.reduce((sum, c) => sum + (c.enhanced?.pageEstimate || 0), 0);
  const completedChapters = chapters.filter(c => c.content || c.enhanced).length;

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="py-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-[800] text-zinc-900">Chapter Editor</h2>
          <p className="text-[12px] text-zinc-400">
            {roughDraft?.title || "Your Story"} · {chapters.length} sections · ~{totalPages || "?"} pages estimated
          </p>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-[900] text-zinc-900">{completedChapters}/{chapters.length}</div>
          <div className="text-[10px] text-zinc-400 uppercase tracking-widest">Sections done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-100 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-zinc-900 rounded-full"
          animate={{ width: `${(completedChapters / chapters.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Chapter list */}
      <div className="space-y-3">
        {chapters.map((ch, idx) => (
          <ChapterCard
            key={idx}
            chapter={ch}
            idx={idx}
            isActive={activeChapter === idx}
            isEnhancing={enhancing === idx}
            isAgentThinking={agentThinking === idx}
            onActivate={() => setActiveChapter(activeChapter === idx ? -1 : idx)}
            onContentChange={(val) => updateContent(idx, val)}
            onEnhance={() => enhanceChapter(idx)}
          />
        ))}
      </div>

      <div className="mt-8 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
        <BookOpen className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
        <p className="text-[12px] text-zinc-500">Complete all chapters to unlock export options</p>
      </div>
    </div>
  );
}

function ChapterCard({ chapter, idx, isActive, isEnhancing, isAgentThinking, onActivate, onContentChange, onEnhance }) {
  const typeColors = {
    prologue: "bg-violet-50 border-violet-100 text-violet-600",
    chapter: "bg-zinc-50 border-zinc-100 text-zinc-600",
    epilogue: "bg-cyan-50 border-cyan-100 text-cyan-600"
  };

  return (
    <motion.div
      layout
      className={`rounded-2xl border overflow-hidden transition-shadow ${isActive ? "shadow-md" : "shadow-none"} ${
        chapter.type === "prologue" ? "border-violet-100" : chapter.type === "epilogue" ? "border-cyan-100" : "border-zinc-100"
      }`}
    >
      {/* Header */}
      <button
        onClick={onActivate}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-zinc-50 transition-colors text-left"
      >
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${typeColors[chapter.type]}`}>
          {chapter.type}
        </div>
        <span className="flex-1 text-[14px] font-[700] text-zinc-900">{chapter.label}</span>
        {chapter.enhanced && (
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Enhanced
          </span>
        )}
        {chapter.enhanced?.pageEstimate && (
          <span className="text-[10px] text-zinc-400">~{chapter.enhanced.pageEstimate}p</span>
        )}
        {isActive ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
      </button>

      {/* Body */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5 bg-white border-t border-zinc-50 space-y-4">
              {/* Input */}
              <div className="pt-4">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Your Idea for this {chapter.type}</label>
                <textarea
                  value={chapter.content}
                  onChange={e => onContentChange(e.target.value)}
                  placeholder={`Describe what happens in ${chapter.label}… Even rough notes work.`}
                  rows={4}
                  className="w-full text-[13px] text-zinc-800 placeholder-zinc-300 bg-zinc-50 border border-zinc-100 rounded-xl p-3 outline-none focus:border-zinc-300 resize-none leading-relaxed transition-colors"
                />
              </div>

              {/* Enhance button */}
              <button
                onClick={onEnhance}
                disabled={isEnhancing}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-[12px] font-semibold rounded-full hover:bg-zinc-800 disabled:opacity-50 transition-all"
              >
                {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {isEnhancing ? "Co-Engineer is writing..." : "Enhance with 00"}
              </button>

              {/* Agent thinking */}
              {isAgentThinking && (
                <div className="flex gap-2 items-start p-3 bg-zinc-50 rounded-xl">
                  <Film className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                  <div className="text-[12px] text-zinc-500 italic">
                    Co-Engineer is analyzing tone, setting mood, planning cinematography...
                  </div>
                </div>
              )}

              {/* Enhanced output */}
              {chapter.enhanced && !isEnhancing && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Enhanced Prose</p>
                    <p className="text-[13px] text-zinc-700 leading-relaxed">{chapter.enhanced.enhancedText}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Mood", val: chapter.enhanced.mood, icon: "🎭" },
                      { label: "Lighting", val: chapter.enhanced.lighting, icon: "💡" },
                      { label: "Camera", val: chapter.enhanced.cameraNote, icon: "🎬" },
                    ].map(item => (
                      <div key={item.label} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">{item.icon} {item.label}</div>
                        <div className="text-[11px] font-semibold text-zinc-700">{item.val}</div>
                      </div>
                    ))}
                  </div>

                  {chapter.enhanced.suggestions?.length > 0 && (
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Plot Suggestions</p>
                      <ul className="space-y-1.5">
                        {chapter.enhanced.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-600">
                            <span className="text-zinc-300 mt-0.5 flex-shrink-0">→</span> {s}
                          </li>
                        ))}
                      </ul>
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