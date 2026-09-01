import React, { useState } from "react";
import { motion } from "framer-motion";
import { Crown, ExternalLink, Lock } from "lucide-react";
import { createPageUrl } from "@/utils";
import DocsAdminLock from "./DocsAdminLock";
import AppAccessGate from "@/components/appstore2/AppAccessGate";
import { useAppStoreAccess } from "@/lib/useAppStoreAccess";

// Shared docs hero — app icon, name, tagline, badges, and the Open App action.
// Open App is always shown (mobile + desktop). Admin-only apps render an
// amber "Admin Only" button + a DocsAdminLock card explaining how to gain access.
export default function DocsHero({ app, docs, accent = "zinc" }) {
  const accentMap = {
    zinc: "from-zinc-900 to-zinc-700",
    violet: "from-violet-600 to-fuchsia-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    cyan: "from-cyan-500 to-blue-600",
  };
  const grad = accentMap[accent] || accentMap.zinc;

  const openApp = app.path ? createPageUrl(app.path) : app.externalUrl;
  const isAdmin = !!app.admin;
  const access = useAppStoreAccess();
  const [gateOpen, setGateOpen] = useState(false);

  const launch = () => {
    try { localStorage.setItem("came_from_categories", "true"); } catch {}
    if (openApp.startsWith("http")) window.open(openApp, "_blank", "noopener,noreferrer");
    else window.location.href = openApp;
  };
  const guardedLaunch = () => {
    if (access.valid) launch();
    else setGateOpen(true);
  };

  const OpenAppButton = ({ fullWidth = false }) => {
    if (!openApp) return null;
    const size = fullWidth ? "w-full" : "px-4";
    if (isAdmin) {
      const cls = `inline-flex items-center justify-center gap-1.5 h-10 ${size} rounded-full bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 transition-colors flex-shrink-0`;
      const inner = (<><Lock className="w-4 h-4" />Open App · Admin Only</>);
      return openApp.startsWith("http") ? (
        <a href={openApp} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
      ) : (
        <button onClick={launch} className={cls}>{inner}</button>
      );
    }
    const cls = `inline-flex items-center justify-center gap-1.5 h-10 ${size} rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-700 transition-colors flex-shrink-0`;
    const inner = (<><ExternalLink className="w-4 h-4" />Open App</>);
    return (
      <button onClick={guardedLaunch} className={cls}>{inner}</button>
    );
  };

  return (
    <div className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-[0.07]`} />
      <div className="relative px-5 sm:px-8 pt-6 pb-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
          >
            {app.logo ? (
              <img src={app.logo} alt={app.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-2xl font-[900] text-zinc-500">
                {app.name?.[0]?.toUpperCase()}
              </div>
            )}
            {app.premium && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                <Crown className="w-3 h-3 text-yellow-900" />
              </div>
            )}
          </motion.div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-[900] tracking-tight text-zinc-900 leading-tight">{app.name}</h1>
            <p className="text-sm sm:text-[15px] text-zinc-500 mt-1">{docs.tagline}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">{app.cat}</span>
              {app.admin && <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"><Lock className="w-3 h-3" />Admin</span>}
              {app.premium && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">Premium</span>}
            </div>
          </div>

          <div className="hidden sm:block flex-shrink-0">
            <OpenAppButton />
          </div>
        </div>

        {/* Mobile: full-width Open App */}
        <div className="sm:hidden mt-4">
          <OpenAppButton fullWidth />
        </div>

        {isAdmin && <DocsAdminLock app={app} />}
        <AppAccessGate
          open={gateOpen}
          onClose={() => setGateOpen(false)}
          onAuthorized={() => { setGateOpen(false); launch(); }}
        />
      </div>
    </div>
  );
}