import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StateOfMindPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef(null);

  // Free meditation/zen music tracks (royalty-free)
  const tracks = [
    {
      name: "Peaceful Mind",
      url: "https://www.bensound.com/bensound-music/bensound-slowmotion.mp3"
    },
    {
      name: "Deep Calm",
      url: "https://www.bensound.com/bensound-music/bensound-relaxing.mp3"
    },
    {
      name: "Inner Peace",
      url: "https://www.bensound.com/bensound-music/bensound-sunny.mp3"
    }
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      // Move to next track when one ends
      if (currentTrack < tracks.length - 1) {
        setCurrentTrack(prev => prev + 1);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentTrack]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Ambient Background Animation */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center max-w-2xl"
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-7xl font-light text-white mb-8 tracking-wider"
        >
          State of Mind
        </motion.h1>

        {/* Breathing Circle */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-48 h-48 md:w-64 md:h-64 mx-auto mb-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-purple-400/30"
          />
        </motion.div>

        {/* Breathing Instructions */}
        <motion.div
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-white/80 text-lg md:text-xl mb-12 font-light"
        >
          <motion.p
            key="breathe"
            animate={{
              opacity: [1, 0, 0, 0, 0, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              times: [0, 0.16, 0.33, 0.5, 0.66, 1],
            }}
          >
            Breathe in... Hold... Breathe out...
          </motion.p>
        </motion.div>

        {/* Audio Player */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
          <div className="text-white/90 text-sm mb-4 font-light">
            {tracks[currentTrack].name}
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 border border-white/30"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </Button>
            <Button
              onClick={toggleMute}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Meditation Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/60 text-sm md:text-base font-light italic max-w-md mx-auto"
        >
          "Peace comes from within. Do not seek it without."
        </motion.p>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={tracks[currentTrack].url}
          loop={false}
        />
      </motion.div>
    </div>
  );
}