import React from "react";
import { motion } from "framer-motion";
import { X, Trash2, ExternalLink } from "lucide-react";
import { findTool } from "./mirageTools";
import { Link } from "react-router-dom";

export default function MirageNodeConfig({ node, onUpdate, onClose, onDelete }) {
  if (!node) return null;
  const tool = findTool(node.toolId);
  if (!tool) return null;

  const updateField = (key, value) => {
    onUpdate({ ...node, config: { ...node.config, [key]: value } });
  };

  const cfg = node.config || {};

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-black/90 backdrop-blur-xl border-l border-emerald-500/20 z-40 flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/20">
            {tool.logo ? (
              <img src={tool.logo} alt={tool.appName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                <span className="text-white font-black text-xs">{tool.appName.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm truncate">{tool.appName}</div>
            <div className="text-emerald-300 text-[10px] font-bold tracking-wide uppercase">{tool.sublabel}</div>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <p className="text-white/50 text-xs leading-relaxed">{tool.desc}</p>

        {tool.capability === "image" && (
          <Field label="Image Prompt" hint="Use {{result}} to reference the previous step's output">
            <textarea
              value={cfg.prompt || ""}
              onChange={(e) => updateField("prompt", e.target.value)}
              rows={5}
              className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none resize-none"
              placeholder="A cinematic shot of…"
            />
          </Field>
        )}

        {tool.capability === "llm" && (
          <Field label="Prompt" hint="Use {{result}} for previous output">
            <textarea
              value={cfg.prompt || ""}
              onChange={(e) => updateField("prompt", e.target.value)}
              rows={5}
              className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none resize-none"
            />
          </Field>
        )}

        {tool.capability === "research" && (
          <Field label="Research Topic">
            <textarea
              value={cfg.topic || ""}
              onChange={(e) => updateField("topic", e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none resize-none"
            />
          </Field>
        )}

        {tool.capability === "search" && (
          <Field label="Search Query">
            <input
              value={cfg.query || ""}
              onChange={(e) => updateField("query", e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
            />
          </Field>
        )}

        {tool.capability === "read_feed" && (
          <>
            <Field label="Number of posts">
              <input
                type="number"
                min={1}
                max={50}
                value={cfg.limit || 10}
                onChange={(e) => updateField("limit", Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
              />
            </Field>
            <Field label="Filter keyword (optional)">
              <input
                value={cfg.keyword || ""}
                onChange={(e) => updateField("keyword", e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                placeholder="kaspa"
              />
            </Field>
          </>
        )}

        {tool.capability === "post" && (
          <>
            <Field label="Author name (optional)">
              <input
                value={cfg.author_name || ""}
                onChange={(e) => updateField("author_name", e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                placeholder="MIRAGE"
              />
            </Field>
            <Field label="Override content (optional)" hint="Leave blank to auto-use previous output">
              <textarea
                value={cfg.content_override || ""}
                onChange={(e) => updateField("content_override", e.target.value)}
                rows={3}
                className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none resize-none"
              />
            </Field>
          </>
        )}

        {tool.capability === "email" && (
          <>
            <Field label="To">
              <input
                type="email"
                value={cfg.to || ""}
                onChange={(e) => updateField("to", e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Subject">
              <input
                value={cfg.subject || ""}
                onChange={(e) => updateField("subject", e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
              />
            </Field>
            <Field label="Body" hint="{{result}} embeds previous output (text + images)">
              <textarea
                value={cfg.body || ""}
                onChange={(e) => updateField("body", e.target.value)}
                rows={5}
                className="w-full bg-black/40 border border-white/10 focus:border-purple-400/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none resize-none"
              />
            </Field>
          </>
        )}

        {tool.capability === "social" && (
          <p className="text-white/40 text-xs leading-relaxed">
            This will open X compose with the previous step's text. No config needed.
          </p>
        )}

        {/* Output preview */}
        {node.output !== undefined && node.output !== null && (
          <div>
            <div className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase mb-2">Last output</div>
            {typeof node.output === "string" && /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i.test(node.output) ? (
              <img src={node.output} alt="" className="w-full rounded-lg border border-white/10" />
            ) : (
              <pre className="bg-black/40 border border-white/10 rounded-lg p-3 text-white/70 text-[11px] max-h-48 overflow-auto whitespace-pre-wrap">
                {typeof node.output === "object" ? JSON.stringify(node.output, null, 2) : String(node.output)}
              </pre>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-5 py-3 border-t border-white/10">
        <Link
          to={tool.path}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold"
        >
          <ExternalLink className="w-3 h-3" /> Open {tool.appName}
        </Link>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold"
        >
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      </div>
    </motion.div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold tracking-widest text-white/50 uppercase mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-white/30 text-[10px] mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}