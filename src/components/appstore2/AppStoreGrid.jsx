import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Crown, ExternalLink, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { APPS } from "./appCatalog";
import AppPreviewModal from "./AppPreviewModal";
import AppGridItem from "./AppGridItem";

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
  const [previewApp, setPreviewApp] = useState(null);

  useEffect(() => {
    // RLS ensures: approved apps visible to everyone; pending/rejected only to owner + admin
    base44.entities.AppProposal.list("-created_date", 200)
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
            review: p.status === "pending",
          }))
        );
      })
      .catch(() => setCommunityApps([]));
  }, [refreshKey]);

  // TTT Builder lives in the Featured row, not the grid.
  const allApps = [...APPS, ...communityApps].filter((a) => a.name !== "TTT Builder");

  const isKaspaApp = (app) => {
    const text = `${app.name} ${app.desc} ${app.path || ""}`.toLowerCase();
    return /\bkaspa\b|\bkas\b|krc20|krc-20|\bdag\b/.test(text);
  };

  // When an AI/instant search is active, build a lookup set of matched names.
  const matchedNames = aiResults?.names?.length
    ? new Set(aiResults.names.map((n) => n.toLowerCase()))
    : null;
  const hasSearch = !!search?.trim();

  const filtered = allApps.filter((app) => {
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
          const inner = <AppGridItem app={app} />;

          if (app.externalUrl) {
            return (
              <button
                key={app.name + (app.path || app.externalUrl) + i}
                type="button"
                onClick={() => setPreviewApp(app)}
                className="appearance-none p-0 border-0 bg-transparent w-full"
              >
                {inner}
              </button>
            );
          }
          return (
            <Link
              key={app.name + app.path + i}
              to={`/AppDocs/${app.path}`}
              className="block w-full"
            >
              {inner}
            </Link>
          );
        })}
      </motion.div>
      <AppPreviewModal app={previewApp} onClose={() => setPreviewApp(null)} />
    </div>
  );
}