import React, { useState, useRef } from "react";
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
  const intakeRef = useRef(null);
  const wellnessRef = useRef(null);

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

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-[#DED6F2] text-[#1F1B2E] pb-20 font-body">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <AnimatePresence mode="wait">
          {/* Initial landing state */}
          {!result && !isProcessing && !error && (
            <motion.div key="intake" exit={{ opacity: 0 }}>
              <SlobzHero
                onIntakeClick={() => scrollTo(intakeRef)}
                onWellnessClick={() => scrollTo(wellnessRef)}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 items-start">
                <MomentumTrack />
                <div className="space-y-6">
                  <div ref={intakeRef} className="scroll-mt-6">
                    <ChaosIntake onProcess={handleProcess} isProcessing={isProcessing} />
                  </div>
                  <div ref={wellnessRef} className="scroll-mt-6">
                    <SlobaCard />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-16">
              <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-12 md:p-16 text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-[#7C5CFC] shadow-[0_8px_20px_rgba(124,92,252,0.4)] mb-5">
                  <Cpu className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="font-heading text-2xl font-semibold text-[#1F1B2E] mb-3">Slob Agentic Engine</h2>
                <p className="text-sm text-[#8B84A3] mb-8 max-w-md mx-auto leading-relaxed">
                  Ingesting chaos · Stripping self-deprecation · Extracting skills ·
                  Synthesizing resume · Building redemption plan…
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-[#8B84A3]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>This takes 10-20 seconds. Breathe.</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {error && !isProcessing && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-16">
              <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-10 text-center max-w-xl mx-auto">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-[18px] bg-[#F96B4C]/10 mb-4">
                  <AlertCircle className="w-7 h-7 text-[#F96B4C]" />
                </div>
                <p className="text-sm text-[#3A3450] mb-6">{error}</p>
                <button
                  onClick={() => { setError(""); }}
                  className="px-8 py-3 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-xs font-display font-extrabold tracking-wide shadow-[0_8px_20px_rgba(124,92,252,0.4)] transition-colors"
                >
                  TRY AGAIN
                </button>
              </div>
            </motion.div>
          )}

          {/* Results state */}
          {result && !isProcessing && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pt-8">
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FDFBF7] hover:bg-white text-[#7C5CFC] text-xs font-display font-extrabold tracking-wide shadow-[0_8px_20px_rgba(124,92,252,0.2)] transition-colors"
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
                  title="3-Step Redemption Plan"
                  subtitle="Small, achievable wins. Start this week."
                />
              )}
              {result.micro_steps?.length > 0 && (
                <MicroSteps
                  steps={result.micro_steps}
                  title="Executive Function Bypass"
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