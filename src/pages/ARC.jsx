import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, Send, Copy, Check, Edit2, Plus, ChevronDown, ChevronUp, Loader2, Sparkles, Zap, Play, X } from "lucide-react";

// ─── ARC Agent Core ───────────────────────────────────────────────
const ARC_SYSTEM = `You are ARC — Advanced Remix Composer — an expert viral video template analyst and creative director.

When a user uploads an image (viral ad, TikTok, Reel, YouTube Short), you:
1. DECODE the template: scene location, subject type, visual style, camera angle, lighting, energy
2. IDENTIFY overlays: title text, captions, CTAs, brand placement, speech bubbles
3. ANALYZE the hook formula: what makes this ad stop the scroll
4. OUTPUT a structured analysis in JSON:
{
  "scene": { "location": "...", "subject": "...", "lighting": "...", "camera_angle": "...", "energy": "..." },
  "overlays": { "title": "...", "captions": ["..."], "cta": "...", "style": "..." },
  "hook_formula": "...",
  "template_name": "...",
  "pills": [
    { "id": "1", "label": "Scene Recreation", "prompt": "full cinematic video prompt to recreate this exact scene with different person/brand", "type": "main" },
    { "id": "2", "label": "B-Roll Cut 1", "prompt": "b-roll scene prompt", "type": "broll" },
    { "id": "3", "label": "B-Roll Cut 2", "prompt": "b-roll scene prompt", "type": "broll" }
  ],
  "summary": "A friendly 2-3 sentence description of what you analyzed and how to use it"
}

Be creative, detailed and specific in prompts. Write prompts as if directing a video shoot.`;

const THOUGHTS = [
  "Scanning visual composition...",
  "Detecting overlay elements...",
  "Analyzing hook formula...",
  "Identifying scene type...",
  "Mapping camera angles...",
  "Extracting text overlays...",
  "Computing virality score...",
  "Building recreation prompts...",
  "Generating scene cuts...",
  "Finalizing ARC output...",
];

// ─── Sub-components ───────────────────────────────────────────────
function ThinkingBubble({ thoughts, visible }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % thoughts.length), 1100);
    return () => clearInterval(t);
  }, [visible, thoughts.length]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          className="flex items-start gap-3 mb-4"
        >
          {/* ARC avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                    animate={{ y: [0,-4,0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
              <span className="text-xs text-violet-400 font-medium">ARC is analyzing</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={current}
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.25 }}
                className="text-xs text-white/60"
              >
                {thoughts[current]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PromptPill({ pill, onEdit, onExpand, onGenerate, index }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(pill.prompt);
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImg, setGeneratedImg] = useState(null);

  const copy = () => {
    navigator.clipboard.writeText(editText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSave = () => {
    onEdit(pill.id, editText);
    setEditing(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: editText });
      setGeneratedImg(res.url);
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const typeColor = pill.type === 'main'
    ? 'from-violet-600/20 to-cyan-600/20 border-violet-500/40'
    : 'from-white/5 to-white/5 border-white/15';

  const typeLabel = pill.type === 'main' ? 'Main Scene' : `B-Roll ${index}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 24 }}
      className={`bg-gradient-to-br ${typeColor} border rounded-2xl p-4 mb-3`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            pill.type === 'main' ? 'bg-violet-500/30 text-violet-300' : 'bg-white/10 text-white/60'
          }`}>{typeLabel}</span>
          <span className="text-xs font-semibold text-white/80">{pill.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setEditing(!editing)}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Edit prompt">
            <Edit2 className="w-3 h-3 text-white/60" />
          </button>
          <button onClick={copy}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Copy prompt">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/60" />}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            {expanded ? <ChevronUp className="w-3 h-3 text-white/60" /> : <ChevronDown className="w-3 h-3 text-white/60" />}
          </button>
        </div>
      </div>

      {/* Collapsed preview */}
      {!expanded && !editing && (
        <p className="text-xs text-white/50 line-clamp-2">{editText}</p>
      )}

      {/* Expanded prompt */}
      <AnimatePresence>
        {expanded && !editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <p className="text-xs text-white/70 leading-relaxed mt-2">{editText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit mode */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-xs text-white resize-none outline-none focus:border-violet-500/60"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleSave}
                className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors">
                Save
              </button>
              <button onClick={() => { setEditing(false); setEditText(pill.prompt); }}
                className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 text-xs transition-colors">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate preview */}
      {!editing && (
        <div className="mt-3 flex items-center gap-2">
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white text-xs font-semibold transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generating ? "Generating..." : "Preview Scene"}
          </button>
        </div>
      )}

      {/* Generated image */}
      <AnimatePresence>
        {generatedImg && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mt-3 rounded-xl overflow-hidden">
            <img src={generatedImg} alt="Generated scene" className="w-full rounded-xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ARCMessage({ msg }) {
  const [pills, setPills] = useState(msg.pills || []);
  const [addingPill, setAddingPill] = useState(false);

  const handleEditPill = (id, newPrompt) => {
    setPills(prev => prev.map(p => p.id === id ? { ...p, prompt: newPrompt } : p));
  };

  const addBRoll = async () => {
    setAddingPill(true);
    const newId = String(pills.length + 1);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this viral ad template analysis: ${msg.analysis?.scene ? JSON.stringify(msg.analysis.scene) : 'unknown scene'}, generate 1 new creative B-roll scene cut prompt. Return JSON: { "label": "B-Roll Cut", "prompt": "detailed cinematic b-roll prompt" }`,
        response_json_schema: { type: "object", properties: { label: { type: "string" }, prompt: { type: "string" } } }
      });
      setPills(prev => [...prev, { id: newId, label: res.label || "New B-Roll", prompt: res.prompt || "B-roll scene", type: "broll" }]);
    } catch (e) { console.error(e); }
    setAddingPill(false);
  };

  if (msg.role === 'user') {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="flex justify-end mb-4">
        <div className="max-w-xs">
          {msg.imageUrl && (
            <div className="mb-2 rounded-2xl overflow-hidden border border-white/10">
              <img src={msg.imageUrl} alt="Uploaded" className="w-full max-h-64 object-cover" />
            </div>
          )}
          {msg.text && (
            <div className="bg-white/10 border border-white/15 rounded-2xl rounded-tr-sm px-4 py-3">
              <p className="text-sm text-white">{msg.text}</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ARC response
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30 mt-1">
        <Zap className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-lg">
        {/* Summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 mb-3">
          <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
        </div>

        {/* Analysis breakdown */}
        {msg.analysis?.scene && (
          <div className="bg-gradient-to-br from-violet-600/10 to-cyan-600/10 border border-violet-500/20 rounded-2xl p-4 mb-3">
            <p className="text-xs font-bold text-violet-400 mb-2 uppercase tracking-wider">Template Decoded</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(msg.analysis.scene).map(([k, v]) => (
                <div key={k} className="bg-black/20 rounded-lg p-2">
                  <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">{k.replace('_', ' ')}</p>
                  <p className="text-xs text-white/80">{v}</p>
                </div>
              ))}
            </div>
            {msg.analysis.hook_formula && (
              <div className="mt-2 bg-black/20 rounded-lg p-2">
                <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Hook Formula</p>
                <p className="text-xs text-white/80">{msg.analysis.hook_formula}</p>
              </div>
            )}
          </div>
        )}

        {/* Scene Prompts (pills) */}
        {pills.length > 0 && (
          <div>
            <p className="text-xs text-white/40 mb-2 uppercase tracking-wider font-semibold">Scene Prompts</p>
            {pills.map((pill, i) => (
              <PromptPill key={pill.id} pill={pill} index={i + 1} onEdit={handleEditPill} />
            ))}
            <button onClick={addBRoll} disabled={addingPill}
              className="flex items-center gap-2 w-full py-2 rounded-xl border border-dashed border-white/20 hover:border-white/40 text-xs text-white/40 hover:text-white/60 transition-all justify-center">
              {addingPill ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {addingPill ? "Generating B-Roll..." : "Add B-Roll Cut"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function ARCPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'arc',
      text: "Welcome. I'm ARC — your viral template decoder. Drop any TikTok, Reel, or YouTube Short screenshot and I'll reverse-engineer the exact formula, identify every overlay and scene element, then hand you ready-to-use prompts to recreate it with your own brand.",
      pills: []
    }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const processImage = async (file) => {
    const uploadRes = await base44.integrations.Core.UploadFile({ file });
    const imageUrl = uploadRes.file_url;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', imageUrl, text: input || null }]);
    setInput('');
    setThinking(true);

    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `${ARC_SYSTEM}\n\nAnalyze this viral video ad template image thoroughly. Extract every visual element, text overlay, scene type, and hook mechanism. Return the structured JSON as specified.`,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            scene: { type: "object" },
            overlays: { type: "object" },
            hook_formula: { type: "string" },
            template_name: { type: "string" },
            pills: { type: "array" },
            summary: { type: "string" }
          }
        }
      });

      setThinking(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'arc',
        text: analysis.summary || "I've analyzed this template. Here are the recreation prompts:",
        analysis,
        pills: analysis.pills || []
      }]);
    } catch (e) {
      setThinking(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'arc',
        text: "I had trouble analyzing that image. Please try again with a clearer screenshot.",
        pills: []
      }]);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    await processImage(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSendText = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userMsg }]);
    setThinking(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${ARC_SYSTEM}\n\nUser message: ${userMsg}\n\nRespond helpfully about viral video templates and content creation. If they describe a scene, generate 2-3 prompt pills for it.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            pills: { type: "array" }
          }
        }
      });
      setThinking(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'arc',
        text: res.summary || res,
        pills: res.pills || [],
        analysis: null
      }]);
    } catch (e) {
      setThinking(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'arc', text: "Let me try that again. What kind of template are you looking to recreate?", pills: [] }]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ background: "radial-gradient(ellipse at 20% 20%, rgba(109,40,217,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.05) 0%, transparent 60%), #000" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8 bg-black/40 backdrop-blur-xl sticky top-0 z-20">
        <Link to={createPageUrl("AppStoreV2")}>
          <button className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </button>
        </Link>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-black text-white tracking-tight">ARC</h1>
          <p className="text-[10px] text-white/40">Advanced Remix Composer</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-white/40">Active</span>
        </div>
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {messages.map(msg => (
            <ARCMessage key={msg.id} msg={msg} />
          ))}
          <ThinkingBubble thoughts={THOUGHTS} visible={thinking} />
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Drop zone hint */}
      <AnimatePresence>
        {dragOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-violet-900/40 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-violet-400 pointer-events-none">
            <div className="text-center">
              <Upload className="w-12 h-12 text-violet-400 mx-auto mb-3" />
              <p className="text-violet-300 font-bold text-lg">Drop to Analyze</p>
              <p className="text-violet-400/60 text-sm">ARC will decode this template</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div
        className="border-t border-white/8 bg-black/60 backdrop-blur-xl px-4 py-3"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-violet-500/40 transition-colors">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
              placeholder="Ask ARC or drop a viral video screenshot..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
              disabled={thinking}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors flex-shrink-0"
              title="Upload image"
            >
              <Upload className="w-3.5 h-3.5 text-white/50" />
            </button>
            <button
              onClick={handleSendText}
              disabled={thinking || !input.trim()}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-violet-500/20 disabled:opacity-40 transition-all hover:scale-105"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-center text-[10px] text-white/20 mt-2">Upload TikToks · Reels · YouTube Shorts · Ad screenshots</p>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }} />
    </div>
  );
}