import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Users, Target, Gift, CheckCircle2, Trophy } from "lucide-react";

export default function PerformanceRewardsPanel({ rewards, onClaim }) {
  const rewardTypes = {
    perfect_attendance: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20" },
    top_performer: { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/20" },
    training_complete: { icon: Target, color: "text-blue-400", bg: "bg-blue-500/20" },
    referral_bonus: { icon: Users, color: "text-purple-400", bg: "bg-purple-500/20" },
    peer_recognition: { icon: Gift, color: "text-pink-400", bg: "bg-pink-500/20" },
    milestone_reached: { icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-500/20" }
  };

  const totalRewards = rewards.reduce((sum, r) => sum + r.reward_kas, 0);
  const claimedRewards = rewards.filter(r => r.claimed).length;

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Performance Rewards
          </h3>
          <div className="text-right">
            <div className="text-sm text-gray-300">Total Earned</div>
            <div className="text-xl font-bold text-yellow-400">{totalRewards.toFixed(2)} KAS</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-black/40 rounded-lg border border-white/10">
            <div className="text-xs text-gray-400">Active</div>
            <div className="text-xl font-bold text-white">{rewards.filter(r => !r.claimed).length}</div>
          </div>
          <div className="p-3 bg-black/40 rounded-lg border border-white/10">
            <div className="text-xs text-gray-400">Claimed</div>
            <div className="text-xl font-bold text-green-400">{claimedRewards}</div>
          </div>
          <div className="p-3 bg-black/40 rounded-lg border border-white/10">
            <div className="text-xs text-gray-400">Total</div>
            <div className="text-xl font-bold text-purple-400">{rewards.length}</div>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {rewards.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No rewards yet</p>
            </div>
          ) : (
            rewards.map((reward, idx) => {
              const config = rewardTypes[reward.achievement_type] || rewardTypes.milestone_reached;
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    reward.claimed 
                      ? 'bg-black/20 border-white/5 opacity-60' 
                      : 'bg-gradient-to-br from-white/5 to-white/10 border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white">{reward.achievement_name}</div>
                        <div className="text-sm text-gray-300 mt-1">{reward.employee_name}</div>
                        <div className="text-xs text-gray-400 mt-1">{reward.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                            {reward.reward_kas} KAS
                          </Badge>
                          {reward.claimed && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">
                              Claimed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {!reward.claimed && (
                      <Button
                        size="sm"
                        onClick={() => onClaim(reward.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}