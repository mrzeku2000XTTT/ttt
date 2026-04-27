import React from "react";
import { X, Trash2 } from "lucide-react";
import NodeImageOutput from "@/components/rmx/NodeImageOutput";

export default function RMXNodeConfig({ node, onUpdate, onClose, onDelete }) {
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
          {node.type === "ai_image" && typeof node.output === "string" && node.output ? (
            <NodeImageOutput url={node.output} />
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
      return [{ key: "prompt", label: "Prompt", type: "textarea", placeholder: "What should the AI do?", hint: "Use {{result}} to insert the previous step's output" }];
    case "ai_image":
      return [{ key: "prompt", label: "Image Prompt", type: "textarea", placeholder: "Describe the image" }];
    case "send_email":
      return [
        { key: "to", label: "To Email", placeholder: "you@example.com" },
        { key: "subject", label: "Subject", placeholder: "Your workflow finished" },
        { key: "body", label: "Body", type: "textarea", placeholder: "Use {{result}} to insert previous output" },
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