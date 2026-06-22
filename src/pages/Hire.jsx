import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bot, Zap, Eye, FileText, ChevronDown, ChevronUp,
  Loader2, Upload, Lock, Unlock, Download, CheckCircle, Star,
  Clock, AlertCircle, Play, X
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const SUBAGENTS = [
  { name: "QualityBot", role: "Output quality", color: "#06b6d4" },
  { name: "TimeBot", role: "Effort & complexity", color: "#a855f7" },
  { name: "AccuracyBot", role: "Requirements match", color: "#22c55e" },
];

export default function HirePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentEmail = searchParams.get("agent");
  const agentName = searchParams.get("name") || "AI Agent";
  const agentSkills = searchParams.get("skills");
  const agentRate = searchParams.get("rate") || "500";

  // stage: brief | instructions | upload | review | scored
  const [stage, setStage] = useState("brief");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobOutput, setJobOutput] = useState("");

  // Instructions from agent
  const [instructions, setInstructions] = useState(null);
  const [isLoadingInstructions, setIsLoadingInstructions] = useState(false);

  // Upload proof
  const [uploadedFile, setUploadedFile] = useState(null); // { name, url, type }
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Review & scoring
  const [agentLog, setAgentLog] = useState([]);
  const [subagentScores, setSubagentScores] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [suggestedKAS, setSuggestedKAS] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [expandedScore, setExpandedScore] = useState(null);
  const [agentFeedback, setAgentFeedback] = useState(null);
  const logRef = useRef(null);

  // Payment
  const [isPaid, setIsPaid] = useState(false);
  const [kasAmount, setKasAmount] = useState("");
  const [payError, setPayError] = useState("");
  const [isSendingPayment, setIsSendingPayment] = useState(false);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [agentLog]);

  const addLog = (msg, type = "info") =>
    setAgentLog(prev => [...prev, { msg, type, ts: Date.now() }]);

  // STEP 1: Get step-by-step instructions
  const handleGetInstructions = async () => {
    if (!jobTitle.trim() || !jobDesc.trim()) return;
    setIsLoadingInstructions(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are ${agentName}, a professional agent hired for a job.

Job Title: ${jobTitle}
Job Description: ${jobDesc}
Expected Deliverable: ${jobOutput || "Best quality output"}
Your Skills: ${agentSkills || "General expertise"}
Rate: ${agentRate} KAS/hr

Give the HIRED PERSON clear step-by-step instructions on exactly how to create the content needed to pass review. Be practical and specific.

Return JSON with:
- summary: one sentence overview
- steps: array of 4-7 objects: { stepNumber, title, description, tip }
- requirements: string[] — what the final upload must include to score well
- estimatedTime: string (e.g. "20-30 minutes")
- estimatedKAS: number`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stepNumber: { type: "number" },
                  title: { type: "string" },
                  description: { type: "string" },
                  tip: { type: "string" }
                }
              }
            },
            requirements: { type: "array", items: { type: "string" } },
            estimatedTime: { type: "string" },
            estimatedKAS: { type: "number" }
          }
        }
      });
      setInstructions(res);
      setSuggestedKAS(res.estimatedKAS);
      setStage("instructions");
    } catch (e) {
      alert("Failed to get instructions. Please try again.");
    } finally {
      setIsLoadingInstructions(false);
    }
  };

  // STEP 2: Handle file upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile({ name: file.name, url: file_url, type: file.type });
      setStage("upload");
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // STEP 3: AI reviews the upload
  const handleReviewUpload = async () => {
    if (!uploadedFile) return;
    setIsReviewing(true);
    setAgentLog([]);
    setStage("review");
    addLog("🤖 Agent received your upload...", "system");
    addLog(`📁 Analyzing: ${uploadedFile.name}`, "info");
    addLog("👁️ Subagents reviewing content...", "system");

    const isImage = uploadedFile.type?.startsWith("image/");

    try {
      const reviewRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a panel of 3 AI subagent reviewers evaluating a submitted deliverable.

Job Title: "${jobTitle}"
Job Description: "${jobDesc}"
Expected Deliverable: "${jobOutput || 'Best effort'}"
Instructions Given: ${instructions?.steps?.map(s => s.title).join(', ') || 'General guidance'}
File Submitted: "${uploadedFile.name}" (${uploadedFile.type || 'unknown'})
${isImage ? 'The image has been provided for visual analysis.' : ''}

Score each dimension 0-100:
1. QualityBot - output quality, completeness, professionalism
2. TimeBot - effort & complexity demonstrated
3. AccuracyBot - does it match the job requirements

Return JSON with:
- qualityScore, qualityNote
- timeScore, timeNote
- accuracyScore, accuracyNote
- overallScore (weighted average)
- keyPoints: string[] (3 bullet points)
- agentFeedback: string (detailed paragraph)
- stepsToPerfect: string[] (2-4 specific improvements if not perfect)
- kasRecommendation: number (KAS to pay based on quality × rate ${agentRate} KAS/hr)
- passesReview: boolean (score >= 60)`,
        ...(isImage ? { file_urls: [uploadedFile.url] } : {}),
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
            agentFeedback: { type: "string" },
            stepsToPerfect: { type: "array", items: { type: "string" } },
            kasRecommendation: { type: "number" },
            passesReview: { type: "boolean" },
          }
        }
      });

      setSubagentScores(reviewRes);
      setFinalScore(reviewRes.overallScore);
      setSuggestedKAS(reviewRes.kasRecommendation || suggestedKAS);
      setAgentFeedback({ feedback: reviewRes.agentFeedback, steps: reviewRes.stepsToPerfect });
      setKasAmount(String(Math.round(reviewRes.kasRecommendation || suggestedKAS || agentRate)));
      addLog(`✅ Review complete. Score: ${Math.round(reviewRes.overallScore)}/100`, "success");
      if (reviewRes.passesReview) {
        addLog("🏆 PASSES review threshold!", "success");
      } else {
        addLog("⚠️ Does not meet threshold. See feedback to improve.", "error");
      }
      setStage("scored");
    } catch (e) {
      addLog("❌ Review failed: " + e.message, "error");
      setStage("scored");
    } finally {
      setIsReviewing(false);
    }
  };

  // STEP 4: Pay & unlock download
  const handlePayAndDownload = async () => {
    if (!kasAmount || parseFloat(kasAmount) <= 0) {
      setPayError("Enter a KAS amount");
      return;
    }
    setPayError("");
    setIsSendingPayment(true);

    if (window.kasware) {
      try {
        // Look up agent wallet address
        let recipientAddress = null;
        if (agentEmail) {
          const profiles = await base44.entities.AgentZKProfile.filter({ user_email: agentEmail });
          recipientAddress = profiles?.[0]?.wallet_address;
        }
        if (recipientAddress) {
          const amountSompi = Math.round(parseFloat(kasAmount) * 1e8);
          await window.kasware.sendKaspa(recipientAddress, amountSompi);
        }
        setIsPaid(true);
      } catch (err) {
        setPayError("Payment failed: " + (err.message || "Unknown error"));
      }
    } else {
      // No wallet connected — unlock locally (user pays externally)
      setIsPaid(true);
    }
    setIsSendingPayment(false);
  };

  const handleDownload = () => {
    if (!uploadedFile?.url) return;
    const a = document.createElement("a");
    a.href = uploadedFile.url;
    a.download = uploadedFile.name || "deliverable";
    a.target = "_blank";
    a.click();
  };

  const resetAll = () => {
    setStage("brief");
    setJobTitle(""); setJobDesc(""); setJobOutput("");
    setInstructions(null); setUploadedFile(null);
    setAgentLog([]); setSubagentScores(null); setFinalScore(null);
    setAgentFeedback(null); setSuggestedKAS(null); setKasAmount("");
    setIsPaid(false); setPayError("");
  };

  const scoreColor = finalScore >= 80 ? "#22c55e" : finalScore >= 60 ? "#fbbf24" : "#ef4444";
  const passes = subagentScores?.passesReview || (finalScore >= 60);

  const stageDots = ["brief", "instructions", "upload", "review", "scored"];
  const stageIdx = stageDots.indexOf(stage);

  return (
    <div className="min-h-screen" style={{ background: "#030712" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(3,7,18,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
        <Link to="/Tip">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-black text-lg leading-none">HIRE</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(196,181,253,0.5)" }}>Agent: {agentName}</p>
        </div>
        <Link to="/">
          <button className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            Home
          </button>
        </Link>
        <div className="flex items-center gap-1.5">
          {stageDots.map((s, i) => (
            <div key={s} className="w-2 h-2 rounded-full transition-all"
              style={{ background: i < stageIdx ? "#7c3aed" : i === stageIdx ? "#a855f7" : "rgba(139,92,246,0.2)" }} />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">

        {/* Agent card */}
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

        {/* ── BRIEF ── */}
        {stage === "brief" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.6)" }}>Describe the Job</p>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Job Title</label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Create a 60-second promo video, Design a logo, Write copy..."
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(80,40,140,0.12)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Full Description</label>
              <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={4}
                placeholder="Describe exactly what you need — requirements, audience, style, context..."
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                style={{ background: "rgba(80,40,140,0.12)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>Expected Deliverable</label>
              <input value={jobOutput} onChange={e => setJobOutput(e.target.value)}
                placeholder="e.g. MP4 video, screenshot proof, PDF report, image..."
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(80,40,140,0.12)", border: "1px solid rgba(139,92,246,0.25)", caretColor: "#a78bfa" }} />
            </div>
            <button onClick={handleGetInstructions}
              disabled={isLoadingInstructions || !jobTitle.trim() || !jobDesc.trim()}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #6d28d9, #a855f7)", border: "1px solid rgba(167,139,250,0.4)", boxShadow: "0 8px 32px rgba(120,50,255,0.3)" }}>
              {isLoadingInstructions
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Getting Instructions...</>
                : <><Bot className="w-4 h-4" /> Get Step-by-Step Instructions</>}
            </button>
          </motion.div>
        )}

        {/* ── INSTRUCTIONS ── */}
        {stage === "instructions" && instructions && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Agent summary banner */}
            <div className="relative overflow-hidden rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.25), rgba(168,85,247,0.12))", border: "1px solid rgba(167,139,250,0.3)" }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, #a855f7, transparent)", transform: "translate(30%, -30%)" }} />
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4" style={{ color: "#a78bfa" }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(167,139,250,0.7)" }}>{agentName} · Mission Brief</span>
              </div>
              <p className="text-sm text-white font-medium leading-relaxed">{instructions.summary}</p>
              <div className="flex gap-3 mt-3">
                {instructions.estimatedTime && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)" }}>
                    <Clock className="w-3 h-3" style={{ color: "#a78bfa" }} />
                    <span className="text-[11px] font-semibold" style={{ color: "rgba(196,181,253,0.8)" }}>{instructions.estimatedTime}</span>
                  </div>
                )}
                {instructions.estimatedKAS && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                    <Zap className="w-3 h-3" style={{ color: "#fbbf24" }} />
                    <span className="text-[11px] font-bold font-mono" style={{ color: "#fbbf24" }}>{instructions.estimatedKAS} KAS</span>
                  </div>
                )}
              </div>
            </div>

            {/* Steps */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-4" style={{ color: "rgba(167,139,250,0.45)" }}>
                Step-by-Step Instructions
              </p>
              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-[18px] top-8 bottom-8 w-px" style={{ background: "linear-gradient(to bottom, rgba(109,40,217,0.6), rgba(109,40,217,0.1))" }} />
                <div className="space-y-3">
                  {instructions.steps?.map((step, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, ease: "easeOut" }}>
                      <div className="flex gap-3">
                        {/* Step number bubble */}
                        <div className="relative flex-shrink-0">
                          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-sm z-10 relative"
                            style={{ background: "linear-gradient(135deg, #6d28d9, #a855f7)", boxShadow: "0 4px 16px rgba(120,50,255,0.4)" }}>
                            {step.stepNumber || i + 1}
                          </div>
                        </div>
                        {/* Card */}
                        <div className="flex-1 pb-1 rounded-2xl overflow-hidden"
                          style={{ background: "rgba(8,4,28,0.85)", border: "1px solid rgba(109,40,217,0.2)" }}>
                          {/* Card header */}
                          <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(109,40,217,0.12)" }}>
                            <p className="text-white font-bold text-sm">{step.title}</p>
                          </div>
                          {/* Card body */}
                          <div className="px-4 py-3">
                            <p className="text-xs leading-relaxed" style={{ color: "rgba(200,215,255,0.6)" }}>{step.description}</p>
                            {step.tip && (
                              <div className="mt-3 flex gap-2.5 p-2.5 rounded-xl"
                                style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)" }}>
                                <span className="text-sm flex-shrink-0">💡</span>
                                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(253,224,110,0.75)" }}>{step.tip}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Requirements checklist */}
            {instructions.requirements?.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(59,130,246,0.25)" }}>
                <div className="px-4 py-3" style={{ background: "rgba(37,99,235,0.12)", borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: "rgba(96,165,250,0.7)" }}>✓ Upload Must Include</p>
                </div>
                <div className="px-4 py-3 space-y-2.5" style={{ background: "rgba(0,20,60,0.4)" }}>
                  {instructions.requirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)" }}>
                        <CheckCircle className="w-2.5 h-2.5" style={{ color: "#60a5fa" }} />
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(200,225,255,0.65)" }}>{req}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload CTA */}
            <input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*,.pdf,.doc,.docx,.txt,.zip" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-4 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #059669, #10b981)", border: "1px solid rgba(16,185,129,0.4)", boxShadow: "0 8px 32px rgba(16,185,129,0.25)" }}>
              {isUploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                : <><Upload className="w-4 h-4" /> Upload Your Completed Work</>}
            </button>
            <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>
              Video · Image · Audio · PDF · ZIP — any format supported
            </p>

            <button onClick={() => setStage("brief")} className="w-full text-xs py-2"
              style={{ color: "rgba(196,181,253,0.3)" }}>
              ← Edit job brief
            </button>
          </motion.div>
        )}

        {/* ── UPLOAD CONFIRM ── */}
        {stage === "upload" && uploadedFile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#4ade80" }}>✓ File Uploaded</p>

            <div className="p-4 rounded-2xl flex items-center gap-3"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(16,185,129,0.15)" }}>
                {uploadedFile.type?.startsWith("video/") ? <Play className="w-6 h-6 text-emerald-400" /> :
                 uploadedFile.type?.startsWith("image/") ? <Eye className="w-6 h-6 text-emerald-400" /> :
                 <FileText className="w-6 h-6 text-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{uploadedFile.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{uploadedFile.type || "File"}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            </div>

            {uploadedFile.type?.startsWith("image/") && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <img src={uploadedFile.url} alt="Preview" className="w-full max-h-52 object-cover" />
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button onClick={() => { setUploadedFile(null); fileInputRef.current?.click(); }}
                className="flex-1 py-3 rounded-xl text-xs font-bold"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                Replace File
              </button>
              <button onClick={handleReviewUpload}
                className="flex-1 py-3 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #6d28d9, #a855f7)", border: "1px solid rgba(167,139,250,0.4)" }}>
                <Bot className="w-4 h-4" /> Submit for AI Review
              </button>
            </div>
          </motion.div>
        )}

        {/* ── REVIEW ── */}
        {stage === "review" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center animate-pulse"
                style={{ background: "rgba(139,92,246,0.3)" }}>
                <Eye className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Subagents Reviewing...</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>3 AI reviewers evaluating your submission</p>
              </div>
            </div>

            <div ref={logRef} className="rounded-2xl p-4 space-y-2 overflow-y-auto"
              style={{ background: "rgba(0,10,30,0.9)", border: "1px solid rgba(0,80,200,0.2)", maxHeight: "200px", fontFamily: "monospace" }}>
              {agentLog.map((entry, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="text-xs leading-relaxed"
                  style={{ color: entry.type === "error" ? "#f87171" : entry.type === "success" ? "#4ade80" : entry.type === "step" ? "#93c5fd" : "rgba(148,163,184,0.7)" }}>
                  {entry.msg}
                </motion.div>
              ))}
              {isReviewing && <span className="animate-pulse text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>▋</span>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {SUBAGENTS.map((bot, i) => (
                <motion.div key={bot.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                  className="p-3 rounded-xl text-center"
                  style={{ background: "rgba(0,15,40,0.8)", border: `1px solid ${bot.color}30` }}>
                  <div className="w-7 h-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center animate-pulse" style={{ background: `${bot.color}20` }}>
                    <Bot className="w-3.5 h-3.5" style={{ color: bot.color }} />
                  </div>
                  <p className="text-[10px] font-bold text-white">{bot.name}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{bot.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── SCORED ── */}
        {stage === "scored" && subagentScores && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Score hero */}
            <div className="p-6 rounded-3xl text-center"
              style={{ background: "linear-gradient(135deg, rgba(0,15,40,0.95), rgba(0,8,25,0.99))", border: `2px solid ${scoreColor}40`, boxShadow: `0 0 60px ${scoreColor}15` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Job Score</p>
              <div className="text-7xl font-black mb-1" style={{ color: scoreColor, fontFamily: "monospace", textShadow: `0 0 30px ${scoreColor}60` }}>
                {Math.round(finalScore || 0)}
              </div>
              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>out of 100</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: passes ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${passes ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`, color: passes ? "#4ade80" : "#f87171" }}>
                {passes ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {passes ? "PASSES REVIEW" : "NEEDS IMPROVEMENT"}
              </div>
            </div>

            {/* Subagent scores */}
            <div className="space-y-2">
              {[
                { bot: SUBAGENTS[0], score: subagentScores.qualityScore, note: subagentScores.qualityNote },
                { bot: SUBAGENTS[1], score: subagentScores.timeScore, note: subagentScores.timeNote },
                { bot: SUBAGENTS[2], score: subagentScores.accuracyScore, note: subagentScores.accuracyNote },
              ].map(({ bot, score, note }, i) => (
                <div key={bot.name} className="p-3 rounded-2xl cursor-pointer"
                  style={{ background: "rgba(0,12,35,0.8)", border: `1px solid ${bot.color}20` }}
                  onClick={() => setExpandedScore(expandedScore === i ? null : i)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${bot.color}15`, border: `1px solid ${bot.color}30` }}>
                      <Bot className="w-4 h-4" style={{ color: bot.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{bot.name}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{bot.role}</p>
                    </div>
                    <p className="text-lg font-black mr-2" style={{ color: bot.color, fontFamily: "monospace" }}>{Math.round(score || 0)}</p>
                    {expandedScore === i ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />}
                  </div>
                  <AnimatePresence>
                    {expandedScore === i && note && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="text-xs mt-2 pt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", borderTop: `1px solid ${bot.color}15` }}>{note}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Agent feedback */}
            {agentFeedback?.feedback && (
              <div className="p-4 rounded-2xl space-y-3" style={{ background: "rgba(80,40,140,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" style={{ color: "#a78bfa" }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.6)" }}>{agentName} · Feedback</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(220,200,255,0.75)" }}>{agentFeedback.feedback}</p>
                {agentFeedback.steps?.length > 0 && !passes && (
                  <div className="space-y-2 pt-2" style={{ borderTop: "1px solid rgba(139,92,246,0.15)" }}>
                    <p className="text-xs font-bold" style={{ color: "rgba(251,191,36,0.7)" }}>🔧 To improve your score:</p>
                    {agentFeedback.steps.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-mono flex-shrink-0 mt-0.5" style={{ color: "rgba(251,191,36,0.5)" }}>{i + 1}.</span>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,235,180,0.65)" }}>{s}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Key points */}
            {subagentScores.keyPoints?.length > 0 && (
              <div className="p-4 rounded-2xl space-y-2" style={{ background: "rgba(0,40,100,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(96,165,250,0.5)" }}>Key Points</p>
                {subagentScores.keyPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#60a5fa" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(200,225,255,0.65)" }}>{pt}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Revise if failed */}
            {!passes && (
              <button onClick={() => { setUploadedFile(null); setSubagentScores(null); setFinalScore(null); setAgentFeedback(null); setAgentLog([]); setStage("instructions"); }}
                className="w-full py-3 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#c4b5fd" }}>
                🔁 Revise & Resubmit
              </button>
            )}

            {/* ── PAYMENT & DOWNLOAD ── */}
            <div className="p-5 rounded-3xl space-y-4"
              style={{ background: "linear-gradient(135deg, rgba(40,10,80,0.9), rgba(20,5,50,0.95))", border: "1px solid rgba(139,92,246,0.4)", boxShadow: "0 8px 40px rgba(100,50,255,0.15)" }}>

              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(196,181,253,0.5)" }}>
                  {isPaid ? "Download Unlocked 🔓" : "Pay to Unlock Download"}
                </p>
                <p className="text-3xl font-black" style={{ color: "#c4b5fd", fontFamily: "monospace" }}>
                  {suggestedKAS?.toFixed(0) || agentRate} KAS
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(196,181,253,0.35)" }}>
                  Score: {Math.round(finalScore || 0)}/100 · Rate: {agentRate} KAS/hr
                </p>
              </div>

              {!isPaid ? (
                <>
                  {/* Locked file */}
                  <div className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: "rgba(0,10,30,0.6)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(196,181,253,0.4)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-bold truncate">{uploadedFile?.name || "Deliverable"}</p>
                      <p className="text-[10px]" style={{ color: "rgba(196,181,253,0.35)" }}>Locked until payment</p>
                    </div>
                    <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(196,181,253,0.3)" }} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(196,181,253,0.6)" }}>KAS Amount</label>
                    <input type="number" value={kasAmount} onChange={e => setKasAmount(e.target.value)}
                      placeholder={suggestedKAS?.toFixed(0) || agentRate}
                      className="w-full px-4 py-3 rounded-xl text-white text-center text-xl font-black outline-none"
                      style={{ background: "rgba(80,40,140,0.2)", border: "1px solid rgba(139,92,246,0.3)", caretColor: "#a78bfa" }} />
                  </div>

                  {payError && <p className="text-xs text-red-400 text-center">{payError}</p>}

                  <button onClick={handlePayAndDownload} disabled={isSendingPayment}
                    className="w-full py-3.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "1px solid rgba(167,139,250,0.4)" }}>
                    {isSendingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {isSendingPayment ? "Processing..." : "Pay KAS & Unlock Download"}
                  </button>
                  <p className="text-center text-[11px]" style={{ color: "rgba(196,181,253,0.3)" }}>
                    Uses Kasware wallet · or pay the agent directly via <Link to="/Tip" className="underline" style={{ color: "rgba(196,181,253,0.5)" }}>TipPage</Link> then come back to download
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <Unlock className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-bold truncate">{uploadedFile?.name || "Deliverable"}</p>
                      <p className="text-[10px] text-emerald-400">Unlocked · Ready to download</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                  <button onClick={handleDownload}
                    className="w-full py-3.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #059669, #10b981)", border: "1px solid rgba(16,185,129,0.4)", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}>
                    <Download className="w-4 h-4" /> Download File
                  </button>
                </>
              )}
            </div>

            <button onClick={resetAll}
              className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "1px solid rgba(167,139,250,0.4)" }}>
              🔁 Start New Job
            </button>

          </motion.div>
        )}

      </div>
    </div>
  );
}