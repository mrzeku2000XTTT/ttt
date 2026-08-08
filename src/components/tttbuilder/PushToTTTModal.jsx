import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Loader2, CheckCircle, ExternalLink, Copy, AlertCircle, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["AI", "Tools", "Games", "Finance", "Creative", "Social", "Education", "Community", "Media", "Dev", "Shop", "Security", "Kaspa"];

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export default function PushToTTTModal({ open, onClose, files, projectName, user }) {
  const [appName, setAppName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Tools");
  const [phase, setPhase] = useState("form"); // form | booting | done | error
  const [liveUrl, setLiveUrl] = useState(null);
  const [sandboxId, setSandboxId] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      const name = (projectName || "My TTT App").slice(0, 50);
      setAppName(name);
      setSlug(slugify(name));
      setSlugEdited(false);
      setDescription("");
      setCategory("Tools");
      setPhase("form");
      setLiveUrl(null);
      setSandboxId(null);
      setError(null);
      setCopied(false);
    }
  }, [open, projectName]);

  const handleNameChange = (v) => {
    setAppName(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const handleSlugChange = (v) => {
    setSlugEdited(true);
    setSlug(slugify(v));
  };

  const push = async () => {
    if (!files.length || !appName.trim() || !slug.trim()) return;
    setPhase("booting");
    setError(null);
    try {
      // 1. Boot E2B sandbox to host the app live
      const e2bRes = await base44.functions.invoke("e2bSandbox", { action: "run", files });
      const e2b = e2bRes.data || {};
      if (!e2b.url) throw new Error(e2b.error || "Live sandbox failed to start");

      setLiveUrl(e2b.url);
      setSandboxId(e2b.sandboxId);

      // 2. Create TTTAppRegistry record — auto-live, no review
      await base44.entities.TTTAppRegistry.create({
        app_name: appName.trim(),
        slug: slug.trim(),
        external_url: e2b.url,
        e2b_sandbox_id: e2b.sandboxId,
        category,
        description: description.trim() || `${appName.trim()} — built with TTT Builder`,
        submitter_email: user?.email || "",
        submitter_name: user?.full_name || user?.username || "",
        is_active: true,
      });

      setPhase("done");
    } catch (err) {
      setError(err.message || "Something went wrong");
      setPhase("error");
    }
  };

  const copyLink = () => {
    if (!liveUrl) return;
    navigator.clipboard.writeText(liveUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#161b22] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-2 mb-5">
              <Rocket className="w-5 h-5 text-[#70C7BA]" />
              <h2 className="font-bold text-white text-base">Push to TTT</h2>
            </div>

            {phase === "form" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">App name</label>
                  <input
                    value={appName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Awesome App"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#70C7BA]/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">URL slug <span className="text-white/30">(tttz.xyz/{slug || "your-app"})</span></label>
                  <input
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="my-awesome-app"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#70C7BA]/50 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does your app do?"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#70C7BA]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          category === c
                            ? "bg-[#70C7BA] text-black"
                            : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#70C7BA]/5 border border-[#70C7BA]/15">
                  <Tag className="w-3.5 h-3.5 text-[#70C7BA] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Your app will be hosted live on E2B and added to the TTT App Store instantly — no review needed. Anyone with the link can view it.
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 h-10 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={push}
                    disabled={!appName.trim() || !slug.trim() || !files.length}
                    className="flex-1 h-10 rounded-xl bg-[#70C7BA] text-black text-sm font-bold hover:bg-[#70C7BA]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    <Rocket className="w-4 h-4" /> Push to TTT
                  </button>
                </div>
              </div>
            )}

            {phase === "booting" && (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 text-[#70C7BA] animate-spin mx-auto mb-4" />
                <p className="font-bold text-white mb-1">Hosting your app…</p>
                <p className="text-xs text-white/40">Booting live sandbox & publishing to the App Store</p>
              </div>
            )}

            {phase === "done" && (
              <div className="text-center py-2">
                <CheckCircle className="w-10 h-10 text-[#70C7BA] mx-auto mb-3" />
                <p className="font-bold text-white mb-1">Your app is live!</p>
                <p className="text-xs text-white/40 mb-4">Added to the TTT App Store — no review needed.</p>

                <div className="space-y-2 text-left mb-4">
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#70C7BA] hover:underline break-all">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" /> {liveUrl}
                  </a>
                  <Link to="/AppStoreV2" className="flex items-center gap-2 text-xs text-white/50 hover:text-white hover:underline">
                    <Tag className="w-3.5 h-3.5" /> View in App Store
                  </Link>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
                    className="flex-1 h-9 rounded-xl bg-white/5 text-white/70 hover:text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? <><CheckCircle className="w-3.5 h-3.5 text-[#70C7BA]" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy link</>}
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 h-9 rounded-xl bg-[#70C7BA] text-black text-sm font-bold hover:bg-[#70C7BA]/90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {phase === "error" && (
              <div className="text-center py-4">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-400 font-bold mb-2">Push failed</p>
                <p className="text-xs text-white/40 mb-4 break-words">{error}</p>
                <button onClick={() => setPhase("form")} className="w-full h-9 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors">
                  Try again
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}