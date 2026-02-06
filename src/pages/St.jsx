import React from "react";
import { motion } from "framer-motion";

export default function StPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0042f30b3_image.png"
              alt="St. Creative"
              className="w-32 h-32 mx-auto mb-6 object-contain"
            />
            <h1 className="text-5xl font-black text-white mb-4">St. Creative</h1>
            <p className="text-white/60 text-xl">Coming Soon</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}