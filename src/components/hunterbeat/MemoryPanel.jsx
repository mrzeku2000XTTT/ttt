import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Loader2, Github, BookOpen } from "lucide-react";
import { useHunterBeatMemory, fetchSkillContent } from "./useHunterBeatMemory";

export default function MemoryPanel({ user, open, onClose }) {
  const { skills, notes, addSkill, removeSkill, addNote, removeNote } = useHunterBeatMemory(user);
  const [skillUrl, setSkillUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState("");
  const [noteText, setNoteText] = useState("");

  const ingest = async (e) => {
    e.preventDefault();
    if (!skillUrl.trim() || ingesting) return;
    setError("");
    setIngesting(true);
    try {
      const { title, content } = await fetchSkillContent(skillUrl.trim());
      addSkill({
        id: Date.now(),
        title,
        source_url: skillUrl.trim(),
        content,
        added_at: Date.now(),
      });
      setSkillUrl("");
    } catch (err) {
      setError(err.message || "Couldn't ingest that skill.");
    } finally {
      setIngesting(false);
    }
  };

  const addCustomNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote(noteText.trim());
    setNoteText("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white ring-1 ring-zinc-200 shadow-2xl"
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-zinc-100 px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">Memory</div>
                <h2 className="text-lg font-[700] text-zinc-900">Skills & Notes</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Ingest GitHub skill */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Github className="w-4 h-4 text-zinc-700" />
                  <h3 className="text-sm font-semibold text-zinc-900">Ingest a GitHub skill</h3>
                </div>
                <p className="text-[12px] text-zinc-500 mb-3">
                  Paste any GitHub skill file URL (e.g. a SKILL.md). HunterBeat learns it and uses it when crafting your prompts.
                </p>
                <form onSubmit={ingest} className="flex gap-2">
                  <input
                    value={skillUrl}
                    onChange={(e) => setSkillUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo/blob/main/skills/…/SKILL.md"
                    disabled={ingesting}
                    className="flex-1 h-10 px-3 rounded-lg bg-zinc-50 ring-1 ring-zinc-200 text-[13px] text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!skillUrl.trim() || ingesting}
                    className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold disabled:opacity-30 hover:bg-zinc-800"
                  >
                    {ingesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Ingest
                  </button>
                </form>
                {error && <div className="text-[12px] text-red-500 mt-2">{error}</div>}

                <div className="mt-3 space-y-2">
                  {skills.length === 0 && (
                    <div className="text-[12px] text-zinc-400 italic">No skills learned yet.</div>
                  )}
                  {skills.map((s) => (
                    <div key={s.id} className="flex items-start gap-2 p-3 rounded-xl bg-zinc-50 ring-1 ring-zinc-100">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-zinc-800 truncate">{s.title}</div>
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-500 truncate block"
                        >
                          {s.source_url}
                        </a>
                      </div>
                      <button
                        onClick={() => removeSkill(s.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Custom notes */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-900 mb-2">Notes</h3>
                <form onSubmit={addCustomNote} className="flex gap-2 mb-3">
                  <input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a style preference or memory…"
                    className="flex-1 h-10 px-3 rounded-lg bg-zinc-50 ring-1 ring-zinc-200 text-[13px] text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <button
                    type="submit"
                    disabled={!noteText.trim()}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 text-white disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
                <div className="space-y-2">
                  {notes.length === 0 && <div className="text-[12px] text-zinc-400 italic">No notes yet.</div>}
                  {notes.map((n) => (
                    <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-50 ring-1 ring-zinc-100">
                      <div className="flex-1 text-[12px] text-zinc-700">{n.text}</div>
                      <button onClick={() => removeNote(n.id)} className="text-zinc-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}