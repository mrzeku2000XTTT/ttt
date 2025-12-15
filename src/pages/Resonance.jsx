import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Zap, CheckCircle2, Play, Trophy, Music, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from "@/api/base44Client";

// Audio Context helper
const AudioContext = window.AudioContext || window.webkitAudioContext;

export default function ResonancePage() {
  // Game State
  const [gameState, setGameState] = useState('MENU'); // MENU, PLAYING, LEVEL_COMPLETE, VICTORY, GAMEOVER
  const [mode, setMode] = useState('CHALLENGE'); // CHALLENGE, ZEN
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [user, setUser] = useState(null);
  
  // Wave Physics
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [frequency, setFrequency] = useState(1);
  const [amplitude, setAmplitude] = useState(50);
  const [targetFreq, setTargetFreq] = useState(3); 
  const [targetAmp, setTargetAmp] = useState(80); 
  
  // Gameplay Logic
  const [matchPercentage, setMatchPercentage] = useState(0);
  const [lockProgress, setLockProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  
  // Refs
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioCtxRef = useRef(null);
  const userOscRef = useRef(null);
  const targetOscRef = useRef(null);
  const masterGainRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Constants
  const LOCK_THRESHOLD = 96;
  const LOCK_SPEED = 0.5; // How fast the lock bar fills per frame when matched
  const BASE_AUDIO_FREQ = 100;

  useEffect(() => {
    loadUserAndScore();
    return () => stopAudio();
  }, []);

  const loadUserAndScore = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u) {
        const progress = await base44.entities.UserProgress.filter({
          user_email: u.email,
          topic: 'Resonance'
        });
        if (progress.length > 0) {
          setHighScore(progress[0].current_score);
        }
      }
    } catch (e) {
      console.error("Auth load failed", e);
    }
  };

  const saveScore = async (newScore) => {
    if (!user || newScore <= highScore) return;
    setHighScore(newScore);
    try {
      const existing = await base44.entities.UserProgress.filter({
        user_email: user.email,
        topic: 'Resonance'
      });
      
      if (existing.length > 0) {
        await base44.entities.UserProgress.update(existing[0].id, {
          current_score: newScore
        });
      } else {
        await base44.entities.UserProgress.create({
          user_email: user.email,
          topic: 'Resonance',
          current_score: newScore,
          difficulty_level: '10+'
        });
      }
    } catch (e) {
      console.error("Save score failed", e);
    }
  };

  // --- Audio System ---
  const initAudio = () => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    
    const masterGain = ctx.createGain();
    masterGain.gain.value = isMuted ? 0 : 0.1;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // User Oscillator (Sine)
    const userOsc = ctx.createOscillator();
    userOsc.type = 'sine';
    userOsc.start();
    const userGain = ctx.createGain();
    userGain.gain.value = 0.5;
    userOsc.connect(userGain);
    userGain.connect(masterGain);
    userOscRef.current = userOsc;

    // Target Oscillator (Sine with slightly different timbre/type maybe? kept sine for pure beating)
    const targetOsc = ctx.createOscillator();
    targetOsc.type = 'sine';
    targetOsc.start();
    const targetGain = ctx.createGain();
    targetGain.gain.value = 0.3; // Quieter
    targetOsc.connect(targetGain);
    targetGain.connect(masterGain);
    targetOscRef.current = targetOsc;
  };

  const stopAudio = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const updateAudio = (userF, targetF) => {
    if (!userOscRef.current || !targetOscRef.current) return;
    // Map visual frequency (1-10) to Audio Hz (100-600)
    const uHz = 100 + userF * 50;
    const tHz = 100 + targetF * 50;
    
    userOscRef.current.frequency.setTargetAtTime(uHz, audioCtxRef.current.currentTime, 0.1);
    targetOscRef.current.frequency.setTargetAtTime(tHz, audioCtxRef.current.currentTime, 0.1);

    // Modulation: Volume dips when matched (phase cancellation effect simulation or just ducking)
    // Or simpler: Increase volume when close to encourage match? 
    // Let's do: When locked, play a harmonious chord or just pure tone.
    // For now, simple frequency tracking.
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = !isMuted ? 0 : 0.1;
    }
  };

  // --- Game Loop ---
  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setGameState('PLAYING');
    setLevel(1);
    setScore(0);
    setLockProgress(0);
    setTimeLeft(selectedMode === 'ZEN' ? 9999 : 30);
    initAudio();
    generateLevel(1);
  };

  const generateLevel = (lvl) => {
    // Harder levels = Higher freq variance, Lower tolerance (implied by user needing to be precise)
    // For now, just randomization.
    const seed = Math.random();
    const baseF = 2 + (lvl * 0.5); // Gets faster
    setTargetFreq(Math.max(1, Math.min(8, baseF + (seed * 2 - 1))));
    setTargetAmp(50 + Math.random() * 40);
    setLockProgress(0);
    setTimeLeft(mode === 'ZEN' ? 9999 : Math.max(10, 35 - (lvl * 2))); // Less time per level
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (gameState !== 'PLAYING') return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Control sensitivity
      const f = (clientX / innerWidth) * 8 + 0.5; // Range 0.5 to 8.5
      const a = ((innerHeight - clientY) / innerHeight) * 100; // Range 0 to 100
      
      setFrequency(f);
      setAmplitude(a);
      setMousePos({ x: clientX, y: clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let timer;
    if (mode === 'CHALLENGE') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('GAMEOVER');
            saveScore(score);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, mode, score]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    updateAudio(frequency, targetFreq);

    // Calculate match
    const freqDiff = Math.abs(frequency - targetFreq);
    const ampDiff = Math.abs(amplitude - targetAmp);
    
    // Tolerances get tighter with levels
    const difficultyMod = mode === 'CHALLENGE' ? 1 + (level * 0.1) : 1;
    const freqTol = 1.5 / difficultyMod;
    const ampTol = 20 / difficultyMod;

    const fMatch = Math.max(0, 100 - (freqDiff / freqTol) * 100);
    const aMatch = Math.max(0, 100 - (ampDiff / ampTol) * 100);
    const total = (fMatch + aMatch) / 2;
    
    setMatchPercentage(total);

  }, [frequency, amplitude, targetFreq, targetAmp, level, mode, gameState]);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const render = (time) => {
      // Delta time calculation
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      // Logic update in render loop for smoothness
      if (gameState === 'PLAYING') {
        const freqDiff = Math.abs(frequency - targetFreq);
        const ampDiff = Math.abs(amplitude - targetAmp);
        // Normalized match score (0-1)
        const match = Math.max(0, 1 - (freqDiff / 2 + ampDiff / 30)); 
        
        if (match > 0.85) { // Threshold to start locking
            setLockProgress(prev => {
                const next = prev + (LOCK_SPEED * (match * match)); // Accelerate lock
                if (next >= 100) {
                    handleLevelComplete();
                    return 0;
                }
                return next;
            });
        } else {
            setLockProgress(prev => Math.max(0, prev - 1)); // Decay
        }
      }

      // --- Drawing ---
      const t = time * 0.002;

      // 1. Target Wave (Ghost)
      ctx.beginPath();
      // Challenge: Ghost visibility fades in higher levels? No, keep it visible but maybe glitchy
      ctx.strokeStyle = `rgba(255, 255, 255, ${mode === 'ZEN' ? 0.2 : Math.max(0.05, 0.3 - level * 0.03)})`; 
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * 0.01 * targetFreq + t) * targetAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. User Wave
      ctx.beginPath();
      // Color shifts from Red (bad) to Green/Cyan (good)
      const r = 255 * (1 - matchPercentage/100);
      const g = 255 * (matchPercentage/100);
      const b = 255;
      
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 6 + (lockProgress / 10); // Gets thicker as you lock
      ctx.shadowBlur = matchPercentage / 3;
      ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;

      // Jitter if far from match
      const jitter = (100 - matchPercentage) * 0.1;
      
      for (let x = 0; x < width; x++) {
        const noise = (Math.random() - 0.5) * jitter;
        const y = height / 2 + Math.sin(x * 0.01 * frequency + t) * amplitude + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [frequency, amplitude, targetFreq, targetAmp, gameState, level, mode, matchPercentage]);

  const handleLevelComplete = () => {
    if (mode === 'ZEN') {
        // Just new target, chill vibes
        setScore(s => s + 100);
        generateLevel(1);
    } else {
        // Challenge mode logic
        const levelBonus = Math.ceil(timeLeft * 10);
        setScore(s => s + 1000 + levelBonus);
        
        if (level >= 5) {
            setGameState('VICTORY');
            saveScore(score + 1000 + levelBonus);
        } else {
            setGameState('LEVEL_COMPLETE');
            setTimeout(() => {
                setLevel(l => l + 1);
                generateLevel(level + 1);
                setGameState('PLAYING');
            }, 1500);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden cursor-crosshair select-none font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      {/* Background Ambience */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${matchPercentage > 90 ? 'opacity-20' : 'opacity-0'}`}>
         <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/30 via-transparent to-purple-900/30" />
      </div>

      {/* --- MENU SCREEN --- */}
      <AnimatePresence>
        {gameState === 'MENU' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="max-w-md w-full p-8 text-center space-y-8">
              <div>
                <h1 className="text-6xl font-black text-white tracking-tighter mb-2">RESONANCE</h1>
                <p className="text-white/60">Find the frequency. Sync the wave.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={() => startGame('CHALLENGE')}
                  className="h-16 text-xl bg-white text-black hover:bg-gray-200"
                >
                  <Trophy className="w-6 h-6 mr-3" />
                  Challenge Mode
                </Button>
                <Button 
                  onClick={() => startGame('ZEN')}
                  className="h-16 text-xl bg-transparent border border-white/20 text-white hover:bg-white/10"
                >
                  <Music className="w-6 h-6 mr-3" />
                  Zen Mode
                </Button>
              </div>

              {highScore > 0 && (
                <div className="text-sm text-white/40 font-mono">
                  HIGH SCORE: {highScore}
                </div>
              )}
              
              <Link to={createPageUrl("TruthLanding")}>
                <Button variant="link" className="text-white/40 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Truth
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HUD --- */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
          {/* Header */}
          <div className="flex justify-between items-start pointer-events-auto">
             <div className="flex gap-2">
                <Button 
                    size="icon" variant="ghost" 
                    onClick={() => setGameState('MENU')}
                    className="text-white/50 hover:text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Button 
                    size="icon" variant="ghost" 
                    onClick={toggleMute}
                    className="text-white/50 hover:text-white"
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
             </div>

             <div className="text-right">
                <div className="text-4xl font-black text-white tracking-widest">{score}</div>
                <div className="flex items-center justify-end gap-4 text-sm font-mono text-white/60">
                   <span>LVL {level}</span>
                   {mode === 'CHALLENGE' && (
                       <span className={`${timeLeft < 10 ? 'text-red-500 animate-pulse' : ''}`}>
                           {timeLeft}s
                       </span>
                   )}
                </div>
             </div>
          </div>

          {/* Center Info */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
             {lockProgress > 0 && (
                 <div className="flex flex-col items-center gap-2">
                     <div className="text-2xl font-black text-cyan-400 tracking-[0.5em] animate-pulse">
                        SYNCING
                     </div>
                     <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-cyan-400"
                            style={{ width: `${lockProgress}%` }}
                        />
                     </div>
                 </div>
             )}
          </div>

          {/* Footer Debug/Guides */}
          <div className="flex justify-between items-end text-xs font-mono text-white/20">
             <div>FREQ: {frequency.toFixed(2)}</div>
             <div>AMP: {Math.round(amplitude)}%</div>
          </div>
        </div>
      )}

      {/* --- LEVEL COMPLETE OVERLAY --- */}
      <AnimatePresence>
        {gameState === 'LEVEL_COMPLETE' && (
             <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
             >
                <div className="text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                   WAVE LOCKED
                </div>
             </motion.div>
        )}
      </AnimatePresence>

      {/* --- GAMEOVER / VICTORY --- */}
      <AnimatePresence>
        {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
            >
                <div className="text-center space-y-6">
                    {gameState === 'VICTORY' ? (
                        <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
                    ) : (
                        <Activity className="w-24 h-24 text-red-500 mx-auto mb-4" />
                    )}
                    
                    <div>
                        <h1 className="text-5xl font-black text-white mb-2">
                            {gameState === 'VICTORY' ? 'RESONANCE ACHIEVED' : 'SIGNAL LOST'}
                        </h1>
                        <p className="text-2xl text-white/60">Final Score: {score}</p>
                    </div>

                    <div className="flex justify-center gap-4">
                        <Button 
                            onClick={() => startGame(mode)}
                            className="bg-white text-black hover:bg-gray-200 h-12 px-8 text-lg"
                        >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Try Again
                        </Button>
                        <Button 
                            onClick={() => setGameState('MENU')}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 h-12 px-8 text-lg"
                        >
                            Menu
                        </Button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}