import React from 'react';
import { Search, BookOpen, User } from 'lucide-react';

const TABS = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'docs', label: 'Dev docs', icon: BookOpen },
  { id: 'profile', label: 'Profile', icon: User },
];

/** iOS-style bottom tab bar for the Search Kaspa app. */
export default function SearchKaspaTabBar({ active, onChange }) {
  return (
    <nav
      aria-label="Search Kaspa tabs"
      className="fixed bottom-0 inset-x-0 z-[300] border-t border-white/10 bg-black/90 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-transform active:scale-95"
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-300' : 'text-white/40'}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-cyan-300' : 'text-white/40'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}