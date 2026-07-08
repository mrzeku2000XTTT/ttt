import React, { useMemo, useRef, useEffect } from "react";

export const SONG_DURATION = 192;

// Line-level timestamps (seconds) for "The Dollar Is Dying".
// ~10s instrumental intro before vocals start.
export const SONG_LYRICS = [
  { time: 10, line: "The dollar is dying, Bitcoin can't scale," },
  { time: 14, line: "Gold is too heavy, Solana transactions fail." },
  { time: 18, line: "I've tried them all and I must confess —" },
  { time: 22, line: "Kaspa is the best money." },
  { time: 26, line: "" },
  { time: 29, line: "Bitcoin can't scale, Solana is down again," },
  { time: 33, line: "Ethereum gas fees and scaling solutions went." },
  { time: 37, line: "Shiny objects flash and making me sick," },
  { time: 41, line: "Token unlocks flood — I burns out quick." },
  { time: 45, line: "Markets pumping, dump it's a gambler's dream," },
  { time: 49, line: "Whales are running like a whale of your machine." },
  { time: 53, line: "Your favorite influencer's changing up the profile pic," },
  { time: 57, line: "They say we're still early — better aping quick." },
  { time: 61, line: "" },
  { time: 64, line: "The dollar is dying, Bitcoin can't scale," },
  { time: 68, line: "Gold is too heavy, Solana transactions fail." },
  { time: 72, line: "I've tried them all and I must confess —" },
  { time: 76, line: "Kaspa is the best money." },
  { time: 80, line: "" },
  { time: 83, line: "The speed blew my mind, scalability defined." },
  { time: 87, line: "Kaspa is the future — leave the fiat life behind." },
  { time: 91, line: "No CEO chains, no centralized control," },
  { time: 95, line: "Digital freedom for everyone to hold." },
  { time: 99, line: "" },
  { time: 102, line: "The dollar is dying, Bitcoin can't scale," },
  { time: 106, line: "Gold is too heavy, Solana transactions fail." },
  { time: 110, line: "I've tried them all and I must confess —" },
  { time: 114, line: "Kaspa is the best money." },
  { time: 118, line: "" },
  { time: 122, line: "Dollar is… dollar is… dollar is dying." },
];

// Build a per-word timeline. Within each line, words are spread evenly across
// the gap from this line's start to the next line's start — close enough to
// the sung cadence to highlight the current word in real time.
function buildWordTimeline(lines) {
  return lines.map((entry, i) => {
    const start = entry.time;
    const next = i + 1 < lines.length ? lines[i + 1].time : start + 4;
    const duration = Math.max(next - start, 1.5);
    const words = entry.line ? entry.line.split(/\s+/).filter(Boolean) : [];
    const perWord = words.length > 0 ? duration / words.length : duration;
    return {
      time: start,
      words: words.map((w, wi) => ({ text: w, time: start + wi * perWord })),
    };
  });
}

/**
 * LyricsTracker — karaoke-style lyrics that follow the song in real time.
 * `elapsed` is the TRUE playback position (seconds, float) reported by the
 * YouTube player. The exact word currently being sung is highlighted and the
 * active line auto-scrolls smoothly into view.
 */
export default function LyricsTracker({ elapsed, onScrolledToBottom }) {
  const lines = useMemo(() => buildWordTimeline(SONG_LYRICS), []);
  const lineRefs = useRef([]);

  // Active line = the last line whose start time has passed
  let activeLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= elapsed) activeLine = i;
    else break;
  }

  // Auto-scroll the active line into view — only when the active line changes,
  // so it stays smooth and doesn't fight manual scrolling.
  useEffect(() => {
    if (activeLine < 0) return;
    const el = lineRefs.current[activeLine];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeLine]);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) onScrolledToBottom?.();
  };

  return (
    <div onScroll={handleScroll} className="overflow-y-auto" style={{ maxHeight: 140, scrollbarWidth: "none" }}>
      <div className="space-y-1 pb-4">
        {lines.map((line, i) => {
          const isActive = i === activeLine;
          const isPast = i < activeLine;
          if (line.words.length === 0) {
            return <div key={i} ref={(el) => (lineRefs.current[i] = el)} className="h-3" />;
          }
          // Active word within the active line
          let activeWord = -1;
          if (isActive) {
            for (let w = 0; w < line.words.length; w++) {
              if (line.words[w].time <= elapsed) activeWord = w;
              else break;
            }
          }
          return (
            <p
              key={i}
              ref={(el) => (lineRefs.current[i] = el)}
              className="text-[13px] leading-relaxed font-medium transition-colors duration-200"
              style={{ color: isActive ? "#1e293b" : isPast ? "#94a3b8" : "#475569" }}
            >
              {line.words.map((word, wi) => {
                const hot = isActive && wi === activeWord;
                return (
                  <span
                    key={wi}
                    className="transition-all duration-150"
                    style={{
                      color: hot ? "#f97316" : undefined,
                      fontWeight: hot ? 700 : 500,
                      textShadow: hot ? "0 0 8px rgba(249,115,22,0.45)" : "none",
                    }}
                  >
                    {word.text + " "}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    </div>
  );
}