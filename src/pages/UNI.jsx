import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import MatrixGridBackground from '@/components/feed/MatrixGridBackground';

export default function UNIPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center">
      <MatrixGridBackground />

      <div className="absolute top-6 left-6 z-50">
        <Link to={createPageUrl("Feed")}>
          <Button variant="ghost" className="text-green-500 hover:text-green-400 hover:bg-green-500/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
      </div>
      
      <div className="relative z-10 text-center space-y-8">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-9xl font-black text-green-500 tracking-tighter glitch-effect"
          style={{ textShadow: '0 0 20px #0f0' }}
        >
          UNI
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-green-400 font-mono text-xl"
        >
          SYSTEM INITIALIZED
        </motion.p>

      </div>

      <style jsx>{`
        .glitch-effect {
          position: relative;
        }
        .glitch-effect::before,
        .glitch-effect::after {
          content: 'UNI';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
        }
        .glitch-effect::before {
          left: 2px;
          text-shadow: -1px 0 red;
          clip: rect(24px, 550px, 90px, 0);
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }
        .glitch-effect::after {
          left: -2px;
          text-shadow: -1px 0 blue;
          clip: rect(85px, 550px, 140px, 0);
          animation: glitch-anim 2.5s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim {
          0% { clip: rect(10px, 9999px, 30px, 0); }
          20% { clip: rect(80px, 9999px, 100px, 0); }
          40% { clip: rect(10px, 9999px, 100px, 0); }
          60% { clip: rect(60px, 9999px, 80px, 0); }
          80% { clip: rect(30px, 9999px, 60px, 0); }
          100% { clip: rect(50px, 9999px, 90px, 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip: rect(60px, 9999px, 80px, 0); }
          20% { clip: rect(10px, 9999px, 30px, 0); }
          40% { clip: rect(50px, 9999px, 90px, 0); }
          60% { clip: rect(20px, 9999px, 40px, 0); }
          80% { clip: rect(90px, 9999px, 100px, 0); }
          100% { clip: rect(30px, 9999px, 60px, 0); }
        }
      `}</style>
    </div>
  );
}