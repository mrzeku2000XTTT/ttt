import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORY_DOT = {
  kaspa: "bg-cyan-400",
  crypto: "bg-amber-400",
  youtube: "bg-red-500",
  advertisement: "bg-violet-500",
  app: "bg-emerald-400",
};

/**
 * HotTopicsTicker — a live news-style scrolling ticker for crypto news + Kaspa apps.
 * All ~700 Kaspa apps are interspersed so every one shows at least once per hour.
 * Shows live UTC time and category-colored indicators.
 */
export default function HotTopicsTicker() {
  const [topics, setTopics] = useState([]);
  const [kaspaApps, setKaspaApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [utcTime, setUtcTime] = useState("");

  // Live UTC clock — updates every second so users know it's live
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setUtcTime(`${h}:${m}:${s} UTC`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch news topics
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("fetchKaspaHotTopics", {});
        const data = res?.data || res;
        setTopics(data?.topics || []);
      } catch (e) {
        console.error("Ticker fetch failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch ALL Kaspa apps — cycle through every one at least once per hour
  useEffect(() => {
    (async () => {
      try {
        const apps = await base44.entities.KaspaHubApp.list("-indexed_at", 1000);
        setKaspaApps(apps || []);
      } catch (e) {
        console.error("Kaspa apps fetch failed", e);
      }
    })();
  }, []);

  if (loading || (topics.length === 0 && kaspaApps.length === 0)) return null;

  // Convert Kaspa apps to ticker items
  const appItems = kaspaApps.map((app) => {
    let host = app.url || "";
    try { host = new URL(app.url).host.replace(/^www\./, ""); } catch {}
    return {
      author_handle: host || app.name,
      author_name: app.name,
      profile_image_url: app.logo,
      tweet_url: app.url,
      category: "app",
      is_advertisement: false,
    };
  });

  // News items (first 40 to leave room for apps)
  const newsItems = topics.slice(0, 40);

  // Intersperse: apps + news so all ~700 apps get exposure each cycle
  const sample = [...appItems, ...newsItems];
  const items = [...sample, ...sample]; // duplicate for seamless loop

  // ~3s per unique item → all apps shown within ~35 min (well under 1 hour)
  const duration = Math.max(sample.length * 3, 90);

  return (
    <div className="w-full overflow-hidden border-t border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="flex items-center h-9">
        {/* Label badge with live UTC time */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 h-full bg-gradient-to-r from-orange-500/20 to-transparent border-r border-white/10 z-10">
          <Flame className="w-3 h-3 text-orange-400 flex-shrink-0 animate-pulse" />
          <span className="text-[9px] font-mono tracking-widest uppercase text-white/70 whitespace-nowrap">HOT</span>
          <span className="text-[8px] font-mono text-emerald-400/80 tabular-nums whitespace-nums leading-none">{utcTime}</span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex items-center gap-5 whitespace-nowrap animate-ticker hover:[animation-play-state:paused]"
            style={{ animationDuration: `${duration}s` }}
          >
            {items.map((topic, i) => (
              <button
                key={i}
                onClick={() => topic.tweet_url && window.open(topic.tweet_url, "_blank", "noopener,noreferrer")}
                className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white transition-colors flex-shrink-0"
              >
                {/* Category indicator dot */}
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CATEGORY_DOT[topic.category] || "bg-white/40"}`} />
                {topic.is_advertisement && (
                  <span className="text-[7px] font-bold uppercase tracking-wider text-violet-300 bg-violet-500/20 px-1 py-0.5 rounded">AD</span>
                )}
                <img
                  src={
                    topic.profile_image_url ||
                    (topic.author_handle && !topic.author_handle.includes(".")
                      ? `https://unavatar.io/x/${topic.author_handle}`
                      : `https://www.google.com/s2/favicons?domain=${topic.author_handle}&sz=32`)
                  }
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  alt=""
                  loading="lazy"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <span className="font-semibold text-white/70">{topic.author_handle}</span>
                <span className="text-white/20">·</span>
                <span className="max-w-[160px] truncate">{topic.author_name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}