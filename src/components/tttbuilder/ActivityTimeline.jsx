import React, { useState } from "react";
import { Brain, FilePlus2, FilePen, BookOpen, ChevronDown, ChevronRight } from "lucide-react";

const KIND = {
  thought: { icon: Brain, label: (it) => `Thought for ${it.seconds || 1}s`, color: "text-[#86868B]" },
  read: { icon: BookOpen, label: (it) => `Read ${it.path}`, color: "text-[#86868B]" },
  wrote: { icon: FilePlus2, label: (it) => `Wrote ${it.path}`, color: "text-[#007AFF]" },
  edited: { icon: FilePen, label: (it) => `Edited ${it.path}`, color: "text-[#FF9500]" },
};

function Thought({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 text-[11px] text-[#86868B] hover:text-[#1D1D1F] transition-colors">
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Brain className="w-3 h-3" />
        Thought for {item.seconds || 1}s
      </button>
      {open && item.text && (
        <p className="mt-1 ml-5 pl-2 border-l border-black/[0.1] text-[11px] text-[#6B7280] leading-relaxed whitespace-pre-wrap">
          {item.text}
        </p>
      )}
    </div>
  );
}

export default function ActivityTimeline({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {items.map((it, i) => {
        if (it.kind === "thought") return <Thought key={i} item={it} />;
        const meta = KIND[it.kind] || KIND.read;
        const Icon = meta.icon;
        return (
          <div key={i} className={`flex items-center gap-1.5 text-[11px] ${meta.color}`}>
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{meta.label(it)}</span>
          </div>
        );
      })}
    </div>
  );
}