import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StampModal({ post, onClose, onConfirm, isLoading }) {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getTruncatedAddress = (address) => {
    if (!address) return "No address";
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-white/20 rounded-xl w-full max-w-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">⭐</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Stamp Post</h3>
                <p className="text-white/60 text-sm">Post Details</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4 mb-6">
            {/* Post Owner Address */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-white/60 mb-2">Post Owner Address</div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-white font-mono text-sm">
                    {getTruncatedAddress(post?.author_wallet_address)}
                  </div>
                  <div className="text-white/40 text-xs mt-1 break-all font-mono">
                    {post?.author_wallet_address}
                  </div>
                </div>
                <Button
                  onClick={() =>
                    copyToClipboard(
                      post?.author_wallet_address || "",
                      "address"
                    )
                  }
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/40 hover:text-white flex-shrink-0"
                >
                  {copiedField === "address" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Post ID */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-white/60 mb-2">Post ID</div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-white font-mono text-sm">
                    {post?.id?.substring(0, 12)}...
                  </div>
                  <div className="text-white/40 text-xs mt-1 break-all font-mono">
                    {post?.id}
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(post?.id || "", "id")}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/40 hover:text-white flex-shrink-0"
                >
                  {copiedField === "id" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-6">
            <p className="text-xs text-orange-300">
              Share this post address and ID to others so they can stamp your post using their wallet.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30"
            >
              Close
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold"
            >
              {isLoading ? "Stamping..." : "Stamp Post"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}