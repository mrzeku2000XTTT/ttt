import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORY_DOT = {
  kaspa: "bg-cyan-400",
  crypto: "bg-amber-400",
  youtube: "bg-red-500",
  advertisement: "bg-violet-500",
};

/**
 * HotTopicsTicker — a live news-style scrolling ticker for crypto news.
 * Topics scroll continuously from right to left, pausing on hover.
 * Shows live UTC time and category-colored indicators.
 */
export default function HotTopicsTicker() {
  const [topics, setTopics] = useState([]);
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

  if (loading || topics.length === 0) return null;

  // Use first 60 unique items for the ticker (duplicated for seamless loop)
  const sample = topics.slice(0, 60);
  const items = [...sample, ...sample];

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
          <div className="flex items-center gap-5 whitespace-nowrap animate-ticker hover:[animation-play-state:paused]">
            {items.map((topic, i) => (
              <button
                key={i}
                onClick={() => window.open(topic.tweet_url, "_blank", "noopener,noreferrer")}
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