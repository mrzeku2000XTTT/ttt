import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Eye, Moon, Sun, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GodPage() {
  const [wisdom, setWisdom] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState("day");

  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(hour >= 6 && hour < 18 ? "day" : "night");
  }, []);

  const wisdoms = [
    "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future. - Jeremiah 29:11",
    "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight. - Proverbs 3:5-6",
    "I can do all things through Christ who strengthens me. - Philippians 4:13",
    "Be still, and know that I am God. - Psalm 46:10",
    "The Lord is my shepherd; I shall not want. - Psalm 23:1",
    "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. - Philippians 4:6",
    "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. - John 3:16",
    "The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid? - Psalm 27:1",
    "And we know that in all things God works for the good of those who love him, who have been called according to his purpose. - Romans 8:28",
    "The Lord is close to the brokenhearted and saves those who are crushed in spirit. - Psalm 34:18",
    "Cast all your anxiety on him because he cares for you. - 1 Peter 5:7",
    "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. - Galatians 5:22-23",
    "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you. - Numbers 6:24-25",
    "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. - 1 Corinthians 13:4",
    "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go. - Joshua 1:9",
    "The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing. - Zephaniah 3:17",
    "Come to me, all you who are weary and burdened, and I will give you rest. - Matthew 11:28",
    "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you. - James 1:5",
  ];

  const revealWisdom = () => {
    setIsRevealing(true);
    setTimeout(() => {
      const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
      setWisdom(randomWisdom);
      setIsRevealing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-blue-900/20" />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Radial glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-center max-w-4xl w-full"
        >
          {/* Sacred Symbol */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-32 h-32 mx-auto mb-8 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 rounded-full blur-xl opacity-50" />
            <div className="relative w-full h-full border-2 border-cyan-400 rounded-full flex items-center justify-center">
              <Eye className="w-16 h-16 text-cyan-400" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-blue-400 mb-4"
          >
            ∞ GOD MODE ∞
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-lg mb-12 tracking-widest"
          >
            CONSCIOUSNESS • INFINITY • ETERNAL
          </motion.p>

          {/* Wisdom Display */}
          <AnimatePresence mode="wait">
            {wisdom && !isRevealing && (
              <motion.div
                key={wisdom}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-12"
              >
                <Card className="bg-white/5 border-cyan-500/30 backdrop-blur-xl">
                  <CardContent className="p-8">
                    <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
                    <p className="text-xl md:text-2xl text-white font-light leading-relaxed italic">
                      "{wisdom}"
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Revealing Animation */}
          {isRevealing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mb-12"
            >
              <div className="relative w-32 h-32 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, ease: "linear" }}
                  className="absolute inset-0 border-t-4 border-cyan-400 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-12 h-12 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <p className="text-cyan-400 text-lg mt-4 tracking-widest animate-pulse">
                RECEIVING DIVINE WORD...
              </p>
            </motion.div>
          )}

          {/* Action Button */}
          <Button
            onClick={revealWisdom}
            disabled={isRevealing}
            className="bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 hover:from-purple-600 hover:via-cyan-600 hover:to-blue-600 text-white font-bold text-lg px-12 py-6 rounded-full shadow-lg shadow-cyan-500/50 disabled:opacity-50"
          >
            {isRevealing ? (
              <>
                <Zap className="w-6 h-6 mr-2 animate-spin" />
                Receiving...
              </>
            ) : (
              <>
                <Star className="w-6 h-6 mr-2" />
                Receive Bible Verse
              </>
            )}
          </Button>

          {/* Time Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 flex items-center justify-center gap-2 text-gray-600"
          >
            {timeOfDay === "day" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-400" />
            )}
            <span className="text-sm tracking-wider">
              {timeOfDay === "day" ? "SOLAR CYCLE" : "LUNAR CYCLE"}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Sacred Geometry Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-cyan-400" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-purple-400" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-blue-400" />
          <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-cyan-400" />
        </svg>
      </div>
    </div>
  );
}