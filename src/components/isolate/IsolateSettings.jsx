import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Gamepad2, Clock, Flag, X, Zap, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function IsolateSettings({ course, onUpdate }) {
  const [open, setOpen] = useState(false);
  const settings = course.settings || {};

  const update = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    const updatedCourse = { ...course, settings: newSettings };
    onUpdate(updatedCourse);
    base44.entities.IsolateCourse.update(course.id, { settings: newSettings }).catch(() => {});
  };

  return (
    <>
      {/* Floating settings button — bigger as requested */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-20 right-5 z-40 w-14 h-14 rounded-2xl bg-white ring-1 ring-zinc-200 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        title="Settings"
      >
        <Settings className="w-7 h-7 text-zinc-600" />
        {settings.game_mode && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Gamepad2 className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/30 z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-zinc-100 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-zinc-600" />
                  <h2 className="text-xl font-bold tracking-tight">Settings</h2>
                </div>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Game Mode */}
                <div className={`rounded-2xl p-5 transition-all ${settings.game_mode ? "bg-gradient-to-br from-violet-50 to-fuchsia-50 ring-1 ring-violet-300" : "bg-zinc-50 ring-1 ring-zinc-200"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${settings.game_mode ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" : "bg-zinc-200"}`}>
                      <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-zinc-900 text-[16px]">Game Mode</h3>
                      <p className="text-[13px] text-zinc-500">Turn learning into a game</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-zinc-600 mb-4 leading-relaxed">
                    Transforms your course into an RPG-style game with XP, levels, achievements, and game-styled challenges. The level map becomes a game world.
                  </p>
                  <button
                    onClick={() => update("game_mode", !settings.game_mode)}
                    className={`w-full py-3 rounded-xl font-semibold text-[14px] transition-all ${
                      settings.game_mode
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
                        : "bg-white ring-1 ring-zinc-300 text-zinc-700 hover:ring-zinc-400"
                    }`}
                  >
                    {settings.game_mode ? "🎮 Game Mode Active" : "Enable Game Mode"}
                  </button>
                </div>

                {/* Time Management */}
                <div className="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-zinc-600" />
                    <h3 className="font-bold text-zinc-900 text-[16px]">Time Management</h3>
                  </div>

                  {/* Daily study time */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[14px] font-medium text-zinc-700">Daily study goal</label>
                      <span className="text-[14px] font-bold text-zinc-900">{settings.daily_time_minutes || 30} min</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={settings.daily_time_minutes || 30}
                      onChange={(e) => update("daily_time_minutes", parseInt(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                    <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                      <span>5 min</span>
                      <span>2 hrs</span>
                    </div>
                  </div>

                  {/* Session timer */}
                  <div>
                    <label className="text-[14px] font-medium text-zinc-700 mb-2 block">Session timer</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { v: 0, label: "Off" },
                        { v: 5, label: "5 min" },
                        { v: 10, label: "10 min" },
                        { v: 15, label: "15 min" },
                        { v: 25, label: "25 min 🍅" },
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          onClick={() => update("session_timer_minutes", opt.v)}
                          className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                            (settings.session_timer_minutes || 0) === opt.v
                              ? "bg-zinc-900 text-white"
                              : "bg-white ring-1 ring-zinc-200 text-zinc-600 hover:bg-zinc-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[12px] text-zinc-400 mt-2">A countdown timer per module session. When time's up, you'll get a nudge to take a break.</p>
                  </div>
                </div>

                {/* Checkpoints */}
                <div className="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Flag className="w-5 h-5 text-zinc-600" />
                    <h3 className="font-bold text-zinc-900 text-[16px]">Checkpoints</h3>
                  </div>
                  <label className="text-[14px] font-medium text-zinc-700 mb-2 block">Ask to continue or explore every…</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: 2, label: "2 modules" },
                      { v: 3, label: "3 modules" },
                      { v: 5, label: "5 modules" },
                      { v: 0, label: "Never" },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => update("checkpoint_frequency", opt.v)}
                        className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                          (settings.checkpoint_frequency ?? 3) === opt.v
                            ? "bg-zinc-900 text-white"
                            : "bg-white ring-1 ring-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[12px] text-zinc-400 mt-2">At each checkpoint you can keep going with this topic or jump back to start something new.</p>
                </div>

                {/* Game stats preview */}
                {settings.game_mode && (
                  <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-5 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-[16px]">Your stats</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-2xl font-bold text-amber-400">{course.level || 1}</div>
                        <div className="text-[11px] text-zinc-400">Level</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-violet-400">{course.xp || 0}</div>
                        <div className="text-[11px] text-zinc-400">XP</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-cyan-400">{course.streak || 0}</div>
                        <div className="text-[11px] text-zinc-400">Day streak</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}