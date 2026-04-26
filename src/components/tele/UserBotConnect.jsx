import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Link2, CheckCircle2, AlertCircle, Loader2, ExternalLink, Trash2, Power } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function UserBotConnect() {
  const [user, setUser] = useState(null);
  const [link, setLink] = useState(null);
  const [token, setToken] = useState("");
  const [kaspaAddress, setKaspaAddress] = useState("");
  const [agentMode, setAgentMode] = useState("both");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      if (me?.created_wallet_address) setKaspaAddress(me.created_wallet_address);
      const links = await base44.entities.TelegramBotLink.filter({ user_email: me.email });
      if (links.length > 0) {
        setLink(links[0]);
        setAgentMode(links[0].agent_mode || "both");
        setKaspaAddress(links[0].kaspa_address || "");
      }
    } catch {}
  };

  const handleConnect = async () => {
    setError(""); setSuccess("");
    if (!token.trim()) { setError("Paste your bot token from @BotFather"); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("telegramRegisterBot", {
        bot_token: token.trim(),
        kaspa_address: kaspaAddress.trim(),
        agent_mode: agentMode,
      });
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        setSuccess(`✅ Connected! Open ${res.data.next_step}`);
        setToken("");
        await init();
      }
    } catch (e) {
      setError(e.message || "Connection failed");
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    if (!link || !confirm("Disconnect this bot?")) return;
    setLoading(true);
    try {
      await base44.entities.TelegramBotLink.delete(link.id);
      setLink(null);
      setSuccess("Bot disconnected.");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleToggle = async () => {
    if (!link) return;
    setLoading(true);
    try {
      const updated = await base44.entities.TelegramBotLink.update(link.id, { is_active: !link.is_active });
      setLink({ ...link, is_active: !link.is_active });
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-6 text-center">
        <p className="text-white/60 text-sm">Sign in to connect your Telegram bot.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 p-5 sm:p-6"
    >
      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base">Your Personal Telegram Bot</h3>
          <p className="text-white/60 text-xs mt-0.5">
            Each user runs their own bot. Connects to your Kaspa wallet & agent.
          </p>
        </div>
      </div>

      {link ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-black/40 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${link.is_active && link.webhook_status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'}`} />
                <span className="text-white font-mono text-sm">@{link.bot_username}</span>
              </div>
              <a
                href={`https://t.me/${link.bot_username}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-white/40">Status</div>
                <div className="text-white">{link.is_active ? 'Active' : 'Paused'}</div>
              </div>
              <div>
                <div className="text-white/40">Messages</div>
                <div className="text-white">{link.message_count || 0}</div>
              </div>
              <div className="col-span-2">
                <div className="text-white/40">Linked Wallet</div>
                <div className="text-white font-mono text-[10px] break-all">
                  {link.kaspa_address || 'none'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium flex items-center justify-center gap-2"
            >
              <Power className="w-3.5 h-3.5" />
              {link.is_active ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-black/30 border border-white/10 p-4 text-xs text-white/70 space-y-2">
            <div className="font-semibold text-white text-sm mb-2">Quick setup:</div>
            <div>1. Open <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-cyan-400">@BotFather</a> on Telegram</div>
            <div>2. Send <code className="text-cyan-300">/newbot</code> and follow the prompts</div>
            <div>3. Copy the token BotFather gives you</div>
            <div>4. Paste it below ↓</div>
          </div>

          <div>
            <label className="text-white/70 text-xs font-medium mb-1.5 block">Bot Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm font-mono focus:border-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-white/70 text-xs font-medium mb-1.5 block">Kaspa Address (optional)</label>
            <input
              type="text"
              value={kaspaAddress}
              onChange={(e) => setKaspaAddress(e.target.value)}
              placeholder="kaspa:qz..."
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white text-sm font-mono focus:border-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-white/70 text-xs font-medium mb-1.5 block">Agent Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'both', label: 'Chat + Cmds' },
                { v: 'ai_chat', label: 'AI Only' },
                { v: 'tools_only', label: 'Cmds Only' },
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setAgentMode(opt.v)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    agentMode === opt.v
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-300 text-xs">{error}</span>
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-green-300 text-xs">{success}</span>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !token.trim()}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {loading ? 'Connecting...' : 'Connect Bot'}
          </button>
        </div>
      )}
    </motion.div>
  );
}