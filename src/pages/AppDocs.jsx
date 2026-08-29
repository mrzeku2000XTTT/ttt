import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { APPS } from "@/components/appstore2/appCatalog";
import { getAppDocs, getLayoutKey } from "@/components/appstore2/appDocsData";
import DocsLayoutDefault from "@/components/appstore2/docs/DocsLayoutDefault";
import DocsLayoutCreative from "@/components/appstore2/docs/DocsLayoutCreative";
import DocsLayoutFinance from "@/components/appstore2/docs/DocsLayoutFinance";
import DocsLayoutGames from "@/components/appstore2/docs/DocsLayoutGames";
import DocsLayoutAI from "@/components/appstore2/docs/DocsLayoutAI";
import { ArrowLeft, Bot } from "lucide-react";

const playGTA = () => { try { const a = new Audio("https://media.base44.com/files/public/6901295fa9bcfaa0f5ba2c2a/e5aa22c46_gta-menu.mp3"); a.volume = 0.8; a.play().catch(() => {}); } catch {} };

export default function AppDocsPage() {
  const { appPath } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const app = useMemo(() => APPS.find((a) => a.path === appPath), [appPath]);
  const docs = useMemo(() => (app ? getAppDocs(app) : null), [app]);
  const layoutKey = useMemo(() => (app ? getLayoutKey(app) : "default"), [app]);

  // Set a unique, Kaspa-keyworded title + meta description per app so each docs
  // page indexes distinctly in Google. Restored on unmount.
  useEffect(() => {
    if (!app) return;
    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const title = `${app.name} on Kaspa — ${docs?.tagline || app.desc || "TTT App"}`;
    const desc = `${app.name} ${docs?.tagline ? "— " + docs.tagline : ""}. ${docs?.overview || app.desc || ""} Built on the Kaspa network — your wallet is your login, on-chain settlement on the Kaspa Layer-1 DAG.`.slice(0, 160);
    document.title = title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement("meta"); metaDesc.setAttribute("name", "description"); document.head.appendChild(metaDesc); }
    metaDesc.setAttribute("content", desc);
    return () => { document.title = prevTitle; if (metaDesc) metaDesc.setAttribute("content", prevDesc); };
  }, [app, docs]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900">
      {/* Nav — matches AppStoreV2 */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between pl-3 sm:pl-5 pr-[calc(0.75rem+env(safe-area-inset-right,0px))] sm:pr-[calc(1.25rem+env(safe-area-inset-right,0px))] bg-[#F5F5F7]/80 backdrop-blur-2xl border-b border-zinc-200/50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between w-full h-14 gap-2">
          <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 transition-colors h-14 px-3 -ml-3 rounded-lg active:bg-zinc-200/60">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[14px] font-medium">Store</span>
          </Link>
          <span className="text-[15px] font-[800] tracking-tight min-w-0 truncate text-center">Docs</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/AIAgentHub" onClick={playGTA} className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 hover:opacity-90 h-10 px-3.5 rounded-full transition-opacity shadow-lg shadow-fuchsia-500/30">
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agents</span>
            </Link>
            <Link to="/Home" onClick={playGTA} className="flex items-center text-[13px] font-semibold text-white bg-black hover:bg-zinc-800 h-10 px-4 rounded-full transition-colors">
              Open TTT
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-20">
        {!app ? (
          <div className="text-center py-24">
            <p className="text-zinc-400 text-sm">App not found.</p>
            <Link to="/AppStoreV2" className="mt-3 text-sm font-semibold text-zinc-900 underline inline-block">Back to Store</Link>
          </div>
        ) : (
          (() => {
            const props = { app, docs, activeTab, onTab: setActiveTab };
            switch (layoutKey) {
              case "creative": return <DocsLayoutCreative {...props} />;
              case "finance": return <DocsLayoutFinance {...props} />;
              case "games": return <DocsLayoutGames {...props} />;
              case "ai": return <DocsLayoutAI {...props} />;
              default: return <DocsLayoutDefault {...props} />;
            }
          })()
        )}
      </div>
    </div>
  );
}