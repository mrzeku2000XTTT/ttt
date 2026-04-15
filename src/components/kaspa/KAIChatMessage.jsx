import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { KAIBlocksAnimation } from "./KAIAnimations";
import { setKaSshiGlobal, markKaSshiInlineVisited } from "@/components/KaSshiPlayer";
import KAINewsCard from "./KAINewsCard";
import KAIVideoCard from "./KAIVideoCard";

export default function KAIChatMessage({ msg, index, typingIndex, typingText, setIsOpen, setBrowserUrl, setShowBrowser, setViewingPost, onWatchVideo }) {
  const navigate = useNavigate();

  // Video posts — cards with YouTube playback + watch & learn
  if (msg.role === "video_posts") {
    return (
      <div className="flex flex-col gap-2 max-w-[95%]">
        <div className="text-[12px] font-semibold px-1" style={{ color: "rgba(6,182,212,0.9)" }}>
          {msg.content}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
          {msg.videos.map((video, i) => (
            <KAIVideoCard
              key={i}
              video={video}
              index={i}
              onPlay={(v) => {
                if (v.url) {
                  setBrowserUrl(v.url);
                  setViewingPost(null);
                  setShowBrowser(true);
                }
              }}
              onWatch={(v, idx) => {
                // Trigger "watch the Nth one" flow
                if (onWatchVideo) onWatchVideo(v, idx);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // News posts — rich preview cards with post viewer
  if (msg.role === "news_posts") {
    return (
      <div className="flex flex-col gap-2 max-w-[95%]">
        <div className="text-[12px] font-semibold px-1" style={{ color: "rgba(6,182,212,0.9)" }}>
          {msg.content}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
          {msg.posts.map((post, i) => (
            <KAINewsCard
              key={i}
              post={post}
              onViewPost={(p) => { setViewingPost(p); setShowBrowser(true); }}
            />
          ))}
        </div>
        <button
          onClick={() => { setBrowserUrl("https://kaspa-app-9cc9fe40.base44.app"); setViewingPost(null); setShowBrowser(true); }}
          className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all hover:scale-105 mt-1"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
        >
          🌐 Browse all on Kaspa.news
        </button>
      </div>
    );
  }

  if (msg.role === "action") {
    return (
      <div className="flex justify-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))",
            border: "1px solid rgba(6,182,212,0.35)",
            color: "rgba(6,182,212,0.95)",
          }}
        >
          <KAIBlocksAnimation />
          {msg.content}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl break-words overflow-hidden"
        style={msg.role === "user" ? {
          background: "rgba(6,182,212,0.2)",
          color: "rgba(255,255,255,0.95)",
          borderBottomRightRadius: "4px",
        } : {
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderBottomLeftRadius: "4px",
        }}
      >
        {msg.images && msg.images.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {msg.images.map((imgUrl, ii) => (
              <img key={ii} src={imgUrl} alt="uploaded" className="w-16 h-16 rounded-lg object-cover ring-1 ring-white/20" />
            ))}
          </div>
        )}
        {msg.role === "assistant" ? (
          <ReactMarkdown
            className="kai-md text-[13px] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1">{children}</p>,
              a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 break-all">{children}</a>,
              strong: ({ children }) => <span className="font-semibold text-white/95">{children}</span>,
              ul: ({ children }) => <ul className="my-1 ml-3 list-disc text-white/70">{children}</ul>,
              ol: ({ children }) => <ol className="my-1 ml-3 list-decimal text-white/70">{children}</ol>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              code: ({ children }) => <code className="px-1 py-0.5 rounded bg-white/10 text-cyan-300 text-[11px] font-mono">{children}</code>,
            }}
          >
            {typingIndex === index ? (typingText || "") : msg.content}
          </ReactMarkdown>
        ) : (
          <span>{typingIndex === index ? (typingText || "") : msg.content}</span>
        )}
        {typingIndex === index && <span className="inline-block w-[2px] h-[14px] bg-cyan-400 ml-0.5 animate-pulse align-middle" />}
        
        {msg.kasshiAction && (
          <div className="mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); markKaSshiInlineVisited(); setKaSshiGlobal(true); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-bold transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(6,182,212,0.35))",
                border: "1px solid rgba(168,85,247,0.5)",
                color: "rgba(192,132,252,1)",
              }}
            >
              <span className="flex items-end gap-[2px] h-[12px]">
                {[8,12,6,10].map((h,i) => (
                  <span key={i} className="inline-block w-[2.5px] rounded-sm" style={{
                    height: h, background: 'linear-gradient(to top, #a855f7, #06b6d4)',
                    animation: `kasshi-eq-chat 0.8s ease-in-out ${i*0.15}s infinite alternate`,
                  }} />
                ))}
              </span>
              Open KaSshi Player
            </button>
            <style>{`@keyframes kasshi-eq-chat { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }`}</style>
          </div>
        )}
        {msg.browserLink && (
          <button
            onClick={() => { setBrowserUrl(msg.browserLink); setShowBrowser(true); }}
            className="mt-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:scale-105 flex items-center gap-1.5"
            style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.35)", color: "rgba(6,182,212,1)" }}
          >
            🌐 View in Browser
          </button>
        )}
        {msg.links && msg.links.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.links.map((link, li) => (
              <button
                key={li}
                onClick={() => { setIsOpen(false); navigate(createPageUrl(link.path)); }}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(6,182,212,0.25)", border: "1px solid rgba(6,182,212,0.4)", color: "rgba(6,182,212,1)" }}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}