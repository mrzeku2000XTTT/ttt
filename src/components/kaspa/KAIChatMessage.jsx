import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { KAIBlocksAnimation } from "./KAIAnimations";
import { setKaSshiGlobal, markKaSshiInlineVisited } from "@/components/KaSshiPlayer";
import KAINewsCard from "./KAINewsCard";
import KAIVideoCard from "./KAIVideoCard";
import ImposterRenderLoader from "./ImposterRenderLoader";
import { base44 } from "@/api/base44Client";

export default function KAIChatMessage({ msg, index, typingIndex, typingText, setIsOpen, setBrowserUrl, setShowBrowser, setViewingPost, onWatchVideo }) {
  const [txState, setTxState] = useState("idle"); // idle | sending | done | error
  const [txResult, setTxResult] = useState(null);
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

  // PDF preview
  if (msg.role === "pdf_preview") {
    return (
      <div className="flex flex-col gap-1.5 max-w-[95%] w-full">
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(6,182,212,0.1) 100%)", border: "1px solid rgba(37,99,235,0.3)" }}>
          {/* Top strip */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
            <div className="w-9 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #1d4ed8, #0369a1)", boxShadow: "0 2px 8px rgba(29,78,216,0.5)" }}>
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M2 0h8l6 6v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2a2 2 0 012-2z" fill="rgba(255,255,255,0.15)"/>
                <path d="M10 0l6 6h-4a2 2 0 01-2-2V0z" fill="rgba(255,255,255,0.3)"/>
                <path d="M4 10h8M4 13h6" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[13px] font-semibold truncate">{msg.pdf_title || 'Document'}.pdf</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(147,197,253,0.7)" }}>✅ PDF ready · Click to download</div>
            </div>
          </div>
          {/* Divider */}
          <div style={{ height: 1, background: "rgba(37,99,235,0.2)" }} />
          {/* Action buttons */}
          <div className="flex">
            <a
              href={msg.file_url}
              download={`${msg.pdf_title || 'document'}.pdf`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold transition-all hover:bg-white/5"
              style={{ color: "rgba(147,197,253,1)", textDecoration: "none" }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M3 6l3.5 3.5L10 6M1 11h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Download
            </a>
            <div style={{ width: 1, background: "rgba(37,99,235,0.2)" }} />
            <a
              href={msg.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold transition-all hover:bg-white/5"
              style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Open
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Email preview
  if (msg.role === "email_preview") {
    return (
      <div className="flex flex-col gap-2 max-w-[95%] w-full">
        <div className="text-[12px] font-semibold px-1" style={{ color: "rgba(6,182,212,0.9)" }}>
          📧 {msg.content}
        </div>
        <div className="rounded-xl overflow-hidden w-full" style={{ border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          <iframe src={msg.preview_data_url} width="100%" height="400" style={{ border: "none", display: "block" }} title="Email Preview" />
        </div>
        {msg.send_links && (
          <div className="flex gap-2 flex-wrap px-1">
            <a href={msg.send_links.gmail} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(234,67,53,0.2)", border: "1px solid rgba(234,67,53,0.4)", color: "rgba(255,120,100,1)" }}>
              📧 Open in Gmail
            </a>
            <a href={msg.send_links.outlook} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(0,114,198,0.2)", border: "1px solid rgba(0,114,198,0.4)", color: "rgba(100,180,255,1)" }}>
              📬 Open in Outlook
            </a>
          </div>
        )}
        <div className="text-[11px] px-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Everything is pre-filled — just click to open your email client and send.
        </div>
      </div>
    );
  }

  // Imposter video rendering — progress card
  if (msg.imposterRender) {
    return (
      <div className="flex justify-start">
        <ImposterRenderLoader
          status={msg.imposterRender.status}
          progress={msg.imposterRender.progress}
          elapsed={msg.imposterRender.elapsed}
        />
      </div>
    );
  }

  // Imposter image ready — embed image directly
  if (msg.imposterImage?.image_url) {
    return (
      <div className="flex justify-start">
        <div
          className="max-w-[90%] rounded-2xl overflow-hidden"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(6,182,212,0.3)" }}
        >
          <img
            src={msg.imposterImage.image_url}
            alt={msg.imposterImage.prompt || "generated image"}
            className="w-full block"
            style={{ maxHeight: 420, objectFit: "contain", background: "#000" }}
          />
          <div className="flex items-center justify-between px-3 py-2 text-[11px] gap-2">
            <span className="text-cyan-400/80 font-semibold truncate">
              🖼️ {msg.imposterImage.prompt ? msg.imposterImage.prompt.slice(0, 60) : "image ready"}
            </span>
            <a
              href={msg.imposterImage.image_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              download
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Imposter video ready — embed video directly
  if (msg.imposterVideo?.video_url) {
    return (
      <div className="flex justify-start">
        <div
          className="max-w-[90%] rounded-2xl overflow-hidden"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(6,182,212,0.3)" }}
        >
          <video
            src={msg.imposterVideo.video_url}
            controls
            autoPlay
            playsInline
            className="w-full block"
            style={{ maxHeight: 360 }}
          />
          <div className="flex items-center justify-between px-3 py-2 text-[11px]">
            <span className="text-cyan-400/80 font-semibold">🎬 render complete</span>
            <a
              href={msg.imposterVideo.video_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              download
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Imposter send transaction confirm card
  if (msg.imposterTx) {
    const { to_address, amount_kas, balance, from_address, mnemonic } = msg.imposterTx;
    const sendTx = async () => {
      setTxState("sending");
      try {
        const res = await base44.functions.invoke('sendKaspaTransaction', {
          mnemonic,
          fromAddress: from_address,
          toAddress: to_address,
          amountKas: amount_kas,
        });
        if (res.data?.error) throw new Error(res.data.error);
        setTxResult(res.data);
        setTxState("done");
      } catch (err) {
        setTxResult({ error: err.message });
        setTxState("error");
      }
    };

    return (
      <div className="flex justify-start">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-[90%] rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,50,50,0.07)", border: "1px solid rgba(255,50,50,0.25)" }}>
          <div className="px-4 pt-3 pb-2">
            <div className="text-[10px] text-red-400/60 uppercase tracking-wider font-bold mb-2">⚡ Transaction Request</div>
            <div className="space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className="text-white/40">Amount</span>
                <span className="text-white/90 font-bold">{amount_kas} KAS</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-white/40">To</span>
                <span className="text-white/70 font-mono text-[10px]">{to_address.slice(0, 24)}…</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-white/40">From</span>
                <span className="text-white/50 font-mono text-[10px]">{from_address?.slice(0, 24)}…</span>
              </div>
              {balance !== undefined && balance !== null && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-white/40">Balance</span>
                  <span className="text-green-400/80 font-mono">{balance.toFixed(4)} KAS</span>
                </div>
              )}
            </div>
          </div>

          {txState === "idle" && (
            <div className="flex border-t border-red-500/15">
              <button onClick={sendTx}
                className="flex-1 py-2.5 text-[12px] font-bold text-red-400 hover:bg-red-500/10 transition-all">
                ✓ Confirm
              </button>
              <div className="w-px bg-red-500/15" />
              <button onClick={() => setTxState("error")}
                className="flex-1 py-2.5 text-[12px] text-white/30 hover:bg-white/5 transition-all">
                ✕ Cancel
              </button>
            </div>
          )}
          {txState === "sending" && (
            <div className="py-3 text-center text-[11px] text-red-400/70 animate-pulse">sending…</div>
          )}
          {txState === "done" && (
            <div className="px-4 py-2.5 text-[11px] text-green-400/80">
              ✓ sent — txid: <span className="font-mono text-[10px] break-all">{String(txResult?.txId || "").slice(0, 32)}…</span>
            </div>
          )}
          {txState === "error" && (
            <div className="px-4 py-2.5 text-[11px] text-red-400/70">
              {txResult?.error || "cancelled."}
            </div>
          )}
        </motion.div>
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