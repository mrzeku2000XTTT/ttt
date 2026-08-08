import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Save, Trash2, X, Clock, FileCode2 } from "lucide-react";

const STORAGE_KEY = "ttt_builder_projects";
const MAX_PROJECTS = 50;

export function loadProjects() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveProjects(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_PROJECTS)));
  } catch {}
}

export function upsertProject(project) {
  const list = loadProjects();
  const idx = list.findIndex((p) => p.id === project.id);
  if (idx >= 0) list[idx] = project;
  else list.unshift(project);
  const trimmed = list.slice(0, MAX_PROJECTS);
  saveProjects(trimmed);
  return trimmed;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ProjectsPanel({ open, onClose, current, onLoad, onSave }) {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setProjects(loadProjects());
      setName(current?.name || "");
    }
  }, [open, current]);

  const handleSave = () => {
    if (!current?.files?.length) return;
    const proj = {
      id: current.id || `proj_${Date.now()}`,
      name: (name.trim() || current?.name || "Untitled").slice(0, 60),
      files: current.files,
      messages: current.messages,
      phase: current.phase,
      buildMode: current.buildMode,
      model: current.model,
      walletKit: current.walletKit,
      savedAt: new Date().toISOString(),
    };
    const list = upsertProject(proj);
    setProjects(list);
    onSave?.(proj);
  };

  const handleDelete = (id) => {
    const list = loadProjects().filter((p) => p.id !== id);
    saveProjects(list);
    setProjects(list);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white border border-black/[0.08] rounded-2xl p-5 w-full max-w-lg max-h-[80vh] flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#007AFF]" />
                <h2 className="font-bold text-[#1D1D1F] text-base">Projects</h2>
                <span className="text-[10px] text-[#86868B] font-bold bg-[#F0F0F2] px-1.5 py-0.5 rounded">
                  {projects.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Save current */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-black/[0.06]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name…"
                className="flex-1 bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF]/50 focus:bg-white transition-colors"
              />
              <button
                onClick={handleSave}
                disabled={!current?.files?.length}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#007AFF] text-white text-xs font-bold hover:bg-[#0051D5] disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" /> Save current
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2 min-h-0">
              {projects.length === 0 ? (
                <div className="text-center py-10 text-[#86868B] text-sm">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No saved projects yet.
                  <br />
                  Build something and hit "Save current".
                </div>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-black/[0.06] hover:border-[#007AFF]/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#007AFF]/10 border border-[#007AFF]/20 flex items-center justify-center flex-shrink-0">
                      <FileCode2 className="w-4 h-4 text-[#007AFF]" />
                    </div>
                    <button
                      onClick={() => onLoad(p)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="text-sm font-semibold text-[#1D1D1F] truncate">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#86868B] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(p.savedAt)}
                        </span>
                        <span>·</span>
                        <span>{p.files?.length || 0} files</span>
                        <span>·</span>
                        <span className="uppercase">{p.buildMode || "html"}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}