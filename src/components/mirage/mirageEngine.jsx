import { base44 } from "@/api/base44Client";
import { findTool } from "./mirageTools";

/**
 * mirageEngine — runs a MIRAGE workflow.
 * Input: ordered list of node objects { id, toolId, config }
 * Each node receives the previous node's output via {{result}} interpolation.
 */

const stringify = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    try { return JSON.stringify(val, null, 2); } catch { return String(val); }
  }
  return String(val);
};

const interpolate = (str, prevOutput) => {
  if (typeof str !== "string") return str;
  return str.replace(/\{\{\s*result\s*\}\}/gi, () => stringify(prevOutput));
};

export async function runMirageNode(node, prevOutput, allOutputs) {
  const tool = findTool(node.toolId);
  if (!tool) throw new Error(`Unknown tool: ${node.toolId}`);
  const cfg = node.config || {};

  switch (tool.capability) {
    case "image": {
      const prompt = interpolate(cfg.prompt || "", prevOutput);
      if (!prompt.trim()) throw new Error("Image prompt is empty");
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      return res?.url || "";
    }

    case "llm": {
      const prompt = interpolate(cfg.prompt || "", prevOutput);
      if (!prompt.trim()) throw new Error("Prompt is empty");
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      return res;
    }

    case "research": {
      const topic = interpolate(cfg.topic || "", prevOutput);
      if (!topic.trim()) throw new Error("Research topic is empty");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Conduct deep web research on: """${topic}"""

Use live web search. Return a thorough markdown report with:
# ${topic}
## Key Findings (5-7 bullets with concrete facts, dates, names, numbers)
## Detailed Analysis (3-5 sections covering different angles)
## Sources (numbered URLs you actually used)

Be specific. No filler. Use real current data.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
      });
      return typeof res === "string" ? res : stringify(res);
    }

    case "search": {
      const query = interpolate(cfg.query || "", prevOutput);
      if (!query.trim()) throw new Error("Search query is empty");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the web for: "${query}". Summarize the 5 most relevant current results with source URLs.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
      });
      return typeof res === "string" ? res : stringify(res);
    }

    case "read_feed": {
      const limit = Math.max(1, Math.min(50, Number(cfg.limit) || 10));
      const keyword = (cfg.keyword || "").trim().toLowerCase();
      const posts = await base44.entities.Post.list("-created_date", limit * 2);
      const filtered = keyword
        ? posts.filter((p) => (p.content || "").toLowerCase().includes(keyword))
        : posts;
      const top = filtered.slice(0, limit);
      if (top.length === 0) return "No TTT posts found.";
      return top
        .map((p, i) => {
          const author = p.author_name || "anon";
          const content = (p.content || "").trim().slice(0, 400);
          return `**${i + 1}. @${author}** — ${content}`;
        })
        .join("\n\n");
    }

    case "post": {
      // Walk back through outputs for text + image
      let textPart = "";
      let imageUrl = "";
      for (let i = allOutputs.length - 1; i >= 0; i--) {
        const out = allOutputs[i];
        if (typeof out === "string" && /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i.test(out)) {
          if (!imageUrl) imageUrl = out;
          continue;
        }
        if (!textPart) textPart = stringify(out).trim();
      }
      const overrideText = interpolate(cfg.content_override || "", prevOutput).trim();
      const content = overrideText || textPart;
      if (!content) throw new Error("No content to post");

      const payload = {
        content,
        author_name: (cfg.author_name || "").trim() || "MIRAGE",
        author_role: "user",
      };
      if (imageUrl) {
        payload.image_url = imageUrl;
        payload.media_files = [{ url: imageUrl, type: "image/png", name: "mirage.png", size: 0 }];
      }
      const created = await base44.entities.Post.create(payload);
      return { posted: true, post_id: created?.id, has_image: !!imageUrl };
    }

    case "email": {
      const to = interpolate(cfg.to || "", prevOutput).trim();
      const subject = interpolate(cfg.subject || "MIRAGE", prevOutput);
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        throw new Error(`Invalid recipient: "${to}"`);
      }
      let body = interpolate(cfg.body || "{{result}}", prevOutput);

      // Embed image URLs
      body = body.replace(
        /(https?:\/\/[^\s<"']+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s<"']*)?)/gi,
        (url) => `<img src="${url}" alt="" style="max-width:100%;border-radius:12px;margin:12px 0;display:block;" />`
      );
      // Newlines → breaks if not HTML
      if (!/<[a-z][\s\S]*>/i.test(body)) {
        body = body.replace(/\n/g, "<br/>");
      }

      await base44.integrations.Core.SendEmail({ to, subject, body, from_name: "MIRAGE AI" });
      return { sent: true, to };
    }

    case "social": {
      const text = stringify(prevOutput).trim();
      if (!text) throw new Error("No text to post");
      const tweet = text.length > 275 ? text.slice(0, 272).trimEnd() + "…" : text;
      const intent = `https://x.com/intent/post?text=${encodeURIComponent(tweet)}`;
      try { window.open(intent, "_blank", "noopener,noreferrer"); } catch {}
      try { await navigator.clipboard.writeText(text); } catch {}
      return { opened: true, chars: tweet.length };
    }

    default:
      throw new Error(`Unsupported capability: ${tool.capability}`);
  }
}

export async function runMirageWorkflow(nodes, onLog) {
  const log = (msg, type = "info") => onLog?.({ msg, type, time: new Date().toLocaleTimeString() });
  log(`▶ MIRAGE awakening · ${nodes.length} tool${nodes.length === 1 ? "" : "s"}`);

  const outputs = [];
  let prev = null;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const tool = findTool(node.toolId);
    log(`→ ${tool?.appName || node.toolId}…`);
    try {
      const result = await runMirageNode(node, prev, outputs);
      outputs.push(result);
      prev = result;
      log(`✓ ${tool?.appName || node.toolId} complete`, "success");
    } catch (err) {
      log(`✗ ${tool?.appName || node.toolId} failed: ${err.message}`, "error");
      throw err;
    }
  }
  log(`■ MIRAGE complete`, "success");
  return outputs;
}