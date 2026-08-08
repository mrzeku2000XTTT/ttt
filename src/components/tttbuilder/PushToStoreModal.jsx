import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Loader2, CheckCircle, Upload, X, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PushToStoreModal({ open, onClose, html, defaultName, defaultDesc }) {
  const [appName, setAppName] = useState(defaultName || "");
  const [description, setDescription] = useState(defaultDesc || "");
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [category, setCategory] = useState("Builder");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setAppName(defaultName || "");
      setDescription(defaultDesc || "");
      setIconFile(null);
      setIconPreview(null);
      setCategory("Builder");
      setResult(null);
    }
  }, [open, defaultName, defaultDesc]);

  const handleIconChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setIconPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const publish = async () => {
    if (!appName.trim() || !html) return;
    setPublishing(true);
    try {
      // 1. Upload the built HTML so it's viewable as a live app
      const htmlBlob = new Blob([html], { type: "text/html" });
      const htmlFile = new File([htmlBlob], `${appName.trim().toLowerCase().replace(/\s+/g, "-")}.html`, { type: "text/html" });
      const uploadRes = await base44.integrations.Core.UploadFile({ file: htmlFile });
      const appUrl = uploadRes.file_url;

      // 2. Upload icon if provided
      let iconUrl = "";
      if (iconFile) {
        const iconRes = await base44.integrations.Core.UploadFile({ file: iconFile });
        iconUrl = iconRes.file_url;
      }

      // 3. Get current user
      const me = await base44.auth.me().catch(() => null);

      // 4. Create the AppProposal with pending status
      await base44.entities.AppProposal.create({
        app_name: appName.trim(),
        app_link: appUrl,
        icon_url: iconUrl,
        description: description.trim() || "Built with TTT Builder",
        category,
        submitter_email: me?.email || "anonymous",
        submitter_name: me?.username || me?.email?.split("@")[0] || "TTT Builder",
        status: "pending",
      });

      setResult({ success: true, url: appUrl });
    } catch (err) {
      setResult({ success: false, error: err.message || "Failed to publish" });
    } finally {
      setPublishing(false);
    }
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
            className="bg-[#161b22] border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#70C7BA]" />
                <h2 className="font-bold text-white text-base">Push to App Store</h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!result ? (
              <div className="space-y-4">
                {/* Icon upload */}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 hover:border-[#70C7BA]/40 flex items-center justify-center overflow-hidden transition-colors">
                      {iconPreview ? (
                        <img src={iconPreview} alt="icon" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
                  </label>
                  <div>
                    <p className="text-xs text-white/50">App icon</p>
                    <p className="text-[10px] text-white/30">PNG or JPG, square recommended</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">App name</label>
                  <input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="My Kaspa App"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#70C7BA]/50"
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
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#70C7BA]/50"
                  >
                    {["Builder", "Tools", "Finance", "Games", "AI", "Creative", "Education", "Community", "Social", "Shop", "Security"].map((c) => (
                      <option key={c} value={c} className="bg-[#161b22]">{c}</option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] text-white/30">
                  Your app will be submitted for <span className="text-[#70C7BA]">Review</span>. You can view it anytime. An admin will verify and approve it to make it visible to all TTT users.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 h-10 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={publish}
                    disabled={publishing || !appName.trim() || !html}
                    className="flex-1 h-10 rounded-xl bg-[#70C7BA] text-black text-sm font-bold hover:bg-[#70C7BA]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {publishing ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><Store className="w-4 h-4" /> Push to Store</>}
                  </button>
                </div>
              </div>
            ) : result.success ? (
              <div className="text-center py-4">
                <CheckCircle className="w-10 h-10 text-[#70C7BA] mx-auto mb-3" />
                <p className="font-bold text-white mb-1">Submitted for Review!</p>
                <p className="text-xs text-white/40 mb-4">Your app is now visible to you and admins. Once approved, it'll appear for all TTT users.</p>
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#70C7BA] hover:underline mb-4">
                  <Upload className="w-3.5 h-3.5" /> View your app
                </a>
                <button onClick={onClose} className="w-full h-9 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-red-400 font-bold mb-2">Publish failed</p>
                <p className="text-xs text-white/40 mb-4">{result.error}</p>
                <button onClick={() => setResult(null)} className="w-full h-9 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors">
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