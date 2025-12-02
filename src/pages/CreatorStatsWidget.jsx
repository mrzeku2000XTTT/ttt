import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, DollarSign, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CreatorStatsWidget() {
  const [stats, setStats] = useState({
    todayEarnings: 0,
    totalPending: 0,
    balance: 0,
    clicks: 0,
    conversions: 0
  });
  const [kasPrice, setKasPrice] = useState(null);
  const [creatorEmail, setCreatorEmail] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (email) {
      setCreatorEmail(email);
      loadData(email);
      loadKasPrice();

      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        loadData(email);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, []);

  const loadKasPrice = async () => {
    try {
      const response = await base44.functions.invoke('getKaspaPrice');
      setKasPrice(response.data.price);
    } catch (err) {
      console.error('Failed to load KAS price:', err);
    }
  };

  const loadData = async (email) => {
    try {
      const referrals = await base44.entities.CreatorReferral.filter({
        creator_email: email
      });

      const today = new Date().setHours(0, 0, 0, 0);
      const todayRefs = referrals.filter(r => 
        new Date(r.created_date).setHours(0, 0, 0, 0) === today
      );

      const clicks = referrals.length;
      const conversions = referrals.filter(r => r.converted).length;
      const totalEarnings = referrals.reduce((sum, r) => sum + (r.earnings || 0), 0);
      const todayEarnings = todayRefs.reduce((sum, r) => sum + (r.earnings || 0), 0);

      setStats({
        todayEarnings,
        totalPending: totalEarnings * 0.7,
        balance: totalEarnings * 0.3,
        clicks,
        conversions
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-white/10">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-400 text-xs">Today's Earnings</h3>
                <TrendingUp className="w-3 h-3 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                ${stats.todayEarnings.toFixed(2)}
              </div>
              {kasPrice && (
                <p className="text-xs text-cyan-400">
                  ≈ {(stats.todayEarnings / kasPrice).toFixed(2)} KAS
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-white/10">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-400 text-xs">Total Pending</h3>
                <DollarSign className="w-3 h-3 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                ${stats.totalPending.toFixed(2)}
              </div>
              {kasPrice && (
                <p className="text-xs text-cyan-400">
                  ≈ {(stats.totalPending / kasPrice).toFixed(2)} KAS
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-white/10">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-400 text-xs">Balance</h3>
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                ${stats.balance.toFixed(2)}
              </div>
              {kasPrice && (
                <p className="text-xs text-cyan-400">
                  ≈ {(stats.balance / kasPrice).toFixed(2)} KAS
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Card className="bg-zinc-900 border-white/10">
            <CardContent className="p-4">
              <div className="text-gray-400 text-xs mb-1">Clicks</div>
              <div className="text-xl font-bold text-white">{stats.clicks}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-white/10">
            <CardContent className="p-4">
              <div className="text-gray-400 text-xs mb-1">Conversions</div>
              <div className="text-xl font-bold text-white">{stats.conversions}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}