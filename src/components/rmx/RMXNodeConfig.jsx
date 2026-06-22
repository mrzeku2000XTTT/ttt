import React from "react";
import { X, Trash2 } from "lucide-react";
import NodeImageOutput from "@/components/rmx/NodeImageOutput";

export default function RMXNodeConfig({ node, onUpdate, onClose, onDelete, onWorldToggle }) {
  const setField = (key, val) => {
    onUpdate({ config: { ...node.config, [key]: val } });
  };

  const fields = getFields(node.type);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-black text-base">{node.label}</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{node.type}</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-white/70 text-xs font-bold mb-1.5">
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea
                value={node.config[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={4}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-purple-400 rounded-lg text-white text-sm outline-none resize-none"
              />
            ) : f.type === "checkbox" ? (
              <label className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white/70 text-sm">
                <input
                  type="checkbox"
                  checked={node.config[f.key] === true || node.config[f.key] === "yes"}
                  onChange={(e) => setField(f.key, e.target.checked ? "yes" : "no")}
                  className="w-4 h-4 accent-purple-500"
                />
                Enabled
              </label>
            ) : f.type === "select" ? (
              <select
                value={node.config[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-purple-400 rounded-lg text-white text-sm outline-none"
              >
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || "text"}
                value={node.config[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-purple-400 rounded-lg text-white text-sm outline-none"
              />
            )}
            {f.hint && <p className="text-white/30 text-[10px] mt-1">{f.hint}</p>}
          </div>
        ))}
      </div>

      {node.output !== null && node.output !== undefined && (
        <div className="mb-4">
          <label className="block text-white/70 text-xs font-bold mb-1.5">Last Output</label>
          {(["ai_image", "k6ix_image", "k6ix_video"].includes(node.type)) && typeof node.output === "string" && node.output ? (
            <NodeImageOutput url={node.output} onWorldToggle={onWorldToggle} />
          ) : (
            <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg max-h-48 overflow-y-auto">
              <pre className="text-green-300 text-[11px] whitespace-pre-wrap break-words font-mono">
                {typeof node.output === "string" ? node.output : JSON.stringify(node.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-bold"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete Step
      </button>
    </div>
  );
}

function getFields(type) {
  switch (type) {
    case "ai_prompt":
      return [
        { key: "prompt", label: "Prompt", type: "textarea", placeholder: "What should the AI do?", hint: "Use {{result}} to insert the previous step's output" },
        {
          key: "model",
          label: "Model",
          type: "select",
          options: [
            "automatic",
            "gpt_5_mini",
            "gpt_5_4",
            "gpt_5_5",
            "gemini_3_flash",
            "gemini_3_1_pro",
            "claude_sonnet_4_6",
            "claude_opus_4_6",
            "claude_opus_4_7",
          ],
          hint: "Automatic = fast & cheap. Claude Opus = deepest reasoning. Gemini 3 = web-aware. Non-default models cost more credits.",
        },
        { key: "use_internet", label: "Use live web context", type: "select", options: ["no", "yes"], hint: "Only works with gemini_3_flash or gemini_3_1_pro" },
      ];
    case "ai_summarize":
      return [
        { key: "style", label: "Style", type: "select", options: ["bullets", "paragraph", "tldr", "tweet"] },
        { key: "length", label: "Length", type: "select", options: ["short", "medium", "long"] },
      ];
    case "ai_translate":
      return [
        { key: "target_language", label: "Target Language", placeholder: "Spanish, French, Japanese, etc." },
      ];
    case "ai_extract":
      return [
        { key: "fields", label: "Fields to extract", type: "textarea", placeholder: "title, author, date, summary", hint: "Comma-separated list. Output is JSON." },
      ];
    case "ai_classify":
      return [
        { key: "mode", label: "Mode", type: "select", options: ["sentiment", "category", "score"] },
        { key: "categories", label: "Categories (comma-separated)", placeholder: "positive, neutral, negative" },
      ];
    case "fetch_url":
      return [{ key: "url", label: "URL", placeholder: "https://example.com", hint: "Fetches the page text. Some sites block direct fetch (CORS)." }];
    case "fetch_rss":
      return [
        { key: "url", label: "RSS URL", placeholder: "https://hnrss.org/frontpage" },
        { key: "limit", label: "Items to return", type: "number", placeholder: "10" },
      ];
    case "hacker_news":
      return [
        { key: "feed", label: "Feed", type: "select", options: ["top", "new", "best", "ask", "show"] },
        { key: "limit", label: "How many?", type: "number", placeholder: "10" },
      ];
    case "reddit":
      return [
        { key: "subreddit", label: "Subreddit", placeholder: "kaspa" },
        { key: "sort", label: "Sort", type: "select", options: ["hot", "new", "top", "rising"] },
        { key: "limit", label: "How many?", type: "number", placeholder: "10" },
      ];
    case "weather":
      return [{ key: "city", label: "City", placeholder: "Austin", hint: "Live weather via Open-Meteo (free, no key)" }];
    case "crypto_price":
      return [
        { key: "coin", label: "Coin ID", placeholder: "kaspa", hint: "CoinGecko ID, e.g. kaspa, bitcoin, ethereum" },
        { key: "currency", label: "Currency", placeholder: "usd" },
      ];
    case "wikipedia":
      return [{ key: "topic", label: "Topic", placeholder: "Kaspa cryptocurrency" }];
    case "math_eval":
      return [{ key: "expression", label: "Expression", type: "textarea", placeholder: "15% tip on $42, or {{result}} * 1.1", hint: "Plain English works: 'add 7% tax to {{result}}' or 'average of 10, 20, 30'. Pure math also works." }];
    case "ai_image":
      return [{ key: "prompt", label: "Image Prompt", type: "textarea", placeholder: "Describe the image" }];
    case "k6ix_image":
      return [
        { key: "prompt", label: "Prompt", type: "textarea", placeholder: "Describe the image", hint: "Use {{result}} to include the previous node output" },
        { key: "existing_image_urls", label: "Reference image URLs", type: "textarea", placeholder: "https://...\nhttps://...", hint: "Optional, one URL per line" },
      ];
    case "k6ix_video":
      return [
        { key: "prompt", label: "Prompt", type: "textarea", placeholder: "Describe the video", hint: "Use {{result}} to include the previous node output" },
        { key: "duration", label: "Duration", type: "select", options: ["4", "6", "8"] },
        { key: "aspect_ratio", label: "Aspect Ratio", type: "select", options: ["16:9", "9:16"] },
      ];
    case "k6ix_llm":
      return [
        { key: "prompt", label: "Prompt", type: "textarea", placeholder: "What should K6ix generate?", hint: "Use {{result}} to include the previous node output" },
        { key: "add_context_from_internet", label: "Web Context", type: "checkbox" },
        { key: "response_json_schema", label: "JSON Schema", type: "textarea", placeholder: "{\n  \"type\": \"object\",\n  \"properties\": {}\n}", hint: "Optional" },
        { key: "file_urls", label: "File URLs", type: "textarea", placeholder: "https://...\nhttps://...", hint: "Optional, one URL per line" },
        { key: "model", label: "Model", type: "select", options: ["automatic", "gpt_5_mini", "gpt_5_4", "gpt_5_5", "gemini_3_flash", "gemini_3_1_pro", "claude_sonnet_4_6", "claude_opus_4_6", "claude_opus_4_7"] },
      ];
    case "k6ix_scrape":
      return [{ key: "url", label: "Website URL", placeholder: "https://example.com" }];
    case "ultramock_mp4":
      return [
        { key: "tagline", label: "Tagline / Headline", type: "textarea", placeholder: "Your tagline here", hint: "Use {{result}} to pull text from the previous step" },
        { key: "aspect_ratio", label: "Aspect Ratio", type: "select", options: ["16:9", "9:16"] },
        { key: "device", label: "Device", type: "select", options: ["iphone", "android", "ipad", "macbook", "imac", "browser", "none"] },
        { key: "background", label: "Background", type: "select", options: ["sunset", "ocean", "forest", "peach", "mono", "ivory", "midnight", "candy", "white", "black"] },
        { key: "preset", label: "Animation Preset", type: "select", options: ["spin", "tilt", "pop", "float", "reveal", "flip", "wobble", "zoomin", "showcase", "shake", "slide-in-left", "slide-in-right", "drop-in", "orbit", "swoop", "chat-zoom"] },
        { key: "duration", label: "Duration (seconds)", type: "number", placeholder: "4", hint: "1–30 seconds. Auto-renders & downloads MP4 in a new tab." },
        { key: "email_to", label: "Email MP4 to (optional)", placeholder: "you@example.com", hint: "If set, the rendered MP4 is uploaded and emailed as a download link." },
      ];
    case "deep_research":
      return [
        { key: "topic", label: "Research Topic", type: "textarea", placeholder: "e.g. Latest Kaspa ecosystem developments in the past 30 days", hint: "Live web scraping + multi-pass synthesis. Use {{result}} to research a previous step's output." },
        { key: "depth", label: "Depth", type: "select", options: ["shallow", "deep"] },
      ];
    case "read_ttt_feed":
      return [
        { key: "limit", label: "How many posts?", type: "number", placeholder: "20" },
        { key: "keyword", label: "Filter keyword (optional)", placeholder: "kaspa", hint: "Only return posts containing this word" },
      ];
    case "post_to_ttt":
      return [
        { key: "author_name", label: "Display name (optional)", placeholder: "Anonymous", hint: "Posts are anonymous — no wallet or identity attached. Leave blank for 'Anonymous'." },
        { key: "content_override", label: "Custom content (optional)", type: "textarea", placeholder: "Leave blank to use {{result}} from previous step", hint: "Supports {{result}}. If empty, uses last text step. Image from prior ai_image attaches automatically." },
      ];
    case "send_email":
      return [
        { key: "to", label: "To Email", placeholder: "you@example.com", hint: "Real email address — sent via Base44" },
        { key: "from_name", label: "From Name (optional)", placeholder: "NODA Workflow" },
        { key: "subject", label: "Subject", placeholder: "Your workflow finished" },
        { key: "body", label: "Body", type: "textarea", placeholder: "Use {{result}} to insert previous output", hint: "{{result}} pulls in the last step's output" },
      ];
    case "delay":
      return [{ key: "seconds", label: "Seconds", type: "number", placeholder: "2" }];
    case "filter":
      return [{ key: "contains", label: "Must Contain", placeholder: "kaspa", hint: "Stops the workflow if previous output doesn't include this text" }];
    case "webhook":
      return [
        { key: "url", label: "URL", placeholder: "https://example.com/hook" },
        { key: "method", label: "Method", type: "select", options: ["POST", "PUT", "PATCH"] },
      ];
    default:
      return [];
  }
}