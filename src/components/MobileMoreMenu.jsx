import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MoreHorizontal, ExternalLink, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import ZKVerificationModal from "@/components/ZKVerificationModal";

export default function MobileMoreMenu({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showZKModal, setShowZKModal] = useState(false);

  const mobilePages = [
    { name: "Patch Project", path: "Creator", icon: "🎨" },
    { name: "Tip Pages", path: "TapToTip", icon: "💰" },
    { name: "Templates", path: "TemplateBuilder", icon: "📝" },
    { name: "Watch Party", path: "Movies", icon: "🎬" },
    { name: "Kaspa Local", path: "KaspaLocal", icon: "🌍" },
    { name: "Shop", path: "Shop", icon: "🛍️" },
    { name: "Career", path: "Career", icon: "💼" },
    { name: "Analytics", path: "Analytics", icon: "📊" },
    { name: "Docs", path: "Docs", icon: "📚" },
  ];

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 text-white/60"
      >
        <MoreHorizontal className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
              style={{ top: 'var(--sat, 0px)' }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-black border-t border-white/20 rounded-t-2xl"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/40 rounded-lg flex items-center justify-center">
                    <MoreHorizontal className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">More Pages</h3>
                    <p className="text-white/60 text-xs">All TTT apps & features</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-4 space-y-2">
                {/* ZK Connect Button for iOS Users */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowZKModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-white hover:bg-purple-500/30 transition-all"
                >
                  <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm">ZK Connect</div>
                    <div className="text-white/60 text-xs">iOS wallet verification</div>
                  </div>
                  <Zap className="w-4 h-4 text-yellow-400" />
                </button>

                {/* All Mobile Pages */}
                {mobilePages.map((page) => (
                  <Link
                    key={page.path}
                    to={createPageUrl(page.path)}
                    onClick={() => setIsOpen(false)}
                  >
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">
                        {page.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{page.name}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/40" />
                    </button>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ZKVerificationModal
        isOpen={showZKModal}
        onClose={() => setShowZKModal(false)}
        currentUser={currentUser}
      />
    </>
  );
}