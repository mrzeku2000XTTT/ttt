import { base44 } from "@/api/base44Client";

// TTT-branded models mapped to real backend LLMs
export const KASPA_AI_MODELS = [
  { id: "base_1", label: "Base 1", tag: "Flagship", backend: "gemini_3_1_pro", web: true, color: "#4d6bfe" },
  { id: "gptsol", label: "GPTSol", tag: "Reasoning", backend: "gpt_5_5", web: false, color: "#10a37f" },
  { id: "gpt_terra", label: "GPT Terra", tag: "Fast", backend: "gpt_5_4", web: false, color: "#0ea5e9" },
  { id: "fable_5", label: "Fable 5", tag: "Creative", backend: "claude-sonnet-5", web: false, color: "#c084fc" },
  { id: "opus_48", label: "Opus 4.8", tag: "Deep Think", backend: "claude_opus_4_8", web: false, color: "#f59e0b" },
];

const SYSTEM = `You are TTT AI — a powerful multi-model assistant on the TTT platform (powered by Kaspa).
You have real tools. Decide if the user's request needs one:
- "generate_image": user wants an image/picture/logo/art created. action_input = a detailed image prompt.
- "kaspa_price": user asks about the KAS/Kaspa price or market.
- "kaspa_balance": user asks the balance of a kaspa address. action_input = the kaspa address.
- "speak": user wants text read aloud / audio / voice. action_input = the text to speak (max 500 chars).
- "none": everything else — answer directly.
Always write a helpful "reply" in Markdown (short paragraphs, bold key terms). If using a tool, the reply should introduce the result naturally (the tool output is attached automatically after your reply).`;

// One full skill-enabled turn. Returns { reply, attachment }
export async function runSkillTurn({ model, webSearch, history, text }) {
  const convo = history.slice(-10).map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n");

  // Web search only works on gemini backends — auto-route when toggled on
  const useWeb = webSearch;
  const backend = useWeb && !model.web ? "gemini_3_flash" : model.backend;

  const decision = await base44.integrations.Core.InvokeLLM({
    model: backend,
    add_context_from_internet: useWeb && (backend.includes("gemini")),
    prompt: `${SYSTEM}\n\n## Conversation\n${convo}\nUser: ${text}`,
    response_json_schema: {
      type: "object",
      properties: {
        reply: { type: "string" },
        action: { type: "string", enum: ["none", "generate_image", "kaspa_price", "kaspa_balance", "speak"] },
        action_input: { type: "string" },
      },
      required: ["reply", "action"],
    },
  });

  const reply = decision?.reply || "Hmm, try again?";
  let attachment = null;

  try {
    if (decision.action === "generate_image" && decision.action_input) {
      const res = await base44.integrations.Core.GenerateImage({ prompt: decision.action_input });
      if (res?.url) attachment = { type: "image", url: res.url };
    } else if (decision.action === "kaspa_price") {
      const res = await base44.functions.invoke("getKaspaPrice", {});
      const d = res?.data || res;
      if (d?.price != null) attachment = { type: "price", price: d.price, change: d.change24h ?? null };
    } else if (decision.action === "kaspa_balance" && decision.action_input) {
      const res = await base44.functions.invoke("getKaspaBalance", { address: decision.action_input.trim() });
      const d = res?.data || res;
      if (d?.balance != null || d?.balanceKAS != null) {
        attachment = { type: "balance", balance: d.balanceKAS ?? d.balance, address: decision.action_input.trim() };
      }
    } else if (decision.action === "speak" && decision.action_input) {
      const res = await base44.integrations.Core.GenerateSpeech({ text: decision.action_input.slice(0, 500) });
      if (res?.url) attachment = { type: "audio", url: res.url };
    }
  } catch {
    // tool failed silently — reply text still stands
  }

  return { reply, attachment };
}