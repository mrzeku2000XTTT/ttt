import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, ArrowLeft, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function ScenarioBotPage() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSimulate = async () => {
    if (!scenario.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are Scenario Bot - an AI that simulates detailed scenarios based on user prompts.

Given this scenario request: "${scenario}"

Provide a comprehensive simulation including:
1. **Scenario Overview** - What's happening
2. **Key Players** - Who's involved
3. **Timeline** - Step-by-step progression
4. **Outcomes** - Possible results (best case, worst case, most likely)
5. **Strategic Insights** - What to watch for, recommendations

Format with clear headings, bullet points, and make it engaging and detailed.`,
        response_json_schema: {
          type: "object",
          properties: {
            overview: { type: "string" },
            players: { type: "string" },
            timeline: { type: "string" },
            outcomes: { type: "string" },
            insights: { type: "string" },
          },
          required: ["overview", "players", "timeline", "outcomes", "insights"],
        },
      });

      setResult(response);
    } catch (error) {
      console.error("Scenario simulation failed:", error);
      setResult({
        overview: "Failed to generate scenario",
        players: "Error occurred",
        timeline: "Please try again",
        outcomes: "Simulation error",
        insights: "Check your input and retry",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(-1)}
                size="sm"
                className="bg-purple-500/20 border border-purple-500 hover:bg-purple-500/30 text-purple-400 h-9"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Scenario Bot</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-20" />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Scenario Simulation
            </h2>
          </div>
          <p className="text-white/60 text-sm">
            Describe any scenario and get a detailed AI-powered simulation with outcomes and insights
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="block text-sm font-medium text-white/80 mb-2">
              What scenario do you want to simulate?
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="e.g., What would happen if Bitcoin reached $1M? Or simulate a startup launching a new product..."
              className="w-full h-32 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 resize-none"
            />
            <Button
              onClick={handleSimulate}
              disabled={loading || !scenario.trim()}
              className="w-full mt-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-5">
              <h3 className="text-lg font-bold text-purple-300 mb-2">📊 Scenario Overview</h3>
              <p className="text-white/80 text-sm leading-relaxed">{result.overview}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-lg font-bold text-pink-300 mb-2">👥 Key Players</h3>
              <p className="text-white/80 text-sm leading-relaxed">{result.players}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-lg font-bold text-purple-300 mb-2">⏱️ Timeline</h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.timeline}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-lg font-bold text-pink-300 mb-2">🎯 Possible Outcomes</h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.outcomes}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-5">
              <h3 className="text-lg font-bold text-purple-300 mb-2">💡 Strategic Insights</h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.insights}</p>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <Bot className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-sm">
              Enter a scenario above to see the simulation
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}