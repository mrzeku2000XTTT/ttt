import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles, Brain, Zap, Shield, Users, TrendingUp, Target, Rocket, Briefcase, Trophy, Eye, Wallet, Network, Server, Truck, Radio, Sparkle, ThumbsUp, BarChart3, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function SingularityPage() {
  const [isHovered, setIsHovered] = React.useState(false);
  const [transactions, setTransactions] = React.useState([]);
  const [activeSection, setActiveSection] = React.useState('apps');
  const [expandedPhase, setExpandedPhase] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [showVoteModal, setShowVoteModal] = React.useState(false);
  const [votes, setVotes] = React.useState({});
  const [userVotes, setUserVotes] = React.useState({});
  
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        console.log("User not logged in");
      }
    };
    
    const fetchTransactions = async () => {
      try {
        const response = await base44.functions.invoke('getLiveKaspaTransactions');
        if (response.data?.transactions) {
          setTransactions(response.data.transactions);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    };

    const loadVotes = async () => {
      try {
        const allVotes = await base44.entities.AppVote.list();
        const voteCounts = {};
        const myVotes = {};
        
        allVotes.forEach(vote => {
          if (!voteCounts[vote.app_name]) {
            voteCounts[vote.app_name] = 0;
          }
          voteCounts[vote.app_name] += vote.vote_type === 'upvote' ? 1 : -1;
          
          if (user && vote.user_email === user.email) {
            myVotes[vote.app_name] = vote;
          }
        });
        
        setVotes(voteCounts);
        setUserVotes(myVotes);
      } catch (err) {
        console.error('Failed to load votes:', err);
      }
    };
    
    loadUser();
    fetchTransactions();
    loadVotes();
    const interval = setInterval(fetchTransactions, 10000);
    
    return () => clearInterval(interval);
  }, [user]);
  
  const isAdmin = user && user.role === 'admin';

  const handleVote = async (appName) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    try {
      const existingVote = userVotes[appName];
      
      if (existingVote) {
        await base44.entities.AppVote.delete(existingVote.id);
        setUserVotes(prev => {
          const updated = {...prev};
          delete updated[appName];
          return updated;
        });
        setVotes(prev => ({...prev, [appName]: (prev[appName] || 0) - 1}));
      } else {
        const newVote = await base44.entities.AppVote.create({
          app_name: appName,
          user_email: user.email,
          vote_type: 'upvote'
        });
        setUserVotes(prev => ({...prev, [appName]: newVote}));
        setVotes(prev => ({...prev, [appName]: (prev[appName] || 0) + 1}));
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const apps = [
    {
      name: "Proof of Bullish",
      description: "Show your conviction with proof",
      icon: Flame,
      gradient: "from-orange-500 to-red-500",
      path: "ProofOfBullish"
    },
    {
      name: "Link Checker",
      description: "AI-powered scam & phishing detection",
      icon: Shield,
      gradient: "from-blue-500 to-cyan-500",
      path: "LinkChecker"
    },
    {
      name: "Register Business",
      description: "Register your business on Kaspa",
      icon: Briefcase,
      gradient: "from-purple-500 to-pink-500",
      path: "RegisterBusiness"
    },
    {
      name: "Kaspa TTT",
      description: "Full Kaspa business platform",
      icon: Zap,
      gradient: "from-cyan-500 to-blue-500",
      path: "KaspaTTT"
    },
    {
      name: "Champions",
      description: "Zeku AI Agents platform",
      icon: Trophy,
      gradient: "from-yellow-500 to-orange-500",
      path: "Champions"
    },
    {
      name: "Matrix",
      description: "Advanced AI matrix platform",
      icon: Brain,
      gradient: "from-green-500 to-emerald-500",
      path: "Matrix"
    },
    {
      name: "NASA",
      description: "NASA Eyes on the Solar System",
      icon: Rocket,
      gradient: "from-blue-600 to-indigo-600",
      path: "NASA"
    },
    {
      name: "Kaspa Local",
      description: "Local Kaspa network tools",
      icon: Server,
      gradient: "from-cyan-500 to-teal-500",
      path: "KaspaLocal"
    },
    {
      name: "Cosmic Eye",
      description: "Cosmic vision and insights",
      icon: Eye,
      gradient: "from-indigo-500 to-purple-500",
      path: "CosmicEye"
    },
    {
      name: "Cargo Ways",
      description: "Logistics and transport platform",
      icon: Truck,
      gradient: "from-orange-500 to-amber-500",
      path: "CargoWays"
    },
    {
      name: "Echo",
      description: "Echo communication platform",
      icon: Radio,
      gradient: "from-green-500 to-emerald-500",
      path: "Echo"
    },
    {
      name: "Aura Dashboard",
      description: "Advanced analytics dashboard",
      icon: Sparkles,
      gradient: "from-violet-500 to-purple-500",
      path: "AuraDashboard"
    },
    {
      name: "TTT ENERGY",
      description: "Peer-to-peer energy network",
      icon: Zap,
      gradient: "from-yellow-500 to-orange-500",
      path: "TTTClassic",
      adminOnly: true
    },
    {
      name: "Veritas",
      description: "The Veritas Project",
      icon: Eye,
      gradient: "from-violet-500 to-purple-500",
      path: "Veritas",
      adminOnly: true
    },
    {
      name: "Transport Protocol",
      description: "Trustless transport network",
      icon: Network,
      gradient: "from-blue-500 to-indigo-500",
      path: "TransportProtocol",
      adminOnly: true
    }
  ];
  
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/30 via-black to-blue-900/25" />
      
      {/* Animated Grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>
      
      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Advanced 3D Atom Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center" style={{ perspective: '1200px' }}>
        <motion.div 
          className="relative w-[800px] h-[800px]"
          animate={{ rotateY: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Central Glow - Multiple Layers */}
          <div className="absolute left-1/2 top-1/2 -ml-40 -mt-40 w-80 h-80 bg-gradient-radial from-blue-500/35 via-blue-600/25 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute left-1/2 top-1/2 -ml-32 -mt-32 w-64 h-64 bg-gradient-radial from-blue-400/30 via-blue-500/20 to-transparent rounded-full blur-2xl" style={{ animationDelay: '1s' }} />
          
          {/* Complex Nucleus - Multiple Particles with 3D effect */}
          <div 
            className="absolute left-1/2 top-1/2 -ml-20 -mt-20 w-40 h-40 cursor-pointer" 
            style={{ transform: 'translateZ(0px)' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Core glow */}
            <motion.div 
              animate={{ 
                scale: isHovered ? 1.5 : 1,
                opacity: isHovered ? 0.3 : 0.5
              }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-br from-blue-400/50 via-blue-500/50 to-blue-600/50 rounded-full blur-3xl animate-pulse" 
            />
            
            {/* Protons (red/pink) with depth */}
            {[
              { x: 0, y: 0, z: 0, size: 18 },
              { x: 20, y: 10, z: 15, size: 16 },
              { x: -15, y: 12, z: -10, size: 17 },
              { x: 10, y: -18, z: 12, size: 15 },
              { x: -12, y: -10, z: -8, size: 16 },
              { x: 22, y: -8, z: 5, size: 14 },
              { x: -18, y: 15, z: 18, size: 15 },
              { x: 8, y: 20, z: -15, size: 14 }
            ].map((particle, i) => (
              <motion.div
                key={`proton-${i}`}
                animate={{ 
                  scale: isHovered ? [1.2, 1.4, 1.2] : [1, 1.2, 1],
                  rotateZ: [0, 360],
                  x: isHovered ? particle.x * 2.5 : particle.x,
                  y: isHovered ? particle.y * 2.5 : particle.y
                }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  marginLeft: -particle.size / 2,
                  marginTop: -particle.size / 2,
                  transform: `translateZ(${particle.z}px)`,
                  background: 'radial-gradient(circle at 35% 35%, rgba(255, 182, 193, 1), rgba(251, 146, 146, 0.95) 25%, rgba(239, 68, 68, 0.85) 50%, rgba(220, 38, 38, 0.8) 75%, rgba(153, 27, 27, 0.9))',
                  boxShadow: `
                    0 0 30px rgba(236, 72, 153, 0.8),
                    0 0 15px rgba(239, 68, 68, 0.6),
                    inset -4px -4px 12px rgba(0, 0, 0, 0.5),
                    inset 4px 4px 12px rgba(255, 255, 255, 0.4),
                    inset -1px -1px 6px rgba(153, 27, 27, 0.8),
                    inset 2px 2px 8px rgba(255, 182, 193, 0.6)
                  `
                }}
              />
            ))}
            
            {/* Neutrons (blue) with depth */}
            {[
              { x: 8, y: 15, z: -12, size: 17 },
              { x: -20, y: -5, z: 10, size: 16 },
              { x: 15, y: -12, z: -15, size: 15 },
              { x: -10, y: 20, z: 8, size: 16 },
              { x: 18, y: 3, z: -5, size: 14 },
              { x: -8, y: -15, z: 15, size: 15 },
              { x: -22, y: 8, z: -18, size: 14 },
              { x: 12, y: -20, z: 10, size: 15 }
            ].map((particle, i) => (
              <motion.div
                key={`neutron-${i}`}
                animate={{ 
                  scale: isHovered ? [1.25, 1.5, 1.25] : [1, 1.25, 1],
                  rotateZ: [360, 0],
                  x: isHovered ? particle.x * 2.5 : particle.x,
                  y: isHovered ? particle.y * 2.5 : particle.y
                }}
                transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.3 }}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  marginLeft: -particle.size / 2,
                  marginTop: -particle.size / 2,
                  transform: `translateZ(${particle.z}px)`,
                  background: 'radial-gradient(circle at 35% 35%, rgba(224, 242, 254, 1), rgba(147, 197, 253, 0.95) 25%, rgba(59, 130, 246, 0.85) 50%, rgba(29, 78, 216, 0.8) 75%, rgba(30, 58, 138, 0.9))',
                  boxShadow: `
                    0 0 30px rgba(6, 182, 212, 0.8),
                    0 0 15px rgba(59, 130, 246, 0.6),
                    inset -4px -4px 12px rgba(0, 0, 0, 0.5),
                    inset 4px 4px 12px rgba(255, 255, 255, 0.4),
                    inset -1px -1px 6px rgba(30, 58, 138, 0.8),
                    inset 2px 2px 8px rgba(224, 242, 254, 0.6)
                  `
                }}
              />
            ))}
          </div>

          {/* Energy Rings with 3D depth */}
          {[
            { size: 180, opacity: 0.4, z: 20 },
            { size: 240, opacity: 0.3, z: 0 },
            { size: 300, opacity: 0.2, z: -20 }
          ].map((ring, i) => (
            <motion.div
              key={`ring-${i}`}
              animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [ring.opacity, ring.opacity * 0.3, ring.opacity],
                rotateZ: [0, 360]
              }}
              transition={{ duration: 4 + i * 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 border-2 border-blue-400/35 rounded-full"
              style={{
                width: ring.size,
                height: ring.size,
                marginLeft: -ring.size / 2,
                marginTop: -ring.size / 2,
                transform: `translateZ(${ring.z}px)`,
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.35)'
              }}
            />
          ))}

          {/* Orbital rings with electrons - Enhanced 3D */}
          {[
            { size: 350, duration: 5, rotateX: 75, rotateY: 0, rotateZ: 0, color: '#3b82f6', electronSize: 8 },
            { size: 450, duration: 8, rotateX: 60, rotateY: 30, rotateZ: 45, color: '#2563eb', electronSize: 7 },
            { size: 550, duration: 11, rotateX: 80, rotateY: -45, rotateZ: -30, color: '#1d4ed8', electronSize: 9 },
            { size: 400, duration: 6.5, rotateX: 45, rotateY: 60, rotateZ: 90, color: '#60a5fa', electronSize: 7 },
            { size: 500, duration: 9.5, rotateX: 70, rotateY: -60, rotateZ: -60, color: '#3b82f6', electronSize: 8 },
            { size: 600, duration: 13, rotateX: 85, rotateY: 20, rotateZ: 20, color: '#1e40af', electronSize: 9 },
            { size: 480, duration: 10, rotateX: 55, rotateY: -30, rotateZ: 75, color: '#93c5fd', electronSize: 7 }
          ].map((orbit, i) => (
            <div
              key={`orbit-${i}`}
              className="absolute left-1/2 top-1/2"
              style={{
                width: orbit.size,
                height: orbit.size,
                marginLeft: -orbit.size / 2,
                marginTop: -orbit.size / 2,
                transform: `rotateX(${orbit.rotateX}deg) rotateY(${orbit.rotateY}deg) rotateZ(${orbit.rotateZ}deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              <motion.div
                animate={{ rotateZ: 360 }}
                transition={{
                  duration: orbit.duration,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Orbit path with gradient */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: `2px solid ${orbit.color}40`,
                    boxShadow: `0 0 20px ${orbit.color}30, inset 0 0 20px ${orbit.color}20`
                  }}
                />
                {/* Electron */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: orbit.electronSize,
                    height: orbit.electronSize,
                    top: -orbit.electronSize / 2,
                    left: '50%',
                    marginLeft: -orbit.electronSize / 2,
                    background: `radial-gradient(circle at 30% 30%, ${orbit.color}ff, ${orbit.color}cc)`,
                    boxShadow: `0 0 25px ${orbit.color}, 0 0 40px ${orbit.color}80, inset -1px -1px 4px rgba(0, 0, 0, 0.3), inset 1px 1px 4px rgba(255, 255, 255, 0.5)`,
                    transform: 'translateZ(10px)'
                  }}
                />
                {/* Electron trail */}
                <motion.div
                  animate={{ opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute rounded-full"
                  style={{
                    width: orbit.electronSize * 1.5,
                    height: orbit.electronSize * 1.5,
                    top: -orbit.electronSize * 0.75,
                    left: '50%',
                    marginLeft: -orbit.electronSize * 0.75,
                    background: `radial-gradient(circle, ${orbit.color}60, transparent)`,
                    transform: 'translateZ(5px)'
                  }}
                />
              </motion.div>
            </div>
          ))}

          {/* Live Kaspa Transactions as Particles */}
          {transactions.map((tx, i) => {
            const randomX = Math.random() * 600 - 300;
            const randomY = Math.random() * 600 - 300;
            const randomZ = Math.random() * 200 - 100;

            // Color based on transaction amount
            const getColor = (amount) => {
              if (amount > 500) return '#10b981'; // Green for large
              if (amount > 100) return '#06b6d4'; // Cyan for medium
              if (amount > 10) return '#8b5cf6'; // Purple for small
              return '#ec4899'; // Pink for tiny
            };

            const color = getColor(tx.amount);
            const size = Math.min(2 + (tx.amount / 100), 8);

            return (
              <motion.div
                key={`tx-${tx.hash}-${i}`}
                animate={{
                  x: [randomX, -randomX, randomX],
                  y: [randomY, -randomY, randomY],
                  scale: [0.5, 1.5, 0.5],
                  opacity: [0.2, 1, 0.2]
                }}
                transition={{
                  duration: 10 + Math.random() * 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
                className="absolute left-1/2 top-1/2 rounded-full cursor-pointer group"
                style={{
                  width: size,
                  height: size,
                  background: color,
                  boxShadow: `0 0 15px ${color}`,
                  transform: `translateZ(${randomZ}px)`
                }}
                title={`${tx.amount.toFixed(2)} KAS`}
              >
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            );
          })}

          {/* Electromagnetic field lines */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30);
            return (
              <motion.div
                key={`field-${i}`}
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  scale: [0.95, 1.05, 0.95]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: "easeInOut"
                }}
                className="absolute left-1/2 top-1/2 origin-center"
                style={{
                  width: 2,
                  height: 400,
                  marginLeft: -1,
                  marginTop: -200,
                  background: `linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.25), transparent)`,
                  transform: `rotateZ(${angle}deg) rotateX(80deg)`,
                  transformStyle: 'preserve-3d'
                }}
              />
            );
          })}
          </motion.div>
          </div>


      
      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="mb-6">
            <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 tracking-tighter mb-2">
              TTT
            </h1>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white/90 tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
            Singularity
          </h2>
          <p className="text-white/50 text-xl">Experimental Apps & Features</p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-8 bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10"
        >
          <button
            onClick={() => setActiveSection('apps')}
            className={`px-6 py-3 rounded-xl transition-all font-semibold ${
              activeSection === 'apps'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Brain className="w-4 h-4 inline-block mr-2" />
            Apps
          </button>
          <button
            onClick={() => setActiveSection('dao')}
            className={`px-6 py-3 rounded-xl transition-all font-semibold ${
              activeSection === 'dao'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            DAO Governance
          </button>
          <button
            onClick={() => setActiveSection('roadmap')}
            className={`px-6 py-3 rounded-xl transition-all font-semibold ${
              activeSection === 'roadmap'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Rocket className="w-4 h-4 inline-block mr-2" />
            Roadmap
          </button>
        </motion.div>

        {/* Vote Button */}
        {activeSection === 'apps' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowVoteModal(true)}
            className="mb-6 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 text-white font-semibold"
          >
            <BarChart3 className="w-5 h-5" />
            Community Votes
          </motion.button>
        )}

        {/* Apps Section */}
        {activeSection === 'apps' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {apps.filter(app => !app.adminOnly || isAdmin).map((app, i) => {
            const Icon = app.icon;
            const content = (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={app.path ? { y: -8, scale: 1.02 } : {}}
                className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${
                  app.path ? 'cursor-pointer' : 'opacity-50'
                } transition-all duration-300 group`}
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  borderColor: 'rgba(255,255,255,0.05)'
                }}
              >
                {/* Subtle hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative p-8 flex flex-col items-center text-center">
                  {/* Minimal icon */}
                  <div className="mb-6">
                    <Icon className="w-16 h-16 text-white/40 group-hover:text-white/80 transition-colors duration-300" />
                  </div>

                  <h3 className="text-xl font-bold text-white/90 mb-2 group-hover:text-white transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/60 transition-colors">
                    {app.description}
                  </p>

                  {!app.path && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-xs text-white/30">
                      <Sparkles className="w-3 h-3" />
                      Coming Soon
                    </div>
                  )}

                  {app.path && (
                    <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/40 group-hover:text-white/80 transition-colors font-medium">
                      Launch
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </div>
                  )}
                </div>
              </motion.div>
            );

            return app.path ? (
              <Link key={i} to={createPageUrl(app.path)}>
                {content}
              </Link>
            ) : (
              <div key={i}>{content}</div>
            );
          })}
          </div>
        )}

        {/* DAO Governance Section */}
        {activeSection === 'dao' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-blue-400" />
                <h3 className="text-3xl font-bold text-white">DAO Governance</h3>
              </div>
              <p className="text-white/60 mb-6 leading-relaxed">
                TTT is transitioning to a community-driven DAO (Decentralized Autonomous Organization). 
                Our governance model empowers holders to shape the future of the platform through on-chain voting.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-black/40 rounded-xl p-6 border border-white/5">
                  <Target className="w-6 h-6 text-cyan-400 mb-3" />
                  <h4 className="text-xl font-bold text-white mb-2">Governance Token</h4>
                  <p className="text-white/50 text-sm mb-3">
                    TTT token holders can participate in governance decisions, including feature proposals, 
                    treasury allocation, and protocol upgrades.
                  </p>
                  <div className="text-cyan-400 text-xs font-semibold">Coming Q2 2026</div>
                </div>

                <div className="bg-black/40 rounded-xl p-6 border border-white/5">
                  <TrendingUp className="w-6 h-6 text-blue-400 mb-3" />
                  <h4 className="text-xl font-bold text-white mb-2">Proposal System</h4>
                  <p className="text-white/50 text-sm mb-3">
                    Any holder can submit governance proposals. Proposals require community approval 
                    before implementation through transparent on-chain voting.
                  </p>
                  <div className="text-blue-400 text-xs font-semibold">Beta Testing</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/20">
                <h4 className="text-lg font-bold text-white mb-3">Governance Principles</h4>
                <ul className="space-y-2 text-white/60 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span><strong className="text-white">Transparency:</strong> All proposals and votes are publicly visible on-chain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span><strong className="text-white">Decentralization:</strong> No single entity controls governance decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span><strong className="text-white">Community-First:</strong> Token holders drive platform evolution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span><strong className="text-white">Fair Voting:</strong> One token = one vote, preventing concentration of power</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Roadmap Section */}
        {activeSection === 'roadmap' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-8">
                <Rocket className="w-8 h-8 text-blue-400" />
                <h3 className="text-3xl font-bold text-white">Development Roadmap</h3>
              </div>

              <div className="space-y-8">
                {/* Nov 2025 - Mar 2026 */}
                <div className="relative pl-8 border-l-2 border-blue-500/30">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
                  <button 
                    onClick={() => setExpandedPhase(expandedPhase === 'phase1' ? null : 'phase1')}
                    className="w-full text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="mb-1 text-sm text-blue-400 font-semibold flex items-center gap-2">
                      Nov 2025 - Mar 2026
                      <span className="text-xs">{expandedPhase === 'phase1' ? '▼' : '▶'}</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3">Foundation & Core Features</h4>
                  </button>
                  <p className="text-white/40 text-xs mb-2">App Launch: November 7, 2025</p>
                  
                  {expandedPhase === 'phase1' ? (
                    <div className="space-y-4 mt-4">
                      <div className="bg-black/20 rounded-lg p-3 border border-blue-500/10">
                        <div className="text-blue-300 text-xs font-bold mb-2">November 2025</div>
                        <ul className="space-y-1 text-white/60 text-xs">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-400 rounded-full" />
                            Platform launch & user onboarding
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-400 rounded-full" />
                            Core wallet integration
                          </li>
                        </ul>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3 border border-blue-500/10">
                        <div className="text-blue-300 text-xs font-bold mb-2">December 2025</div>
                        <ul className="space-y-1 text-white/60 text-xs">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-400 rounded-full" />
                            Bridge L1/L2 infrastructure complete
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-400 rounded-full" />
                            Security audits & testing
                          </li>
                        </ul>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3 border border-blue-500/10">
                        <div className="text-blue-300 text-xs font-bold mb-2">January 2026</div>
                        <ul className="space-y-1 text-white/60 text-xs">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-400 rounded-full" />
                            Agent ZK beta launch
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                            Community feedback integration
                          </li>
                        </ul>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3 border border-blue-500/10">
                        <div className="text-blue-300 text-xs font-bold mb-2">February 2026</div>
                        <ul className="space-y-1 text-white/60 text-xs">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                            Bull Moon tracker expansion
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                            Mobile optimization
                          </li>
                        </ul>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3 border border-blue-500/10">
                        <div className="text-blue-300 text-xs font-bold mb-2">March 2026</div>
                        <ul className="space-y-1 text-white/60 text-xs">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-white/30 rounded-full" />
                            Performance optimizations
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-white/30 rounded-full" />
                            Preparation for DAO launch
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-2 text-white/60 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        Bridge infrastructure for L1/L2 transfers
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        TTT Wallet integration with Kasware
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        Agent ZK profile system
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                        Bull Moon eclipse tracker (In Progress)
                      </li>
                    </ul>
                  )}
                </div>

                {/* Apr - Jun 2026 */}
                <div className="relative pl-8 border-l-2 border-cyan-500/30">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" />
                  <button 
                    onClick={() => setExpandedPhase(expandedPhase === 'phase2' ? null : 'phase2')}
                    className="w-full text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="mb-1 text-sm text-cyan-400 font-semibold flex items-center gap-2">
                      Apr - Jun 2026
                      <span className="text-xs">{expandedPhase === 'phase2' ? '▼' : '▶'}</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3">DAO & Governance</h4>
                  </button>
                  
                  {expandedPhase === 'phase2' ? (
                    <div className="space-y-4 mt-4">
                      <div className="bg-black/20 rounded-lg p-3 border border-cyan-500/10">
                        <div className="text-cyan-300 text-xs font-bold mb-2">April 2026</div>
                        <ul className="space-y-1 text-white/60 text-xs">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-white/30 rounded-full" />
                            TTT token smart contract deployment
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-white/30 rounded-full" />
                            Initial token distribution
                          </li>
                        </ul>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3 border border-cyan-500/10">
                        <div className="text-cyan-300 text-xs font-bold mb-2">May 2026</div>
                        <ul className="space-y-1 text-white/60 text-xs">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-white/30 rounded-full" />
                            Voting system implementation
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-white/30 rounded-full" />
                            Community proposal portal launch
                          </li>
                        </ul>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3 border border-cyan-500/10">
                        <div className="text-cyan-300 text-xs font-bold mb-2">June 2026</div>
                        <ul className="space-y-1 text-white/60 text-xs">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-white/30 rounded-full" />
                            Treasury dashboard live
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-white/30 rounded-full" />
                            First community governance votes
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-2 text-white/60 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                        TTT governance token launch
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                        On-chain voting system implementation
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                        Community proposal portal
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                        Treasury dashboard and transparency tools
                      </li>
                    </ul>
                  )}
                </div>

                {/* Jul - Sep 2026 */}
                <div className="relative pl-8 border-l-2 border-purple-500/30">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50" />
                  <div className="mb-1 text-sm text-purple-400 font-semibold">Jul - Sep 2026</div>
                  <h4 className="text-xl font-bold text-white mb-3">Advanced Features</h4>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      DAGKnight multi-wallet verification system
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      NFT marketplace and minting platform
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Enhanced AI analytics and insights
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Cross-chain bridge expansion
                    </li>
                  </ul>
                </div>

                {/* Oct - Dec 2026 */}
                <div className="relative pl-8 border-l-2 border-pink-500/30">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50" />
                  <div className="mb-1 text-sm text-pink-400 font-semibold">Oct - Dec 2026</div>
                  <h4 className="text-xl font-bold text-white mb-3">Ecosystem Expansion</h4>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Developer SDK and API documentation
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Mobile app launch (iOS & Android)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Strategic partnerships and integrations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Community grants program
                    </li>
                  </ul>
                </div>

                {/* Q1 2027 */}
                <div className="relative pl-8 border-l-2 border-emerald-500/30">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
                  <div className="mb-1 text-sm text-emerald-400 font-semibold">Jan - Mar 2027</div>
                  <h4 className="text-xl font-bold text-white mb-3">Enterprise & Scale</h4>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Enterprise solutions and institutional onboarding
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Advanced DeFi integrations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Global expansion initiatives
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Layer-3 protocol research
                    </li>
                  </ul>
                </div>

                {/* Q2 2027 */}
                <div className="relative pl-8 border-l-2 border-teal-500/30">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-teal-500 rounded-full shadow-lg shadow-teal-500/50" />
                  <div className="mb-1 text-sm text-teal-400 font-semibold">Apr - Jun 2027</div>
                  <h4 className="text-xl font-bold text-white mb-3">Innovation & Research</h4>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      AI-powered trading algorithms
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Zero-knowledge proof implementations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Quantum-resistant security upgrades
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                      Community-driven feature development
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 bg-gradient-to-br from-white/5 to-transparent rounded-xl p-6 border border-white/5">
                <p className="text-white/40 text-xs leading-relaxed">
                  <strong className="text-white/60">Note:</strong> This roadmap is subject to change based on 
                  community governance decisions, market conditions, and technical feasibility. All dates are estimates.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Vote Modal */}
      <AnimatePresence>
      {showVoteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowVoteModal(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-black/95 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Community Votes</h2>
                <p className="text-white/60 text-sm">Vote for your favorite apps</p>
              </div>
              <Button
                onClick={() => setShowVoteModal(false)}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {apps.filter(app => !app.adminOnly || isAdmin).map((app) => {
                  const Icon = app.icon;
                  const voteCount = votes[app.name] || 0;
                  const hasVoted = userVotes[app.name];

                  return (
                    <motion.div
                      key={app.name}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className="w-6 h-6 text-white/80" />
                          <div>
                            <h3 className="text-white font-semibold">{app.name}</h3>
                            <p className="text-white/60 text-xs">{app.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-white font-bold text-lg">{voteCount}</div>
                            <div className="text-white/40 text-[10px]">votes</div>
                          </div>

                          <button
                            onClick={() => handleVote(app.name)}
                            disabled={!user}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              hasVoted
                                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                : 'bg-white/5 border-white/20 text-white/60 hover:border-white/40 hover:text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={user ? (hasVoted ? 'Remove vote' : 'Vote') : 'Login to vote'}
                          >
                            <ThumbsUp className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      </div>
      );
      }