import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Plus, Edit3, Trash2, Power, PowerOff,
  ExternalLink, MessageCircle, Shield, Copy, CheckCircle2, Wrench
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import TeleToolEditor from "@/components/tele/TeleToolEditor";
import BotSetupGuide from "@/components/tele/BotSetupGuide";
import UserBotConnect from "@/components/tele/UserBotConnect";

export default function TELEPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.role === "admin") await loadTools();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadTools = async () => {
    const data = await base44.entities.TeleTool.list("-created_date", 100);
    setTools(data);
  };

  const handleNew = () => {
    setEditingTool(null);
    setEditorOpen(true);
  };

  const handleEdit = (tool) => {
    setEditingTool(tool);
    setEditorOpen(true);
  };

  const handleDelete = async (tool) => {
    if (!confirm(`Delete tool "${tool.name}"?`)) return;
    await base44.entities.TeleTool.delete(tool.id);
    await loadTools();
  };

  const handleToggle = async (tool) => {
    await base44.entities.TeleTool.update(tool.id, { is_active: !tool.is_active });
    await loadTools();
  };

  const handleSaved = async () => {
    setEditorOpen(false);
    setEditingTool(null);
    await loadTools();
  };

  const copyCommand = (cmd, id) => {
    navigator.clipboard.writeText(`/${cmd}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Loading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Non-admin user view: connect their own bot
  if (user?.role !== "admin") {
    return (
      <div className="fixed inset-0 bg-black overflow-y-auto">
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
          <Link to={createPageUrl("AppStoreV2")} className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20">
                <Send className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">TELE</h1>
                <p className="text-white/50 text-sm">Connect your Kaspa agent to Telegram</p>
              </div>
            </div>
          </motion.div>

          <UserBotConnect />

          <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
            <div className="text-xs text-white/60 leading-relaxed">
              <strong className="text-white">How it works:</strong> Create your own bot via @BotFather, paste the token, and your bot becomes a Telegram interface to your Kaspa agent — chat freely or use admin-defined slash commands.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin UI
  return (
    <div className="fixed inset-0 bg-black overflow-y-auto">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to={createPageUrl("AppStoreV2")} className="flex items-center gap-2 text-white/60 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded-xl"
          >
            <MessageCircle className="w-4 h-4" /> @BotFather
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <Send className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">TELE Builder</h1>
              <p className="text-white/50 text-sm">Build custom tools for your Telegram bot</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full w-fit">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-300 text-[11px] font-bold tracking-widest uppercase">Admin Only</span>
          </div>
        </motion.div>

        {/* Admin's own bot connection */}
        <div className="mb-6">
          <UserBotConnect />
        </div>

        {/* Bot setup guide */}
        <BotSetupGuide />

        {/* Stats + New button */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Tools" value={tools.length} />
          <StatCard label="Active" value={tools.filter((t) => t.is_active).length} accent="green" />
          <StatCard label="Inactive" value={tools.filter((t) => !t.is_active).length} accent="red" />
          <StatCard label="Total Uses" value={tools.reduce((s, t) => s + (t.usage_count || 0), 0)} accent="cyan" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" /> Tools
          </h2>
          <Button onClick={handleNew} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
            <Plus className="w-4 h-4 mr-1.5" /> New Tool
          </Button>
        </div>

        {/* Tools grid */}
        {tools.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <div className="text-5xl mb-3">🔧</div>
            <h3 className="text-white font-bold mb-1">No tools yet</h3>
            <p className="text-white/40 text-sm mb-4">Create your first tool to start building your Telegram bot</p>
            <Button onClick={handleNew} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
              <Plus className="w-4 h-4 mr-1.5" /> Create First Tool
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tools.map((tool) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative p-4 rounded-2xl border backdrop-blur-sm ${
                  tool.is_active
                    ? "bg-white/[0.03] border-white/10 hover:border-cyan-500/30"
                    : "bg-white/[0.01] border-white/5 opacity-60"
                } transition-all group`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {tool.icon || "🔧"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-white font-bold text-sm truncate">{tool.name}</h3>
                      {tool.is_active ? (
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <button
                      onClick={() => copyCommand(tool.command, tool.id)}
                      className="inline-flex items-center gap-1 text-cyan-300 font-mono text-xs hover:text-cyan-200"
                    >
                      /{tool.command}
                      {copiedId === tool.id ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-40" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-white/60 text-xs leading-relaxed mb-3 line-clamp-2">{tool.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3 text-[10px] text-white/30">
                    <span className="uppercase tracking-wider">{tool.category}</span>
                    <span>·</span>
                    <span>{tool.usage_count || 0} uses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(tool)}
                      title={tool.is_active ? "Disable" : "Enable"}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                    >
                      {tool.is_active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(tool)}
                      title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-cyan-400"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tool)}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info footer */}
        <div className="mt-8 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xs text-white/60 leading-relaxed">
              <strong className="text-white">How it works:</strong> Each tool becomes a slash command in your Telegram bot.
              Users type <code className="bg-white/10 px-1 rounded text-cyan-300">/command arguments</code> and
              the bot runs your prompt template with their input.
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editorOpen && (
          <TeleToolEditor
            tool={editingTool}
            onSave={handleSaved}
            onCancel={() => { setEditorOpen(false); setEditingTool(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, accent = "white" }) {
  const colors = {
    white: "text-white",
    green: "text-green-400",
    red: "text-red-400",
    cyan: "text-cyan-400",
  };
  return (
    <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
      <div className={`text-2xl font-black ${colors[accent]}`}>{value}</div>
      <div className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}