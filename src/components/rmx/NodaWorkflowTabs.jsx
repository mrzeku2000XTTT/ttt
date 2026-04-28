import React from "react";
import { Plus, X, Zap, Loader2 } from "lucide-react";

/**
 * NodaWorkflowTabs — Chrome-style tab bar for managing multiple workflows in one session.
 * Each tab holds its own { name, nodes, selectedNodeId } state in the parent.
 */
export default function NodaWorkflowTabs({ tabs, activeTabId, onSelect, onNew, onClose, onRename }) {
  return (
    <div className="relative z-10 flex items-center gap-1 px-3 pt-2 pb-0 bg-black/50 backdrop-blur-xl border-b border-white/5 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`group flex-shrink-0 flex items-center gap-2 pl-3 pr-1.5 h-8 rounded-t-lg cursor-pointer transition-all border border-b-0 ${
              active
                ? "bg-zinc-950 border-white/10 text-white"
                : "bg-white/[0.03] border-transparent text-white/50 hover:bg-white/[0.06] hover:text-white/80"
            }`}
            style={{ maxWidth: 200 }}
          >
            {tab.isRunning ? (
              <Loader2 className="w-3 h-3 flex-shrink-0 text-emerald-400 animate-spin" />
            ) : (
              <Zap className={`w-3 h-3 flex-shrink-0 ${active ? "text-cyan-400" : "text-white/40"}`} />
            )}
            <input
              value={tab.name}
              onChange={(e) => onRename(tab.id, e.target.value)}
              onClick={(e) => active && e.stopPropagation()}
              className="bg-transparent outline-none text-xs font-bold min-w-0 flex-1 truncate"
              style={{ width: `${Math.min(Math.max(tab.name.length, 8), 18)}ch` }}
            />
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
                className="w-4 h-4 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onNew}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-t-lg text-white/50 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors"
        title="New workflow"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}