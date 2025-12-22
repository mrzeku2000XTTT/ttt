import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export default function KurncyPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=2000&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.4)'
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-7xl md:text-9xl font-black text-white tracking-tight mb-4">
              Kurncy
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-2xl md:text-4xl text-white/90 font-light mb-4"
          >
            The Kaspa-Centric Wallet
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg md:text-xl text-white/70 mb-12"
          >
            Now on iOS & Android
          </motion.p>

          {/* CTA Button */}
          <motion.a
            href="https://www.kurncy.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-semibold rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300"
          >
            Visit Kurncy.com
            <ExternalLink className="w-5 h-5" />
          </motion.a>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-8 text-white/60 text-sm"
          >
            Secure. Compliant. Ready for the future of crypto.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}