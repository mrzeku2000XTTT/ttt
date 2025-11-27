import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, X, Briefcase, Code, CheckCircle2 } from "lucide-react";

export default function IDCard({ profile, onClose }) {
  const [flipped, setFlipped] = useState(false);

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };

  const isWorker = profile.work_type?.includes('worker');
  const isEmployer = profile.work_type?.includes('employer');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, rotateY: 0 }}
          animate={{ scale: 1, rotateY: flipped ? 180 : 0 }}
          exit={{ scale: 0.8 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md h-[280px] cursor-pointer"
          style={{ transformStyle: "preserve-3d" }}
          onDoubleClick={() => setFlipped(!flipped)}
        >
          {/* Front of Card */}
          <div
            className={`absolute inset-0 ${flipped ? 'opacity-0' : 'opacity-100'}`}
            style={{ backfaceVisibility: "hidden" }}
          >
            <Card className="h-full bg-gradient-to-br from-cyan-900/40 via-blue-900/40 to-purple-900/40 border-cyan-500/30 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
              
              <CardContent className="relative z-10 p-6 h-full flex flex-col">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-all"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50">
                    <span className="text-white font-black text-xl">TTT</span>
                  </div>
                  <div>
                    <div className="text-xs text-cyan-400 font-semibold">AGENT IDENTITY</div>
                    <div className="text-white text-sm font-mono">{profile.agent_zk_id}</div>
                  </div>
                </div>

                {/* Profile Section */}
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-lg">
                    {profile.agent_zk_photo ? (
                      <img src={profile.agent_zk_photo} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                        <Shield className="w-10 h-10 text-cyan-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-1">{profile.username}</h3>
                    <div className="text-xs text-cyan-300 font-mono mb-2">
                      {truncateAddress(profile.wallet_address)}
                    </div>
                    {profile.role && (
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                        {profile.role}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {profile.availability || 'ACTIVE'}
                  </Badge>
                  
                  {isWorker && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      <Code className="w-3 h-3 mr-1" />
                      WORKER
                    </Badge>
                  )}
                  
                  {isEmployer && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      <Briefcase className="w-3 h-3 mr-1" />
                      EMPLOYER
                    </Badge>
                  )}

                  {profile.is_hireable && isWorker && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                      ✨ HIREABLE
                    </Badge>
                  )}

                  {profile.kns_domain && (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-mono text-xs">
                      {profile.kns_domain}
                    </Badge>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    IMMUTABLE • UNIQUE • QUANTUM-SECURED
                  </div>
                  <div className="text-xs text-cyan-400">
                    {profile.verification_count > 0 ? `${profile.verification_count} DAG-VERIFIED` : 'STATUS:ONLINE'}
                  </div>
                </div>

                {/* Double-tap hint */}
                <div className="text-center text-xs text-gray-600 mt-2">
                  Double-click to flip
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Back of Card */}
          <div
            className={`absolute inset-0 ${flipped ? 'opacity-100' : 'opacity-0'}`}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <Card className="h-full bg-gradient-to-br from-slate-900 to-black border-cyan-500/30 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                    <span className="text-white font-black text-6xl">TTT</span>
                  </div>
                  <div className="text-cyan-400 text-sm font-semibold mb-1">AGENT ZK NETWORK</div>
                  <div className="text-gray-500 text-xs">DECENTRALIZED IDENTITY</div>
                  
                  {isWorker && profile.tech_background && (
                    <div className="mt-6 px-6">
                      <div className="text-xs text-cyan-400 mb-2">TECH BACKGROUND</div>
                      <p className="text-white text-sm">{profile.tech_background}</p>
                    </div>
                  )}

                  {profile.hourly_rate_kas && (
                    <div className="mt-4">
                      <div className="text-xs text-cyan-400">RATE</div>
                      <div className="text-white text-lg font-bold">{profile.hourly_rate_kas} KAS/hr</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Footer */}
              <div className="absolute bottom-6 left-6 right-6 text-center text-xs text-gray-600">
                Double-click to flip back
              </div>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}