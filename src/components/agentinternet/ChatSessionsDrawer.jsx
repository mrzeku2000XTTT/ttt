import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MessageSquare, X } from "lucide-react";

export default function ChatSessionsDrawer({
  open, onClose, chats, activeId, onSelect, onNew, onDelete,
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 z-10"
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute top-0 bottom-0 left-0 w-72 bg-zinc-950 border-r border-white/10 z-20 flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="text-white/80 text-xs font-mono uppercase tracking-widest">Chats</span>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onNew}
              className="m-3 flex items-center gap-2 px-3 h-10 rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 text-sm font-medium hover:bg-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> New chat
            </button>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-3 space-y-1">
              {chats.length === 0 && (
                <div className="text-white/30 text-xs font-mono px-2 py-4 text-center">no chats yet</div>
              )}
              {[...chats].reverse().map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={`group flex items-center gap-2 px-2.5 py-2.5 rounded-lg cursor-pointer ${
                    c.id === activeId ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white/40 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-white/85 truncate">{c.title || "New chat"}</div>
                    <div className="text-[9px] text-white/30 font-mono">
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}