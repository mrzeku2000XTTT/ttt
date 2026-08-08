import React, { useState } from "react";
import { FileCode, Server, Bot, Database, Brain, Settings, Zap, Plus, Trash2, Cpu, Wallet, Sparkles } from "lucide-react";

/* ---------- Overview ---------- */
export function OverviewPanel({ files, messages, buildMode, model, walletKit, onJump }) {
  const stats = [
    { label: "Files", value: files.length, icon: FileCode, color: "#007AFF" },
    { label: "Messages", value: messages.length, icon: Sparkles, color: "#AF52DE" },
    { label: "Build mode", value: buildMode, icon: Server, color: "#34C759" },
    { label: "Model", value: model === "ttt_agent_1" ? "Agent 1" : model, icon: Cpu, color: "#FF9500" },
    { label: "Wallet kit", value: walletKit ? "On" : "Off", icon: Wallet, color: "#007AFF" },
  ];
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1D1D1F] mb-1 tracking-tight">Overview</h2>
        <p className="text-xs text-[#86868B]">Your project at a glance.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span className="text-[11px] text-[#86868B] font-medium">{s.label}</span>
              </div>
              <div className="text-[#1D1D1F] font-bold text-sm capitalize truncate">{s.value}</div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onJump("code")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-black/[0.08] hover:border-[#007AFF]/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#1D1D1F] hover:text-[#007AFF] text-xs font-bold transition-all">
          <FileCode className="w-3.5 h-3.5" /> Open Code
        </button>
        <button onClick={() => onJump("live")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-black/[0.08] hover:border-[#007AFF]/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#1D1D1F] hover:text-[#007AFF] text-xs font-bold transition-all">
          <Server className="w-3.5 h-3.5" /> Open Live
        </button>
        <button onClick={() => onJump("agents")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-black/[0.08] hover:border-[#007AFF]/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#1D1D1F] hover:text-[#007AFF] text-xs font-bold transition-all">
          <Bot className="w-3.5 h-3.5" /> Configure Agents
        </button>
      </div>
    </div>
  );
}

/* ---------- Agents ---------- */
export function AgentsPanel({ onGenerate, loading }) {
  const [agentPrompt, setAgentPrompt] = useState("");
  const presets = [
    "Build me an agentic app with a proper workflow: a research agent that gathers data, a planner agent that creates a task list, and an executor agent that runs each task and reports results.",
    "Add an AI agent to this app that can answer user questions, search the web, and save notes to a local database.",
    "Add a multi-agent workflow: one agent monitors crypto prices and alerts, another auto-creates a summary, and a third posts it to a feed.",
  ];
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1D1D1F] mb-1 tracking-tight">Agents</h2>
        <p className="text-xs text-[#86868B]">Add real AI agents and workflows to your build.</p>
      </div>
      <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <label className="text-xs text-[#6B7280] mb-2 block font-medium">Describe the agentic app you want</label>
        <textarea
          value={agentPrompt}
          onChange={e => setAgentPrompt(e.target.value)}
          placeholder="Build me an agentic app with a proper workflow..."
          rows={4}
          className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-lg px-3 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF]/50 focus:bg-white resize-none transition-colors"
        />
        <button
          onClick={() => agentPrompt.trim() && onGenerate(agentPrompt)}
          disabled={loading || !agentPrompt.trim()}
          className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#007AFF] text-white text-sm font-bold hover:bg-[#0051D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Zap className="w-4 h-4" />}
          Build Agentic App
        </button>
      </div>
      <div>
        <div className="text-xs text-[#86868B] font-medium mb-2">Quick starts</div>
        <div className="space-y-2">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => setAgentPrompt(p)}
              className="w-full text-left p-3 rounded-lg bg-white border border-black/[0.06] hover:border-[#007AFF]/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-xs text-[#6B7280] hover:text-[#1D1D1F] transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Database ---------- */
export function DatabasePanel({ files }) {
  const hasDb = files.some(f => f.path.includes("database") || f.path.includes("db") || f.path.includes("store"));
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1D1D1F] mb-1 tracking-tight">Database</h2>
        <p className="text-xs text-[#86868B]">Local storage and data persistence for your app.</p>
      </div>
      {hasDb ? (
        <div className="bg-[#34C759]/10 border border-[#34C759]/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-[#34C759]" />
            <span className="text-sm font-bold text-[#1D1D1F]">Database detected</span>
          </div>
          <p className="text-xs text-[#6B7280]">Your project has data storage files. They persist locally in the browser via localStorage / IndexedDB.</p>
        </div>
      ) : (
        <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-[#86868B]" />
            <span className="text-sm font-bold text-[#1D1D1F]">No database yet</span>
          </div>
          <p className="text-xs text-[#86868B] mb-3">Ask the builder to add data persistence: "Add a local database to store and retrieve user data."</p>
        </div>
      )}
      <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="text-xs text-[#6B7280] font-medium mb-2">How data works in TTT Builder apps</div>
        <ul className="text-xs text-[#86868B] space-y-1.5 leading-relaxed">
          <li>• Static apps use <code className="text-[#007AFF] bg-[#007AFF]/10 px-1 rounded">localStorage</code> / <code className="text-[#007AFF] bg-[#007AFF]/10 px-1 rounded">IndexedDB</code> — data stays in the browser.</li>
          <li>• React/npm apps can use any client-side store (Zustand, Jotai, or raw localStorage).</li>
          <li>• Data never leaves the device unless you explicitly fetch() to an external API.</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------- Memory ---------- */
const MEMORY_KEY = "ttt_builder_memory_notes";
export function MemoryPanel() {
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || "[]"); } catch { return []; }
  });
  const [text, setText] = useState("");

  const save = () => {
    if (!text.trim()) return;
    const next = [...notes, { id: Date.now(), text: text.trim(), at: new Date().toISOString() }];
    setNotes(next);
    localStorage.setItem(MEMORY_KEY, JSON.stringify(next));
    setText("");
  };
  const remove = (id) => {
    const next = notes.filter(n => n.id !== id);
    setNotes(next);
    localStorage.setItem(MEMORY_KEY, JSON.stringify(next));
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1D1D1F] mb-1 tracking-tight">Memory</h2>
        <p className="text-xs text-[#86868B]">Persistent context the builder remembers across sessions.</p>
      </div>
      <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <label className="text-xs text-[#6B7280] mb-2 block font-medium">Add a memory note</label>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            placeholder="e.g. Always use dark theme with Kaspa green accents"
            className="flex-1 bg-[#F5F5F7] border border-black/[0.08] rounded-lg px-3 py-2 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF]/50 focus:bg-white transition-colors"
          />
          <button onClick={save} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#007AFF] text-white text-sm font-bold hover:bg-[#0051D5] transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {notes.length === 0 && (
          <div className="text-center py-8 text-[#86868B] text-xs">No memory notes yet.</div>
        )}
        {notes.map(n => (
          <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <Brain className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#1D1D1F]">{n.text}</div>
              <div className="text-[10px] text-[#86868B] mt-1">{new Date(n.at).toLocaleString()}</div>
            </div>
            <button onClick={() => remove(n.id)} className="text-[#86868B] hover:text-[#FF3B30] transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */
export function SettingsPanel({ buildMode, onChangeBuildMode, model, onChangeModel, walletKit, onChangeWalletKit, loading }) {
  const [localLLM, setLocalLLM] = useState(() => {
    try { return localStorage.getItem("ttt_builder_local_llm") || ""; } catch { return ""; }
  });
  const saveLocalLLM = (v) => {
    setLocalLLM(v);
    try { localStorage.setItem("ttt_builder_local_llm", v); } catch {}
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1D1D1F] mb-1 tracking-tight">Settings</h2>
        <p className="text-xs text-[#86868B]">Configure your build environment.</p>
      </div>

      {/* Build mode */}
      <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="text-xs text-[#6B7280] font-medium mb-3">Build mode</div>
        <div className="flex gap-2">
          {["html", "react"].map(m => (
            <button
              key={m}
              onClick={() => onChangeBuildMode(m)}
              disabled={loading}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                buildMode === m ? "bg-[#007AFF] text-white" : "bg-[#F5F5F7] text-[#6B7280] hover:text-[#1D1D1F]"
              }`}
            >
              {m === "html" ? "Static HTML" : "React / Vite"}
            </button>
          ))}
        </div>
      </div>

      {/* Model */}
      <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="text-xs text-[#6B7280] font-medium mb-3">AI model</div>
        <div className="flex gap-2">
          {[
            { id: "ttt_agent_1", label: "TTT Agent 1" },
            { id: "claude_opus_4_8", label: "Claude Opus" },
            { id: "claude_sonnet_4_6", label: "Claude Sonnet" },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => onChangeModel(m.id)}
              disabled={loading}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                model === m.id ? "bg-[#007AFF] text-white" : "bg-[#F5F5F7] text-[#6B7280] hover:text-[#1D1D1F]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wallet kit */}
      <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6B7280] font-medium">Kaspa wallet kit</div>
            <div className="text-[11px] text-[#86868B] mt-0.5">Inject the native Kaspa wallet into every build</div>
          </div>
          <button
            onClick={() => onChangeWalletKit(!walletKit)}
            disabled={loading}
            className={`relative w-11 h-6 rounded-full transition-colors ${walletKit ? "bg-[#34C759]" : "bg-[#D2D2D7]"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${walletKit ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Local LLM */}
      <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-4 h-4 text-[#86868B]" />
          <div className="text-xs text-[#6B7280] font-medium">Local LLM endpoint</div>
        </div>
        <p className="text-[11px] text-[#86868B] mb-3">Point to a local LLM server (e.g. Ollama at http://localhost:11434). Used as a fallback model for generation.</p>
        <input
          value={localLLM}
          onChange={e => saveLocalLLM(e.target.value)}
          placeholder="http://localhost:11434"
          className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-lg px-3 py-2 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF]/50 focus:bg-white transition-colors"
        />
      </div>
    </div>
  );
}