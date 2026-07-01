import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, ArrowLeft, Loader2, Eye, Skull, Zap, Moon, Sun, Trash2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const VISUALIZATION_MODES = [
  { id: "standard", label: "Standard", icon: Sun, color: "from-blue-500 to-cyan-500", description: "Clean, professional analysis" },
  { id: "dark", label: "Dark Magic", icon: Moon, color: "from-purple-900 to-black", description: "Unveil hidden forces" },
  { id: "forbidden", label: "Forbidden", icon: Skull, color: "from-red-900 to-black", description: "Knowledge man was not meant to know" },
  { id: "secret", label: "Secret", icon: Eye, color: "from-emerald-900 to-black", description: "Ancient hidden truths" },
  { id: "chaos", label: "Chaos", icon: Zap, color: "from-orange-600 to-red-600", description: "Pure unpredictable entropy" },
];

const STORAGE_KEY = "scenario_bot_simulations";

function loadSimulations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSimulations(simulations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(simulations.slice(0, 20)));
  } catch {}
}

export default function ScenarioBotPage() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [visualMode, setVisualMode] = useState("standard");
  const [savedSimulations, setSavedSimulations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setSavedSimulations(loadSimulations());
  }, []);

  const handleSimulate = async () => {
    if (!scenario.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are Scenario Bot - an AI that simulates detailed scenarios based on user prompts.

Given this scenario request: "${scenario}"

Provide a comprehensive simulation with these sections:

**Scenario Overview** - What's happening in 2-3 sentences
**Key Players** - Who's involved (list 3-5 entities)
**Timeline** - Step-by-step progression (5-7 key events)
**Outcomes** - Possible results: best case, worst case, most likely
**Strategic Insights** - What to watch for, recommendations

Make it engaging, detailed, and specific to the scenario.`,
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

      if (response && response.overview) {
        const newSimulation = {
          id: Date.now().toString(),
          scenario,
          result: response,
          visualMode,
          timestamp: new Date().toISOString(),
        };
        
        setResult(response);
        const updated = [newSimulation, ...savedSimulations];
        setSavedSimulations(updated);
        saveSimulations(updated);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (error) {
      console.error("Scenario simulation failed:", error);
      setResult({
        overview: "The simulation encountered an error. This could be due to API limits or network issues. Please try again.",
        players: "Error: Unable to retrieve data",
        timeline: "The simulation failed to complete. Check your connection and retry.",
        outcomes: "No outcomes generated due to error.",
        insights: "Try rephrasing your scenario or use a different visualization mode.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSimulation = (sim) => {
    setResult(sim.result);
    setScenario(sim.scenario);
    setVisualMode(sim.visualMode || "standard");
    setShowHistory(false);
  };

  const deleteSimulation = (id) => {
    const updated = savedSimulations.filter(s => s.id !== id);
    setSavedSimulations(updated);
    saveSimulations(updated);
  };

  const clearHistory = () => {
    setSavedSimulations([]);
    saveSimulations([]);
  };

  const getBackgroundStyle = () => {
    switch (visualMode) {
      case "dark":
        return { background: "radial-gradient(ellipse at center, #1a0524 0%, #0a010f 50%, #000000 100%)" };
      case "forbidden":
        return { background: "radial-gradient(ellipse at center, #240505 0%, #0f0101 50%, #000000 100%)" };
      case "secret":
        return { background: "radial-gradient(ellipse at center, #05241a 0%, #010f0a 50%, #000000 100%)" };
      case "chaos":
        return { background: "radial-gradient(ellipse at center, #241405 0%, #0f0801 50%, #000000 100%)" };
      default:
        return { background: "#000000" };
    }
  };

  const currentMode = VISUALIZATION_MODES.find(m => m.id === visualMode);
  const ModeIcon = currentMode?.icon || Sun;

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={getBackgroundStyle()}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(-1)}
                size="sm"
                className={`bg-gradient-to-r ${currentMode?.color || "from-purple-500 to-pink-500"} border border-white/20 text-white h-9`}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentMode?.color || "from-purple-500 to-pink-400"} flex items-center justify-center`}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Scenario Bot</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowHistory(!showHistory)}
                size="sm"
                variant="ghost"
                className="text-white/60 hover:text-white h-9"
              >
                <Save className="w-4 h-4 mr-2" />
                History ({savedSimulations.length})
              </Button>
              
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <ModeIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">{currentMode?.label}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[200px]">
                  {VISUALIZATION_MODES.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setVisualMode(mode.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          visualMode === mode.id ? "bg-white/10" : "hover:bg-white/5"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">{mode.label}</div>
                          <div className="text-[10px] text-white/50">{mode.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-20" />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" style={{ color: visualMode !== "standard" ? "#ffffff" : "#a855f7" }} />
            <h2 className={`text-2xl font-bold ${visualMode === "standard" ? "text-purple-400" : "text-white"}`}>
              {visualMode === "standard" ? "AI Scenario Simulation" : `${currentMode?.label} Visualization`}
            </h2>
          </div>
          <p className="text-white/60 text-sm">
            {currentMode?.description || "Describe any scenario and get a detailed AI-powered simulation"}
          </p>
        </motion.div>

        {/* History Panel */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Saved Simulations</h3>
              {savedSimulations.length > 0 && (
                <Button onClick={clearHistory} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-8">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            {savedSimulations.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No saved simulations yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedSimulations.map((sim) => (
                  <div key={sim.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/5">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSimulation(sim)}>
                      <p className="text-sm font-medium text-white truncate">{sim.scenario}</p>
                      <p className="text-xs text-white/40">{new Date(sim.timestamp).toLocaleDateString()}</p>
                    </div>
                    <Button onClick={() => deleteSimulation(sim.id)} size="sm" variant="ghost" className="text-white/40 hover:text-red-400 h-8">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className={`bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl ${
            visualMode !== "standard" ? "bg-black/40" : ""
          }`}>
            <label className="block text-sm font-medium text-white/80 mb-2">
              What scenario do you want to simulate?
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="e.g., What would happen if Bitcoin reached $1M? Simulate a startup launching a new product..."
              className="w-full h-32 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 resize-none"
            />
            <Button
              onClick={handleSimulate}
              disabled={loading || !scenario.trim()}
              className={`w-full mt-3 bg-gradient-to-r ${currentMode?.color || "from-purple-500 to-pink-500"} hover:opacity-90 text-white font-semibold`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {visualMode === "standard" ? "Simulating..." : "Summoning..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {visualMode === "standard" ? "Run Simulation" : `Invoke ${currentMode?.label}`}
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Results */}
        {result && typeof result === "object" && result.overview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className={`bg-gradient-to-br ${currentMode?.color || "from-purple-500/10 to-pink-500/10"} border border-white/20 rounded-xl p-5 backdrop-blur-xl`}>
              <h3 className="text-lg font-bold text-white mb-2">📊 Scenario Overview</h3>
              <p className="text-white/80 text-sm leading-relaxed">{result.overview}</p>
            </div>

            <div className={`bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-xl ${
              visualMode !== "standard" ? "bg-black/40" : ""
            }`}>
              <h3 className="text-lg font-bold text-white mb-2">👥 Key Players</h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.players}</p>
            </div>

            <div className={`bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-xl ${
              visualMode !== "standard" ? "bg-black/40" : ""
            }`}>
              <h3 className="text-lg font-bold text-white mb-2">⏱️ Timeline</h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.timeline}</p>
            </div>

            <div className={`bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-xl ${
              visualMode !== "standard" ? "bg-black/40" : ""
            }`}>
              <h3 className="text-lg font-bold text-white mb-2">🎯 Possible Outcomes</h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.outcomes}</p>
            </div>

            <div className={`bg-gradient-to-br ${currentMode?.color || "from-purple-500/10 to-pink-500/10"} border border-white/20 rounded-xl p-5 backdrop-blur-xl`}>
              <h3 className="text-lg font-bold text-white mb-2">💡 Strategic Insights</h3>
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
              Enter a scenario above and click Run to see the simulation
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}