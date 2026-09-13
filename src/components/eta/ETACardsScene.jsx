import React from 'react';
import { motion } from 'framer-motion';

export default function ETACardsScene({ scene, advanced, frameProgress }) {
  const images = advanced.cardImages || [];
  const parsedCount = Number(scene.component?.replace('Cards', ''));
  const count = Math.max(3, Math.min(6, parsedCount || 4));
  const radius = Number(advanced.cardRadius || 16);
  return (
    <div className="relative h-52 w-full max-w-md [perspective:900px]">
      {Array.from({ length: count }).map((_, i) => {
        const x = (i - (count - 1) / 2) * 54;
        const rotate = (i - (count - 1) / 2) * 10;
        const duration = 3 + i * .25;
        return (
          <motion.div
            key={i}
            initial={Number.isFinite(frameProgress) ? false : { x: 0, y: 50, rotate: 0, opacity: 0 }}
            animate={Number.isFinite(frameProgress) ? undefined : { x: [x, x + (i % 2 ? 8 : -8), x], y: [22, 8, 22], rotate: [rotate, rotate + (i % 2 ? 4 : -4), rotate], opacity: 1 }}
            transition={Number.isFinite(frameProgress) ? undefined : { opacity: { delay: i * .12 }, x: { duration, repeat: Infinity, ease: 'easeInOut' }, y: { duration, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration, repeat: Infinity, ease: 'easeInOut' } }}
            className="absolute left-1/2 top-3 h-40 w-28 -translate-x-1/2 overflow-hidden border border-border bg-background p-2 shadow-2xl"
            style={{ borderRadius: radius, backgroundColor: advanced.cardColor, ...(Number.isFinite(frameProgress) ? { opacity: Math.min(1, Math.max(0, (frameProgress - i * .06) * 5)), transform: `translateX(calc(-50% + ${x + Math.sin(frameProgress * Math.PI * 4 + i) * 8}px)) translateY(${22 + Math.cos(frameProgress * Math.PI * 4 + i) * 7}px) rotate(${rotate + Math.sin(frameProgress * Math.PI * 3 + i) * 3}deg)` } : {}) }}
          >
            {images[i]?.url ? <img src={images[i].url} alt="Animated card" className="h-full w-full object-cover" /> : <DefaultCard delay={i * .2} />}
          </motion.div>
        );
      })}
      <motion.p initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .75 }} className="absolute inset-x-0 bottom-0 z-20 text-center font-heading text-xl font-semibold text-foreground">{advanced.centerHeadline || scene.headline}</motion.p>
    </div>
  );
}

function DefaultCard({ delay }) {
  return <><motion.i animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity, delay }} className="block h-20 rounded-lg bg-primary/25" /><i className="mt-3 block h-2 w-4/5 rounded bg-muted" /><i className="mt-2 block h-2 w-1/2 rounded bg-muted" /></>;
}