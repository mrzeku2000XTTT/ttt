import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Anchor, CheckCircle, Hash, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

export default function AnchorDetailModal({ anchor, onClose }) {
  if (!anchor) return null;

  const pressureLabels = {
    creative_flow: "Creative Flow",
    urgent_solving: "Urgent Problem Solving",
    analytical_thinking: "Analytical Thinking",
    routine_execution: "Routine Execution"
  };

  const pressureColors = {
    creative_flow: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    urgent_solving: "bg-red-500/20 text-red-400 border-red-500/30",
    analytical_thinking: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    routine_execution: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                <Anchor className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Continuity Anchor</h3>
                <p className="text-white/60 text-xs">{moment(anchor.anchor_timestamp).format('MMM D, YYYY - h:mm A')}</p>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <div className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">Vector: Directional Aim</div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white leading-relaxed">{anchor.vector}</p>
              </div>
            </div>

            <div>
              <div className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">Weight: Contextual Significance</div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white/80 leading-relaxed">{anchor.weight}</p>
              </div>
            </div>

            <div>
              <div className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">Open Loop: Point of Suspension</div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white/80 leading-relaxed">{anchor.open_loop}</p>
              </div>
            </div>

            <div>
              <div className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">Pressure: Motivational Quality</div>
              <Badge className={`${pressureColors[anchor.pressure]} text-sm py-1 px-3`}>
                {pressureLabels[anchor.pressure]}
              </Badge>
            </div>

            {anchor.context_tags?.length > 0 && (
              <div>
                <div className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">Context Tags</div>
                <div className="flex flex-wrap gap-2">
                  {anchor.context_tags.map((tag, i) => (
                    <Badge key={i} className="bg-white/10 text-white/70 border-white/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-white/10 pt-6">
              <div className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">Kaspa Verification</div>
              <div className="space-y-3">
                {anchor.is_verified && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Blockchain Verified</span>
                  </div>
                )}
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Hash className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white/40 text-xs mb-1">Transaction Hash</div>
                      <div className="text-white text-xs font-mono break-all">{anchor.kaspa_tx_hash}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-white/40 text-xs mb-1">Block Height</div>
                      <div className="text-white text-xs font-mono">{anchor.block_height?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <div className="text-white/40 text-xs text-center">
              This anchor is cryptographically verified on the Kaspa blockchain
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}