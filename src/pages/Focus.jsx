import React from "react";
import { motion } from "framer-motion";

export default function FocusPage() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {/* Water Background */}
      <div className="absolute inset-0">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/6670324f5_nature-sea-landscape-with-idyllic-view-water.jpg"
          alt="Water"
          className="w-full h-full object-cover"
          style={{ 
            imageRendering: 'high-quality',
            filter: 'brightness(0.4) contrast(1.1)'
          }}
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-6xl"
        >
          <h1 className="text-4xl md:text-6xl font-black text-white text-center mb-8 tracking-tight">
            FOCUS
          </h1>
          
          {/* YouTube Iframe */}
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              src="https://www.youtube.com/embed/UpPmnnJcy6A?autoplay=1&mute=1"
              className="absolute top-0 left-0 w-full h-full rounded-xl border-2 border-white/10 shadow-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}