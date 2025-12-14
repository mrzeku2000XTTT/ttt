import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function KaspaHubPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center space-y-12">
        <div className="absolute top-0 left-0">
          <Link to={createPageUrl("AppStore")}>
            <Button variant="ghost" className="text-white/60 hover:text-white">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Store
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-32 h-32 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 group-hover:opacity-100 transition-opacity" />
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/b3c82bda2_image.png"
              alt="KaspaHub"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-white/50">
              KaspaHub
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Your central gateway to the Kaspa ecosystem. Explore projects, tools, and community resources all in one place.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="pt-8"
          >
            <a 
              href="https://kaspahub.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative inline-flex"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <Button 
                size="lg"
                className="relative h-16 px-12 text-xl font-bold bg-black border border-white/10 rounded-full hover:bg-white/5 transition-all"
              >
                Launch KaspaHub
                <ExternalLink className="w-6 h-6 ml-3 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12"
        >
          {[
            { title: "Ecosystem", desc: "Discover Kaspa projects" },
            { title: "Tools", desc: "Essential utilities & explorers" },
            { title: "Community", desc: "Connect with builders" }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-white/40">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}