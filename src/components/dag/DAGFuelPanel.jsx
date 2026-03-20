import React, { useState, useEffect } from "react";
import { Zap, Flame, Gift, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DONATION_ADDRESS = "kaspa:qr5w9dtp6ru08cwheusawez5kv0f9dmfaz8fwfqejvnx9jk4p74fc2g5wfzdm";

export default function DAGFuelPanel({ stats, onDonate }) {
  const [dagStats, setDagStats] = useState(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [fuelType, setFuelType] = useState("cycling");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const allStats = await base44.entities.DAGStats.filter({});
      if (allStats.length > 0) {
        setDagStats(allStats[0]);
      }
    } catch (err) {
      console.error("Failed to load DAG stats:", err);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cyclingFuel = dagStats?.total_cycling_fuel || 0;
  const boostFuel = dagStats?.total_boost_fuel || 0;
  const artificialTPS = dagStats?.current_artificial_tps || 0;
  const totalSent = dagStats?.total_transactions_sent || 0;

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Cycling Fuel */}
        <div className="relative cursor-default">
          <div className="flex flex-col gap-1 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg min-w-[140px]">
            <div className="flex items-center gap-1.5 text-purple-400">
              <Flame className="w-3 h-3" />
              <span className="font-mono text-[9px] uppercase">Cycling Fuel</span>
            </div>
            <div className="font-mono text-sm font-bold text-white">
              {cyclingFuel.toFixed(1)} KAS
            </div>
            <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500/50 to-purple-400 transition-all duration-300"
                style={{ width: Math.min((cyclingFuel / 10000) * 100, 100) + '%' }}
              />
            </div>
          </div>
        </div>

        {/* Boost Fuel */}
        <div className="relative cursor-default">
          <div className="flex flex-col gap-1 px-3 py-2 bg-teal-500/10 border border-teal-500/30 rounded-lg min-w-[140px]">
            <div className="flex items-center gap-1.5 text-teal-400">
              <Zap className="w-3 h-3" />
              <span className="font-mono text-[9px] uppercase">Boost Fuel</span>
              {boostFuel > 0 && (
                <span className="text-[8px] px-1.5 py-0.5 bg-teal-500/20 text-teal-300 rounded">ACTIVE</span>
              )}
            </div>
            <div className="font-mono text-sm font-bold text-white">
              {boostFuel.toFixed(1)} KAS
            </div>
            <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500/50 to-teal-400 transition-all duration-300"
                style={{ width: Math.min((boostFuel / 5000) * 100, 100) + '%' }}
              />
            </div>
          </div>
        </div>

        {/* Artificial TPS */}
        <div className="relative cursor-default">
          <div className="flex flex-col gap-1 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg min-w-[100px]">
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Zap className="w-3 h-3" />
              <span className="font-mono text-[9px] uppercase">+TPS</span>
            </div>
            <div className="font-mono text-sm font-bold text-white">
              {artificialTPS.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Total Sent */}
        <div className="relative cursor-default">
          <div className="flex flex-col gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg min-w-[120px]">
            <span className="font-mono text-[9px] uppercase text-white/50">Sent</span>
            <div className="font-mono text-sm font-bold text-white">
              {totalSent.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Donate Button */}
        <Button
          onClick={() => setShowDonateModal(true)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-0 h-auto py-2 px-4"
        >
          <Gift className="w-4 h-4 mr-2" />
          <span className="font-mono font-bold">+ DONATE</span>
        </Button>
      </div>

      {/* Donation Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-zinc-900 border border-teal-500/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 font-mono">Donate Fuel</h3>
            
            <div className="space-y-4">
              {/* Fuel Type Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFuelType("cycling")}
                  className={`flex-1 px-4 py-3 rounded-lg border font-mono text-sm transition-all ${
                    fuelType === "cycling"
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <Flame className="w-4 h-4 mx-auto mb-1" />
                  Cycling Fuel
                </button>
                <button
                  onClick={() => setFuelType("boost")}
                  className={`flex-1 px-4 py-3 rounded-lg border font-mono text-sm transition-all ${
                    fuelType === "boost"
                      ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <Zap className="w-4 h-4 mx-auto mb-1" />
                  Boost Fuel
                </button>
              </div>

              {/* Description */}
              <div className="text-xs text-white/60 font-mono">
                {fuelType === "cycling" ? (
                  <>🔄 Cycling fuel generates sustained TPS indefinitely</>
                ) : (
                  <>⚡ Boost fuel provides temporary TPS spike (24h)</>
                )}
              </div>

              {/* Donation Address */}
              <div>
                <label className="text-xs text-white/50 font-mono mb-2 block">Send KAS to:</label>
                <div className="flex gap-2">
                  <Input
                    value={DONATION_ADDRESS}
                    readOnly
                    className="bg-black/50 border-white/10 text-white font-mono text-xs"
                  />
                  <Button
                    onClick={handleCopyAddress}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300 font-mono">
                ⚠️ Transactions are detected automatically within ~10 seconds
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowDonateModal(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}