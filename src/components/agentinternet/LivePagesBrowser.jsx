import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ArrowRight, ArrowUpRight } from "lucide-react";
import { visibleLivePages } from "./livePages";
import OrganicOrb from "./OrganicOrb";

/**
 * LivePagesBrowser — a searchable directory of every live, guest-browseable
 * page. Opened from the Agent Internet landing so guests can find and click
 * through to any active project/lab without admin access.
 */
export default function LivePagesBrowser({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then((u) => setIsAdmin(u?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  const pages = useMemo(() => visibleLivePages(isAdmin), [isAdmin]);

  const cats = useMemo(
    () => ["All", ...Array.from(new Set(pages.map((a) => a.cat))).sort()],
    [pages]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pages.filter((a) => {
      if (cat !== "All" && a.cat !== cat) return false;
      if (!needle) return true;
      return (a.name + " " + a.desc + " " + a.cat).toLowerCase().includes(needle);
    });
  }, [q, cat, pages]);

  const goTo = (app) => {
    if (app.externalUrl) window.open(app.externalUrl, "_blank");
    else if (app.path) navigate(`/${app.path}`);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-xl flex items-center justify-center px-4 py-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 h-9 rounded-full border border-white/15 bg-black/50 text-white/60 hover:text-white hover:border-white/40 text-xs font-mono uppercase tracking-widest transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden"
          >
            {/* header */}
            <div className="p-5 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <OrganicOrb size={20} colors={["#67e8f9", "#22d3ee", "#6366f1"]} />
                <span className="text-sm font-bold text-white">All Live Pages</span>
                <span className="ml-auto text-[10px] font-mono text-white/40">{pages.length} indexed</span>
              </div>
              <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-white/10 bg-black/40">
                <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  autoFocus
                  placeholder="Search pages — try “idea”, “wallet”, “video”…"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-white placeholder:text-white/30"
                />
              </div>
              <div className="mt-3 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {cats.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wide transition-colors ${cat === c ? "bg-white/15 text-white" : "text-white/45 hover:text-white/70"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-sm">
                  No pages match “{q}”.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filtered.map((app) => (
                    <button
                      key={app.name}
                      onClick={() => goTo(app)}
                      className="group flex flex-col items-start gap-2 p-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-cyan-400/40 hover:bg-cyan-500/5 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between w-full">
                        <img src={app.logo} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        {app.externalUrl ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-white/30" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-cyan-300" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-white truncate w-full">{app.name}</div>
                      <div className="text-[11px] text-white/50 line-clamp-2 w-full">{app.desc}</div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-300/50">{app.cat}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}