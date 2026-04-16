import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Globe, Code, Copy, CheckCircle2, Eye, Wand2, AlertCircle } from "lucide-react";

const STEPS = [
  { id: "fetch", label: "Fetching site HTML & styles" },
  { id: "screenshot", label: "Capturing visual layout" },
  { id: "analyze", label: "Analyzing design system" },
  { id: "generate", label: "Generating React component" },
];

export default function UIClonerPage() {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("code");

  const isLoading = step >= 0 && step < STEPS.length;

  const handleClone = async () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;

    setError(null);
    setResult(null);
    setStep(0);

    try {
      // Step 1: Fetch HTML
      setStep(0);
      const scrapeRes = await base44.functions.invoke("uiClonerScrape", { url: finalUrl });
      if (scrapeRes.data?.error) throw new Error(scrapeRes.data.error);
      const { html, screenshot_url } = scrapeRes.data;

      // Step 2: Screenshot fetched
      setStep(1);
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Analyze
      setStep(2);
      await new Promise(r => setTimeout(r, 400));

      // Step 4: Generate React code via LLM
      setStep(3);
      const genRes = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are a senior frontend engineer. Recreate the following website's UI/UX 1:1 as a single self-contained React component.

URL: ${finalUrl}

HTML/DOM snapshot:
\`\`\`html
${html?.slice(0, 12000)}
\`\`\`

${screenshot_url ? `Screenshot URL for visual reference: ${screenshot_url}` : ""}

Instructions:
- Output ONLY valid JSX — a single default-exported React functional component named ClonedUI
- Use only Tailwind CSS classes for ALL styling. No inline styles unless absolutely necessary.
- Recreate every visible section: navbar, hero, features, footer etc.
- Match colors, fonts, spacing, layout, and responsive behavior as closely as possible
- Use placeholder <img> tags with realistic src URLs from unsplash if images are needed
- Include icons using lucide-react if needed
- Do NOT include any import statements — assume React, Tailwind, and lucide-react are already available
- Do NOT wrap in markdown code blocks — output pure JSX only
- Make it fully responsive (mobile + desktop)`,
        file_urls: screenshot_url ? [screenshot_url] : undefined,
      });

      setStep(STEPS.length);
      setResult({ code: genRes, screenshot_url, url: finalUrl });
    } catch (err) {
      setError(err.message || "Something went wrong. Try a different URL.");
      setStep(-1);
    }
  };

  const handleCopy = () => {
    if (result?.code) {
      navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">UI Cloner</h1>
            <p className="text-[11px] text-white/40 mt-0.5">Paste a URL — get a 1:1 React component</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-8">
        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isLoading && handleClone()}
                placeholder="https://stripe.com or figma.com/..."
                className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
            </div>
            <Button
              onClick={handleClone}
              disabled={isLoading || !url.trim()}
              className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4 mr-2" />Clone UI</>}
            </Button>
          </div>
          <p className="text-[11px] text-white/30 pl-1">Works best on public marketing pages. Authentication-gated pages may have limited results.</p>
        </motion.div>

        {/* Steps progress */}
        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              {STEPS.map((s, i) => {
                const done = step > i;
                const active = step === i;
                return (
                  <div key={s.id} className={`flex items-center gap-3 transition-all duration-500 ${done ? "opacity-100" : active ? "opacity-100" : "opacity-30"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? "bg-green-500" : active ? "bg-cyan-500 animate-pulse" : "bg-white/10"}`}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : active ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <span className="w-2 h-2 rounded-full bg-white/30" />}
                    </div>
                    <span className={`text-sm font-medium ${done ? "text-green-400" : active ? "text-cyan-300" : "text-white/40"}`}>{s.label}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit border border-white/10">
                <button onClick={() => setActiveTab("code")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "code" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
                  <Code className="w-4 h-4" /> React Code
                </button>
                {result.screenshot_url && (
                  <button onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "preview" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
                    <Eye className="w-4 h-4" /> Screenshot
                  </button>
                )}
              </div>

              {activeTab === "code" && (
                <div className="relative">
                  <div className="flex items-center justify-between bg-zinc-900 border border-white/10 rounded-t-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <span className="text-[11px] text-white/40 font-mono ml-2">ClonedUI.jsx</span>
                    </div>
                    <Button onClick={handleCopy} size="sm" variant="ghost" className="h-7 text-white/50 hover:text-white text-xs gap-1.5">
                      {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy code</>}
                    </Button>
                  </div>
                  <div className="bg-black/60 border border-t-0 border-white/10 rounded-b-xl overflow-auto max-h-[600px]">
                    <pre className="p-5 text-[12px] text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {result.code}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === "preview" && result.screenshot_url && (
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="bg-zinc-900 px-4 py-2.5 flex items-center gap-2 border-b border-white/10">
                    <Globe className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-[11px] text-white/40 font-mono truncate">{result.url}</span>
                  </div>
                  <img src={result.screenshot_url} alt="Site screenshot" className="w-full object-top" />
                </div>
              )}

              <p className="text-[11px] text-white/30 text-center">
                Paste the code into a new page file in your project — it's ready to drop in.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}