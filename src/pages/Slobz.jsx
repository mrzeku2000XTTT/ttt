import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, RotateCcw, AlertCircle, Cpu } from "lucide-react";
import SlobzHero from "@/components/slobz/SlobzHero";
import ChaosIntake from "@/components/slobz/ChaosIntake";
import SlobScoreCard from "@/components/slobz/SlobScoreCard";
import SkillsPanel from "@/components/slobz/SkillsPanel";
import ResumePreview from "@/components/slobz/ResumePreview";
import MicroSteps from "@/components/slobz/MicroSteps";
import MomentumTrack from "@/components/slobz/MomentumTrack";
import SlobaCard from "@/components/slobz/SlobaCard";

export default function Slobz() {
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleProcess = async (intakeText) => {
    setIsProcessing(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the SLOB AGENTIC ENGINE (SAE) — an autonomous career & cognitive rehabilitation platform. You operate on "Radical Candor": unfiltered, protective, deeply supportive, but entirely free of corporate jargon. You act like a trusted, blunt friend.

TASK: Take the user's raw, chaotic stream-of-consciousness intake and transform it into actionable career intelligence.

USER INTAKE (verbatim):
"""
${intakeText}
"""

YOUR JOB:
1. ROAST: Write a brutally honest but caring roast (2-3 sentences). Be funny but never cruel. Call out the real problems.
2. SLOB_SCORE: 0-100 (100 = absolute slob, 0 = has it together). Most users land 60-90.
3. HARD_SKILLS: Extract real hard skills. Map informal activities to professional skills:
   - "making memes" → "Digital Asset Creation", "Social Media Engagement"
   - "MMO raiding" → "Cross-Functional Team Coordination", "Resource Management"
   - "photoshop" → "Digital Design", "Visual Content Production"
   - "gaming all night" → "Sustained Focus", "Problem-Solving Under Pressure"
4. SOFT_SKILLS: Extract soft skills from their lifestyle (leadership from gaming, creativity from art, resilience from struggle, etc.)
5. RESUME_MARKDOWN: Generate a professional resume in markdown. Use extracted skills. Reframe gaps as transferable experience. NO LIES — reframe what they actually have. Include sections: Summary, Skills, Experience (reframed from hobbies/life), Education.
6. THREE_STEP_PLAN: Create a 3-step redemption plan. Each step must be small and achievable this week.
7. MICRO_STEPS: Break the first step into 3-5 absurdly micro-steps for ADHD brains. Each takes under 2 minutes. Example: "Open this link. Look at the company logo for 10 seconds. Done."
8. SUGGESTED_ROLES: Suggest 3-5 job roles matching their profile. Avoid toxic environments (no aggressive sales, no loud offices, no micromanaging managers). Favor remote, flexible, low-stress roles.

Be specific and personal — reference actual details from their intake. No generic advice.`,
        response_json_schema: {
          type: "object",
          properties: {
            slob_score: { type: "number" },
            roast: { type: "string" },
            hard_skills: { type: "array", items: { type: "string" } },
            soft_skills: { type: "array", items: { type: "string" } },
            resume_markdown: { type: "string" },
            three_step_plan: {
              type: "array",
              items: {
                type: "object",
                properties: { step: { type: "string" }, description: { type: "string" } },
              },
            },
            micro_steps: {
              type: "array",
              items: {
                type: "object",
                properties: { step: { type: "string" }, description: { type: "string" } },
              },
            },
            suggested_roles: { type: "array", items: { type: "string" } },
          },
        },
      });

      setResult(res);

      // Save profile (best-effort — don't fail the UX if this errors for guests)
      try {
        const user = await base44.auth.me().catch(() => null);
        await base44.entities.SlobProfile.create({
          intake_text: intakeText,
          slob_score: res.slob_score,
          roast: res.roast,
          hard_skills: res.hard_skills,
          soft_skills: res.soft_skills,
          resume_markdown: res.resume_markdown,
          three_step_plan: res.three_step_plan,
          micro_steps: res.micro_steps,
          suggested_roles: res.suggested_roles,
          user_email: user?.email || null,
          status: "complete",
        });
      } catch (saveErr) {
        console.warn("Profile save failed (guest?):", saveErr);
      }
    } catch (err) {
      console.error("SAE engine error:", err);
      setError(err.message || "The SAE engine crashed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-800 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <SlobzHero />

        <AnimatePresence mode="wait">
          {/* Initial intake state */}
          {!result && !isProcessing && !error && (
            <motion.div key="intake" exit={{ opacity: 0 }} className="space-y-8">
              <ChaosIntake onProcess={handleProcess} isProcessing={isProcessing} />
              <MomentumTrack />
              <SlobaCard />
            </motion.div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-12 shadow-xl shadow-gray-200/40 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 border border-green-200 mb-4">
                  <Cpu className="w-8 h-8 text-green-600 animate-pulse" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">SLOB AGENTIC ENGINE</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  Ingesting chaos · Stripping self-deprecation · Extracting skills ·
                  Synthesizing resume · Building redemption plan…
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>This takes 10-20 seconds. Breathe.</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {error && !isProcessing && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white/60 backdrop-blur-xl border border-red-200 rounded-3xl p-8 shadow-xl shadow-gray-200/40 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 border border-red-200 mb-4">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-sm text-gray-700 mb-6">{error}</p>
                <button
                  onClick={() => { setError(""); }}
                  className="px-6 py-3 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold tracking-wide"
                >
                  TRY AGAIN
                </button>
              </div>
            </motion.div>
          )}

          {/* Results state */}
          {result && !isProcessing && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold tracking-wide transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> NEW INTAKE
                </button>
              </div>

              <SlobScoreCard score={result.slob_score} roast={result.roast} />
              <SkillsPanel
                hardSkills={result.hard_skills}
                softSkills={result.soft_skills}
                suggestedRoles={result.suggested_roles}
              />
              <ResumePreview resumeMarkdown={result.resume_markdown} />

              {result.three_step_plan?.length > 0 && (
                <MicroSteps
                  steps={result.three_step_plan}
                  title="3-STEP REDEMPTION PLAN"
                  subtitle="Small, achievable wins. Start this week."
                />
              )}
              {result.micro_steps?.length > 0 && (
                <MicroSteps
                  steps={result.micro_steps}
                  title="EXECUTIVE FUNCTION BYPASS"
                  subtitle="Absurdly micro-steps. Each takes under 2 minutes. Dopamine-sized chunks."
                />
              )}

              <MomentumTrack />
              <SlobaCard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}