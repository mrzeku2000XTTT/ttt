import React from "react";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: `url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/42598d5e5_image.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tight">
            UNCHAIN REALITY
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-cyan-500/50 transition-all"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Enter TTT
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}