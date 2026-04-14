import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Rocket, Clock, MessageSquare, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const COMING_SOON = [
  { title: "KRC-20 Cross-Token Swaps", desc: "Swap tokens directly inside TTT", tag: "DeFi" },
  { title: "Agent-to-Agent Protocol", desc: "AI agents communicate and trade autonomously", tag: "AI" },
  { title: "Community Governance", desc: "Vote on proposals with your KAS", tag: "DAO" },
  { title: "Mobile Native App", desc: "TTT on iOS and Android natively", tag: "Mobile" },
];

// Changelog — add new entries at the TOP when features ship
const RECENT_UPDATES = [
  { title: "Core R&D Agent on What is Kaspa", desc: "AI agent now scrapes kaspa.news daily for Rust node, GHOSTDAG, DAGKnight, and protocol development updates.", tag: "AI Agent", date: "Apr 14" },
  { title: "KCbridge on Send KAS", desc: "Quick-access bridge button added to the Send KAS page for instant crypto swaps via KC Bridge.", tag: "Bridge", date: "Apr 14" },
  { title: "What is Kaspa — Dedicated Page", desc: "Full educational page covering blockDAG architecture, PoW, fair launch, timeline, and live community news.", tag: "Education", date: "Apr 13" },
  { title: "Community Videos Section", desc: "Users can now add, watch, and manage YouTube explainer videos directly on the TTT 2.0 landing page.", tag: "Community", date: "Apr 13" },
  { title: "Custom Product Icons", desc: "All 8 product cards on TTT 2.0 now feature unique, AI-generated high-fidelity logos.", tag: "Design", date: "Apr 13" },
  { title: "Kaspa Community News Feed", desc: "Daily auto-refreshing news from kaspa.news and community sources, cached for efficiency.", tag: "News", date: "Apr 13" },
  { title: "TTT 2.0 Landing Page", desc: "Complete redesign with Apple-inspired aesthetics — products, roadmap, market data, and more.", tag: "Platform", date: "Apr 12" },
  { title: "Navigation: Community Link", desc: "Added Community section to the TTTV2 top nav for quick access.", tag: "Nav", date: "Apr 12" },
  { title: "Home → TTTV2 Link", desc: "Home page now features a direct link to the TTT 2.0 landing experience.", tag: "Nav", date: "Apr 12" },
];

export default function WhatsNew({ kaspaUpdates, posts }) {
  return (
    <section id="news" className="py-20 sm:py-28 px-5 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Updated Daily</p>
          <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">What's New</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Recent TTT Updates */}
          <div>
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-500" /> Recent Updates
            </h3>
            <div className="space-y-3">
              {RECENT_UPDATES.slice(0, 5).map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="p-4 rounded-xl ring-1 ring-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{item.tag}</span>
                    <span className="text-[10px] text-zinc-400">{item.date}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-zinc-800 leading-snug">{item.title}</p>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Kaspa Updates */}
          <div>
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Kaspa Network
            </h3>
            <div className="space-y-3">
              {kaspaUpdates.length > 0 ? kaspaUpdates.map((u, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  className="p-4 rounded-xl ring-1 ring-zinc-100 hover:ring-zinc-200 hover:shadow-md transition-all duration-300 bg-zinc-50/50">
                  <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md">{u.tag}</span>
                  <p className="text-[13px] font-semibold text-zinc-800 leading-snug line-clamp-2 mt-2">{u.title}</p>
                  {u.summary && <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{u.summary}</p>}
                </motion.div>
              )) : (
                <div className="p-4 rounded-xl bg-zinc-50 text-zinc-400 text-xs text-center">Loading updates…</div>
              )}
            </div>
          </div>

          {/* Latest Posts */}
          <div>
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-500" /> Community Posts
            </h3>
            <div className="space-y-3">
              {posts.length > 0 ? posts.slice(0, 4).map(p => (
                <motion.div key={p.id} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  className="p-4 rounded-xl ring-1 ring-zinc-100 hover:ring-zinc-200 hover:shadow-md transition-all duration-300 bg-zinc-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold text-zinc-700">{p.author}</span>
                    <span className="text-[10px] text-zinc-300">{p.date}</span>
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-2">{p.text}</p>
                  {(p.tips > 0 || p.likes > 0) && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
                      {p.tips > 0 && <span className="text-cyan-600 font-semibold">💰 {p.tips} KAS</span>}
                      {p.likes > 0 && <span>♥ {p.likes}</span>}
                    </div>
                  )}
                </motion.div>
              )) : (
                <div className="p-4 rounded-xl bg-zinc-50 text-zinc-400 text-xs text-center">No posts yet</div>
              )}
            </div>
          </div>

          {/* Coming Soon */}
          <div>
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Rocket className="w-3.5 h-3.5 text-purple-500" /> Coming Soon
            </h3>
            <div className="space-y-3">
              {COMING_SOON.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl ring-1 ring-purple-100 bg-gradient-to-br from-purple-50/50 to-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{item.tag}</span>
                    <Clock className="w-3 h-3 text-purple-400" />
                  </div>
                  <p className="text-[13px] font-semibold text-zinc-800 leading-snug">{item.title}</p>
                  <p className="text-[11px] text-zinc-400 mt-1">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}