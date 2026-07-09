import { base44 } from "@/api/base44Client";
import { EARN_TASKS } from "./agentCredits";

export const AGENT_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b053dc185_generated_image.png";

// AGENT. branded models mapped to real backend LLMs
export const KASPA_AI_MODELS = [
  { id: "base_1", label: "Base 1", badge: "New", tag: "Flagship", backend: "gemini_3_1_pro", web: true, logo: "orb", color: "#4d6bfe", cost: 3 },
  { id: "sonnet_5", label: "Sonnet 5", tag: "Balanced", backend: "claude-sonnet-5", web: false, logo: "anthropic", color: "#D97757", cost: 4 },
  { id: "opus_48", label: "Opus 4.8", tag: "Deep Think", backend: "claude_opus_4_8", web: false, logo: "anthropic", color: "#D97757", cost: 8 },
  { id: "fable_5", label: "Fable 5", tag: "Creative", backend: "claude_sonnet_4_6", web: false, logo: "fable", color: "#c084fc", cost: 4 },
  { id: "gpt_terra", label: "GPT-5.6 Terra", badge: "New", tag: "Reasoning", backend: "gpt_5_4", web: false, logo: "openai", color: "#ECECEC", cost: 5 },
  { id: "gptsol", label: "GPT-5.6 Sol", badge: "New", tag: "Reasoning", backend: "gpt_5_5", web: false, logo: "sol", color: "#14F195", cost: 5 },
  { id: "basic", label: "Basic", tag: "Fast", backend: "gpt_5_mini", web: false, logo: "basic", color: "#9ca3af", cost: 1 },
];

const SYSTEM = `You are AGENT. — a powerful autonomous multi-model AI agent on the TTT platform (powered by Kaspa).
You have real tools. Decide if the user's request needs one:
- "generate_image": user wants an image/picture/logo/art created. action_input = a detailed image prompt.
- "build_app": user wants to BUILD, CREATE or LAUNCH an app, website, landing page, tool, game or product. action_input = a detailed product spec (name, purpose, features, style).
- "kaspa_price": user asks about the KAS/Kaspa price or market.
- "kaspa_balance": user asks ONLY the balance of a kaspa address. action_input = the kaspa address.
- "node_status": user wants to connect to / check the live Kaspa node, network or BlockDAG status.
- "kaspa_txs": user asks for transactions / activity / history of a kaspa address, or asks to SCAN an address (e.g. "wallet #1 latest transactions"). action_input = the kaspa address.
- "explain_tx": user pastes a Kaspa transaction ID (64-char hex string) or asks to explain a transaction. action_input = the tx id only.
- "speak": user wants text read aloud / audio / voice. action_input = the text to speak (max 500 chars).
- "verify_task": the user submits PROOF (usually a screenshot) that they completed a K-CREDITS earn task. Valid task ids: "follow_x" (they follow @TTTPlatform on X), "post_x" (they posted about AGENT. on X), "join_telegram" (they joined the TTT Telegram). Analyze the attached proof image STRICTLY — set "task_approved" true ONLY if the image clearly shows the task completed; false otherwise (no image attached = false). action_input = the task id.
- "none": everything else — answer directly.
CRITICAL — USE DATA ALREADY FETCHED: the conversation may contain [TOOL DATA] blocks with live Kaspa data already retrieved. When the user asks a follow-up about that data (e.g. "explain its pattern", "what does this mean", "ok what", "is this an exchange?"), DO NOT re-run a tool — choose action "none" and write a complete analytical answer in "reply" using the [TOOL DATA]: cover transaction frequency, typical amounts, direction (+ = received, − = sent), timing patterns, and what kind of wallet it looks like (exchange, mining pool, personal, treasury). Only re-run "kaspa_txs"/"kaspa_balance" when the user asks for FRESH data or a NEW address.
Also output "thought": one short sentence of your internal reasoning about the task (shown to the user as your thinking).
Always write a helpful "reply" in Markdown. If using a tool, the reply should introduce the result naturally (the tool output is attached automatically after your reply).`;

const BUILDER_PROMPT = (spec) => `You are AGENT.'s product engineer. Build a COMPLETE, polished, standalone HTML file for this product spec:

${spec}

Requirements:
- Single self-contained HTML file: inline <style> and <script>, no external dependencies except Google Fonts.
- Beautiful modern dark UI, fully responsive, real working interactivity in vanilla JS (state in localStorage where useful — this is the user's personal backend).
- Include a hero/header with the product name.
Return JSON: { "title": short product name, "description": one-line description, "html": the full HTML document starting with <!DOCTYPE html> }`;

// One full agent turn with live thought streaming. Returns { reply, thought, attachment }
const TOOL_ACTIONS = ["generate_image", "build_app", "kaspa_price", "kaspa_balance", "speak", "node_status", "kaspa_txs", "explain_tx"];

// Summarize a message's tool attachment so follow-up questions can be answered from context
function summarizeAttachment(a) {
  try {
    if (!a) return "";
    if (a.type === "txlist") return `\n[TOOL DATA — address scan] ${JSON.stringify({ address: a.address, balanceKAS: a.balanceKAS, txs: (a.txs || []).slice(0, 15) })}`;
    if (a.type === "txdetail") return `\n[TOOL DATA — tx detail] ${JSON.stringify(a).slice(0, 2500)}`;
    if (a.type === "balance") return `\n[TOOL DATA — balance] ${a.balance} KAS · ${a.address}`;
    if (a.type === "node") return `\n[TOOL DATA — node status] ${JSON.stringify(a).slice(0, 1200)}`;
    if (a.type === "price") return `\n[TOOL DATA — KAS price] $${a.price} (${a.change ?? "?"}% 24h)`;
  } catch {}
  return "";
}

export async function runSkillTurn({ model, webSearch, history, text, fileUrls = [], onThought, toolAccess = null }) {
  const think = (t) => { try { onThought?.(t); } catch {} };
  const convo = history.slice(-10).map(m => `${m.role === "user" ? "User" : "AGENT"}: ${m.content}${m.role === "assistant" ? summarizeAttachment(m.attachment) : ""}`).join("\n");

  const useWeb = webSearch;
  const backend = useWeb && !model.web ? "gemini_3_flash" : model.backend;

  think(`Reasoning with ${model.label}${useWeb ? " · searching the web" : ""}${fileUrls.length ? ` · analyzing ${fileUrls.length} file${fileUrls.length > 1 ? "s" : ""}` : ""}…`);

  const decision = await base44.integrations.Core.InvokeLLM({
    model: backend,
    add_context_from_internet: useWeb && backend.includes("gemini"),
    file_urls: fileUrls.length ? fileUrls : undefined,
    prompt: `${SYSTEM}\n\n## Conversation\n${convo}\nUser: ${text}${fileUrls.length ? `\n(The user attached ${fileUrls.length} file(s) — analyze them.)` : ""}`,
    response_json_schema: {
      type: "object",
      properties: {
        thought: { type: "string" },
        reply: { type: "string" },
        action: { type: "string", enum: ["none", "generate_image", "build_app", "kaspa_price", "kaspa_balance", "speak", "verify_task", "node_status", "kaspa_txs", "explain_tx"] },
        action_input: { type: "string" },
        task_approved: { type: "boolean" },
      },
      required: ["reply", "action"],
    },
  });

  if (decision?.thought) think(decision.thought);

  // AGENT TOOLS gate — tools require a connected Kaspa wallet (admins unlimited)
  if (toolAccess && !toolAccess.unlimited && TOOL_ACTIONS.includes(decision?.action)) {
    if (!toolAccess.walletConnected) {
      return { reply: "**AGENT TOOLS are locked.** Connect your Kaspa wallet in **Settings** (gear icon, top right) to unlock one-click tools — image generation, product builder, voice, live prices & more. No API keys needed — everything runs on TTT's own infrastructure.", thought: null, attachment: null };
    }
    if (toolAccess.enabled?.[decision.action] === false) {
      return { reply: "That tool is switched off in your **Settings**. Turn it back on and try again.", thought: null, attachment: null };
    }
  }

  let reply = decision?.reply || "Hmm, try again?";
  let attachment = null;

  try {
    if (decision.action === "generate_image" && decision.action_input) {
      think("Generating your image…");
      const res = await base44.integrations.Core.GenerateImage({ prompt: decision.action_input });
      if (res?.url) attachment = { type: "image", url: res.url };
    } else if (decision.action === "build_app" && decision.action_input) {
      think("Writing product spec → architecting UI…");
      think("Building your product — writing HTML, CSS & JS…");
      const app = await base44.integrations.Core.InvokeLLM({
        model: "claude_opus_4_8",
        prompt: BUILDER_PROMPT(decision.action_input),
        response_json_schema: {
          type: "object",
          properties: { title: { type: "string" }, description: { type: "string" }, html: { type: "string" } },
          required: ["title", "html"],
        },
      });
      if (app?.html) {
        think("Deploying to your personal backend…");
        let saved = null;
        try {
          saved = await base44.entities.AgentProduct.create({
            title: app.title, description: app.description || "", html_content: app.html, status: "launched",
          });
        } catch {}
        attachment = { type: "app", title: app.title, description: app.description || "", html: app.html, productId: saved?.id || null };
      }
    } else if (decision.action === "kaspa_price") {
      think("Fetching live Kaspa market data…");
      const res = await base44.functions.invoke("getKaspaPrice", {});
      const d = res?.data || res;
      if (d?.price != null) attachment = { type: "price", price: d.price, change: d.change24h ?? null };
    } else if (decision.action === "kaspa_balance" && decision.action_input) {
      think("Querying the Kaspa network…");
      const res = await base44.functions.invoke("getKaspaBalance", { address: decision.action_input.trim() });
      const d = res?.data || res;
      if (d?.balance != null || d?.balanceKAS != null) {
        attachment = { type: "balance", balance: d.balanceKAS ?? d.balance, address: decision.action_input.trim() };
      }
    } else if (decision.action === "node_status") {
      think("Connecting to live Kaspa REST node…");
      const res = await base44.functions.invoke("agentNodeQuery", { action: "status" });
      const d = res?.data || res;
      if (d?.success) attachment = { type: "node", ...d };
    } else if (decision.action === "kaspa_txs" && decision.action_input) {
      think("Scanning address on the live Kaspa node…");
      const res = await base44.functions.invoke("agentNodeQuery", { action: "scan", address: decision.action_input.trim() });
      const d = res?.data || res;
      if (d?.success) {
        attachment = { type: "txlist", address: d.address, balanceKAS: d.balanceKAS, txs: d.txs || [] };
        think("Analyzing wallet activity — writing the breakdown…");
        try {
          const analyzed = await base44.integrations.Core.InvokeLLM({
            prompt: `The user asked: "${text}". Here is LIVE Kaspa node data for ${d.address} — balance ${d.balanceKAS} KAS, recent transactions (amounts in KAS, + = received / − = sent, time is unix ms): ${JSON.stringify((d.txs || []).slice(0, 15))}.\n\nAnswer the user's question directly in concise Markdown using this data: frequency, typical amounts, direction, timing patterns, and what kind of wallet this looks like (exchange, mining pool, personal, treasury). Do NOT say you'll fetch data — it's already here; the raw list renders below your answer.`,
          });
          if (analyzed) reply = analyzed;
        } catch {}
      }
    } else if (decision.action === "explain_tx" && decision.action_input) {
      think("Fetching transaction from the live node…");
      const res = await base44.functions.invoke("agentNodeQuery", { action: "tx", txId: decision.action_input.trim() });
      const d = res?.data || res;
      if (d?.success) {
        attachment = { type: "txdetail", ...d };
        think("Analyzing the transaction — writing a plain-English breakdown…");
        try {
          const explained = await base44.integrations.Core.InvokeLLM({
            prompt: `Explain this Kaspa transaction in clear, friendly plain English so anyone can understand it. Cover: what happened, who sent to who (shorten addresses like kaspa:qq12…ab34), amounts in KAS, the fee, when it happened (block time is unix ms), and whether it was accepted by the network. Keep it concise with Markdown.\n\n${JSON.stringify(d)}`,
          });
          if (explained) reply = explained;
        } catch {}
      }
    } else if (decision.action === "verify_task" && decision.action_input) {
      think("Analyzing your proof…");
      const task = EARN_TASKS.find(t => t.id === decision.action_input.trim());
      if (task) attachment = { type: "task", taskId: task.id, reward: task.reward, approved: !!decision.task_approved };
    } else if (decision.action === "speak" && decision.action_input) {
      think("Synthesizing voice…");
      const res = await base44.integrations.Core.GenerateSpeech({ text: decision.action_input.slice(0, 500) });
      if (res?.url) attachment = { type: "audio", url: res.url };
    }
  } catch {
    // tool failed silently — reply text still stands
  }

  return { reply, thought: decision?.thought || null, attachment };
}