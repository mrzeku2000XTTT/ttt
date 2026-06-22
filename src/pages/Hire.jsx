import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, Send, Clock, Star, CheckCircle, AlertCircle, Zap, Eye, FileText, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const STAGES = [
  { id: "brief", label: "Job Brief", icon: FileText },
  { id: "analyzing", label: "AI Analysis", icon: Bot },
  { id: "working", label: "Agent Working", icon: Zap },
  { id: "review", label: "Subagent Review", icon: Eye },
  { id: "scored", label: "Score & Pay", icon: Star },
];

const SUBAGENTS = [
  { name: "QualityBot", role: "Code & output quality", color: "#06b6d4" },
  { name: "TimeBot", role: "Effort & complexity", color: "#a855f7" },
  { name: "AccuracyBot", role: "Requirements match", color: "#22c55e" },
];

export default function HirePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentEmail = searchParams.get("agent");
  const agentName = searchParams.get("name");
  const agentSkills = searchParams.get("skills");
  const agentRate = searchParams.get("rate");

  const [stage, setStage] = useState("brief"); // brief | analyzing | working | review | scored
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobOutput, setJobOutput] = useState(""); // what the agent should deliver
  const [currentUser, setCurrentUser] = useState(null);

  // AI analysis state
  const [analysis, setAnalysis] = useState(null); // { complexity, estimatedHours, requiredSkills, breakdown }
  const [agentLog, setAgentLog] = useState([]); // live steps
  const [agentResult, setAgentResult] = useState(null); // delivered output
  const [subagentScores, setSubagentScores] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [suggestedKAS, setSuggestedKAS] = useState(null);
  const [jobStartTime, setJobStartTime] = useState(null);
  const [jobEndTime, setJobEndTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedScore, setExpandedScore] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [agentLog]);

  const addLog = (msg, type = "info") => {
    setAgentLog(prev => [...prev, { msg, type, ts: Date.now() }]);
  };

  // STEP 1: Analyze the job
  const handleAnalyzeJob = async () => {
    if (!jobTitle.trim() || !jobDesc.trim()) return;
    setStage("analyzing");
    setIsRunning(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a job analyst for an AI agent marketplace powered by Kaspa (KAS).
Analyze this job request and return structured data.

Job Title: ${jobTitle}
Job Description: ${jobDesc}
Expected Output: ${jobOutput || "Not specified"}
Agent Skills: ${agentSkills || "General"}
Agent Rate: ${agentRate || "500"} KAS/hour

Return JSON with:
- complexity: "low" | "medium" | "high" 
- estimatedHours: number (0.1 - 8)
- requiredSkills: string[] (top 3-5 skills needed)
- breakdown: string[] (3-5 steps the agent will take)
- estimatedKAS: number (hours * rate, rounded)
- summary: string (one sentence what agent will do)`,
        response_json_schema: {
          type: "object",
          properties: {
            complexity: { type: "string" },
            estimatedHours: { type: "number" },
            requiredSkills: { type: "array", items: { type: "string" } },
            breakdown: { type: "array", items: { type: "string" } },
            estimatedKAS: { type: "number" },
            summary: { type: "string" },
          }
        }
      });
      setAnalysis(res);
      setSuggestedKAS(res.estimatedKAS);
      setStage("brief"); // show analysis, wait for user to confirm
    } catch (e) {
      setAnalysis({ error: "Analysis failed. Please try again." });
      setStage("brief");
    } finally {
      setIsRunning(false);
    }
  };

  // STEP 2: Start the agent
  const handleStartAgent = async () => {
    setStage("working");
    setAgentLog([]);
    setJobStartTime(Date.now());
    setIsRunning(true);

    addLog("🤖 Agent initialized. Reading job brief...", "system");
    addLog(`📋 Task: ${jobTitle}`, "info");

    const steps = analysis?.breakdown || [
      "Parsing requirements",
      "Researching and planning approach",
      "Executing core task",
      "Validating output",
      "Finalizing deliverable",
    ];

    try {
      // Stream-simulate steps with real LLM doing each
      for (let i = 0; i < steps.length; i++) {
        addLog(`⚡ Step ${i + 1}/${steps.length}: ${steps[i]}`, "step");
        await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
      }

      addLog("🧠 Invoking AI to complete the task...", "system");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AI agent hired to complete a job on the Kaspa ecosystem.

Job Title: ${jobTitle}
Job Description: ${jobDesc}
Expected Output: ${jobOutput || "Provide a thorough, professional deliverable"}
Your Skills: ${agentSkills || "General expertise"}

Complete this job thoroughly. Provide a detailed, high-quality deliverable. 
Structure your response with clear sections. Be specific and practical.
This output will be reviewed by subagents and scored for quality.`,
      });

      setAgentResult(result);
      setJobEndTime(Date.now());
      addLog("✅ Task completed. Submitting for review...", "success");

      setTimeout(() => runSubagentReview(result), 600);
    } catch (e) {
      addLog("❌ Agent encountered an error: " + e.message, "error");
      setIsRunning(false);
    }
  };

  // STEP 3: Subagent review
  const runSubagentReview = async (result) => {
    setStage("review");
    addLog("👁️ Subagents reviewing deliverable...", "system");

    const timeTakenMs = (jobEndTime || Date.now()) - (jobStartTime || Date.now());
    const timeTakenMin = Math.max(1, Math.round(timeTakenMs / 60000));

    try {
      const reviewRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a panel of 3 AI subagent reviewers evaluating the output of an AI agent.

Original Job: "${jobTitle}"
Job Description: "${jobDesc}"
Expected Output: "${jobOutput || 'Best effort'}"
Agent Deliverable:
"""
${result}
"""

Score each dimension from 0-100 and give a key point (one sentence):

1. QualityBot - Code & output quality: accuracy, completeness, professionalism
2. TimeBot - Effort & complexity: how hard was this task, was effort appropriate
3. AccuracyBot - Requirements match: did it address what was asked

Also provide:
- overallScore: weighted average (0-100)
- keyPoints: 3 bullet points about the work
- kasRecommendation: number (suggested KAS to pay, based on quality, complexity, and rate of ${agentRate || 500} KAS/hr)`,
        response_json_schema: {
          type: "object",
          properties: {
            qualityScore: { type: "number" },
            qualityNote: { type: "string" },
            timeScore: { type: "number" },
            timeNote: { type: "string" },
            accuracyScore: { type: "number" },
            accuracyNote: { type: "string" },
            overallScore: { type: "number" },
            keyPoints: { type: "array", items: { type: "string" } },
            kasRecommendation: { type: "number" },
          }
        }
      });

      setSubagentScores(reviewRes);
      setFinalScore(reviewRes.overallScore);
      setSuggestedKAS(reviewRes.kasRecommendation || suggestedKAS);
      setStage("scored");
      addLog(`🏆 Review complete. Score: ${reviewRes.overallScore}/100`, "success");
    } catch (e) {
      addLog("Review failed: " + e.message, "error");
      setStage("scored");
    } finally {
      setIsRunning(false);
    }
  };

  const stageIndex = STAGES.findIndex(s => s.id === stage);
  const scoreColor = finalScore >= 80 ? "#22c55e" : finalScore >= 60 ? "#fbbf24" : "#ef4444";

  return (
    <div className="min-h-screen" style={{ background: "#030712" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(3,7,18,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
        <Link to="/Tip">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black text-lg leading-none">HIRE</h1>
          {agentName && <p className="text-xs mt-0.5" style={{ color: "rgba(196,181,253,0.5)" }}>Agent: {agentName}</p>}
        </div>
        <Link to="/">
          <button className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            Home
          </button>
        </Link>
        {/* Stage progress dots */}
        <div className="flex items-center gap-1.5">
          {STAGES.map((s, i) => (
            <div key={s.id} className="w-2 h-2 rounded-full transition-all"
              style={{ background: i < stageIndex ? "#7c3aed" : i === stageIndex ? "#a855f7" : "rgba(139,92,246,0.2)" }} />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Agent card (if coming from directory) */}
        {agentName && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-3"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold">{agentName}</p>
              {agentSkills && <p className="text-xs truncate mt-0.5" style={{ color: "rgba(196,181,253,0.5)" }}>{agentSkills}</p>}
            </div>
            {agentRate && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-mono font-bold" style={{ color: "#fbbf24" }}>⚡ {agentRate}</p>
                <p className="text-[10px]" style={{ color: "rgba(196,181,253,0.4)" }}>KAS/hr</p>
              </div>
            )}
          </div>
        )}

        {/* ── BRIEF STAGE ── */}
        {stage === "brief" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(139,92,246,0.6)" }}>
                {analysis ? "Job Analyzed — Confirm to Start" : "Describe the Job"}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Job Title</label>
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                    placeholder="e.g. Write a KRC-20 token contract, Create a trading strategy..."
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(80,40,140,0.12)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }}
                    disabled={!!analysis} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Full Description</label>
                  <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={4}
                    placeholder="Describe exactly what you need. Be specific about requirements, constraints, and context..."
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                    style={{ background: "rgba(80,40,140,0.12)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }}
                    disabled={!!analysis} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Expected Deliverable</label>
                  <input value={jobOutput} onChange={e => setJobOutput(e.target.value)}
                    placeholder="e.g. Working code, a report, a design spec, a trading signal..."
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{ background: "rgba(80,40,140,0.12)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }}
                    disabled={!!analysis} />
                </div>
              </div>
            </div>

            {/* Analysis result */}
            {analysis && !analysis.error && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-4 rounded-2xl space-y-3"
                style={{ background: "rgba(0,20,50,0.8)", border: "1px solid rgba(59,130,246,0.3)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>AI Job Analysis</p>
                <p className="text-sm text-white/80 leading-relaxed">{analysis.summary}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Complexity", value: analysis.complexity?.toUpperCase() },
                    { label: "Est. Hours", value: `${analysis.estimatedHours}h` },
                    { label: "Est. KAS", value: `${analysis.estimatedKAS} KAS` },
                  ].map(item => (
                    <div key={item.label} className="p-2.5 rounded-xl text-center"
                      style={{ background: "rgba(0,60,180,0.15)", border: "1px solid rgba(0,100,255,0.2)" }}>
                      <p className="text-white font-black text-sm">{item.value}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(96,165,250,0.5)" }}>{item.label}</p>
                    </div>
                  ))}
                </div>
                {analysis.breakdown && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(96,165,250,0.5)" }}>Agent Steps</p>
                    <div className="space-y-1">
                      {analysis.breakdown.map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[10px] font-mono mt-0.5 flex-shrink-0" style={{ color: "rgba(96,165,250,0.4)" }}>{i + 1}.</span>
                          <p className="text-xs" style={{ color: "rgba(200,230,255,0.6)" }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => { setAnalysis(null); }} className="text-xs" style={{ color: "rgba(196,181,253,0.4)" }}>
                  ← Edit job brief
                </button>
              </motion.div>
            )}

            {analysis?.error && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <p className="text-xs text-red-400">{analysis.error}</p>
              </div>
            )}

            {/* CTA */}
            {!analysis ? (
              <button onClick={handleAnalyzeJob}
                disabled={isRunning || !jobTitle.trim() || !jobDesc.trim()}
                className="w-full py-3.5 rounded-2xl text-sm font-black tracking-wide text-white transition-all disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #6d28d9 0%, #a855f7 100%)", border: "1px solid rgba(167,139,250,0.4)", boxShadow: "0 8px 32px rgba(120,50,255,0.3)" }}>
                {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Bot className="w-4 h-4" /> Analyze Job with AI</>}
              </button>
            ) : (
              <button onClick={handleStartAgent}
                disabled={isRunning}
                className="w-full py-3.5 rounded-2xl text-sm font-black tracking-wide text-white transition-all disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", border: "1px solid rgba(16,185,129,0.4)", boxShadow: "0 8px 32px rgba(16,185,129,0.25)" }}>
                <Zap className="w-4 h-4" /> Start Agent · Do the Job
              </button>
            )}
          </motion.div>
        )}

        {/* ── WORKING STAGE ── */}
        {(stage === "working" || stage === "review") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center animate-pulse"
                style={{ background: stage === "review" ? "rgba(139,92,246,0.3)" : "rgba(16,185,129,0.3)" }}>
                {stage === "review" ? <Eye className="w-4 h-4 text-purple-400" /> : <Zap className="w-4 h-4 text-emerald-400" />}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{stage === "review" ? "Subagents Reviewing..." : "Agent Working..."}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {stage === "review" ? "3 subagents evaluating quality" : "AI agent executing your job"}
                </p>
              </div>
            </div>

            {/* Live log */}
            <div ref={logRef} className="rounded-2xl p-4 space-y-2 overflow-y-auto"
              style={{ background: "rgba(0,10,30,0.9)", border: "1px solid rgba(0,80,200,0.2)", maxHeight: "280px", fontFamily: "monospace" }}>
              {agentLog.map((entry, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="text-xs leading-relaxed"
                  style={{ color: entry.type === "error" ? "#f87171" : entry.type === "success" ? "#4ade80" : entry.type === "step" ? "#93c5fd" : "rgba(148,163,184,0.7)" }}>
                  {entry.msg}
                </motion.div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
                  <span className="animate-pulse">▋</span>
                </div>
              )}
            </div>

            {/* Subagent status */}
            {stage === "review" && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {SUBAGENTS.map((bot, i) => (
                  <motion.div key={bot.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                    className="p-3 rounded-xl text-center"
                    style={{ background: "rgba(0,15,40,0.8)", border: `1px solid ${bot.color}30` }}>
                    <div className="w-7 h-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center animate-pulse"
                      style={{ background: `${bot.color}20` }}>
                      <Bot className="w-3.5 h-3.5" style={{ color: bot.color }} />
                    </div>
                    <p className="text-[10px] font-bold text-white">{bot.name}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{bot.role}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SCORED STAGE ── */}
        {stage === "scored" && subagentScores && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Final score hero */}
            <div className="p-6 rounded-3xl text-center"
              style={{ background: "linear-gradient(135deg, rgba(0,15,40,0.95), rgba(0,8,25,0.99))", border: `2px solid ${scoreColor}40`, boxShadow: `0 0 60px ${scoreColor}15` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Job Score</p>
              <div className="text-7xl font-black mb-1" style={{ color: scoreColor, fontFamily: "monospace", textShadow: `0 0 30px ${scoreColor}60` }}>
                {Math.round(finalScore)}
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>out of 100</p>
              {jobStartTime && jobEndTime && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Clock className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Completed in {Math.round((jobEndTime - jobStartTime) / 1000)}s
                  </span>
                </div>
              )}
            </div>

            {/* Subagent scores */}
            <div className="space-y-2">
              {[
                { bot: SUBAGENTS[0], score: subagentScores.qualityScore, note: subagentScores.qualityNote },
                { bot: SUBAGENTS[1], score: subagentScores.timeScore, note: subagentScores.timeNote },
                { bot: SUBAGENTS[2], score: subagentScores.accuracyScore, note: subagentScores.accuracyNote },
              ].map(({ bot, score, note }, i) => (
                <div key={bot.name} className="p-3 rounded-2xl"
                  style={{ background: "rgba(0,12,35,0.8)", border: `1px solid ${bot.color}20` }}>
                  <div className="flex items-center gap-3" onClick={() => setExpandedScore(expandedScore === i ? null : i)} style={{ cursor: "pointer" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${bot.color}15`, border: `1px solid ${bot.color}30` }}>
                      <Bot className="w-4 h-4" style={{ color: bot.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{bot.name}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{bot.role}</p>
                    </div>
                    <div className="text-right flex-shrink-0 mr-2">
                      <p className="text-lg font-black" style={{ color: bot.color, fontFamily: "monospace" }}>{Math.round(score || 0)}</p>
                      <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>/100</p>
                    </div>
                    {expandedScore === i ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />}
                  </div>
                  <AnimatePresence>
                    {expandedScore === i && note && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        <p className="text-xs mt-2 pt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", borderTop: `1px solid ${bot.color}15` }}>{note}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Key points */}
            {subagentScores.keyPoints?.length > 0 && (
              <div className="p-4 rounded-2xl space-y-2"
                style={{ background: "rgba(0,40,100,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(96,165,250,0.5)" }}>Key Points</p>
                {subagentScores.keyPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#60a5fa" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(200,225,255,0.65)" }}>{pt}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Agent deliverable preview */}
            {agentResult && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,80,200,0.25)" }}>
                <div className="px-4 py-2.5 flex items-center gap-2"
                  style={{ background: "rgba(0,40,120,0.3)", borderBottom: "1px solid rgba(0,80,200,0.2)" }}>
                  <FileText className="w-3.5 h-3.5" style={{ color: "#60a5fa" }} />
                  <p className="text-xs font-bold" style={{ color: "#93c5fd" }}>Agent Deliverable</p>
                </div>
                <div className="p-4 max-h-56 overflow-y-auto"
                  style={{ background: "rgba(0,10,30,0.8)", fontFamily: "monospace" }}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(200,230,255,0.6)" }}>{agentResult}</p>
                </div>
              </div>
            )}

            {/* KAS payment recommendation */}
            <div className="p-5 rounded-3xl text-center"
              style={{ background: "linear-gradient(135deg, rgba(40,10,80,0.9), rgba(20,5,50,0.95))", border: "1px solid rgba(139,92,246,0.4)", boxShadow: "0 8px 40px rgba(100,50,255,0.15)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(196,181,253,0.5)" }}>Recommended Payment</p>
              <p className="text-4xl font-black mb-1" style={{ color: "#c4b5fd", fontFamily: "monospace" }}>
                {suggestedKAS?.toFixed(0) || "—"} KAS
              </p>
              <p className="text-xs mb-4" style={{ color: "rgba(196,181,253,0.35)" }}>
                Based on score ({Math.round(finalScore)}/100) · Rate: {agentRate || 500} KAS/hr
              </p>
              <div className="flex gap-2">
                <Link to="/Tip" className="flex-1">
                  <button className="w-full py-3 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#c4b5fd" }}>
                    💼 Pay in TipPage
                  </button>
                </Link>
                <button
                  onClick={() => { setStage("brief"); setAnalysis(null); setAgentLog([]); setAgentResult(null); setSubagentScores(null); setFinalScore(null); setJobTitle(""); setJobDesc(""); setJobOutput(""); }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", border: "1px solid rgba(167,139,250,0.4)" }}>
                  🔁 New Job
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}