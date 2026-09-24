import React from 'react';

/** Compact labelled icon button for the mobile/tablet tool row. */
export default function MorphToolButton({ icon: Icon, label, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 transition-colors ${
        active ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[9px] whitespace-nowrap">{label}</span>
    </button>
  );
}