import React, { useEffect } from "react";
import { ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function BMTUnivPage() {
  const navigate = useNavigate();
  const url = "https://bmtuniversity.com";

  useEffect(() => {
    // Auto-open in new tab after a short delay
    const timer = setTimeout(() => {
      window.open(url, '_blank');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-black to-blue-500/10" />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <button
          onClick={() => navigate(createPageUrl('AppStore'))}
          className="absolute top-4 left-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/ab3b7f637_image.png" 
            alt="BMT University" 
            className="w-32 h-32 mx-auto mb-6 rounded-full border-4 border-white/10"
          />
          
          <h1 className="text-4xl font-black text-white text-center mb-2">BMT University</h1>
          <p className="text-white/60 text-center mb-8">Education for the Crypto Generation</p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <ExternalLink className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">External Resource</h3>
                <p className="text-white/60 text-sm">
                  BMT University will open in a new tab to provide you with the best learning experience.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => window.open(url, '_blank')}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-14 text-lg font-semibold text-black"
          >
            Enter BMT University
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-white/40 text-xs text-center mt-4">
            Opening automatically in 1 second...
          </p>
        </motion.div>
      </div>
    </div>
  );
}