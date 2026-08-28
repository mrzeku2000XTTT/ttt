import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * HotTopicsTicker — a live news-style scrolling ticker for trending $KAS content.
 * Topics scroll continuously from right to left, pausing on hover.
 * Positioned as a fixed bar at the bottom of the landing page.
 */
export default function HotTopicsTicker() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Duplicate for seamless infinite loop
  const items = [...topics, ...topics];

  return (
    <div className="w-full overflow-hidden border-t border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="flex items-center h-9">
        {/* Label badge */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 h-full bg-gradient-to-r from-orange-500/20 to-transparent border-r border-white/10 z-10">
          <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
          <span className="text-[9px] font-mono tracking-widest uppercase text-white/70 whitespace-nowrap">HOT TOPICS</span>
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-6 whitespace-nowrap animate-ticker hover:[animation-play-state:paused]">
            {items.map((topic, i) => (
              <button
                key={i}
                onClick={() => window.open(topic.tweet_url, "_blank", "noopener,noreferrer")}
                className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white transition-colors flex-shrink-0"
              >
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
                <span className="max-w-[180px] truncate">{topic.author_name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}