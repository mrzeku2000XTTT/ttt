import React from 'react';
import { motion } from 'framer-motion';

export default function ETACardsScene({ scene, advanced, frameProgress }) {
  const images = advanced.cardImages || [];
  const parsedCount = Number(scene.component?.replace('Cards', ''));
  const count = Math.max(3, Math.min(6, parsedCount || 4));
  const radius = Number(advanced.cardRadius || 16);
  const rings = [...(advanced.ringKeyframes || [])].sort((a,b) => a.time - b.time);
  const ring = rings.filter((item) => Number(item.time || 0) <= Number(frameProgress || 0) * Number(scene.duration || 3)).at(-1) || rings[0];
  return (
    <div className="relative h-52 w-full max-w-md [perspective:900px]">
      {Array.from({ length: count }).map((_, i) => {
        const angle = i / count * Math.PI * 2 + Number(frameProgress || 0) * Number(scene.duration || 3) * Number(ring?.speed || 20) * Math.PI / 180;
        const x = ring && Number.isFinite(frameProgress) ? Math.cos(angle) * 92 * Number(ring.radius || 1) : (i - (count - 1) / 2) * 54;
        const ringY = ring && Number.isFinite(frameProgress) ? Math.sin(angle) * 25 * Number(ring.radius || 1) : 0;
        const rotate = (i - (count - 1) / 2) * 10;
        const duration = 3 + i * .25;
        return (
          <motion.div
            key={i}
            initial={Number.isFinite(frameProgress) ? false : { x: 0, y: 50, rotate: 0, opacity: 0 }}
            animate={Number.isFinite(frameProgress) ? undefined : { x: [x, x + (i % 2 ? 8 : -8), x], y: [22, 8, 22], rotate: [rotate, rotate + (i % 2 ? 4 : -4), rotate], opacity: 1 }}
            transition={Number.isFinite(frameProgress) ? undefined : { opacity: { delay: i * .12 }, x: { duration, repeat: Infinity, ease: 'easeInOut' }, y: { duration, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration, repeat: Infinity, ease: 'easeInOut' } }}
            className="absolute left-1/2 top-3 h-40 w-28 -translate-x-1/2 overflow-hidden border border-border bg-background p-2 shadow-2xl"
            style={{ borderRadius: radius, backgroundColor: advanced.cardColor, ...(Number.isFinite(frameProgress) ? { opacity: Math.min(1, Math.max(0, (frameProgress - i * .06) * 5)), transform: `translateX(calc(-50% + ${x}px)) translateY(${22 + ringY}px) rotateX(${Number(ring?.tiltX || 0)}deg) rotateZ(${Number(ring?.tiltZ || rotate)}deg)` } : {}) }}
          >
            {images[i]?.url ? <img src={images[i].url} alt="Animated card" className="h-full w-full object-cover" /> : <DefaultCard delay={i * .2} frameProgress={frameProgress} />}
          </motion.div>
        );
      })}
      <motion.p initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .75 }} className="absolute inset-x-0 bottom-0 z-20 text-center font-heading text-xl font-semibold text-foreground">{advanced.centerHeadline || scene.headline}</motion.p>
    </div>
  );
}

function DefaultCard({ delay, frameProgress }) {
  return <><motion.i animate={Number.isFinite(frameProgress)?undefined:{ scale: [1, 1.08, 1] }} transition={Number.isFinite(frameProgress)?undefined:{ duration: 2, repeat: Infinity, delay }} style={Number.isFinite(frameProgress)?{transform:`scale(${1+Math.sin(frameProgress*Math.PI*4+delay)*.06})`}:undefined} className="block h-20 rounded-lg bg-primary/25" /><i className="mt-3 block h-2 w-4/5 rounded bg-muted" /><i className="mt-2 block h-2 w-1/2 rounded bg-muted" /></>;
}