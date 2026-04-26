import React, { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Copy, CheckCircle2, Bot, Key, Link as LinkIcon, MessageCircle } from "lucide-react";

export default function BotSetupGuide() {
  const [copied, setCopied] = useState(null);

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const steps = [
    {
      num: 1,
      icon: Bot,
      title: "Create your bot with @BotFather",
      desc: "Open Telegram, message @BotFather, and send /newbot. Pick a name (e.g. 'My TTT Bot') and a username ending in 'bot' (e.g. 'mytttbot').",
      action: { label: "Open @BotFather", href: "https://t.me/BotFather", copy: "/newbot" },
    },
    {
      num: 2,
      icon: Key,
      title: "Copy your bot token",
      desc: "BotFather will give you a token like 1234567890:ABCdefGHIjkl... Save it — you'll need it next.",
    },
    {
      num: 3,
      icon: LinkIcon,
      title: "Connect the token in Base44",
      desc: "Open your Base44 dashboard → Agents → 'tele' → Telegram tab → paste your bot token and save. This wires your bot to the TELE agent.",
      action: { label: "Open Base44 Dashboard", href: "https://app.base44.com", external: true },
    },
    {
      num: 4,
      icon: MessageCircle,
      title: "Message your bot",
      desc: "Open your bot in Telegram (search its @username) and send /start. The TELE agent will respond using whatever tools you've built below.",
    },
  ];

  return (
    <div className="mb-8 p-5 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-cyan-500/20 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Bot className="w-4 h-4 text-cyan-400" />
        <h3 className="text-white font-bold text-sm">How to create & connect your Telegram bot</h3>
      </div>
      <p className="text-white/50 text-xs mb-5">
        TELE agent is ready — you just need to plug it into a real Telegram bot. Follow these 4 steps:
      </p>

      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.num * 0.05 }}
              className="flex gap-3 p-3 bg-black/40 border border-white/5 rounded-xl"
            >
              <div className="w-8 h-8 flex-shrink-0 bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                <span className="text-cyan-400 font-black text-xs">{step.num}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-cyan-300" />
                  <h4 className="text-white font-bold text-sm">{step.title}</h4>
                </div>
                <p className="text-white/60 text-xs leading-relaxed mb-2">{step.desc}</p>
                {step.action && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={step.action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-cyan-300 text-xs font-bold"
                    >
                      {step.action.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {step.action.copy && (
                      <button
                        onClick={() => copy(step.action.copy, step.num)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 text-xs font-mono"
                      >
                        {copied === step.num ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> {step.action.copy}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 text-[11px] text-white/40 leading-relaxed">
        <strong className="text-white/60">Tip:</strong> once your bot is connected, every <code className="text-cyan-300 bg-white/5 px-1 rounded">/command</code> tool you build below becomes a live slash command inside your Telegram bot.
      </div>
    </div>
  );
}