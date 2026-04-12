import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Anchor, X, ChevronDown, ChevronUp, Trash2, Eye } from "lucide-react";
import moment from "moment";

function AnchorRow({ anchor, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const pressureColors = {
    creative_flow: "text-purple-400",
    urgent_solving: "text-red-400",
    analytical_thinking: "text-blue-400",
    routine_execution: "text-gray-400",
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <Anchor className="w-3 h-3 text-cyan-400/60 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-[11px] font-medium truncate">{anchor.vector}</p>
          <p className="text-white/25 text-[9px]">{moment(anchor.anchor_timestamp).fromNow()}</p>
        </div>
        <span className={`text-[9px] ${pressureColors[anchor.pressure] || 'text-white/30'}`}>
          {anchor.pressure?.replace('_', ' ')}
        </span>
        {expanded ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04] pt-2">
              <div>
                <span className="text-white/30 text-[9px] uppercase tracking-wider">Weight</span>
                <p className="text-white/50 text-[10px] leading-relaxed mt-0.5">{anchor.weight}</p>
              </div>
              <div>
                <span className="text-white/30 text-[9px] uppercase tracking-wider">Open Loop</span>
                <p className="text-white/50 text-[10px] leading-relaxed mt-0.5">{anchor.open_loop}</p>
              </div>
              {anchor.context_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {anchor.context_tags.map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-white/[0.04] rounded text-white/30 text-[9px]">#{tag}</span>
                  ))}
                </div>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(anchor.id); }}
                  className="text-red-400/40 hover:text-red-400 text-[10px] flex items-center gap-1 mt-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnchorMemory({ anchors, onDelete, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[998] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-cyan-500/20 rounded-2xl p-5 w-full max-w-lg max-h-[70vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-bold text-sm">Continuity Anchors</h3>
            <span className="text-xs bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full">{anchors.length}</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-white/30 text-[10px] mb-3 leading-relaxed">
          Anchors persist your conversation memory across sessions. After each exchange, 
          Prompto auto-compresses context into an anchor so the AI never forgets.
        </p>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {anchors.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-8">No anchors yet. Start chatting and they'll be created automatically.</p>
          ) : (
            anchors.map((a) => (
              <AnchorRow key={a.id} anchor={a} onDelete={onDelete} />
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}