import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function ResonancePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [frequency, setFrequency] = useState(1);
  const [amplitude, setAmplitude] = useState(50);
  const [targetFreq] = useState(Math.random() * 3 + 2); // Random target between 2 and 5
  const [targetAmp] = useState(Math.random() * 40 + 60); // Random target between 60 and 100
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (locked) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Map mouse to freq (x) and amp (y)
      const freq = (clientX / innerWidth) * 5 + 0.5;
      const amp = ((innerHeight - clientY) / innerHeight) * 100 + 20;
      
      setFrequency(freq);
      setAmplitude(amp);
      setMousePos({ x: clientX, y: clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [locked]);

  useEffect(() => {
    // Check for match
    if (locked) return;

    const freqDiff = Math.abs(frequency - targetFreq);
    const ampDiff = Math.abs(amplitude - targetAmp);
    
    // Calculate match percentage
    const freqMatch = Math.max(0, 100 - freqDiff * 40);
    const ampMatch = Math.max(0, 100 - ampDiff * 2);
    const totalMatch = (freqMatch + ampMatch) / 2;
    
    setScore(totalMatch);

    if (totalMatch > 95) {
      setLocked(true);
    }
  }, [frequency, amplitude, targetFreq, targetAmp, locked]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      // Draw Target Wave (Ghost)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 4;
      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * 0.01 * targetFreq + time) * targetAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Player Wave
      ctx.beginPath();
      const colorIntensity = Math.min(255, score * 2.55);
      ctx.strokeStyle = `rgb(${colorIntensity}, ${255 - colorIntensity}, 255)`;
      ctx.lineWidth = 6;
      ctx.shadowBlur = score / 5;
      ctx.shadowColor = `rgb(${colorIntensity}, ${255 - colorIntensity}, 255)`;
      
      for (let x = 0; x < width; x++) {
        // Linear interpolation if locked to snap to target
        const currentFreq = locked ? targetFreq : frequency;
        const currentAmp = locked ? targetAmp : amplitude;
        
        const y = height / 2 + Math.sin(x * 0.01 * currentFreq + time) * currentAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      time += 0.05;
      animationRef.current = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [frequency, amplitude, targetFreq, targetAmp, score, locked]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden cursor-crosshair">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
        <div className="flex justify-between items-start">
          <Link to={createPageUrl("TruthLanding")} className="pointer-events-auto">
            <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Return
            </Button>
          </Link>
          
          <div className="text-right space-y-1">
            <h2 className="text-2xl font-black text-white tracking-widest">RESONANCE</h2>
            <div className="flex items-center justify-end gap-2 text-white/60 font-mono text-sm">
              <Activity className="w-4 h-4" />
              <span>{frequency.toFixed(2)}Hz</span>
            </div>
            <div className="flex items-center justify-end gap-2 text-white/60 font-mono text-sm">
              <Zap className="w-4 h-4" />
              <span>{Math.round(amplitude)}%</span>
            </div>
          </div>
        </div>

        {/* Center Status */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <AnimatePresence>
            {locked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                  <CheckCircle2 className="w-10 h-10 text-black" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter">
                  SYNCHRONIZED
                </h1>
                <p className="text-white/60 max-w-md">
                  The frequency has been established. The resonance is stable.
                </p>
              </motion.div>
            )}
            {!locked && (
              <motion.div
                animate={{ opacity: score > 50 ? 0.2 : 0 }}
                className="text-white/20 text-xl font-mono"
              >
                Match the frequency...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Progress */}
        <div className="w-full max-w-md mx-auto">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{ width: `${score}%` }}
              animate={{ opacity: locked ? 1 : 0.7 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-mono text-white/30">
            <span>SIGNAL</span>
            <span>{Math.round(score)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}