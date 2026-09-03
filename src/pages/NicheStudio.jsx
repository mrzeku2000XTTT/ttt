import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LayoutGrid, Compass, Link as LinkIcon, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import NicheLogo from '@/components/niche/NicheLogo';
import NicheStudioList from '@/components/niche/NicheStudioList';
import NicheStudioDetail from '@/components/niche/NicheStudioDetail';
import NicheAutoStudio from '@/components/niche/NicheAutoStudio';

export default function NicheStudio() {
  const [niches, setNiches] = useState(null); // null = loading
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(() =>
    new URLSearchParams(window.location.search).get('id') ? 'manual' : 'auto'
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.NicheResult.list('-created_date', 50);
        setNiches(list);
        const id = new URLSearchParams(window.location.search).get('id');
        if (id) {
          const hit = list.find((n) => n.id === id);
          if (hit) setSelected(hit);
        }
      } catch {
        setNiches([]);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0) 60%)' }}
      />

      <div className="flex items-center justify-between px-4 sm:px-6 py-4 relative z-10">
        <Link to="/Niche" className="flex items-center gap-2.5 group">
          <NicheLogo size={32} />
          <span className="font-black tracking-tight text-xl">NICHE <span className="text-white/40 group-hover:text-white/70 transition-colors">Studio</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/Niche"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-sm font-medium transition-all"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Find a niche</span>
          </Link>
          <a
            href="/AppStoreV2"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-sm font-medium transition-all"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Exit to App Store</span>
            <span className="sm:hidden">Exit</span>
          </a>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 relative z-10 mb-2">
        {[
          { key: 'auto', label: 'Automatic', icon: Sparkles },
          { key: 'manual', label: 'Manual', icon: SlidersHorizontal }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              mode === key
                ? 'bg-white text-black'
                : 'border border-white/15 text-white/60 hover:text-white hover:border-white/40'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="relative z-10 py-4 sm:py-8 pb-24">
        {mode === 'auto' ? (
          niches === null ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <NicheAutoStudio niches={niches} />
          )
        ) : !niches ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : selected ? (
          <NicheStudioDetail niche={selected} onBack={() => setSelected(null)} />
        ) : niches.length === 0 ? (
          <div className="max-w-md mx-auto px-4 text-center pt-16">
            <Compass className="w-10 h-10 text-white/30 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-white">No niches yet</h1>
            <p className="text-white/50 text-sm mt-2 mb-6">Find your first niche and it will be saved here automatically.</p>
            <Link
              to="/Niche"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-black font-bold hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] transition-all"
            >
              <LinkIcon className="w-4 h-4" /> Find my niche
            </Link>
          </div>
        ) : (
          <NicheStudioList niches={niches} onSelect={setSelected} />
        )}
      </div>
    </div>
  );
}