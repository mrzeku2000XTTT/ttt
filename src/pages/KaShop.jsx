import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, ShoppingBag } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function KaShopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Gradient background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-slate-600 to-slate-900 rounded-[50%] blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl" style={{ paddingTop: 'var(--sat, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl("AppStore")}>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Apps
            </Button>
          </Link>

          <a
            href="https://kashop.base44.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 border border-white/20">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open KaShop
            </Button>
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <motion.div
            className="mb-8 flex justify-center"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/00f7c1aac_image.png"
              alt="KaShop"
              className="w-32 h-32 drop-shadow-2xl rounded-full"
            />
          </motion.div>

          <h1 className="text-4xl font-black text-white mb-4">KaShop</h1>
          <p className="text-white/60 text-lg mb-8">
            Your premier shopping destination. Discover amazing products and deals.
          </p>

          <a
            href="https://kashop.base44.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 border border-white/20 text-lg px-8 py-6">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Launch KaShop
              </Button>
            </motion.div>
          </a>
        </motion.div>
      </div>
    </div>
  );
}