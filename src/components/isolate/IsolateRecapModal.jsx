import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, X, ArrowRight, Sparkles, Loader2, Trash2 } from "lucide-react";

const LEVELS = ["beginner", "intermediate", "advanced"];

export default function IsolateRecapModal({ course, onClose, onContinue, onLevelUp }) {
  const [moduleCount, setModuleCount] = useState(5);
  const [newTheme, setNewTheme] = useState("");
  const [additionalThemes, setAdditionalThemes] = useState(course.additional_themes || []);
  const [generating, setGenerating] = useState(false);
  const [action, setAction] = useState(null); // "continue" | "levelUp"

  const currentLevelIdx = LEVELS.indexOf(course.skill_level || "beginner");
  const canLevelUp = currentLevelIdx < LEVELS.length - 1;
  const nextLevel = canLevelUp ? LEVELS[currentLevelIdx + 1] : null;

  const addTheme = () => {
    const t = newTheme.trim();
    if (t && !additionalThemes.includes(t) && t !== course.theme) {
      setAdditionalThemes([...additionalThemes, t]);
      setNewTheme("");
    }
  };

  const removeTheme = (t) => {
    setAdditionalThemes(additionalThemes.filter((x) => x !== t));
  };

  const handleContinue = async () => {
    setGenerating(true);
    setAction("continue");
    try {
      await onContinue(moduleCount, additionalThemes);
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
    onClose();
  };

  const handleLevelUp = async () => {
    if (!nextLevel) return;
    setGenerating(true);
    setAction("levelUp");
    try {
      await onLevelUp(nextLevel, moduleCount, additionalThemes);
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
    onClose();
  };

  const completedCount = (course.modules || []).filter((m) => m.completed).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl my-auto"
        >
          {generating ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-5" />
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-2">
                {action === "levelUp" ? `Leveling up to ${nextLevel}...` : "Adding more modules..."}
              </h2>
              <p className="text-[14px] text-zinc-500">Crafting new modules in your theme. This takes ~30 seconds.</p>
            </div>
          ) : (
            <>
              {/* Congrats header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Congrats! 🎉</h2>
                <p className="text-[15px] text-zinc-600 leading-relaxed">
                  You just learned <span className="font-semibold text-zinc-900">{course.topic}</span> through{" "}
                  <span className="font-semibold text-zinc-900">{course.theme}</span>.
                </p>
                <p className="text-[13px] text-zinc-400 mt-1">
                  You completed all {completedCount} modules at the {course.skill_level} level.
                </p>
              </div>

              {/* Module count selector */}
              <div className="mb-5">
                <label className="text-[13px] font-semibold text-zinc-700 mb-2 block">How many more modules?</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setModuleCount(Math.max(1, moduleCount - 1))}
                    className="w-11 h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xl font-bold text-zinc-700 flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={moduleCount}
                    onChange={(e) => setModuleCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="flex-1 text-center text-2xl font-bold text-zinc-900 bg-zinc-50 rounded-xl py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setModuleCount(Math.min(50, moduleCount + 1))}
                    className="w-11 h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xl font-bold text-zinc-700 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Theme management */}
              <div className="mb-6">
                <label className="text-[13px] font-semibold text-zinc-700 mb-2 block">
                  Themes for your training
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-[12px] font-medium">
                    {course.theme} <span className="text-violet-400 text-[10px]">(main)</span>
                  </span>
                  {additionalThemes.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-[12px] font-medium"
                    >
                      {t}
                      <button
                        onClick={() => removeTheme(t)}
                        className="w-4 h-4 rounded-full hover:bg-rose-100 hover:text-rose-500 flex items-center justify-center transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTheme())}
                    placeholder="Add a theme (e.g. Star Wars, cooking...)"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-50 ring-1 ring-zinc-200 focus:ring-2 focus:ring-violet-400 outline-none text-[14px] text-zinc-900 placeholder:text-zinc-400"
                  />
                  <button
                    onClick={addTheme}
                    disabled={!newTheme.trim()}
                    className="px-3 rounded-xl bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-800 disabled:opacity-30 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5">
                {canLevelUp && (
                  <button
                    onClick={handleLevelUp}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[15px] font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Go to {nextLevel} level →
                  </button>
                )}
                <button
                  onClick={handleContinue}
                  className="w-full py-3.5 rounded-xl bg-zinc-900 text-white text-[15px] font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  Continue at {course.skill_level} level
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-zinc-100 text-zinc-600 text-[14px] font-medium hover:bg-zinc-200 transition-colors"
                >
                  Back to course
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}