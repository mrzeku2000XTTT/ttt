import React from 'react';
import { motion } from 'framer-motion';

export default function BackgroundLogo({ 
  text = "TTT", 
  opacity = 0.05, 
  strokeColor = "rgba(6, 182, 212, 0.3)",
  animated = true 
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity }}>
      {animated ? (
        <motion.div 
          animate={{ 
            scale: [1, 1.02, 1],
            opacity: [opacity, opacity * 1.5, opacity]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-[600px] font-black tracking-tighter text-transparent select-none"
          style={{
            WebkitTextStroke: `4px ${strokeColor}`,
            textStroke: `4px ${strokeColor}`,
          }}
        >
          {text}
        </motion.div>
      ) : (
        <div 
          className="text-[600px] font-black tracking-tighter text-transparent select-none"
          style={{
            WebkitTextStroke: `4px ${strokeColor}`,
            textStroke: `4px ${strokeColor}`,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}