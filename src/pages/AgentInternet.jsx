import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowUpRight, BookOpen, Bot, Code2, Network,
  Sparkles, Users, Zap, MessageSquare, Check, Globe, Cpu,
} from "lucide-react";

// Onboarding paths — role-based quick-start into the agent ecosystem
const PATHS = [
  {
    id: 'newcomer',
    icon: Sparkles,
    title: "New to Agents",
    desc: "Start from zero. Learn what agents are, how they talk, and build your first one.",
    primary: { label: "Hello-Agents Tutorial", to: "https://github.com/datawhalechina/hello-agents", external: true },
    secondary: { label: "Explore TTT Agents", to: "/AIAgentHub" },
    accent: "from-cyan-500/20 to-blue-500/20",
  },
  {
    id: 'builder',
    icon: Code2,
    title: "I Build Agents",
    desc: "Frameworks, protocols & open-source code to ship your own agents.",
    primary: { label: "A2A Protocol Docs", to: "https://github.com/a2aproject/A2A", external: true },
    secondary: { label: "Open Blueprint", to: "/Explore" },
    accent: "from-emerald-500/20 to-teal-500/20",
  },
  {
    id: 'business',
    icon: Users,
    title: "I Run a Business",
    desc: "Deploy agents for your team — enterprise platforms, no-code workflows, RAG.",
    primary: { label: "Wanwu Platform", to: "https://gitee.com/unicomai/wanwu", external: true },
    secondary: { label: "Agent ZK Workspace", to: "/AgentZK" },
    accent: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: 'connect',
    icon: Network,
    title: "I Want Agents to Talk",
    desc: "Make agents across frameworks & vendors discover and collaborate with each other.",
    primary: { label: "Agent2Agent Protocol", to: "https://github.com/a2aproject/A2A", external: true },
    secondary: { label: "Awesome AGI Agents", to: "https://github.com/yzfly/awesome-agi-agents", external: true },
    accent: "from-purple-500/20 to-pink-500/20",
  },
];

const QUICK_AGENTS = [
  { name: "Agent ZK", desc: "Blockchain-linked AI agent identity", to: "/AgentZK", icon: Bot },
  { name: "Zeku AI", desc: "Knowledge-powered research agent", to: "/ZekuAI", icon: Sparkles },
  { name: "Idea Lab", desc: "Generate product concepts from any idea", to: "/Explore", icon: Zap },
  { name: "Agent Hub", desc: "Browse the full TTT agent roster", to: "/AIAgentHub", icon: Users },
];

// Real content read from the open-source repos (Gitee + GitHub).
// Each entry is grounded in the actual README I fetched — not hallucinated.
const CURATED_DOCS = [
  {
    name: "Agent2Agent (A2A) Protocol",
    platform: "github",
    url: "https://github.com/a2aproject/A2A",
    blurb: "Google-initiated, Linux Foundation open protocol for inter-agent communication. The literal backbone of the Agent Internet — agents discover & collaborate without exposing internals.",
    tagline: "An open protocol enabling communication and interoperability between opaque agentic applications.",
    keyFacts: [
      "JSON-RPC 2.0 over HTTP(S) as the standard transport",
      "Agent Cards: each agent publishes its capabilities & connection info",
      "Supports sync request/response, streaming (SSE) & async push notifications",
      "Agents collaborate on long-running tasks without sharing memory or tools",
      "SDKs: Python, Go, JS, Java, .NET, Rust (pip install a2a-sdk)",
      "Apache 2.0 · Linux Foundation · complements MCP",
    ],
    excerpt: "The A2A protocol addresses a critical challenge in the AI landscape: enabling gen AI agents, built on diverse frameworks by different companies running on separate servers, to communicate and collaborate effectively — as agents, not just as tools. With A2A, agents can: Discover each other's capabilities. Negotiate interaction modalities (text, forms, media). Securely collaborate on long-running tasks. Operate without exposing their internal state, memory, or tools.",
  },
  {
    name: "OpenAgents",
    platform: "gitee",
    url: "https://gitee.com/wang-yang-y/OpenAgents",
    blurb: "Open platform for hosting language agents in the wild of everyday life. Gitee mirror of xlang-ai/OpenAgents (HKU NLP group). Three real-world agents, fully open source.",
    tagline: "An open platform for using and hosting language agents in the wild of everyday life.",
    keyFacts: [
      "Data Agent — data analysis with Python/SQL + data tools",
      "Plugins Agent — 200+ daily-use third-party plugins (shopping, weather, science...)",
      "Web Agent — autonomous browsing via a Chrome extension",
      "Full stack: backend + frontend + WebBot extension, easy localhost deploy",
      "Chat Web UI optimized for swift responses & common failures",
      "Apache 2.0 · paper: arxiv.org/abs/2310.10634",
    ],
    excerpt: "We built OpenAgents, an open platform for using and hosting language agents in the wild of everyday life. We have now implemented three agents: 1. Data Agent for data analysis with Python/SQL and data tools; 2. Plugins Agent with 200+ daily tools; 3. Web Agent for autonomous web browsing. OpenAgents can analyze data, call plugins, control your browser as ChatGPT Plus, but with OPEN CODE for easy deployment, full stack, Chat Web UI, and agent methods.",
  },
  {
    name: "UnicomAI / 万物 Wanwu",
    platform: "gitee",
    url: "https://gitee.com/unicomai/wanwu",
    blurb: "All-in-one, commercial-friendly licensed agent platform built for enterprise. Five core agent capabilities forming a full-stack FDE toolchain.",
    tagline: "All-in-one, commercial-friendly licensed agent development platform for enterprise scenarios.",
    keyFacts: [
      "① RAG/Knowledge Base Agent — high-precision parsing, GraphRAG, 12 file formats, OCR",
      "② Ontology Agent — structured data, deep reasoning & business decision-making",
      "③ Workflow Agent — visual low-code orchestration, zero-code skill invocation, MCP",
      "④ GUI Agent — operates apps without APIs, UI-level interaction, sandboxed Docker",
      "⑤ General Agent + Skill Dev — natural-language dual-engine, professional reasoning",
      "3 deployment paths: out-of-the-box platform · API integration · UniClaw client",
    ],
    excerpt: "Wanwu aims to deliver all tooling capabilities required by Forward Deployed Engineers (FDEs), forming a full-stack FDE toolchain. It covers core enterprise assets, centers on customers, deeply integrates capabilities into customer systems, dramatically lowers the barrier to AI project delivery, and bridges the final mile from build to field.",
  },
  {
    name: "Hello-Agents (从零开始构建智能体)",
    platform: "github",
    url: "https://github.com/datawhalechina/hello-agents",
    blurb: "Datawhale community systematic agent-learning curriculum. 16 chapters across 5 parts — the most complete Chinese-language guide to building agents from zero.",
    tagline: "从基础理论到实际应用，全面掌握智能体系统的设计与实现。",
    keyFacts: [
      "Ch.1-3: Agent fundamentals, history & LLM basics",
      "Ch.4-7: ReAct, Plan-and-Solve, Reflection + Coze/Dify/n8n + LangGraph/AutoGen",
      "Ch.8-12: Memory & retrieval, context engineering, communication protocols, Agentic-RL",
      "Ch.10 智能体通信协议 — MCP, A2A, ANP protocols in depth",
      "Ch.13-16: Travel assistant, DeepResearch agent, Cyber Town, capstone project",
      "Self-built HelloAgents framework on OpenAI native API · Datawhale free & open",
    ],
    excerpt: "Hello-Agents 是 Datawhale 社区的系统性智能体学习教程... 第十章 智能体通信协议: MCP、A2A、ANP 等协议解析. 本教程旨在带领大家深入理解并构建 AI Native Agent —— 穿透框架表象，从智能体的核心原理出发，深入其核心架构，理解其经典范式，并最终亲手构建起属于自己的多智能体应用.",
  },
  {
    name: "Awesome-AGI-Agents",
    platform: "github",
    url: "https://github.com/yzfly/awesome-agi-agents",
    blurb: "Curated Chinese list of AGI agent resources, papers, projects & protocols. The map of the 2024-2026 agent ecosystem.",
    tagline: "Agents (智能体) 精选资源合集，持续更新中.",
    keyFacts: [
      "LangGraph — stateful, multi-role agent orchestration via graphs",
      "CrewAI — role-based multi-agent collaboration",
      "OpenAI Agents SDK — lightweight orchestration w/ handoffs & guardrails",
      "OpenHands & SWE-agent — autonomous software engineering agents",
      "MCP · Browser Use · smolagents · Pydantic AI · A2A · AG-UI",
      "Claude Code · Gemini CLI · Cline · Google ADK · Microsoft Agent Framework",
    ],
    excerpt: "Awesome-AGI-Agents — Agents (智能体) 精选资源合集. 2024-2026 重要项目: LangGraph, CrewAI, OpenAI Agents SDK, OpenHands, SWE-agent, Model Context Protocol (MCP), Browser Use, smolagents, Pydantic AI, A2A (Agent2Agent), Claude Code, Gemini CLI, Cline, Google ADK, Microsoft Agent Framework, AG-UI.",
  },
];

const SERIF = "'Fraunces', Georgia, serif";

export default function AgentInternetPage() {
  const [expanded, setExpanded] = useState(0);

  return (
    <div className="min-h-screen" style={{ background: "#000", color: "#fff", fontFamily: SERIF }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10" style={{ background: "rgba(0,0,0,0.85)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[14px] font-medium">Back</span>
          </Link>
          <span className="text-[15px] font-semibold tracking-tight">Agent Internet</span>
          <Link to="/AIAgentHub" className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors">
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Agent Hub</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-24">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/80 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Open · Interoperable · On-chain
          </div>
          <h1 className="text-[clamp(2.2rem,7vw,3.8rem)] font-bold leading-[1.02] tracking-tight mb-5">
            Agent Internet
          </h1>
          <p className="text-[15px] sm:text-[17px] text-white/60 leading-relaxed max-w-2xl mb-2">
            An open network where AI agents discover each other, negotiate, and collaborate —
            without exposing their internal memory, tools, or logic.
          </p>
          <p className="text-[13px] text-white/40 leading-relaxed max-w-2xl">
            Grounded in real open-source projects from Chinese developer communities (Gitee & GitHub):
            the <span className="text-white/70">Agent2Agent (A2A) protocol</span>, <span className="text-white/70">OpenAgents</span>,
            <span className="text-white/70"> UnicomAI / Wanwu</span>, and the <span className="text-white/70">Hello-Agents</span> curriculum.
          </p>
        </motion.div>

        {/* Onboarding paths */}
        <div className="mt-14">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-[12px] font-semibold tabular-nums text-white/30">01</span>
            <h2 className="text-[clamp(1.4rem,4vw,2rem)] font-bold tracking-tight">Choose your path</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {PATHS.map((p, i) => {
              const Icon = p.icon;
              const CTA = ({ btn }) => btn.external ? (
                <a href={btn.to} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[12px] font-semibold hover:opacity-90 transition-opacity"
                  style={btn.primary ? { background: "#fff", color: "#000" } : { border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }}>
                  {btn.label} {btn.primary && <ArrowUpRight className="w-3.5 h-3.5" />}
                </a>
              ) : (
                <Link to={btn.to}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[12px] font-semibold hover:opacity-90 transition-opacity"
                  style={btn.primary ? { background: "#fff", color: "#000" } : { border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }}>
                  {btn.label}
                </Link>
              );
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  className={`relative rounded-2xl p-6 border border-white/10 bg-gradient-to-br ${p.accent}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold mb-1">{p.title}</h3>
                      <p className="text-[13px] text-white/60 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <CTA btn={{ ...p.primary, primary: true }} />
                    {p.secondary && <CTA btn={{ ...p.secondary, primary: false }} />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick-start agents */}
        <div className="mt-14">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-[12px] font-semibold tabular-nums text-white/30">02</span>
            <h2 className="text-[clamp(1.4rem,4vw,2rem)] font-bold tracking-tight">Launch a TTT agent now</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_AGENTS.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.name} to={a.to}
                  className="group rounded-xl p-4 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all">
                  <Icon className="w-5 h-5 text-cyan-400 mb-3" />
                  <div className="text-[14px] font-semibold mb-1">{a.name}</div>
                  <div className="text-[11px] text-white/50 leading-snug">{a.desc}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Real docs — curated from what we learned */}
        <div className="mt-16">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-[12px] font-semibold tabular-nums text-white/30">03</span>
            <h2 className="text-[clamp(1.4rem,4vw,2rem)] font-bold tracking-tight">Real open-source references</h2>
          </div>
          <p className="text-[13px] text-white/50 mb-6 max-w-2xl leading-relaxed">
            Read from the actual repos on Gitee (码云) and GitHub. Tap a card to see the real capabilities and excerpt.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {CURATED_DOCS.map((d, i) => {
              const isOpen = expanded === i;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col">
                  <button onClick={() => setExpanded(isOpen ? null : i)}
                    className="text-left p-5 hover:bg-white/5 transition-colors w-full">
                    <div className="flex items-center gap-2 mb-3">
                      {d.platform === 'gitee' ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">Gitee</span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/20">GitHub</span>
                      )}
                    </div>
                    <h3 className="text-[16px] font-bold mb-1.5">{d.name}</h3>
                    <p className="text-[12px] text-white/55 leading-relaxed">{d.blurb}</p>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10 overflow-hidden">
                        <div className="px-5 py-4">
                          <p className="text-[12px] italic text-cyan-300/70 mb-4 leading-relaxed">"{d.tagline}"</p>
                          <div className="space-y-2 mb-4">
                            {d.keyFacts.map((f, k) => (
                              <div key={k} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                <span className="text-[12px] text-white/70 leading-snug">{f}</span>
                              </div>
                            ))}
                          </div>
                          <div className="rounded-lg bg-black/40 border border-white/10 p-3">
                            <p className="text-[11px] text-white/55 leading-relaxed">{d.excerpt}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <a href={d.url} target="_blank" rel="noopener noreferrer"
                    className="mt-auto flex items-center gap-1.5 px-5 py-3 border-t border-white/10 text-[12px] text-cyan-400 hover:bg-white/5 transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    Open source repo
                    <ArrowUpRight className="w-3 h-3 ml-auto" />
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* What is Agent Internet */}
        <div className="mt-16">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-[12px] font-semibold tabular-nums text-white/30">04</span>
            <h2 className="text-[clamp(1.4rem,4vw,2rem)] font-bold tracking-tight">What is the Agent Internet?</h2>
          </div>
          <div className="space-y-4 text-[14px] text-white/65 leading-[1.8] max-w-2xl">
            <p>
              The <strong className="text-white/90">Agent Internet</strong> is the emerging layer where AI agents —
              built on different frameworks, by different vendors, running on separate servers —
              discover each other and collaborate as peers, not just as tools.
            </p>
            <p>
              Its backbone is the open <strong className="text-white/90">Agent2Agent (A2A) protocol</strong> (Google-initiated,
              now under the Linux Foundation): JSON-RPC 2.0 over HTTPS, where each agent publishes an
              <em> Agent Card</em> describing its capabilities. Agents negotiate modalities (text, forms, media),
              collaborate on long-running tasks, and never expose internal state, memory, or proprietary logic.
            </p>
            <p>
              It complements <strong className="text-white/90">MCP</strong> (agents ↔ tools) and <strong className="text-white/90">AG-UI</strong> (agents ↔ user interfaces),
              forming a full open stack. Chinese open-source communities — Datawhale's Hello-Agents curriculum,
              UnicomAI's Wanwu platform, and the OpenAgents project — are building the practical layers on top.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-8">
            {[
              { icon: Network, k: "Discovery", v: "Agent Cards advertise capabilities over HTTPS" },
              { icon: MessageSquare, k: "Interoperability", v: "Any framework · any vendor · any server" },
              { icon: BookOpen, k: "Open Standards", v: "Apache 2.0 · Linux Foundation · community-driven" },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.k} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <Icon className="w-4 h-4 text-cyan-400 mb-2" />
                  <div className="text-[13px] font-semibold mb-1">{c.k}</div>
                  <div className="text-[11px] text-white/50 leading-snug">{c.v}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 text-center">
          <Cpu className="w-6 h-6 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-[20px] font-bold mb-2">Ready to join the Agent Internet?</h3>
          <p className="text-[13px] text-white/60 mb-6 max-w-md mx-auto leading-relaxed">
            Claim your on-chain agent identity and start collaborating with the open agent network.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/AgentZK" className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white text-black text-[13px] font-semibold hover:opacity-90 transition-opacity">
              <Bot className="w-4 h-4" /> Claim Agent ZK
            </Link>
            <Link to="/AIAgentHub" className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-white/20 text-white/80 text-[13px] font-semibold hover:bg-white/10 transition-colors">
              <Users className="w-4 h-4" /> Browse Agent Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}