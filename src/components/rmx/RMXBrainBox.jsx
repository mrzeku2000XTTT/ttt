import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Loader2, X, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { NODE_TEMPLATES } from "./RMXNodeLibrary";

/**
 * RMXBrainBox — natural-language workflow builder.
 * User types what they want; AI returns a node sequence which is built on the canvas.
 */
export default function RMXBrainBox({ open, onClose, onBuild, currentEmail }) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");

  const buildFromBrain = async () => {
    if (!input.trim()) return;
    setThinking(true);
    setError("");

    const allowedTypes = NODE_TEMPLATES.map((t) => t.type).join(", ");

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a workflow builder. The user describes what they want; you output a sequence of workflow steps.

Available node types: ${allowedTypes}

Node config schemas:
- ai_prompt: { prompt: string }   // returns text
- ai_image: { prompt: string }    // returns an image URL
- send_email: { to: string, subject: string, body: string, from_name?: string }
   - body supports {{result}} which inserts the previous step's output (text OR image — images auto-embed)
- delay: { seconds: number }
- filter: { contains: string }
- webhook: { url: string, method: "POST"|"GET" }
- save_data: {}
- branch: {}

Rules:
- Output ONLY a JSON object matching the schema — no commentary.
- Order matters: steps run top to bottom, each step receives the previous step's output via {{result}}.
- If the user wants an email with an AI-generated image, use TWO steps: ai_image then send_email with body containing {{result}}.
- If the user wants an email with AI-written text + image, use THREE steps: ai_prompt, ai_image, then send_email. The email body can reference {{result}} which auto-embeds the most recent image AND prior text.
- Default recipient email if user mentions "me" or "my email": ${currentEmail || "user@example.com"}
- Keep prompts concrete and detailed.

USER REQUEST:
"""${input.trim()}"""`,
        response_json_schema: {
          type: "object",
          properties: {
            workflow_name: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  config: { type: "object", additionalProperties: true },
                },
                required: ["type", "config"],
              },
            },
          },
          required: ["steps"],
        },
      });

      if (!result?.steps?.length) {
        setError("Couldn't figure out the steps. Try rephrasing.");
        setThinking(false);
        return;
      }

      // Map each step to a node template
      const nodes = result.steps
        .map((step) => {
          const tpl = NODE_TEMPLATES.find((t) => t.type === step.type);
          if (!tpl) return null;
          const mergedConfig = { ...(tpl.defaultConfig || {}), ...(step.config || {}) };
          // Guarantee send_email always has a valid recipient — fall back to current user
          if (tpl.type === "send_email") {
            const to = (mergedConfig.to || "").trim();
            const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
            if (!looksValid && currentEmail) {
              mergedConfig.to = currentEmail;
            }
            if (!mergedConfig.subject) mergedConfig.subject = "Your NODA workflow result";
            if (!mergedConfig.body) mergedConfig.body = "Hey 👋\n\n{{result}}\n\n— NODA";
          }
          return {
            id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type: tpl.type,
            label: tpl.label,
            icon: tpl.icon,
            color: tpl.color,
            config: mergedConfig,
            output: null,
          };
        })
        .filter(Boolean);

      if (!nodes.length) {
        setError("AI returned no valid steps.");
        setThinking(false);
        return;
      }

      onBuild(nodes, result.workflow_name);
      setInput("");
      setThinking(false);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
      setThinking(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-gradient-to-br from-zinc-950 to-zinc-900 border border-fuchsia-500/30 rounded-2xl shadow-2xl shadow-fuchsia-500/10 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <span className="text-white font-bold text-sm">Brain</span>
                  <span className="text-white/40 text-[10px] ml-2 font-medium">Tell the AI what you want</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <textarea
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) buildFromBrain();
                }}
                placeholder="e.g. Write a poem about Kaspa, generate a matching cosmic image, then email both to me at jane@example.com"
                rows={5}
                className="w-full bg-black/50 border border-white/10 focus:border-fuchsia-400/50 focus:bg-black/70 rounded-xl px-3 py-3 text-white text-sm outline-none resize-none transition-colors placeholder:text-white/25"
              />

              {error && (
                <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <div className="flex-1 flex items-center gap-1.5 text-white/30 text-[10px] font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>AI picks the steps & wires them up</span>
                </div>
                <button
                  onClick={buildFromBrain}
                  disabled={thinking || !input.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-fuchsia-500/20"
                >
                  {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {thinking ? "Thinking" : "Build"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}