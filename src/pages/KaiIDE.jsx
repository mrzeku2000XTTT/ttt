import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, Sparkles, Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { KAI_DEV_KNOWLEDGE } from "@/components/kaspa/kaiDevKnowledge";
import FullScreenIDECodeBlock from "@/components/kaspa/FullScreenIDECodeBlock";

const TABS = [
  { key: "plan", label: "📋 Plan" },
  { key: "entities", label: "🗄️ Entities" },
  { key: "pages", label: "📄 Pages" },
  { key: "functions", label: "⚙️ Functions" },
  { key: "deploy", label: "🚀 Deploy" },
];

const SUGGESTIONS = [
  "Kaspa wallet tracker with balance alerts",
  "KAS tipping app for creators",
  "Kaspa mining dashboard with hashrate stats",
  "KRC-20 token portfolio viewer",
  "P2P KAS marketplace with escrow",
  "Kaspa whale watcher with notifications",
];

export default function KaiIDEPage() {
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState("input"); // input | building | done
  const [status, setStatus] = useState("");
  const [ideData, setIdeData] = useState(null);
  const [activeTab, setActiveTab] = useState("plan");
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (phase === "input" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [phase]);

  const buildApp = async (appIdea) => {
    if (!appIdea.trim()) return;
    setPhase("building");
    setError(null);
    setStatus("🏗️ Calling KaiArchitect…");

    try {
      // Step 1: Call kaiArchitect
      const archRes = await fetch("https://kaspa-b3ad561a.base44.app/functions/kaiArchitect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: appIdea }),
      });
      const archData = await archRes.json();
      const architectPrompt = archData?.architect_prompt || archData?.prompt || "";

      if (!architectPrompt) {
        setError("KaiArchitect couldn't plan this app. Try being more specific.");
        setPhase("input");
        return;
      }

      setStatus("📚 Loading Kaspa context + dev knowledge…");
      await new Promise((r) => setTimeout(r, 500));
      setStatus("✅ Plan ready — writing full code now…");
      await new Promise((r) => setTimeout(r, 400));
      setStatus("🧠 Generating entities, pages, functions…");

      // Step 2: Generate full app with InvokeLLM + KAI_DEV_KNOWLEDGE
      const codeResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are KAI — a Kaspa-native AI developer agent that vibe codes full apps like Claude Code.

${KAI_DEV_KNOWLEDGE}

## ARCHITECT CONTEXT (from kaiArchitect):
${architectPrompt}

## CRITICAL OUTPUT FORMAT
You MUST respond with ONLY a valid JSON object. No markdown. No code fences. No text before or after.

Return this exact JSON structure:

{
  "app_name": "string — short name",
  "description": "string — 1-2 sentence description",
  "kaspa_apis": ["array of API URLs this app uses"],
  "estimated_time": "string — e.g. '5 minutes'",
  "entities": [
    {
      "name": "EntityName",
      "schema": {
        "type": "object",
        "properties": { ... fields with types ... },
        "required": ["field1"]
      }
    }
  ],
  "pages": [
    {
      "name": "PageName",
      "code": "full JSX code — import { EntityName } from '@/api/entities' — use EntityName.list(), .create(), .filter(), .update(), .delete() — Tailwind dark theme bg-gray-900 + teal-400 accent — mobile-first — complete working code"
    }
  ],
  "functions": [
    {
      "name": "functionName",
      "code": "full Deno function code — import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25'; Deno.serve(async (req) => { ... }); — handle OPTIONS for CORS — use base44.asServiceRole.entities"
    }
  ],
  "deploy_steps": [
    "Entities → New Entity → [name] → paste schema → Save",
    "Pages → New Page → [name] → paste JSX → Save",
    "Functions → New Function → [name] → paste TS → Save & Deploy",
    "Publish App → live ✅"
  ],
  "suggested_upgrades": ["upgrade 1", "upgrade 2", "upgrade 3"]
}

RULES:
- Max 3 entities, 3 pages, 2 functions
- ZERO placeholders. Complete working code only.
- Every app uses at least one live Kaspa API
- Always dark UI: bg-gray-900 body, bg-gray-800 cards, teal-400 accent
- Mobile-first
- Every response header needs CORS

USER'S APP IDEA: "${appIdea}"

Respond with ONLY the JSON object.`,
        model: "claude_sonnet_4_6",
      });

      // Parse response
      let parsed;
      if (typeof codeResponse === "string") {
        const cleaned = codeResponse.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        parsed = JSON.parse(cleaned);
      } else {
        parsed = codeResponse;
      }

      setIdeData(parsed);
      setActiveTab("plan");
      setPhase("done");
      setStatus("");
    } catch (err) {
      console.error("KAI IDE error:", err);
      setError("Something went wrong. Try again or describe your app differently.");
      setPhase("input");
    }
  };

  const reset = () => {
    setPhase("input");
    setIdeData(null);
    setIdea("");
    setError(null);
    setStatus("");
    setActiveTab("plan");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ background: "rgba(8,8,14,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <span className="text-sm font-bold text-cyan-400 tracking-wide">KAI IDE</span>
            {ideData?.app_name && (
              <span className="text-xs text-white/30 font-mono ml-2">— {ideData.app_name}</span>
            )}
          </div>
        </div>
        {phase === "done" && (
          <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-white/10"
            style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "rgba(6,182,212,1)" }}>
            <Sparkles className="w-3.5 h-3.5" />
            New App
          </button>
        )}
      </div>

      <div className="pt-16 pb-8 px-4">
        {/* INPUT PHASE */}
        <AnimatePresence mode="wait">
          {phase === "input" && (
            <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mt-16 sm:mt-24">
              {/* Hero */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-bold"
                  style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "rgba(6,182,212,0.9)" }}>
                  <Zap className="w-3 h-3" /> Powered by KAI + kaiArchitect
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">What do you want to build?</h1>
                <p className="text-white/40 text-sm sm:text-base">Describe your Kaspa app idea and KAI will generate the full code — entities, pages, functions, and deploy instructions.</p>
              </div>

              {/* Input */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(20,20,30,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-start gap-3 p-4">
                  <textarea
                    ref={inputRef}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); buildApp(idea); } }}
                    placeholder="e.g. Build me a Kaspa wallet tracker that shows balance and recent transactions..."
                    className="flex-1 bg-transparent text-white/90 outline-none placeholder-white/25 resize-none min-h-[80px] text-sm sm:text-base"
                    style={{ fontSize: "16px" }}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between px-4 pb-3">
                  <span className="text-[10px] text-white/20">Press Enter to build</span>
                  <button
                    onClick={() => buildApp(idea)}
                    disabled={!idea.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30 hover:scale-105"
                    style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.5), rgba(168,85,247,0.5))", border: "1px solid rgba(6,182,212,0.4)", color: "white" }}>
                    <Sparkles className="w-4 h-4" />
                    Build It
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 rounded-xl text-sm text-red-400 font-medium" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  ❌ {error}
                </div>
              )}

              {/* Suggestions */}
              <div className="mt-6">
                <div className="text-[10px] font-bold text-white/25 uppercase tracking-wider mb-3 text-center">Try these ideas</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => { setIdea(s); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* BUILDING PHASE */}
          {phase === "building" && (
            <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-lg mx-auto mt-32 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(6,182,212,0.15)" }} />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(6,182,212,0.1)", border: "2px solid rgba(6,182,212,0.3)" }}>
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              </div>
              <div className="text-lg font-bold text-white mb-2">Building your app…</div>
              <div className="text-sm text-cyan-400/80 font-medium animate-pulse">{status}</div>
              <div className="text-xs text-white/20 mt-4">This usually takes 15-30 seconds</div>
            </motion.div>
          )}

          {/* DONE PHASE — Full IDE */}
          {phase === "done" && ideData && (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto">
              {/* Summary bar */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="text-lg font-bold text-white">{ideData.app_name || "Your App"}</div>
                <div className="text-xs text-white/40">{ideData.description}</div>
                {ideData.estimated_time && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(6,182,212,0.15)", color: "rgba(6,182,212,0.9)" }}>
                    ⏱ {ideData.estimated_time}
                  </span>
                )}
              </div>

              {/* IDE Frame */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(12,12,20,0.95)", border: "1px solid rgba(6,182,212,0.2)", boxShadow: "0 16px 64px rgba(0,0,0,0.5)" }}>
                {/* Tab bar */}
                <div className="flex overflow-x-auto scrollbar-hide" style={{ background: "rgba(6,182,212,0.05)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    let count = 0;
                    if (tab.key === "entities") count = (ideData.entities || []).length;
                    if (tab.key === "pages") count = (ideData.pages || []).length;
                    if (tab.key === "functions") count = (ideData.functions || []).length;
                    return (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className="flex-shrink-0 px-5 py-3 text-sm font-bold transition-all relative whitespace-nowrap"
                        style={{
                          background: isActive ? "rgba(6,182,212,0.12)" : "transparent",
                          color: isActive ? "rgba(6,182,212,1)" : "rgba(255,255,255,0.35)",
                          borderBottom: isActive ? "2px solid rgba(6,182,212,0.8)" : "2px solid transparent",
                        }}>
                        {tab.label}
                        {count > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px]" style={{ background: "rgba(6,182,212,0.2)", color: "rgba(6,182,212,0.8)" }}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div className="p-5 min-h-[400px]">
                  {activeTab === "plan" && (
                    <div className="space-y-5">
                      <div>
                        <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">App Name</div>
                        <div className="text-xl font-bold text-white">{ideData.app_name || "Untitled"}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Description</div>
                        <div className="text-sm text-white/70 leading-relaxed">{ideData.description}</div>
                      </div>
                      {ideData.kaspa_apis?.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Kaspa APIs Used</div>
                          <div className="space-y-1.5">
                            {ideData.kaspa_apis.map((api, i) => (
                              <div key={i} className="text-xs font-mono px-3 py-2 rounded-lg" style={{ background: "rgba(6,182,212,0.08)", color: "rgba(6,182,212,0.9)", border: "1px solid rgba(6,182,212,0.15)" }}>
                                {api}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "entities" && (
                    <div className="space-y-5">
                      {(ideData.entities || []).length === 0 && <div className="text-sm text-white/30 text-center py-8">No entities</div>}
                      {(ideData.entities || []).map((entity, i) => (
                        <div key={i}>
                          <div className="text-sm font-bold text-white/60 mb-2">🗄️ {entity.name}.json</div>
                          <FullScreenIDECodeBlock code={JSON.stringify(entity.schema, null, 2)} language="json" filename={`${entity.name}.json`} />
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "pages" && (
                    <div className="space-y-5">
                      {(ideData.pages || []).length === 0 && <div className="text-sm text-white/30 text-center py-8">No pages</div>}
                      {(ideData.pages || []).map((page, i) => (
                        <div key={i}>
                          <div className="text-sm font-bold text-white/60 mb-2">📄 {page.name}.jsx</div>
                          <FullScreenIDECodeBlock code={page.code} language="jsx" filename={`${page.name}.jsx`} />
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "functions" && (
                    <div className="space-y-5">
                      {(ideData.functions || []).length === 0 && <div className="text-sm text-white/30 text-center py-8">No functions</div>}
                      {(ideData.functions || []).map((fn, i) => (
                        <div key={i}>
                          <div className="text-sm font-bold text-white/60 mb-2">⚙️ {fn.name}.js</div>
                          <FullScreenIDECodeBlock code={fn.code} language="typescript" filename={`${fn.name}.js`} />
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "deploy" && (
                    <div className="space-y-4">
                      <div className="text-sm font-bold text-white/60 mb-3">🚀 Deploy Instructions</div>
                      {(ideData.deploy_steps || []).map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{ background: "rgba(6,182,212,0.2)", color: "rgba(6,182,212,1)" }}>
                            {i + 1}
                          </div>
                          <div className="text-sm text-white/70 leading-relaxed pt-1">{step}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Suggested upgrades */}
              {ideData.suggested_upgrades?.length > 0 && (
                <div className="mt-6 rounded-xl p-4" style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <div className="text-xs font-bold text-purple-400/80 uppercase tracking-wider mb-3">Want me to add?</div>
                  <div className="flex flex-wrap gap-2">
                    {ideData.suggested_upgrades.map((u, i) => (
                      <button key={i} onClick={() => { setIdea(u); setPhase("input"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                        style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "rgba(192,132,252,0.9)" }}>
                        <ChevronRight className="w-3 h-3" />
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}