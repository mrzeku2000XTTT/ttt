import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Flame, BookOpen, Clock, Search, X, Play } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2a0fa1205_generated_image.png";

const PALETTES = {
  violet: { bg: "from-violet-50 to-fuchsia-50", ring: "ring-violet-200", text: "text-violet-700", bar: "bg-violet-500" },
  cyan: { bg: "from-cyan-50 to-blue-50", ring: "ring-cyan-200", text: "text-cyan-700", bar: "bg-cyan-500" },
  emerald: { bg: "from-emerald-50 to-teal-50", ring: "ring-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
  amber: { bg: "from-amber-50 to-orange-50", ring: "ring-amber-200", text: "text-amber-700", bar: "bg-amber-500" },
  rose: { bg: "from-rose-50 to-pink-50", ring: "ring-rose-200", text: "text-rose-700", bar: "bg-rose-500" },
};

function getPalette(theme) {
  const hash = (theme || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const keys = Object.keys(PALETTES);
  return PALETTES[keys[hash % keys.length]] || PALETTES.violet;
}

export default function IsolateDashboard({ user, courses, loading, onNewCourse, onOpenCourse, onOpenCourseModule, onBack }) {
  const [searchQuery, setSearchQuery] = useState("");
  const totalModules = courses.reduce((sum, c) => sum + (c.modules?.length || 0), 0);
  const completedModules = courses.reduce(
    (sum, c) => sum + (c.modules?.filter((m) => m.completed).length || 0),
    0
  );
  const maxStreak = courses.reduce((max, c) => Math.max(max, c.streak || 0), 0);

  // Search across all modules in all courses
  const searchResults = searchQuery.trim()
    ? courses.flatMap((c) =>
        (c.modules || [])
          .map((m, idx) => ({ course: c, module: m, idx }))
          .filter(({ module }) => {
            const q = searchQuery.toLowerCase();
            return (module.title || "").toLowerCase().includes(q) ||
                   (module.concept || "").toLowerCase().includes(q) ||
                   (module.theme_hook || "").toLowerCase().includes(q) ||
                   (c.title || "").toLowerCase().includes(q) ||
                   (c.topic || "").toLowerCase().includes(q);
          })
      )
    : [];

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-2xl border-b border-zinc-200/50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[14px] font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="ISOLATE" className="w-6 h-6 rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">ISOLATE</span>
          </div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-zinc-900">
            Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-2 text-lg text-zinc-500">Ready to learn something new?</p>
        </motion.div>

        {/* Search across all modules */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all modules across your courses…"
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white ring-1 ring-zinc-200 focus:ring-2 focus:ring-violet-400 outline-none text-[15px] text-zinc-900 placeholder:text-zinc-400 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-10 grid grid-cols-3 gap-4">
          {[
            { icon: BookOpen, label: "Courses", value: courses.length, color: "text-violet-600" },
            { icon: Clock, label: "Modules done", value: completedModules, color: "text-cyan-600" },
            { icon: Flame, label: "Streak", value: `${maxStreak}d`, color: "text-orange-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white ring-1 ring-zinc-200/60 p-5">
              <stat.icon className="w-5 h-5 mb-2" strokeWidth={1.5} />
              <div className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value}</div>
              <div className="text-[13px] text-zinc-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {!searchQuery && (
        <>
        {/* New course button */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onNewCourse}
          className="w-full mb-8 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white p-6 text-left hover:scale-[1.01] active:scale-100 transition-transform shadow-lg shadow-violet-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Plus className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Start a new course</div>
              <div className="text-[14px] text-white/80">Pick a topic and a theme you love</div>
            </div>
          </div>
        </motion.button>

        {/* In-progress courses */}
        {loading ? (
          <div className="text-center py-20 text-zinc-400">Loading...</div>
        ) : courses.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
            </div>
            <p className="text-lg text-zinc-400 font-medium">No courses yet.</p>
            <p className="text-[14px] text-zinc-400 mt-1">Create your first course to get started.</p>
          </motion.div>
        ) : (
          <>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-4">Your courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((course, i) => {
                const pal = getPalette(course.theme);
                const completed = course.modules?.filter((m) => m.completed).length || 0;
                const total = course.modules?.length || 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <motion.button
                    key={course.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => onOpenCourse(course)}
                    className={`text-left rounded-2xl bg-gradient-to-br ${pal.bg} ring-1 ${pal.ring} p-5 hover:scale-[1.02] active:scale-100 transition-transform`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className={`text-[11px] font-semibold uppercase tracking-wider ${pal.text}`}>{course.theme}</div>
                        <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mt-0.5">{course.title}</h3>
                      </div>
                      {course.modules?.[0]?.image_url && (
                        <img src={course.modules[0].image_url} alt="" className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/40" />
                      )}
                    </div>
                    <p className="text-[13px] text-zinc-500 mb-4 line-clamp-2">{course.topic}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/60 overflow-hidden">
                        <div className={`h-full ${pal.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600">{completed}/{total}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
        </>
        )}

        {/* Search results */}
        {searchQuery && (
          <div className="mb-10">
            {searchResults.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
                </div>
                <p className="text-lg text-zinc-400 font-medium">No modules found for "{searchQuery}"</p>
                <p className="text-[14px] text-zinc-400 mt-1">Try a different keyword or topic.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-4">
                  {searchResults.length} module{searchResults.length !== 1 ? "s" : ""} found
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {searchResults.map(({ course, module, idx }, i) => {
                    const pal = getPalette(course.theme);
                    return (
                      <button
                        key={i}
                        onClick={() => onOpenCourseModule(course, idx)}
                        className="text-left rounded-2xl bg-white ring-1 ring-zinc-200 p-4 hover:scale-[1.02] active:scale-100 transition-transform"
                      >
                        <div className="flex items-start gap-3">
                          {module.image_url ? (
                            <img src={module.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-1 ring-zinc-200/60" />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pal.bg} flex-shrink-0`} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`text-[11px] font-semibold uppercase tracking-wider ${pal.text}`}>{course.title}</div>
                            <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900 truncate">{module.title}</h3>
                            <p className="text-[12px] text-zinc-400 truncate">{module.concept}</p>
                          </div>
                          <Play className={`w-5 h-5 flex-shrink-0 ${pal.text}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}