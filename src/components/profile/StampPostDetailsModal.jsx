import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StampPostDetailsModal({ post, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    if (address.length <= 20) return address;
    return address.substring(0, 10) + '...' + address.substring(address.length - 10);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-orange-500/30 rounded-xl p-4 max-w-sm w-full shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500/20 border border-orange-500/40 rounded-lg flex items-center justify-center">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stamp Post</h2>
              <p className="text-[10px] text-gray-400">Post Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Post Owner Address */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Post Owner Address</label>
            <div className="bg-black/40 border border-white/10 rounded-lg p-2.5">
              <div className="text-white font-mono text-xs break-all mb-1.5 font-bold">
                {post.author_wallet_address ? truncateAddress(post.author_wallet_address) : 'No address'}
              </div>
              <div className="text-[10px] text-gray-500 break-all font-mono">
                {post.author_wallet_address || 'N/A'}
              </div>
              {post.author_wallet_address && (
                <button
                  onClick={() => handleCopy(post.author_wallet_address, 'address')}
                  className="mt-1.5 flex items-center gap-1 text-orange-400 hover:text-orange-300 text-[10px] transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copiedField === 'address' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          {/* Post ID */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Post ID</label>
            <div className="bg-black/40 border border-white/10 rounded-lg p-2.5">
              <div className="text-white font-mono text-xs break-all mb-1.5 font-bold">
                {post.id ? truncateAddress(post.id) : 'No ID'}
              </div>
              <div className="text-[10px] text-gray-500 break-all font-mono">
                {post.id || 'N/A'}
              </div>
              {post.id && (
                <button
                  onClick={() => handleCopy(post.id, 'id')}
                  className="mt-1.5 flex items-center gap-1 text-orange-400 hover:text-orange-300 text-[10px] transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copiedField === 'id' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2.5">
            <p className="text-[10px] text-orange-300 leading-relaxed">
              Share this post address and ID to others so they can stamp your post using their wallet.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}