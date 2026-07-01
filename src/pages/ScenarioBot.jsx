import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, ArrowLeft, Send, Loader2, Eye, Skull, Zap, Flame, Moon, Sun, EyeOff } from "lucide-react";
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

export default function ScenarioBotPage() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [visualMode, setVisualMode] = useState("standard");
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [visualElements, setVisualElements] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const handleSimulate = async () => {
    if (!scenario.trim()) return;
    setLoading(true);
    setResult(null);
    setShowVisualizer(true);

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
6. **Visual Elements** - Describe 5-10 visual symbols, entities, or phenomena that represent this scenario

Format with clear headings, bullet points, and make it engaging and detailed.

Return as JSON with these exact fields:
- overview: string
- players: string
- timeline: string
- outcomes: string
- insights: string
- visualElements: array of objects with {name, description, intensity, color}`,
        response_json_schema: {
          type: "object",
          properties: {
            overview: { type: "string" },
            players: { type: "string" },
            timeline: { type: "string" },
            outcomes: { type: "string" },
            insights: { type: "string" },
            visualElements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  intensity: { type: "number" },
                  color: { type: "string" },
                },
                required: ["name", "description", "intensity", "color"],
              },
            },
          },
          required: ["overview", "players", "timeline", "outcomes", "insights", "visualElements"],
        },
      });

      setResult(response);
      setVisualElements(response.visualElements || []);
    } catch (error) {
      console.error("Scenario simulation failed:", error);
      setResult({
        overview: "Failed to generate scenario",
        players: "Error occurred",
        timeline: "Please try again",
        outcomes: "Simulation error",
        insights: "Check your input and retry",
        visualElements: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Dynamic background based on mode
  const getBackgroundStyle = () => {
    const mode = VISUALIZATION_MODES.find(m => m.id === visualMode);
    switch (visualMode) {
      case "dark":
        return {
          background: "radial-gradient(ellipse at center, #1a0524 0%, #0a010f 50%, #000000 100%)",
        };
      case "forbidden":
        return {
          background: "radial-gradient(ellipse at center, #240505 0%, #0f0101 50%, #000000 100%)",
        };
      case "secret":
        return {
          background: "radial-gradient(ellipse at center, #05241a 0%, #010f0a 50%, #000000 100%)",
        };
      case "chaos":
        return {
          background: "radial-gradient(ellipse at center, #241405 0%, #0f0801 50%, #000000 100%)",
        };
      default:
        return { background: "#000000" };
    }
  };

  // Floating particles animation
  useEffect(() => {
    if (!showVisualizer || visualElements.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = visualElements.map((el, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 3 + 1,
      color: el.color || "#ffffff",
      intensity: el.intensity || 0.5,
      pulse: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.05;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const alpha = 0.3 + Math.sin(p.pulse) * 0.2 * p.intensity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.intensity * 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", `, ${alpha})`).replace("rgb", "rgba").replace("hsl", "hsla");
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [showVisualizer, visualElements, visualMode]);

  const currentMode = VISUALIZATION_MODES.find(m => m.id === visualMode);
  const ModeIcon = currentMode?.icon || Sun;

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={getBackgroundStyle()}>
      {/* Animated Background Canvas */}
      {showVisualizer && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-0"
          style={{ opacity: visualMode === "standard" ? 0.3 : 0.7 }}
        />
      )}

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(-1)}
                size="sm"
                className={`bg-gradient-to-r ${currentMode?.color || "from-purple-500 to-pink-500"} bg-opacity-20 border border-white/20 text-white h-9`}
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

            {/* Mode Selector */}
            <div className="flex items-center gap-2">
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
            <Sparkles className={`w-5 h-5 bg-gradient-to-r ${currentMode?.color || "from-purple-400 to-pink-400"} bg-clip-text text-transparent`} style={{ color: visualMode !== "standard" ? "white" : "" }} />
            <h2 className={`text-2xl font-bold bg-gradient-to-r ${currentMode?.color || "from-purple-400 to-pink-400"} bg-clip-text text-transparent`}>
              {visualMode === "standard" ? "AI Scenario Simulation" : `${currentMode?.label} Visualization`}
            </h2>
          </div>
          <p className="text-white/60 text-sm">
            {currentMode?.description || "Describe any scenario and get a detailed AI-powered simulation"}
          </p>
        </motion.div>

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
              placeholder="e.g., What would happen if Bitcoin reached $1M? Or simulate a startup launching a new product..."
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
                  Summoning...
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

        {/* Visualizer */}
        {showVisualizer && visualElements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
          >
            {visualElements.map((el, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div
                  className="aspect-square rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm overflow-hidden"
                  style={{
                    boxShadow: `0 0 ${el.intensity * 20}px ${el.color || "#ffffff"}40`,
                  }}
                >
                  <div
                    className="w-full h-full flex items-center justify-center text-4xl"
                    style={{
                      background: `radial-gradient(circle at center, ${el.color || "#ffffff"}20 0%, transparent 70%)`,
                    }}
                  >
                    {el.name.charAt(0)}
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center p-2">
                  <p className="text-[10px] text-center text-white/80">{el.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className={`bg-gradient-to-br ${currentMode?.color || "from-purple-500/10 to-pink-500/10"} border border-white/20 rounded-xl p-5 backdrop-blur-xl`}>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>📊</span> Scenario Overview
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">{result.overview}</p>
            </div>

            <div className={`bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-xl ${
              visualMode !== "standard" ? "bg-black/40" : ""
            }`}>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>👥</span> Key Players
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">{result.players}</p>
            </div>

            <div className={`bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-xl ${
              visualMode !== "standard" ? "bg-black/40" : ""
            }`}>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>⏱️</span> Timeline
              </h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.timeline}</p>
            </div>

            <div className={`bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-xl ${
              visualMode !== "standard" ? "bg-black/40" : ""
            }`}>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>🎯</span> Possible Outcomes
              </h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.outcomes}</p>
            </div>

            <div className={`bg-gradient-to-br ${currentMode?.color || "from-purple-500/10 to-pink-500/10"} border border-white/20 rounded-xl p-5 backdrop-blur-xl`}>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>💡</span> Strategic Insights
              </h3>
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
              Enter a scenario to begin the simulation
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}