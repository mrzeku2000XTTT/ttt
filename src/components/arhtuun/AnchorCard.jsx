import React from "react";
import { motion } from "framer-motion";
import { Anchor, CheckCircle, Clock, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

export default function AnchorCard({ anchor, onClick }) {
  const pressureLabels = {
    creative_flow: "Creative Flow",
    urgent_solving: "Urgent Solving",
    analytical_thinking: "Analytical",
    routine_execution: "Routine"
  };

  const pressureColors = {
    creative_flow: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    urgent_solving: "bg-red-500/20 text-red-400 border-red-500/30",
    analytical_thinking: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    routine_execution: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      onClick={onClick}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 cursor-pointer hover:border-cyan-500/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
            <Anchor className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Continuity Anchor</div>
            <div className="text-white/40 text-xs">{moment(anchor.anchor_timestamp).fromNow()}</div>
          </div>
        </div>
        {anchor.is_verified && (
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <CheckCircle className="w-3 h-3" />
            <span>Verified</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-white/60 text-xs font-semibold mb-1">Vector</div>
          <div className="text-white text-sm line-clamp-2">{anchor.vector}</div>
        </div>

        <div>
          <div className="text-white/60 text-xs font-semibold mb-1">Open Loop</div>
          <div className="text-white/80 text-sm line-clamp-1">{anchor.open_loop}</div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={pressureColors[anchor.pressure]}>
            {pressureLabels[anchor.pressure]}
          </Badge>
          {anchor.context_tags?.map((tag, i) => (
            <Badge key={i} className="bg-white/10 text-white/70 border-white/20">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {anchor.kaspa_tx_hash && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <Hash className="w-3 h-3" />
            <span className="font-mono truncate">{anchor.kaspa_tx_hash}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}