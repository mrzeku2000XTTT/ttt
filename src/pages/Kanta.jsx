import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mic, Loader2, Copy, Check, Download, Send, Store } from "lucide-react";

// Kanta — chat-style AI lyrics writer powered by TTT's built-in AI.
// Strict monochrome: pure black background, white text only.
// Logo: real Kanta logo from the App Store catalog.

const KANTA_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3abbf9202_generated_image.png";

export default function Kanta() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', prompt?, title?, lyrics?, tags? }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput("");
    setError("");
    const userMsg = { role: "user", prompt };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("kantaGenerate", { prompt });
      setMessages((m) => [...m, {
        role: "assistant",
        prompt,
        title: res.title || "Untitled",
        lyrics: res.lyrics || "",
        tags: res.tags || "",
      }]);
    } catch (e) {
      setError(e?.message || "Lyrics generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const copyLyrics = async (msg) => {
    try {
      await navigator.clipboard.writeText(`${msg.title}\n\n${msg.lyrics}`);
      msg._copied = true;
      setMessages([...messages]);
      setTimeout(() => {
        msg._copied = false;
        setMessages([...messages]);
      }, 1500);
    } catch {}
  };

  const downloadLyrics = (msg) => {
    const blob = new Blob([`${msg.title}\n\n${msg.lyrics}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${msg.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "kanta_lyrics"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export in the exact format the HeartMuLa heartlib repo reads:
  // assets/lyrics.txt + assets/tags.txt (comma-separated, no spaces).
  const downloadHeartMula = (msg) => {
    const save = (filename, content) => {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };
    save("lyrics.txt", msg.lyrics);
    setTimeout(() => save("tags.txt", msg.tags), 300);
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans">
      {/* Header */}
      <header className="flex-shrink-0 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={KANTA_LOGO} alt="Kanta" className="w-10 h-10 rounded-xl object-cover" />
            <div className="leading-tight">
              <h1 className="text-xl font-extrabold tracking-tight">Kanta</h1>
              <p className="text-[11px] text-white/50 -mt-0.5">AI Lyrics Writer</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/AppStoreV2")}
            className="flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white border border-white/15 rounded-full px-3 py-1.5 transition-colors hover:bg-white/10"
          >
            <Store className="w-3.5 h-3.5" />
            Exit to App Store
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <img src={KANTA_LOGO} alt="Kanta" className="w-16 h-16 rounded-2xl object-cover mb-4 opacity-80" />
              <p className="text-lg font-bold mb-1">Write a song</p>
              <p className="text-sm text-white/50 max-w-sm">
                Describe a vibe, story, or feeling. Kanta writes titled, structured lyrics + HeartMuLa style tags you can export.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-white text-black rounded-2xl rounded-br-md px-4 py-2.5 text-sm font-medium">
                    {msg.prompt}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-[92%] w-full border border-white/15 rounded-2xl rounded-bl-md p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-white/60" />
                      <input
                        value={msg.title}
                        onChange={(e) => { msg.title = e.target.value; setMessages([...messages]); }}
                        className="flex-1 bg-transparent border-b border-white/10 pb-1 text-base font-bold text-white focus:outline-none focus:border-white/40"
                      />
                    </div>
                    <textarea
                      value={msg.lyrics}
                      onChange={(e) => { msg.lyrics = e.target.value; setMessages([...messages]); }}
                      rows={Math.min(18, msg.lyrics.split("\n").length + 1)}
                      className="w-full bg-transparent text-sm text-white/90 focus:outline-none resize-none whitespace-pre-wrap leading-relaxed"
                    />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">HeartMuLa tags</label>
                      <input
                        value={msg.tags}
                        onChange={(e) => { msg.tags = e.target.value; setMessages([...messages]); }}
                        placeholder="piano,happy,wedding,synthesizer,romantic"
                        className="w-full bg-transparent border border-white/15 rounded-lg p-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/50 font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => copyLyrics(msg)}
                        title="Copy"
                        className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white border border-white/15 rounded-full px-3 py-1.5 transition-colors hover:bg-white/10"
                      >
                        {msg._copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy
                      </button>
                      <button
                        onClick={() => downloadLyrics(msg)}
                        title="Download lyrics"
                        className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white border border-white/15 rounded-full px-3 py-1.5 transition-colors hover:bg-white/10"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Lyrics
                      </button>
                      <button
                        onClick={() => downloadHeartMula(msg)}
                        disabled={!msg.lyrics || !msg.tags}
                        title="Download lyrics.txt + tags.txt for HeartMuLa"
                        className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white border border-white/15 rounded-full px-3 py-1.5 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Download className="w-3.5 h-3.5" />
                        HeartMuLa
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="border border-white/15 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                <span className="text-sm text-white/60">Writing lyrics…</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-white border border-white/20 rounded-xl p-3">{error}</p>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2 border border-white/15 rounded-2xl bg-transparent focus-within:border-white/40 transition-colors p-1.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe a song… e.g. a chill lofi song about rainy nights"
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none resize-none py-2 px-2 max-h-32"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}