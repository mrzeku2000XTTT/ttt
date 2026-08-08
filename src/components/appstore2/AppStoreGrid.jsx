import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Crown, ExternalLink, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { APPS, KASPA_APPS_ORDER } from "./appCatalog";

function AppIcon({ app, hovered }) {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [hovered]);

  if (app.logo) {
    return (
      <div className="relative w-full h-full">
        <img
          src={app.logo}
          alt={app.name}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl"
          loading="lazy"
        />
        {app.video && (
          <video
            ref={videoRef}
            src={app.video}
            muted
            loop
            playsInline
            preload="none"
            className={`absolute inset-0 w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
    );
  }
  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center">
      <span className="text-xl font-[900] text-zinc-500">{app.name[0]}</span>
    </div>
  );
}

export default function AppStoreGrid({ search, category, isAdmin, refreshKey = 0, view = "all", onViewChange, aiResults }) {
  const [communityApps, setCommunityApps] = useState([]);
  const [builderApps, setBuilderApps] = useState([]);

  useEffect(() => {
    base44.entities.AppProposal.filter({ status: "approved" }, "-created_date", 200)
      .then((list) => {
        setCommunityApps(
          list.map((p) => ({
            name: p.app_name,
            path: null,
            externalUrl: p.app_link,
            cat: p.category || "Tools",
            logo: p.icon_url,
            desc: p.description?.slice(0, 60) || "Community app",
            community: true,
          }))
        );
      })
      .catch(() => setCommunityApps([]));
  }, [refreshKey]);

  useEffect(() => {
    base44.entities.TTTAppRegistry.filter({ is_active: true }, "-created_date", 200)
      .then((list) => {
        setBuilderApps(
          list.map((p) => ({
            name: p.app_name,
            path: null,
            externalUrl: p.external_url,
            cat: p.category || "Tools",
            logo: p.logo_url,
            desc: p.description?.slice(0, 60) || "Built with TTT Builder",
            community: true,
            builder: true,
          }))
        );
      })
      .catch(() => setBuilderApps([]));
  }, [refreshKey]);

  const allApps = [...APPS, ...builderApps, ...communityApps];

  const isKaspaApp = (app) => {
    const text = `${app.name} ${app.desc} ${app.path || ""}`.toLowerCase();
    return /\bkaspa\b|\bkas\b|krc20|krc-20|\bdag\b/.test(text);
  };

  // When an AI/instant search is active, build a lookup set of matched names.
  const matchedNames = aiResults?.names?.length
    ? new Set(aiResults.names.map((n) => n.toLowerCase()))
    : null;
  const hasSearch = !!search?.trim();

  const filtered = view === "kaspa"
    ? KASPA_APPS_ORDER
        .map((name) => allApps.find((a) => a.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean)
        .filter((app) => {
          if (app.admin && !isAdmin) return false;
          if (matchedNames) return matchedNames.has(app.name.toLowerCase());
          return true;
        })
    : allApps.filter((app) => {
        if (app.admin && !isAdmin) return false;

        // Active search: filter by matched names (from LLM or instant substring).
        // Community apps that aren't in the LLM catalog fall back to substring.
        if (hasSearch && matchedNames) {
          if (matchedNames.has(app.name.toLowerCase())) return true;
          if (app.community) {
            const q = search.toLowerCase();
            return app.name.toLowerCase().includes(q) || app.desc.toLowerCase().includes(q);
          }
          return false;
        }

        // Normal category filtering (no search active).
        if (category === "Kaspa") {
          if (!isKaspaApp(app)) return false;
        } else if (category === "TTT") {
          // TTT Apps = all apps in the store (every app is a TTT-built app)
        } else if (category !== "All" && app.cat !== category) return false;
        return true;
      });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-400 text-sm">
        {hasSearch ? "No apps match your search." : "No apps found."}
      </div>
    );
  }

  // Re-key the container on filter change so the stagger replays when user
  // searches or switches categories — adds a satisfying re-shuffle feel.
  const containerKey = `${view}|${category}|${search}|${filtered.length}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.025, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.85 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 380, damping: 26 },
    },
  };

  return (
    <div>
      <motion.div
        key={containerKey}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-5"
      >
        {filtered.map((app, i) => {
          const Wrapper = ({ children }) => {
            const [hovered, setHovered] = React.useState(false);
            return (
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.06, transition: { type: "spring", stiffness: 400, damping: 18 } }}
                whileTap={{ scale: 0.92 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                onTouchStart={() => setHovered(true)}
                onTouchEnd={() => setHovered(false)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                {typeof children === "function" ? children(hovered) : children}
              </motion.div>
            );
          };
          const inner = (
            <Wrapper>
              {(hovered) => (<>
              <motion.div
                className="relative w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-xl transition-shadow"
                animate={{ y: [0, -1.5, 0] }}
                transition={{
                  duration: 3 + (i % 5) * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i % 7) * 0.15,
                }}
              >
                <AppIcon app={app} hovered={hovered} />
                {/* Glossy hover sheen */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                {app.premium && (
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Crown className="w-2.5 h-2.5 text-yellow-900" />
                  </motion.div>
                )}
                {app.community && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center shadow-sm" title="Community submission">
                    <ExternalLink className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </motion.div>
              <div className="text-center max-w-[72px]">
                <p className="text-[11px] font-semibold text-zinc-800 truncate leading-tight group-hover:text-zinc-950 transition-colors">{app.name}</p>
                <p className="text-[9px] text-zinc-400 truncate">{app.desc}</p>
              </div>
              </>)}
            </Wrapper>
          );

          if (app.externalUrl) {
            return (
              <a key={app.name + (app.path || app.externalUrl) + i} href={app.externalUrl} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            );
          }
          return (
            <Link
              key={app.name + app.path + i}
              to={createPageUrl(app.path)}
              onClick={() => { try { localStorage.setItem('came_from_categories', 'true'); } catch {} }}
            >
              {inner}
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}