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
- ultramock_mp4: { tagline: string, device?: "iphone"|"android"|"ipad"|"macbook"|"imac"|"browser"|"none", background?: string, preset?: string, duration?: number, email_to?: string }
   // Renders an animated MP4 in a new browser tab. If email_to is set, the MP4 is uploaded and a download link is emailed.
   // Use whenever the user asks to "make a video", "animate", "render an MP4", "promo video", or wants to email an MP4.
   // tagline supports {{result}}. preset must be one of: spin, tilt, pop, float, reveal, flip, wobble, zoomin, showcase, shake, slide-in-left, slide-in-right, drop-in, orbit, swoop, chat-zoom.
   // CRITICAL EMAIL RULE: If the user mentions ANY of: "email", "send", "mail", "deliver", "to me", "to my inbox" — you MUST set email_to. Use the email address they provided in the request. If they say "to me" or "my email", use: ${currentEmail || "user@example.com"}. NEVER leave email_to empty when emailing is implied. This is the ONLY way the MP4 gets emailed — if email_to is missing, the user gets nothing.
- deep_research: { topic: string, depth: "shallow"|"deep" }   // ACTUALLY scrapes the live web, multi-pass — returns a full markdown research report. Use this whenever the user wants real, current info.
   // CRITICAL: topic MUST be the exact subject the USER asked to research, copied from their request (e.g. "ConsenSys blockchain contributions and key projects"). NEVER leave topic empty and NEVER substitute a different subject.
   // depth: set "shallow" when the user says quick / shallow / brief / fast / short / light; set "deep" when they say deep / thorough / detailed / comprehensive (or don't specify).
- read_ttt_feed: { limit: number, keyword?: string }   // pulls real recent posts from the TTT social feed inside this app. Use whenever user mentions "TTT feed", "the feed", "TTT posts", "what people are saying on TTT".
- post_to_ttt: { author_name?: string, content_override?: string }   // Auto-posts to the TTT social feed. Empty config = uses previous text step + auto-attaches previous ai_image. Use when user says "post to TTT", "publish to feed", "share on TTT", "auto-post".
- send_email: { to: string, subject: string, body: string, from_name?: string }
   - body supports {{result}} which inserts the previous step's output (text OR image — images auto-embed)
   - CRITICAL EMAIL RULE: The "to" field MUST be the EXACT email address the user wrote in their request. Copy it VERBATIM — do not paraphrase, abbreviate, or substitute your own address. If the user wrote "email it to jane@example.com", then to = "jane@example.com". Only default to ${currentEmail || "user@example.com"} if the user said "me"/"my email" and wrote NO explicit address anywhere in the request.
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
- CRITICAL — POSTING TO X / TWITTER: If the user wants to post / tweet / share something on X (Twitter), use this exact pattern:
   1. ai_prompt → write the post text. The prompt MUST instruct the AI to output ONLY the final tweet text, under 275 characters, no preamble, no quotes, no hashtags unless the user asked for them. Example prompt: "Write a single tweet (max 275 chars, no quotes, no preamble) about [topic]. Output only the tweet text itself."
   2. (Optional) ai_image → only add this if the user explicitly asks for an image to go with the post.
   3. send_to_x → with empty config {}. This step automatically picks up the most recent text output and opens X compose.
- CRITICAL: If the user asks for N images (e.g. "10 images", "5 frames", "a slide deck of 8"), output EXACTLY N separate ai_image steps — one per image — each with its own unique, story-progressing prompt. DO NOT collapse them into fewer steps. The send_email step (if any) must come AFTER all ai_image steps so the email auto-embeds every generated image.
- RESEARCH: If the user wants real current information ("research X", "find me", "what's happening with", "latest", "news on", "investigate"), use deep_research — NOT ai_prompt — because deep_research actually scrapes the live web. After deep_research you can chain an ai_prompt to summarize or transform its output via {{result}}.
- TTT FEED: If the user references the TTT feed / posts / community / "what people are saying", use read_ttt_feed to pull real posts FIRST, then chain an ai_prompt or deep_research that processes {{result}}.
- POSTING TO TTT: If user wants to post / publish / share TO the TTT feed, end the workflow with post_to_ttt (config can stay {}). For "post a thought + image to TTT" use: ai_prompt (write the post) → ai_image (the visual) → post_to_ttt {}. The image attaches automatically.
- When generating a sequence of story frames, make each ai_image prompt advance the narrative (frame 1, frame 2, ... frame N) with consistent characters, setting, and style across frames.
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
                  type: {
                    type: "string",
                    enum: NODE_TEMPLATES.map((t) => t.type),
                    description: "MUST be one of the allowed node type strings — NOT 'object'.",
                  },
                  config: {
                    type: "object",
                    properties: {},
                    additionalProperties: true,
                  },
                },
                required: ["type", "config"],
              },
            },
          },
          required: ["workflow_name", "steps"],
        },
      });

      if (!result?.steps?.length) {
        console.warn("[Brain] LLM returned no steps. Full result:", result);
        setError("Couldn't figure out the steps. Try rephrasing.");
        setThinking(false);
        return;
      }

      console.log("[Brain] LLM returned steps:", result.steps);

      // Aliases — handle common LLM type-name drifts
      const TYPE_ALIASES = {
        prompt: "ai_prompt",
        llm: "ai_prompt",
        text: "ai_prompt",
        ai_text: "ai_prompt",
        image: "ai_image",
        generate_image: "ai_image",
        research: "deep_research",
        web_research: "deep_research",
        scrape: "deep_research",
        ttt_feed: "read_ttt_feed",
        read_feed: "read_ttt_feed",
        post_ttt: "post_to_ttt",
        publish_ttt: "post_to_ttt",
        ttt_post: "post_to_ttt",
        post: "post_to_ttt",
        x_post: "send_to_x",
        tweet: "send_to_x",
        email: "send_email",
        wait: "delay",
        sleep: "delay",
      };

      // Fallback: infer node type from the keys in a config object.
      // Used when the LLM returns literal "object" as the type (it confused the JSON schema).
      const inferTypeFromConfig = (cfg) => {
        if (!cfg || typeof cfg !== "object") return null;
        const keys = Object.keys(cfg);
        if (keys.includes("topic") && keys.includes("depth")) return "deep_research";
        if (keys.includes("topic")) return "deep_research";
        if (keys.includes("to") && keys.includes("subject")) return "send_email";
        if (keys.includes("url") && keys.includes("method")) return "webhook";
        if (keys.includes("limit") || keys.includes("keyword")) return "read_ttt_feed";
        if (keys.includes("seconds")) return "delay";
        if (keys.includes("contains")) return "filter";
        if (keys.includes("author_name") || keys.includes("content_override")) return "post_to_ttt";
        if (keys.includes("prompt")) {
          const p = String(cfg.prompt || "").toLowerCase();
          // image-y wording → ai_image, otherwise ai_prompt
          if (/\b(image|visual|frame|illustrat|depict|render|render|render|picture|photo|art|scene|drawing)\b/.test(p)) {
            return "ai_image";
          }
          return "ai_prompt";
        }
        return null;
      };

      const droppedSteps = [];
      // Map each step to a node template
      const nodes = result.steps
        .map((step) => {
          const rawType = (step?.type || "").toLowerCase().trim();
          let resolvedType = TYPE_ALIASES[rawType] || rawType;
          // If the LLM glitched and returned the schema literal "object", infer from config keys.
          // Configs may live under .config OR .properties depending on how the LLM messed up.
          let stepConfig = step?.config && Object.keys(step.config).length ? step.config : (step?.properties || {});
          if (resolvedType === "object" || !NODE_TEMPLATES.find((t) => t.type === resolvedType)) {
            const inferred = inferTypeFromConfig(stepConfig);
            if (inferred) {
              console.warn(`[Brain] Rescued step — inferred "${inferred}" from config keys:`, Object.keys(stepConfig));
              resolvedType = inferred;
            }
          }
          const tpl = NODE_TEMPLATES.find((t) => t.type === resolvedType);
          if (!tpl) {
            droppedSteps.push(rawType || "(empty)");
            return null;
          }
          const mergedConfig = { ...(tpl.defaultConfig || {}), ...stepConfig };
          // Guarantee ultramock_mp4 has email_to filled when the user's request mentions emailing.
          // The LLM sometimes forgets — this catches it. We extract any email from the user input,
          // or fall back to the current user's email.
          if (tpl.type === "ultramock_mp4") {
            const wantsEmail = /\b(email|e-mail|send|mail|deliver|inbox|to me|my email)\b/i.test(input);
            if (wantsEmail && !mergedConfig.email_to) {
              const emailMatch = input.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
              mergedConfig.email_to = emailMatch ? emailMatch[0] : (currentEmail || "");
            }
          }
          // Guarantee send_email has the EXACT recipient the user asked for.
          // The LLM sometimes hallucinates or leaves "to" blank; we rescue it by pulling
          // the email straight out of the user's Brain description BEFORE falling back to
          // the current user's email (which caused wrong-recipient bugs).
          if (tpl.type === "send_email") {
            const to = (mergedConfig.to || "").trim();
            const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
            // First email address mentioned in the user's raw Brain request.
            const emailInInput = input.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
            if (!looksValid) {
              // LLM gave no/bad recipient — prefer the one in the request, else current user.
              mergedConfig.to = emailInInput ? emailInInput[0] : (currentEmail || "");
            } else if (emailInInput && to !== emailInInput[0] && to === currentEmail) {
              // LLM fell back to current user's email, but the request named a different one.
              mergedConfig.to = emailInInput[0];
            }
            if (!mergedConfig.subject) mergedConfig.subject = "Your NODA workflow result";
            if (!mergedConfig.body) mergedConfig.body = "Hey 👋\n\n{{result}}\n\n— NODA";
          }
          // Guarantee deep_research researches what the USER asked — never the template's
          // Kaspa placeholder topic. If the LLM omitted the topic (or the default leaked
          // through), derive it straight from the user's raw Brain request.
          if (tpl.type === "deep_research") {
            const topic = (mergedConfig.topic || "").trim();
            if (!topic || topic === (tpl.defaultConfig?.topic || "").trim()) {
              mergedConfig.topic = input.trim();
            }
            // Honor speed keywords the LLM often ignores: "quick shallow research" → shallow.
            if (/\b(quick|shallow|brief|fast|short|light)\b/i.test(input)) {
              mergedConfig.depth = "shallow";
            } else if (/\b(deep|thorough|detailed|comprehensive)\b/i.test(input)) {
              mergedConfig.depth = "deep";
            }
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
        console.warn("[Brain] All steps dropped. Raw types:", droppedSteps, "Full result:", result);
        setError(
          droppedSteps.length
            ? `AI returned unknown step types: ${droppedSteps.join(", ")}. Try rephrasing.`
            : "AI returned no valid steps."
        );
        setThinking(false);
        return;
      }
      if (droppedSteps.length) {
        console.warn("[Brain] Dropped unknown steps:", droppedSteps);
      }

      // GUARANTEE: if the user asked to post/publish/share to the feed but the LLM
      // omitted the post_to_ttt step (the #1 cause of "didn't post on feed!"), append it.
      const wantsFeedPost = /\b(post|publish|share|push)\b/i.test(input) && /\b(feed|ttt)\b/i.test(input);
      if (wantsFeedPost && !nodes.some((n) => n.type === "post_to_ttt")) {
        const tpl = NODE_TEMPLATES.find((t) => t.type === "post_to_ttt");
        if (tpl) {
          console.warn("[Brain] Rescued missing post_to_ttt step — user asked to post to feed");
          nodes.push({
            id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type: tpl.type,
            label: tpl.label,
            icon: tpl.icon,
            color: tpl.color,
            config: { ...(tpl.defaultConfig || {}) },
            output: null,
          });
        }
      }

      onBuild(nodes, result.workflow_name, input.trim());
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
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg my-auto bg-gradient-to-br from-zinc-950 to-zinc-900 border border-fuchsia-500/30 rounded-2xl shadow-2xl shadow-fuchsia-500/10 overflow-hidden max-h-[95vh] flex flex-col"
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

            <div className="p-3 sm:p-5 overflow-y-auto">
              <textarea
                autoFocus
                data-agent-id="brain"
                aria-label="brain"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) buildFromBrain();
                }}
                placeholder="e.g. Write a poem about Kaspa, generate a matching cosmic image, then email both to me at jane@example.com"
                rows={4}
                className="w-full bg-black/50 border border-white/10 focus:border-fuchsia-400/50 focus:bg-black/70 rounded-xl px-3 py-2.5 text-white text-sm outline-none resize-none transition-colors placeholder:text-white/25 min-h-[80px]"
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
                  data-agent-id="build"
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