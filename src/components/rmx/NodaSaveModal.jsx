import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, X, Loader2, Check, Copy, Globe, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * NodaSaveModal — saves the current workflow as a NodaWorkflow entity
 * so other apps can invoke it via the runNodaWorkflow backend function.
 */
export default function NodaSaveModal({ open, onClose, nodes, workflowName, ownerEmail, onSaved }) {
  const [name, setName] = useState(workflowName || "");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState(null);
  const [savedSlug, setSavedSlug] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setName(workflowName || "");
      setDescription("");
      setIsPublic(false);
      setError("");
      setSavedId(null);
      setSavedSlug(null);
      setCopied(false);
    }
  }, [open, workflowName]);

  const slugify = (s) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `wf-${Date.now()}`;

  const handleSave = async () => {
    setError("");
    if (!name.trim()) {
      setError("Give your workflow a name");
      return;
    }
    if (!ownerEmail) {
      setError("You must be signed in to save");
      return;
    }
    if (!nodes?.length) {
      setError("Add at least one node first");
      return;
    }

    setSaving(true);
    try {
      const slug = slugify(name);
      // Strip per-node `output` so we save a clean definition
      const cleanNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        icon: n.icon,
        color: n.color,
        config: n.config || {},
      }));

      const created = await base44.entities.NodaWorkflow.create({
        owner_email: ownerEmail,
        name: name.trim(),
        slug,
        description: description.trim(),
        nodes: cleanNodes,
        is_public: isPublic,
      });

      setSavedId(created.id);
      setSavedSlug(created.slug || slug);
      onSaved?.({ id: created.id, name: name.trim(), slug });
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const callSnippet =
    savedId &&
    `await base44.functions.invoke("runNodaWorkflow", {\n  workflow_id: "${savedId}",\n  inputs: {} // optional overrides\n});`;

  const copyCall = async () => {
    if (!callSnippet) return;
    await navigator.clipboard.writeText(callSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
            className="w-full max-w-md bg-zinc-950 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <Save className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white font-bold text-sm">Save & Publish</span>
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!savedId ? (
                <>
                  <div>
                    <label className="block text-white/70 text-xs font-bold mb-1.5">Name</label>
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My awesome workflow"
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-emerald-400 rounded-lg text-white text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs font-bold mb-1.5">Description (optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="What does this workflow do?"
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 focus:border-emerald-400 rounded-lg text-white text-sm outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isPublic ? (
                        <Globe className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-white/60" />
                      )}
                      <div>
                        <div className="text-white text-sm font-bold">
                          {isPublic ? "Public" : "Private"}
                        </div>
                        <div className="text-white/50 text-[11px]">
                          {isPublic
                            ? "Any signed-in app user can run it"
                            : "Only you can run it"}
                        </div>
                      </div>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${isPublic ? "bg-emerald-500 justify-end" : "bg-white/10 justify-start"}`}>
                      <div className="w-4 h-4 rounded-full bg-white" />
                    </div>
                  </button>

                  {error && (
                    <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={onClose}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-white text-sm font-bold"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Saving" : "Save"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-200 text-sm font-bold">Saved</span>
                  </div>
                  <div>
                    <div className="text-white/60 text-[11px] uppercase tracking-wider font-bold mb-1.5">
                      Workflow ID
                    </div>
                    <div className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg font-mono text-emerald-300 text-xs break-all">
                      {savedId}
                    </div>
                  </div>
                  {callSnippet && (
                    <div>
                      <div className="text-white/60 text-[11px] uppercase tracking-wider font-bold mb-1.5">
                        Call from another app
                      </div>
                      <div className="relative">
                        <pre className="px-3 py-3 pr-10 bg-black/60 border border-white/10 rounded-lg text-cyan-200 text-[11px] font-mono whitespace-pre-wrap break-words">
                          {callSnippet}
                        </pre>
                        <button
                          onClick={copyCall}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/15 text-white/60 hover:text-white"
                          title="Copy"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-sm font-bold"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}