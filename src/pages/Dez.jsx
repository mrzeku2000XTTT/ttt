import React from 'react';
import { Link } from 'react-router-dom';
import BackToStore from '@/components/BackToStore';
import { ArrowUpRight, Plus } from 'lucide-react';
import { DEZ_LOGO, DEZ_APPS } from '@/components/dez/dezCatalog';

/**
 * Dez — the everyday AI for design. A hub of design apps, like Everyday AI
 * is for life tools. First app: Messages (realistic texting animation).
 */
export default function Dez() {
  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white flex flex-col">
      <BackToStore />
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-5 pt-6 pb-8">
        <div className="max-w-3xl w-full mx-auto">
          <div className="flex items-center gap-4">
            <img src={DEZ_LOGO} alt="Dez" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none">DEZ</h1>
              <p className="text-zinc-500 text-xs mt-1.5">The everyday AI for design — one hub, every design app.</p>
            </div>
          </div>

          <p className="text-[11px] uppercase tracking-wider text-zinc-600 mt-8 mb-3">Design apps</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEZ_APPS.map((app) => {
              const Icon = app.icon;
              return (
                <Link
                  key={app.name}
                  to={`/${app.path}`}
                  className="group border border-zinc-800 rounded-2xl p-4 flex items-start gap-4 hover:border-zinc-500 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-tight">{app.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{app.desc}</p>
                  </div>
                </Link>
              );
            })}

            <div className="border border-dashed border-zinc-800 rounded-2xl p-4 flex items-center gap-4 text-zinc-700">
              <div className="w-12 h-12 rounded-2xl border border-zinc-800 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <p className="text-xs">More design apps land here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}