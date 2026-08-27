import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2a0fa1205_generated_image.png";

const THEME_PRESETS = [
  "Disney movies", "Star Wars", "Anime", "Cooking", "Sports", "Fantasy novels",
  "Video games", "Space exploration", "Superheroes", "Music", "Nature", "Art",
];

const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Brand new to this" },
  { id: "intermediate", label: "Intermediate", desc: "Some experience" },
  { id: "advanced", label: "Advanced", desc: "Comfortable but rusty" },
];

export default function IsolateBuilder({ user, onCreated, onBack }) {
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [theme, setTheme] = useState("");
  const [moduleCount, setModuleCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const canProceed = step === 0 ? topic.trim().length > 2 : step === 1 ? !!level : step === 2 ? theme.trim().length > 1 : step === 3 ? moduleCount > 0 : false;

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      // Step 1: Generate course outline via LLM
      const outlineRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a curriculum designer. Create a learning course outline.

Topic: ${topic}
Skill level: ${level}
Theme: ${theme}

Generate exactly ${moduleCount} modules that teach this topic from ${level} level. Each module should wrap the real concept in a metaphor/scenario from the theme "${theme}".

Return JSON with this exact structure:
{
  "title": "A catchy course title combining topic and theme",
  "modules": [
    {
      "title": "Module title",
      "concept": "The real concept being taught",
      "theme_hook": "One-line themed hook (e.g. 'Variables are like Elsa's magic — the same spell can hold different things')",
      "content": "Full 3-4 paragraph explanation using theme analogies and characters. Keep the real facts accurate. Use original characters inspired by the theme's mood, not specific copyrighted names.",
      "real_facts": "A clear 'Here's what's actually true' summary separating fact from metaphor",
      "knowledge_check": [
        {"question": "Question about the real concept", "options": ["opt1","opt2","opt3"], "answer": 0}
      ]
    }
  ]
}

IMPORTANT: Use original characters/art inspired by the MOOD of the theme, never specific copyrighted character names. Generate exactly ${moduleCount} modules. Each knowledge_check has exactly 3 questions.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  concept: { type: "string" },
                  theme_hook: { type: "string" },
                  content: { type: "string" },
                  real_facts: { type: "string" },
                  knowledge_check: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        answer: { type: "number" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const outline = typeof outlineRes === "string" ? JSON.parse(outlineRes) : outlineRes;

      // Step 2: Generate illustration for each module (in batches)
      const modules = outline.modules || [];
      const numMods = Math.min(modules.length, moduleCount);
      const imagePromises = [];
      for (let i = 0; i < numMods; i++) {
        const m = modules[i];
        imagePromises.push(
          base44.integrations.Core.GenerateImage({
            prompt: `Educational illustration for a learning module about "${m.concept}". Theme mood: ${theme}. Style: clean, modern, warm, original art (no copyrighted characters). Soft colors, minimal, approachable. The image should visually represent the concept through the theme's aesthetic. No text in image.`,
          }).catch(() => null)
        );
      }
      const imageResults = await Promise.all(imagePromises);

      // Step 3: Build full module objects
      const fullModules = modules.slice(0, numMods).map((m, i) => ({
        ...m,
        order: i,
        image_url: imageResults[i]?.url || "",
        completed: false,
        chat: [],
      }));

      // Step 4: Create course entity
      const course = await base44.entities.IsolateCourse.create({
        user_email: user.email,
        title: outline.title || `${topic} × ${theme}`,
        topic,
        skill_level: level,
        theme,
        modules: fullModules,
        completion_pct: 0,
        streak: 1,
        last_accessed: new Date().toISOString(),
        theme_palette: "violet",
      });

      onCreated(course);
    } catch (e) {
      console.error("Course generation failed", e);
      setError(e.message || "Failed to generate course. Please try again.");
      setGenerating(false);
    }
  };

  const steps = ["What do you want to learn?", "What's your level?", "Pick a theme you love", "How many modules?"];

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-2xl border-b border-zinc-200/50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={onBack} disabled={generating} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors disabled:opacity-40">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[14px] font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="ISOLATE" className="w-6 h-6 rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">New Course</span>
          </div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-8 bg-violet-500" : i < step ? "w-8 bg-violet-200" : "w-1.5 bg-zinc-200"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {generating ? (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">Generating your course...</h2>
              <p className="text-zinc-500">Crafting modules, writing explanations, and illustrating concepts in your theme.</p>
              <p className="text-[13px] text-zinc-400 mt-4">This takes about 30-60 seconds.</p>
            </motion.div>
          ) : (
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              {/* Step 0: Topic */}
              {step === 0 && (
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-zinc-900 mb-2">{steps[0]}</h1>
                  <p className="text-zinc-500 mb-8 text-lg">Anything you've been curious about.</p>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canProceed && setStep(1)}
                    placeholder="e.g. Python basics, how neural networks work, guitar chords..."
                    autoFocus
                    className="w-full px-5 py-4 rounded-2xl bg-white ring-1 ring-zinc-200 focus:ring-2 focus:ring-violet-400 outline-none text-lg text-zinc-900 placeholder:text-zinc-300 transition-all"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Python basics", "How neural networks work", "Guitar chords", "Spanish", "Investing", "Calculus"].map((s) => (
                      <button key={s} onClick={() => setTopic(s)} className="px-3.5 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-[13px] font-medium text-zinc-600 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Level */}
              {step === 1 && (
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-zinc-900 mb-2">{steps[1]}</h1>
                  <p className="text-zinc-500 mb-8 text-lg">Be honest — we'll calibrate to you.</p>
                  <div className="space-y-3">
                    {LEVELS.map((lv) => (
                      <button
                        key={lv.id}
                        onClick={() => setLevel(lv.id)}
                        className={`w-full text-left p-5 rounded-2xl ring-1 transition-all ${level === lv.id ? "ring-2 ring-violet-400 bg-violet-50" : "ring-zinc-200 bg-white hover:bg-zinc-50"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold tracking-tight text-zinc-900">{lv.label}</div>
                            <div className="text-[14px] text-zinc-400">{lv.desc}</div>
                          </div>
                          {level === lv.id && <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-white" /></div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Theme */}
              {step === 2 && (
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-zinc-900 mb-2">{steps[2]}</h1>
                  <p className="text-zinc-500 mb-8 text-lg">We'll wrap your course in this theme.</p>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canProceed && setStep(3)}
                    placeholder="e.g. Disney movies, Star Wars, cooking..."
                    autoFocus
                    className="w-full px-5 py-4 rounded-2xl bg-white ring-1 ring-zinc-200 focus:ring-2 focus:ring-violet-400 outline-none text-lg text-zinc-900 placeholder:text-zinc-300 transition-all"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {THEME_PRESETS.map((t) => (
                      <button key={t} onClick={() => setTheme(t)} className={`px-3.5 py-2 rounded-full text-[13px] font-medium transition-all ${theme === t ? "bg-violet-500 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {error && <p className="mt-4 text-[14px] text-red-500">{error}</p>}
                </div>
              )}

              {/* Step 3: Module count */}
              {step === 3 && (
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-zinc-900 mb-2">{steps[3]}</h1>
                  <p className="text-zinc-500 mb-8 text-lg">How deep do you want to go? Pick any number.</p>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <button
                      onClick={() => setModuleCount(Math.max(1, moduleCount - 1))}
                      className="w-14 h-14 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-2xl font-bold text-zinc-700 transition-colors flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={moduleCount}
                      onChange={(e) => setModuleCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                      className="w-24 text-center text-5xl font-bold tracking-tight text-zinc-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                    <button
                      onClick={() => setModuleCount(Math.min(99, moduleCount + 1))}
                      className="w-14 h-14 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-2xl font-bold text-zinc-700 transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[3, 5, 6, 8, 10, 12].map((n) => (
                      <button key={n} onClick={() => setModuleCount(n)} className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${moduleCount === n ? "bg-violet-500 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"}`}>
                        {n} modules
                      </button>
                    ))}
                  </div>
                  <p className="mt-6 text-center text-[13px] text-zinc-400">More modules = longer generation time. Each module gets its own illustration.</p>
                </div>
              )}

              {/* Navigation */}
              {!generating && (
                <div className="mt-10 flex items-center justify-between">
                  {step > 0 ? (
                    <button onClick={() => setStep(step - 1)} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-[14px] font-medium">Back</span>
                    </button>
                  ) : <div />}
                  {step < 3 ? (
                    <button
                      onClick={() => canProceed && setStep(step + 1)}
                      disabled={!canProceed}
                      className="flex items-center gap-1.5 px-6 py-3 rounded-full bg-zinc-900 text-white text-[14px] font-medium hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerate}
                      disabled={!canProceed}
                      className="flex items-center gap-1.5 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[14px] font-medium hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate my course
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}