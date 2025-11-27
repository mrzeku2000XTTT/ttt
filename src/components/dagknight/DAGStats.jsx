import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Zap, Network, Shield, Activity } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DAGStats({ dagStatus, verifications }) {
  const [historicalData, setHistoricalData] = useState([]);
  const [trends, setTrends] = useState({
    blueScore: 0,
    dagDepth: 0,
    crossVerifications: 0
  });

  useEffect(() => {
    calculateHistoricalData();
  }, [verifications]);

  const calculateHistoricalData = () => {
    if (!verifications || verifications.length === 0) {
      setHistoricalData([]);
      return;
    }

    // Group verifications by date
    const dataByDate = {};
    
    verifications.forEach(v => {
      const date = new Date(v.timestamp).toLocaleDateString();
      if (!dataByDate[date]) {
        dataByDate[date] = {
          date,
          verifications: 0,
          blueScore: 0,
          dagDepth: 0,
          crossVerifications: 0
        };
      }
      
      dataByDate[date].verifications += 1;
      dataByDate[date].blueScore += (v.blue_score || 0);
      dataByDate[date].dagDepth = Math.max(dataByDate[date].dagDepth, v.dag_depth || 0);
      if (v.verified_by && v.verified_by.length > 0) {
        dataByDate[date].crossVerifications += 1;
      }
    });

    const historical = Object.values(dataByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    setHistoricalData(historical);

    // Calculate trends
    if (historical.length >= 2) {
      const current = historical[historical.length - 1];
      const previous = historical[historical.length - 2];
      
      setTrends({
        blueScore: current.blueScore - previous.blueScore,
        dagDepth: current.dagDepth - previous.dagDepth,
        crossVerifications: current.crossVerifications - previous.crossVerifications
      });
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, trend }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      const duration = 1000;
      const steps = 20;
      const increment = value / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, [value]);

    const getTrendIcon = () => {
      if (trend > 0) return <TrendingUp className="w-3 h-3 text-green-400" />;
      if (trend < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
      return null;
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-zinc-950 to-zinc-900 border-zinc-800 overflow-hidden relative group">
          <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              {trend !== 0 && (
                <Badge variant="outline" className={`${trend > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                  <div className="flex items-center gap-1">
                    {getTrendIcon()}
                    <span className="text-xs font-semibold">{Math.abs(trend)}</span>
                  </div>
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{label}</div>
            <motion.div 
              className="text-3xl font-bold text-white"
              key={displayValue}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {displayValue}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-xs text-gray-400 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-300">{entry.name}:</span>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Shield}
          label="Verifications"
          value={dagStatus.totalVerifications}
          color="from-purple-500 to-pink-500"
          trend={trends.blueScore}
        />
        <StatCard
          icon={Zap}
          label="Blue Score"
          value={dagStatus.blueScore}
          color="from-cyan-500 to-blue-500"
          trend={trends.blueScore}
        />
        <StatCard
          icon={Network}
          label="DAG Depth"
          value={dagStatus.dagDepth}
          color="from-violet-500 to-purple-500"
          trend={trends.dagDepth}
        />
        <StatCard
          icon={Activity}
          label="Cross-Verified"
          value={dagStatus.crossVerifications}
          color="from-pink-500 to-rose-500"
          trend={trends.crossVerifications}
        />
      </div>

      {/* Charts */}
      {historicalData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-black border-zinc-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Verification Trends
              </h3>
              
              {/* Blue Score Chart */}
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">Blue Score Over Time</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="blueScoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="blueScore" 
                      stroke="#06b6d4" 
                      fillOpacity={1} 
                      fill="url(#blueScoreGradient)"
                      strokeWidth={2}
                      name="Blue Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* DAG Depth & Cross-Verifications Chart */}
              <div>
                <div className="text-sm text-gray-400 mb-3">DAG Metrics Over Time</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="dagDepth" 
                      stroke="#a855f7" 
                      strokeWidth={3}
                      dot={{ fill: '#a855f7', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="DAG Depth"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="crossVerifications" 
                      stroke="#ec4899" 
                      strokeWidth={3}
                      dot={{ fill: '#ec4899', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Cross-Verifications"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Real-time Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-green-400 rounded-full"
        />
        <span>Real-time updates active</span>
      </div>
    </div>
  );
}