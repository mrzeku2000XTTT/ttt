import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";

export default function KasmiPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <Link 
          to={createPageUrl("OliviaApps")} 
          className="opacity-50 hover:opacity-100 transition-opacity duration-300"
        >
          <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full border border-white/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse" />

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 flex flex-col items-center gap-8 p-6 text-center max-w-lg"
      >
        {/* Logo */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-32 h-32 md:w-40 md:h-40 relative rounded-3xl bg-black/50 border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.2)]"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/ca73d2b8f_image.png" 
            alt="Kasmi Logo" 
            className="w-full h-full object-contain p-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          />
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            KASMI
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Experience the future of decentralized applications with Kasmi. 
            Connect, explore, and innovate.
          </p>
        </div>

        <a 
          href="https://www.kasmi.online" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full sm:w-auto"
        >
          <Button 
            size="lg" 
            className="w-full sm:w-auto min-w-[200px] h-14 text-lg font-bold bg-white text-black hover:bg-gray-200 transition-all rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]"
          >
            Launch App
            <ExternalLink className="ml-2 w-5 h-5" />
          </Button>
        </a>
      </motion.div>
    </div>
  );
}