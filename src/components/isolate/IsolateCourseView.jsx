import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, CheckCircle2, Play, BookOpen } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2a0fa1205_generated_image.png";

const PALETTES = {
  violet: { grad: "from-violet-500 to-fuchsia-500", text: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-200", path: "bg-violet-300" },
  cyan: { grad: "from-cyan-500 to-blue-500", text: "text-cyan-600", bg: "bg-cyan-50", ring: "ring-cyan-200", path: "bg-cyan-300" },
  emerald: { grad: "from-emerald-500 to-teal-500", text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", path: "bg-emerald-300" },
  amber: { grad: "from-amber-500 to-orange-500", text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", path: "bg-amber-300" },
  rose: { grad: "from-rose-500 to-pink-500", text: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-200", path: "bg-rose-300" },
};

function getPalette(theme) {
  const hash = (theme || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const keys = Object.keys(PALETTES);
  return PALETTES[keys[hash % keys.length]] || PALETTES.violet;
}

export default function IsolateCourseView({ course, user, onOpenModule, onUpdate, onBack }) {
  const pal = getPalette(course.theme);
  const modules = course.modules || [];
  const completedCount = modules.filter((m) => m.completed).length;
  const totalCount = modules.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // First uncompleted module is unlocked; everything before it is completed/unlocked; everything after first uncompleted is locked
  const firstIncomplete = modules.findIndex((m) => !m.completed);
  const unlockedUpTo = firstIncomplete === -1 ? totalCount : firstIncomplete + 1;

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-2xl border-b border-zinc-200/50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[14px] font-medium">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="ISOLATE" className="w-6 h-6 rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">Course</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Course header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${pal.bg} ${pal.text} text-[12px] font-semibold mb-3`}>
            <BookOpen className="w-3.5 h-3.5" />
            {course.theme}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-zinc-900">{course.title}</h1>
          <p className="mt-3 text-lg text-zinc-500">{course.topic}</p>

          {/* Progress bar */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${pal.grad} rounded-full`}
              />
            </div>
            <span className="text-[14px] font-semibold text-zinc-600">{completedCount}/{totalCount}</span>
          </div>
        </motion.div>

        {/* Module path — level select style */}
        <div className="relative">
          {/* Vertical connecting path */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-zinc-200" />
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(completedCount / Math.max(totalCount, 1)) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`absolute left-7 top-0 w-0.5 ${pal.path}`}
          />

          <div className="space-y-4">
            {modules.map((mod, i) => {
              const isCompleted = mod.completed;
              const isUnlocked = i < unlockedUpTo;
              const isCurrent = i === firstIncomplete;
              const isLocked = !isUnlocked;

              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  disabled={isLocked}
                  onClick={() => !isLocked && onOpenModule(i)}
                  className={`relative w-full text-left flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isLocked
                      ? "bg-zinc-50 cursor-not-allowed"
                      : isCompleted
                      ? `bg-white ring-1 ${pal.ring} hover:scale-[1.01]`
                      : `bg-white ring-2 ${pal.ring} hover:scale-[1.01] shadow-lg`
                  }`}
                >
                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        isCompleted
                          ? `bg-gradient-to-br ${pal.grad} text-white`
                          : isLocked
                          ? "bg-zinc-200 text-zinc-400"
                          : `bg-white ring-2 ${pal.ring} ${pal.text}`
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
                      ) : isLocked ? (
                        <Lock className="w-5 h-5" strokeWidth={1.5} />
                      ) : (
                        <span className="text-lg font-bold">{i + 1}</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLocked ? "text-zinc-300" : pal.text}`}>
                        Module {i + 1}
                      </span>
                      {isCurrent && (
                        <span className={`px-2 py-0.5 rounded-full ${pal.bg} ${pal.text} text-[10px] font-bold uppercase`}>
                          Current
                        </span>
                      )}
                    </div>
                    <h3 className={`text-[16px] font-semibold tracking-tight ${isLocked ? "text-zinc-400" : "text-zinc-900"}`}>
                      {mod.title}
                    </h3>
                    <p className={`text-[13px] mt-0.5 line-clamp-1 ${isLocked ? "text-zinc-300" : "text-zinc-500"}`}>
                      {mod.theme_hook || mod.concept}
                    </p>
                  </div>

                  {/* Thumbnail or arrow */}
                  {mod.image_url && !isLocked && (
                    <img src={mod.image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-zinc-200/60" />
                  )}
                  {!isLocked && (
                    <Play className={`w-5 h-5 flex-shrink-0 ${pal.text}`} strokeWidth={2} />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}