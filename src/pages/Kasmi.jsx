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
      <div className="absolute inset-0 bg-[url('https://wallpapers.com/images/hd/matrix-background-4k-j8q9q6q9q6q9q6q9.jpg')] bg-cover bg-center opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black pointer-events-none" />

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 flex flex-col items-center gap-8 p-6 text-center max-w-lg"
      >
        {/* Logo */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-40 h-40 md:w-48 md:h-48 relative flex items-center justify-center filter drop-shadow-[0_0_30px_rgba(0,255,0,0.3)]"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2216b4c09_image.png" 
            alt="Kasmi Logo" 
            className="w-full h-full object-cover rounded-full"
          />
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Kaspa Marketing Initiative
          </h1>
          <p className="text-white/80 text-lg leading-relaxed font-mono">
            Building innovative and engaging environments on Kaspa.
          </p>
          <a 
            href="https://x.com/KaspaMarketing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm"
          >
            <span>@KaspaMarketing</span>
            <ExternalLink className="w-3 h-3" />
          </a>
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