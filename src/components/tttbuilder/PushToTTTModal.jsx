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
      const e2bRes = await base44.functions.invoke("e2bSandbox", { action: "run", files });
      const e2b = e2bRes.data || {};
      if (!e2b.url) throw new Error(e2b.error || "Live sandbox failed to start");

      setLiveUrl(e2b.url);
      setSandboxId(e2b.sandboxId);

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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white border border-black/[0.08] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center gap-2 mb-5">
              <Rocket className="w-5 h-5 text-[#007AFF]" />
              <h2 className="font-bold text-[#1D1D1F] text-base">Push to TTT</h2>
            </div>

            {phase === "form" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#6B7280] mb-1.5 block">App name</label>
                  <input
                    value={appName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Awesome App"
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF]/50 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#6B7280] mb-1.5 block">URL slug <span className="text-[#86868B]">(tttz.xyz/{slug || "your-app"})</span></label>
                  <input
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="my-awesome-app"
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF]/50 focus:bg-white transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#6B7280] mb-1.5 block">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does your app do?"
                    rows={3}
                    className="w-full bg-[#F5F5F7] border border-black/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-[#007AFF]/50 focus:bg-white resize-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#6B7280] mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          category === c
                            ? "bg-[#007AFF] text-white"
                            : "bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#007AFF]/5 border border-[#007AFF]/15">
                  <Tag className="w-3.5 h-3.5 text-[#007AFF] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#6B7280] leading-relaxed">
                    Your app will be hosted live on E2B and added to the TTT App Store instantly — no review needed. Anyone with the link can view it.
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 h-10 rounded-xl bg-[#F0F0F2] text-[#6B7280] hover:text-[#1D1D1F] text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={push}
                    disabled={!appName.trim() || !slug.trim() || !files.length}
                    className="flex-1 h-10 rounded-xl bg-[#007AFF] text-white text-sm font-bold hover:bg-[#0051D5] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    <Rocket className="w-4 h-4" /> Push to TTT
                  </button>
                </div>
              </div>
            )}

            {phase === "booting" && (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin mx-auto mb-4" />
                <p className="font-bold text-[#1D1D1F] mb-1">Hosting your app…</p>
                <p className="text-xs text-[#86868B]">Booting live sandbox & publishing to the App Store</p>
              </div>
            )}

            {phase === "done" && (
              <div className="text-center py-2">
                <CheckCircle className="w-10 h-10 text-[#34C759] mx-auto mb-3" />
                <p className="font-bold text-[#1D1D1F] mb-1">Your app is live!</p>
                <p className="text-xs text-[#86868B] mb-4">Added to the TTT App Store — no review needed.</p>

                <div className="space-y-2 text-left mb-4">
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#007AFF] hover:underline break-all">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" /> {liveUrl}
                  </a>
                  <Link to="/AppStoreV2" className="flex items-center gap-2 text-xs text-[#6B7280] hover:text-[#1D1D1F] hover:underline">
                    <Tag className="w-3.5 h-3.5" /> View in App Store
                  </Link>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
                    className="flex-1 h-9 rounded-xl bg-[#F0F0F2] text-[#6B7280] hover:text-[#1D1D1F] text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? <><CheckCircle className="w-3.5 h-3.5 text-[#34C759]" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy link</>}
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 h-9 rounded-xl bg-[#007AFF] text-white text-sm font-bold hover:bg-[#0051D5] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {phase === "error" && (
              <div className="text-center py-4">
                <AlertCircle className="w-10 h-10 text-[#FF3B30] mx-auto mb-3" />
                <p className="text-[#FF3B30] font-bold mb-2">Push failed</p>
                <p className="text-xs text-[#86868B] mb-4 break-words">{error}</p>
                <button onClick={() => setPhase("form")} className="w-full h-9 rounded-xl bg-[#F0F0F2] text-[#6B7280] hover:text-[#1D1D1F] text-sm font-bold transition-colors">
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