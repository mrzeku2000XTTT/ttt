import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, X, Sparkles, Eye, Wand2, ChevronDown, Paperclip, ImageIcon, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import html2canvas from "html2canvas";
import { buildSystemPrompt, runTools } from "./mockAgentTools";

const QUICK_PROMPTS = [
  "Make a dramatic product reveal",
  "Slide in from the left, then zoom into the chat",
  "Background: midnight. Add 'COMING SOON' as bold text",
  "Render a 6-second hero animation and export MP4",
];

export default function MockAgent({ open, onClose, getStateSnapshot, canvasRef, handlers }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm Cháoxiào — describe what you want and I'll build it. I can see your canvas, edit devices, chain presets, and render an MP4 for you." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState([]); // [{ url, name }]
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Live snapshot of the canvas state — used to show what the AI will act on
  const liveState = getStateSnapshot ? getStateSnapshot() : null;
  const selectedItem = liveState?.items?.find((it) => it.id === liveState.selected_id) || null;
  const selectedLabel = selectedItem
    ? selectedItem.kind === "text"
      ? `📝 "${(selectedItem.text || "Text").slice(0, 22)}"`
      : selectedItem.kind === "overlay"
      ? `✨ Overlay`
      : `📱 ${selectedItem.device || "device"}`
    : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const captureCanvasUrl = async () => {
    if (!canvasRef?.current) return null;
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null, scale: 0.6, useCORS: true, logging: false,
      });
      // Convert to blob → upload → return URL
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png", 0.9));
      if (!blob) return null;
      const file = new File([blob], "canvas.png", { type: "image/png" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    } catch (e) {
      console.warn("Canvas capture failed:", e);
      return null;
    }
  };

  const handleAttach = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) {
          setAttachments((prev) => [...prev, { url: file_url, name: file.name }]);
        }
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const send = async (text) => {
    const userMsg = (text ?? input).trim();
    if ((!userMsg && attachments.length === 0) || busy) return;

    const userAttachments = [...attachments];
    const newMessages = [
      ...messages,
      { role: "user", content: userMsg || "(image attached)", attachments: userAttachments },
    ];
    setMessages(newMessages);
    setInput("");
    setAttachments([]);
    setBusy(true);

    try {
      // Capture canvas for vision
      const canvasUrl = await captureCanvasUrl();
      const stateSnapshot = getStateSnapshot();
      let systemPrompt = buildSystemPrompt(stateSnapshot);

      // Tell the agent which item is currently selected (focus target)
      if (stateSnapshot?.selected_id) {
        const sel = stateSnapshot.items?.find((it) => it.id === stateSnapshot.selected_id);
        if (sel) {
          systemPrompt += `\n\n🎯 USER FOCUS: The user has selected item id="${sel.id}" (${sel.kind}${sel.device ? ` · ${sel.device}` : ""}). When they say "this", "it", or give an instruction without specifying, act on THIS item. It is already selected — no need to call select_item again.`;
        }
      }
      if (userAttachments.length > 0) {
        systemPrompt += `\n\n📎 The user attached ${userAttachments.length} reference image(s). Inspect them visually for style, content, or context the user wants applied.`;
      }

      // Build conversational context
      const history = newMessages
        .slice(-8)
        .map((m) => `${m.role === "user" ? "USER" : "ASSISTANT"}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`)
        .join("\n\n");

      const fullPrompt = `${systemPrompt}\n\nCONVERSATION:\n${history}\n\nReply now with the JSON plan.`;

      const llmArgs = {
        prompt: fullPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            tools: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  args: { type: "object" },
                },
                required: ["name"],
              },
            },
          },
          required: ["message"],
        },
      };
      const fileUrls = [];
      if (canvasUrl) fileUrls.push(canvasUrl);
      userAttachments.forEach((a) => fileUrls.push(a.url));
      if (fileUrls.length) llmArgs.file_urls = fileUrls;

      const res = await base44.integrations.Core.InvokeLLM(llmArgs);

      const assistantMessage = res?.message || "Done.";
      const toolCalls = Array.isArray(res?.tools) ? res.tools : [];

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage, tools: toolCalls },
      ]);

      if (toolCalls.length > 0) {
        const results = await runTools(toolCalls, handlers);
        const failed = results.filter((r) => !r.ok);
        if (failed.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `⚠️ Some steps failed: ${failed.map((f) => `${f.name} (${f.error})`).join(", ")}`,
            },
          ]);
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${e.message}` },
      ]);
    }
    setBusy(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop on mobile only — taps to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="sm:hidden fixed inset-0 z-[59] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            // Mobile: slide UP from bottom (drawer). Desktop: slide IN from right (panel).
            initial={{ y: "100%", x: 0, opacity: 0 }}
            animate={{ y: 0, x: 0, opacity: 1 }}
            exit={{ y: "100%", x: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-[60] sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:left-auto sm:w-[420px] bg-zinc-950/95 backdrop-blur-2xl border-t sm:border-t-0 sm:border-l border-white/10 rounded-t-3xl sm:rounded-none flex flex-col shadow-2xl"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              maxHeight: "90vh",
            }}
          >
            {/* Mobile drag handle */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-fuchsia-500/10 via-orange-500/10 to-pink-500/10">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 via-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                <Bot className="relative w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-black text-sm tracking-tight">Cháoxiào AI</div>
                <div className="flex items-center gap-1 text-[9px] text-white/40 font-bold uppercase tracking-widest">
                  <Eye className="w-2.5 h-2.5" /> Sees canvas · <Wand2 className="w-2.5 h-2.5" /> Edits · Renders MP4
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg hover:bg-white/10 active:bg-white/20 flex items-center justify-center text-white/60 hover:text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking & editing…</span>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && !busy && (
            <div className="px-4 pb-2 space-y-1.5">
              <div className="text-[9px] font-black tracking-[0.2em] uppercase text-white/30 mb-1.5">
                Try
              </div>
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs"
                >
                  <Sparkles className="w-3 h-3 inline-block mr-1.5 text-fuchsia-400" />
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-black/40">
            {/* Selected-target pin: tells the user (and AI) what's focused */}
            {selectedLabel && (
              <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
                <Target className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-widest">Acting on</span>
                <span className="text-[11px] font-bold text-white truncate">{selectedLabel}</span>
                <span className="ml-auto text-[9px] text-white/40">tap canvas to change</span>
              </div>
            )}

            {/* Attached image previews */}
            {attachments.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {attachments.map((a, i) => (
                  <div key={i} className="relative group">
                    <img src={a.url} alt={a.name} className="w-12 h-12 rounded-md object-cover ring-1 ring-white/20" />
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-md"
                      aria-label="Remove"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAttach}
              className="hidden"
            />

            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy || uploading}
                className="w-12 h-12 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 flex items-center justify-center text-white/70 flex-shrink-0"
                aria-label="Attach image"
                title="Attach reference image"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={selectedLabel ? `Tell me what to do with ${selectedLabel}…` : "Tell me what to build…"}
                rows={2}
                disabled={busy}
                style={{ fontSize: "16px" }}
                className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 focus:border-fuchsia-400 rounded-lg text-white outline-none resize-none disabled:opacity-50"
              />
              <button
                onClick={() => send()}
                disabled={busy || (!input.trim() && attachments.length === 0)}
                className="w-12 h-12 rounded-lg bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:opacity-90 active:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30 flex-shrink-0"
                aria-label="Send"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-[9px] text-white/30 mt-1.5 text-center">
              ⏎ to send · Shift+⏎ newline · 📎 attach image
            </div>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] rounded-2xl px-3.5 py-2 ${
        isUser
          ? "bg-white text-black"
          : "bg-white/5 border border-white/10 text-white"
      }`}>
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {message.attachments.map((a, i) => (
              <img key={i} src={a.url} alt={a.name} className="w-16 h-16 rounded-md object-cover ring-1 ring-black/20" />
            ))}
          </div>
        )}
        <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.tools && message.tools.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
            {message.tools.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono text-fuchsia-300">
                <ChevronDown className="w-2.5 h-2.5" />
                <span className="font-bold">{t.name}</span>
                {t.args && Object.keys(t.args).length > 0 && (
                  <span className="text-white/40 truncate">{JSON.stringify(t.args)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}