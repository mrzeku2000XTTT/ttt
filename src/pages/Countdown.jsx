import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, Target, Activity, ChevronRight, Trophy, Flame
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BackgroundLogo from "../components/BackgroundLogo";

// 72-Hour Challenge: November 4-7, 2025 (12:00 AM to 12:00 AM)
const CHALLENGE_START = new Date('2025-11-04T00:00:00Z');
const CHALLENGE_END = new Date('2025-11-07T00:00:00Z');

// Kaspa Birthday: November 7, 2025
const BIRTHDAY_DATE = new Date('2025-11-07T00:00:00Z');

const GOAL = 1000000000;

export default function CountdownPage() {
  const [user, setUser] = useState(null);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [challengeCountdown, setChallengeCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [birthdayCountdown, setBirthdayCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [globalRate, setGlobalRate] = useState(0);
  const [isChallengeActive, setIsChallengeActive] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(updateCountdowns, 1000);
    const dataInterval = setInterval(loadGlobalStats, 3000);
    return () => {
      clearInterval(interval);
      clearInterval(dataInterval);
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me().catch(() => null);
      setUser(currentUser);
      await loadGlobalStats();
      updateCountdowns();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGlobalStats = async () => {
    try {
      const transactions = await base44.entities.GlobalTransaction.list('-updated_date', 10000);
      const count = transactions.length;
      const volume = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      const now = Date.now();
      const recentTxs = transactions.filter(tx => {
        const txTime = new Date(tx.timestamp).getTime();
        return (now - txTime) < 60000;
      });
      setGlobalRate(recentTxs.length);

      setTotalTransactions(count);
      setTotalVolume(volume);
      setRecentActivity(transactions.slice(0, 10));

      const addressMap = {};
      transactions.forEach(tx => {
        if (tx.from_address) {
          addressMap[tx.from_address] = (addressMap[tx.from_address] || 0) + 1;
        }
      });

      const leaders = Object.entries(addressMap)
        .map(([address, count]) => ({ address, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setLeaderboard(leaders);
    } catch (error) {
      console.error('Failed to load global stats:', error);
    }
  };

  const updateCountdowns = () => {
    const now = new Date();
    
    // Check if challenge is active
    const challengeActive = now >= CHALLENGE_START && now < CHALLENGE_END;
    setIsChallengeActive(challengeActive);
    
    // Challenge countdown (to start or end)
    const challengeTarget = now < CHALLENGE_START ? CHALLENGE_START : CHALLENGE_END;
    const challengeDiff = challengeTarget.getTime() - now.getTime();

    if (challengeDiff <= 0) {
      setChallengeCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    } else {
      const days = Math.floor(challengeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((challengeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((challengeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((challengeDiff % (1000 * 60)) / 1000);
      setChallengeCountdown({ days, hours, minutes, seconds });
    }

    // Birthday countdown
    const birthdayDiff = BIRTHDAY_DATE.getTime() - now.getTime();

    if (birthdayDiff <= 0) {
      setBirthdayCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    } else {
      const days = Math.floor(birthdayDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((birthdayDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((birthdayDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((birthdayDiff % (1000 * 60)) / 1000);
      setBirthdayCountdown({ days, hours, minutes, seconds });
    }
  };

  const percentage = ((totalTransactions / GOAL) * 100).toFixed(8);
  const remainingToGoal = GOAL - totalTransactions;

  const handleContributorClick = (address) => {
    // Navigate to a page showing only this address's transactions
    window.location.href = createPageUrl("ContributorHistory") + `?address=${encodeURIComponent(address)}`;
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            }}
            transition={{
              duration: 10 + Math.random() * 20,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>

      <BackgroundLogo text="TTT" opacity={0.03} strokeColor="rgba(255, 255, 255, 0.1)" animated={true} />

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 backdrop-blur-xl border rounded-2xl flex items-center justify-center ${
                  isChallengeActive 
                    ? 'bg-orange-500/20 border-orange-500/30' 
                    : 'bg-white/5 border-white/10'
                }`}>
                  {isChallengeActive ? (
                    <Flame className="w-8 h-8 text-orange-400 animate-pulse" strokeWidth={1.5} />
                  ) : (
                    <Clock className="w-8 h-8 text-white/60" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <h1 className={`text-4xl md:text-6xl font-black tracking-tight ${
                    isChallengeActive ? 'text-orange-400' : 'text-white'
                  }`}>
                    {isChallengeActive ? '72-HOUR CHALLENGE' : '72-HOUR CHALLENGE'}
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base">
                    {isChallengeActive 
                      ? 'November 4-7, 2025 • LIVE NOW 🔥' 
                      : 'November 4-7, 2025 • Starts Soon'}
                  </p>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-6 py-3">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                  <div>
                    <div className="text-xs text-gray-600">Live Rate</div>
                    <div className="text-lg font-bold text-white">{globalRate} TX/min</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Birthday Countdown */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-sm font-semibold text-white">Kaspa Birthday</div>
                      <div className="text-xs text-gray-500">November 7, 2025</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-center px-3 py-1 bg-white/5 rounded">
                      <div className="text-lg font-bold text-white">{birthdayCountdown.days}</div>
                      <div className="text-[8px] text-gray-500">DAYS</div>
                    </div>
                    <div className="text-center px-3 py-1 bg-white/5 rounded">
                      <div className="text-lg font-bold text-white">{birthdayCountdown.hours}</div>
                      <div className="text-[8px] text-gray-500">HRS</div>
                    </div>
                    <div className="text-center px-3 py-1 bg-white/5 rounded">
                      <div className="text-lg font-bold text-white">{birthdayCountdown.minutes}</div>
                      <div className="text-[8px] text-gray-500">MIN</div>
                    </div>
                    <div className="text-center px-3 py-1 bg-white/5 rounded">
                      <div className="text-lg font-bold text-white">{birthdayCountdown.seconds}</div>
                      <div className="text-[8px] text-gray-500">SEC</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* 72-Hour Challenge Countdown */}
              <Card className={`backdrop-blur-xl border ${
                isChallengeActive 
                  ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30' 
                  : 'bg-white/5 border-white/10'
              }`}>
                <CardContent className="p-6 md:p-8">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {isChallengeActive ? (
                        <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                      ) : (
                        <Clock className="w-6 h-6 text-white/60" />
                      )}
                      <h2 className={`text-2xl font-bold ${isChallengeActive ? 'text-orange-400' : 'text-white'}`}>
                        {isChallengeActive ? 'Challenge Ends In' : 'Challenge Starts In'}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 md:gap-4">
                    {[
                      { value: challengeCountdown.days, label: "Days" },
                      { value: challengeCountdown.hours, label: "Hours" },
                      { value: challengeCountdown.minutes, label: "Minutes" },
                      { value: challengeCountdown.seconds, label: "Seconds" }
                    ].map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <div className={`backdrop-blur-xl rounded-2xl p-4 md:p-6 text-center transition-all ${
                          isChallengeActive 
                            ? 'bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30' 
                            : 'bg-white/5 border border-white/10 hover:bg-white/[0.07]'
                        }`}>
                          <motion.div
                            key={item.value}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`text-4xl md:text-6xl font-black mb-2 ${
                              isChallengeActive ? 'text-orange-400' : 'text-white'
                            }`}
                          >
                            {String(item.value).padStart(2, '0')}
                          </motion.div>
                          <div className="text-xs md:text-sm text-gray-600 uppercase tracking-wider">{item.label}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Goal Progress */}
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6 md:p-8">
                  <div className="text-center mb-8">
                    <div className="text-sm text-gray-600 uppercase tracking-wider mb-2">ULTIMATE GOAL</div>
                    <div className="text-7xl md:text-9xl font-black text-white mb-2">1B</div>
                    <div className="text-xl text-gray-600">TRANSACTIONS FOR KASPA BIRTHDAY</div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-white/60" strokeWidth={1.5} />
                      <h2 className="text-2xl font-bold text-white">Progress</h2>
                    </div>
                    <div className="text-2xl font-bold text-white">{percentage}%</div>
                  </div>

                  <div className="relative mb-8">
                    <div className="h-10 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-white/20 relative overflow-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                        <span className="text-sm text-gray-600">Current Total</span>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{totalTransactions.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Transactions</div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                        <span className="text-sm text-gray-600">Total Volume</span>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{totalVolume.toFixed(2)}</div>
                      <div className="text-xs text-gray-600">KAS</div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                        <span className="text-sm text-gray-600">Remaining</span>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{remainingToGoal.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">To Goal</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Leaderboard */}
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-white/60" strokeWidth={1.5} />
                    <h3 className="text-xl font-bold text-white">Top Contributors</h3>
                  </div>

                  <div className="space-y-3">
                    {leaderboard.map((leader, i) => (
                      <button
                        key={i}
                        onClick={() => handleContributorClick(leader.address)}
                        className="w-full backdrop-blur-xl bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/[0.07] transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center font-bold text-white text-sm">
                              #{i + 1}
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-mono text-white">{leader.address}</div>
                              <div className="text-xs text-gray-600">{leader.count} transactions</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA Card */}
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-white/60 mx-auto mb-4" strokeWidth={1.5} />
                    <h3 className="text-xl font-bold text-white mb-2">Join the Challenge!</h3>
                    <p className="text-gray-600 text-sm mb-6">
                      Make transactions and help reach 1 billion for Kaspa's Birthday
                    </p>
                    <Link to={createPageUrl("Bridge")}>
                      <Button className="w-full backdrop-blur-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20">
                        Start Transacting
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}