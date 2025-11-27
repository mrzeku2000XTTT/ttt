import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, Star, Zap, CheckCircle2 } from "lucide-react";

export default function DAGKnightBadge({ certificate, verifications }) {
  if (!certificate && (!verifications || verifications.length === 0)) {
    return null;
  }

  // Calculate tier based on verifications
  const calculateTier = () => {
    const walletTypes = [...new Set(verifications.map(v => v.wallet_type))];
    const totalBlueScore = verifications.reduce((sum, v) => sum + (v.blue_score || 0), 0);
    const maxDepth = Math.max(...verifications.map(v => v.dag_depth || 0), 0);
    const crossVerifications = verifications.filter(v => v.verified_by && v.verified_by.length > 0).length;

    // Tier logic
    if (walletTypes.length >= 3 && totalBlueScore >= 10 && maxDepth >= 3 && crossVerifications >= 2) {
      return {
        name: "Diamond Knight",
        color: "from-cyan-400 to-blue-500",
        bgColor: "bg-cyan-500/20",
        borderColor: "border-cyan-500/50",
        textColor: "text-cyan-400",
        icon: Crown,
        glow: "shadow-cyan-500/50"
      };
    } else if (walletTypes.length >= 3 && totalBlueScore >= 5 && maxDepth >= 2) {
      return {
        name: "Gold Knight",
        color: "from-yellow-400 to-orange-500",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/50",
        textColor: "text-yellow-400",
        icon: Star,
        glow: "shadow-yellow-500/50"
      };
    } else if (walletTypes.length >= 2 && totalBlueScore >= 3) {
      return {
        name: "Silver Knight",
        color: "from-gray-300 to-gray-500",
        bgColor: "bg-gray-500/20",
        borderColor: "border-gray-500/50",
        textColor: "text-gray-400",
        icon: Shield,
        glow: "shadow-gray-500/50"
      };
    } else if (walletTypes.length >= 1) {
      return {
        name: "Bronze Knight",
        color: "from-orange-600 to-orange-800",
        bgColor: "bg-orange-600/20",
        borderColor: "border-orange-600/50",
        textColor: "text-orange-400",
        icon: Zap,
        glow: "shadow-orange-600/50"
      };
    }

    return null;
  };

  const tier = calculateTier();

  if (!tier) return null;

  const Icon = tier.icon;
  const totalBlueScore = verifications.reduce((sum, v) => sum + (v.blue_score || 0), 0);
  const walletTypes = [...new Set(verifications.map(v => v.wallet_type))];
  const maxDepth = Math.max(...verifications.map(v => v.dag_depth || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className={`bg-black border-2 ${tier.borderColor} rounded-xl p-6 ${tier.glow} shadow-2xl relative overflow-hidden`}>
        {/* Animated background */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute inset-0 bg-gradient-to-br ${tier.color} blur-3xl`}
        />

        <div className="relative z-10">
          {/* Badge Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  boxShadow: [
                    `0 0 20px ${tier.color}`,
                    `0 0 40px ${tier.color}`,
                    `0 0 20px ${tier.color}`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-14 h-14 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <Icon className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <div className="text-xs text-gray-400 mb-1">DAGKnight Verified</div>
                <div className={`text-xl font-bold ${tier.textColor}`}>
                  {tier.name}
                </div>
              </div>
            </div>

            <Badge variant="outline" className={`${tier.bgColor} ${tier.textColor} ${tier.borderColor}`}>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`${tier.bgColor} rounded-lg p-3 border ${tier.borderColor}`}>
              <div className="text-xs text-gray-500 mb-1">Wallets</div>
              <div className={`text-2xl font-bold ${tier.textColor}`}>
                {walletTypes.length}
              </div>
            </div>

            <div className={`${tier.bgColor} rounded-lg p-3 border ${tier.borderColor}`}>
              <div className="text-xs text-gray-500 mb-1">Blue Score</div>
              <div className={`text-2xl font-bold ${tier.textColor}`}>
                {totalBlueScore}
              </div>
            </div>

            <div className={`${tier.bgColor} rounded-lg p-3 border ${tier.borderColor}`}>
              <div className="text-xs text-gray-500 mb-1">DAG Depth</div>
              <div className={`text-2xl font-bold ${tier.textColor}`}>
                {maxDepth}
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="mt-4 space-y-2">
            {walletTypes.includes('kasware_l1') && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Kasware L1 Verified</span>
              </div>
            )}
            {walletTypes.includes('ttt_wallet') && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">TTT Wallet Verified</span>
              </div>
            )}
            {walletTypes.includes('metamask_l2') && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">MetaMask L2 Verified</span>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="text-xs text-gray-500 mb-2">Benefits:</div>
            <div className="flex flex-wrap gap-2">
              {tier.name === "Diamond Knight" && (
                <>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Lower Fees
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                    Higher Limits
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                    Priority Support
                  </Badge>
                </>
              )}
              {tier.name === "Gold Knight" && (
                <>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Reduced Fees
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                    Increased Limits
                  </Badge>
                </>
              )}
              {tier.name === "Silver Knight" && (
                <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                  Enhanced Security
                </Badge>
              )}
              {tier.name === "Bronze Knight" && (
                <Badge variant="outline" className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">
                  Basic Protection
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}