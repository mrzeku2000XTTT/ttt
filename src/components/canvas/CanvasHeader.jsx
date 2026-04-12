import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Search, LayoutGrid, List } from "lucide-react";

export default function CanvasHeader({ searchQuery, onSearchChange, viewMode, onViewModeChange, onNewTemplate }) {
  return (
    <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("AppStore")} className="text-white/30 hover:text-white transition-colors p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">C</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">Canvas</h1>
              <p className="text-white/25 text-[10px] mt-0.5">UI/UX Templates</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search templates..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onNewTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-indigo-500/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}