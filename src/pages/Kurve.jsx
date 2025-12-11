import React, { useEffect } from "react";
import { ArrowLeft, Wallet, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function KurvePage() {
  const navigate = useNavigate();
  const bridgeUrl = "https://kasbridge-evm.kaspafoundation.org";

  useEffect(() => {
    // Auto-open in new tab after a short delay
    const timer = setTimeout(() => {
      window.open(bridgeUrl, '_blank');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-black to-blue-500/10" />
      
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
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7be912bf3_image.png" 
            alt="Kurve" 
            className="w-32 h-32 mx-auto mb-6 rounded-2xl"
          />
          
          <h1 className="text-4xl font-black text-white text-center mb-2">Kurve Bridge</h1>
          <p className="text-white/60 text-center mb-8">KAS L1 ↔ L2 Bridge</p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Wallet className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">Wallet Connection Required</h3>
                <p className="text-white/60 text-sm">
                  To connect your Kasware wallet (L1), the bridge must open in a new tab due to browser security restrictions.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => window.open(bridgeUrl, '_blank')}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-14 text-lg font-semibold"
          >
            Open Kurve Bridge
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