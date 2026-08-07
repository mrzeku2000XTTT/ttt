import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ContentCoreStudio from '@/components/contentcore/ContentCoreStudio';
import { ArrowLeft, Sparkles, Image, Video, Box, Type } from 'lucide-react';

const TOOLS = [
  { id: 'mockups', name: '3D Mockups', desc: 'Place images or videos', icon: Image },
  { id: 'motion', name: '3D Motion Templates', desc: 'Animate your content in seconds', icon: Video },
  { id: 'shapes', name: '3D Icons & Shapes', desc: 'Can be combined with Text', icon: Box },
  { id: 'text', name: '3D Text & Logos', desc: 'Can be combined with Shapes', icon: Type },
];

export default function ContentCore() {
  const [studioOpen, setStudioOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);

  const openStudio = (toolId) => {
    setSelectedTool(toolId);
    setStudioOpen(true);
  };

  if (studioOpen) {
    return <ContentCoreStudio onClose={() => setStudioOpen(false)} initialTool={selectedTool} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <a href="/AppStoreV2" className="text-white/50 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <span className="text-lg font-medium">ContentCore®</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-white/60 hover:text-white text-sm transition">Pricing & License</button>
          <button className="px-4 py-1.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition">
            Sign up
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50 mb-6">
            <Sparkles className="w-3 h-3" />
            3D Content Studio
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Create content in one place.
            <br />
            <span className="text-white/50">Incredibly fast.</span>
          </h1>
          <p className="text-white/40 text-lg mb-8">
            Export as images or videos.
          </p>
        </motion.div>
      </section>

      {/* Quick Start Tools */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-white/50 text-sm uppercase tracking-wider mb-6 text-center">Quick Start</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                onClick={() => openStudio(tool.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative bg-[#111] border border-white/10 rounded-2xl p-6 text-left hover:border-white/30 transition-all hover:bg-[#161616]"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition">
                  <Icon className="w-6 h-6 text-white/70" />
                </div>
                <h3 className="text-white font-medium mb-1">{tool.name}</h3>
                <p className="text-white/40 text-sm">{tool.desc}</p>
                <div className="absolute top-4 right-4 text-white/20 text-xs group-hover:text-white/40 transition">
                  Tool →
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Pricing & License</h2>
          <p className="text-white/40 text-sm mb-6">
            Upgrade now to license your created content: full unlimited usage, modifications, distribution, and resale rights.
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div>
              <div className="text-3xl font-bold">$9.99<span className="text-white/40 text-sm font-normal">/mo</span></div>
              <div className="text-white/40 text-xs">Pay monthly</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <div className="text-3xl font-bold">$5.99<span className="text-white/40 text-sm font-normal">/mo</span></div>
              <div className="text-white/40 text-xs">$71.88 yearly · Save $48</div>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition">
            Upgrade now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-white/30 text-xs">
        ContentCore® Clone · Create content in one place
      </footer>
    </div>
  );
}