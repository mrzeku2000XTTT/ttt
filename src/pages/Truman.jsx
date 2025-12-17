import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Play } from "lucide-react";

export default function TrumanPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-black" />
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to={createPageUrl("BridgeMind")}>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Play className="w-8 h-8 text-red-500" />
                Truman
              </h1>
              <p className="text-white/60">Watch and learn</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/mqlRCYJsZhY"
                title="Truman Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">Featured Content</h2>
              <p className="text-white/60">
                Explore meaningful content and insights through curated videos.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}