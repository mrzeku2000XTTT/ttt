import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Loader2, CheckCircle, X, ExternalLink, Rocket, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "ttt_github_pat";

export default function PushToGitHubModal({ open, onClose, files, defaultName }) {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
  });
  const [remember, setRemember] = useState(() => {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });
  const [showToken, setShowToken] = useState(false);
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [isPrivate, setIsPrivate] = useState(false);
  const [commitMessage, setCommitMessage] = useState("Initial commit from TTT Builder");
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      const slug = (defaultName || "my-kaspa-app")
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^[-.]+|[-.]+$/g, "");
      setRepo(slug || "my-kaspa-app");
      setBranch("main");
      setIsPrivate(false);
      setResult(null);
      setCommitMessage("Initial commit from TTT Builder");
      try { setToken(localStorage.getItem(STORAGE_KEY) || ""); } catch {}
    }
  }, [open, defaultName]);

  const push = async () => {
    if (!token.trim() || !repo.trim() || !files.length) return;
    setPushing(true);
    setResult(null);
    try {
      if (remember) {
        try { localStorage.setItem(STORAGE_KEY, token.trim()); } catch {}
      } else {
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      }
      const res = await base44.functions.invoke("pushAppToUserGitHub", {
        token: token.trim(),
        repo: repo.trim(),
        branch: branch.trim() || "main",
        commitMessage: commitMessage.trim() || "Initial commit from TTT Builder",
        isPrivate,
        files: files.map((f) => ({ path: f.path, content: f.content || "" })),
      });
      setResult({ success: true, ...res.data });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Push failed";
      setResult({ success: false, error: msg });
    } finally {
      setPushing(false);
    }
  };

  const forgetToken = () => {
    setToken("");
    setRemember(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
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
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-white" />
                <h2 className="font-bold text-white text-base">Push to your GitHub</h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!result ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#70C7BA]/8 border border-[#70C7BA]/25 px-3 py-2.5 flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#70C7BA] mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-white/55 leading-relaxed">
                    This pushes to <span className="text-white font-bold">your own GitHub</span> — not TTT's. Your token stays in this browser and is sent only for this push. We never store it.
                  </p>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">GitHub Personal Access Token</label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_... (classic, repo scope)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-9 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#70C7BA]/50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-1.5 text-[10px] text-white/50 cursor-pointer">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[#70C7BA]" />
                      Remember on this device
                    </label>
                    {token && (
                      <button onClick={forgetToken} className="text-[10px] text-white/30 hover:text-red-400">Forget token</button>
                    )}
                  </div>
                  <a href="https://github.com/settings/tokens/new?scopes=repo&description=TTT%20Builder" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#70C7BA] hover:underline mt-1.5">
                    <ExternalLink className="w-3 h-3" /> Create a token (repo scope)
                  </a>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Repo <span className="text-white/30">(owner/name or just name → your account)</span></label>
                  <input
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="my-kaspa-app"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#70C7BA]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Branch</label>
                    <input
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#70C7BA]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Visibility</label>
                    <select
                      value={isPrivate ? "private" : "public"}
                      onChange={(e) => setIsPrivate(e.target.value === "private")}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#70C7BA]/50"
                    >
                      <option value="public" className="bg-[#161b22]">Public</option>
                      <option value="private" className="bg-[#161b22]">Private</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Commit message</label>
                  <input
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#70C7BA]/50"
                  />
                </div>

                <p className="text-[10px] text-white/30">
                  {files.length} file{files.length !== 1 ? "s" : ""} will be committed in a single push. The repo is created if it doesn't exist.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 h-10 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={push}
                    disabled={pushing || !token.trim() || !repo.trim() || !files.length}
                    className="flex-1 h-10 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {pushing ? <><Loader2 className="w-4 h-4 animate-spin" /> Pushing…</> : <><Github className="w-4 h-4" /> Push to GitHub</>}
                  </button>
                </div>
              </div>
            ) : result.success ? (
              <div className="text-center py-3">
                <CheckCircle className="w-10 h-10 text-[#70C7BA] mx-auto mb-3" />
                <p className="font-bold text-white mb-1">Pushed to your GitHub!</p>
                <p className="text-xs text-white/40 mb-4">{result.filesPushed} file{result.filesPushed !== 1 ? "s" : ""} committed to {result.owner}/{result.repo} ({result.branch}).</p>
                <div className="space-y-2 text-left mb-4">
                  <a href={result.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#70C7BA] hover:underline">
                    <Github className="w-3.5 h-3.5" /> View repo: {result.owner}/{result.repo}
                  </a>
                  <a href={result.commitUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#70C7BA] hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> View commit
                  </a>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-left mb-4">
                  <p className="text-[11px] font-bold text-white mb-1.5 flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5 text-[#70C7BA]" /> Deploy it yourself</p>
                  <p className="text-[10px] text-white/40 mb-2">Import this repo into your favourite host:</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`https://vercel.com/new/clone?repository-url=${encodeURIComponent(result.repoUrl)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2.5 py-1.5 rounded-lg bg-black text-white border border-white/15 hover:bg-black/80">Vercel</a>
                    <a href={`https://app.netlify.com/start?repo=${encodeURIComponent(result.repoUrl)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2.5 py-1.5 rounded-lg bg-[#00AD9F] text-white hover:opacity-90">Netlify</a>
                    <a href={`${result.repoUrl}/settings/pages`} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/10 text-white border border-white/15 hover:bg-white/15">GitHub Pages</a>
                  </div>
                </div>
                <button onClick={onClose} className="w-full h-9 rounded-xl bg-white/5 text-white/60 hover:text-white text-sm font-bold transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-red-400 font-bold mb-2">Push failed</p>
                <p className="text-xs text-white/40 mb-4 break-words">{result.error}</p>
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