import React from 'react';
import { motion } from 'framer-motion';
import ETAAnimatedVisual from './ETAAnimatedVisual';

export default function ETAMotionCard({ scene, compact = false, entrance }) {
  const a = scene.advanced || {};
  const browser = a.browserKeyframes?.[0] || {};
  const zoom = a.zoomKeyframes?.[0] || {};
  const media = typeof a.backgroundMedia === 'string' ? { url: a.backgroundMedia, type: 'image' } : a.backgroundMedia;
  const visual = <ETAAnimatedVisual scene={scene} advanced={a} browser={browser} />;
  const transform = { x: Number(zoom.x || 0), y: Number(zoom.y || 0), scale: Number(zoom.scale || 1), rotateX: browser.rotate ? Number(browser.x || 0) : 0, rotateY: browser.rotate ? Number(browser.y || 0) : 0, rotateZ: browser.rotate ? Number(browser.z || 0) : 0 };
  const incoming = entrance?.incoming || {}, outgoing = a.matchCut?.outgoing || {};
  const offset = (direction, amount) => ({ x: direction === 'Left' ? amount : direction === 'Right' ? -amount : 0, y: direction === 'Up' ? amount : direction === 'Down' ? -amount : 0 });
  const initial = entrance?.enabled === false ? { opacity: 1, scale: 1 } : { opacity: incoming.opacity ?? 0, scale: incoming.scale ?? .95, ...offset(entrance?.direction, Number(incoming.distance || .1) * 400) };
  const exit = a.matchCut?.enabled === false ? { opacity: 1 } : { opacity: 0, ...offset(a.matchCut?.direction, -Number(outgoing.distance || .01) * 400) };
  return (
    <motion.div initial={initial} animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} exit={exit} transition={{ duration: Number(incoming.duration || outgoing.duration || .7), ease: 'easeOut' }} className={`relative grid overflow-hidden rounded-2xl border bg-card p-6 ${a.animatedBorder ? 'border-primary ring-2 ring-ring/30' : 'border-border'} ${compact ? 'min-h-52' : 'min-h-80'}`} style={{ backgroundColor: a.backgroundColor, boxShadow: a.boxShadow }}>
      {media?.url && (String(media.type).startsWith('video') ? <video src={media.url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-40" /> : <img src={media.url} alt="Scene background" className="absolute inset-0 h-full w-full object-cover opacity-40" />)}
      <motion.div animate={transform} transition={{ duration: Number(browser.speed || .8), ease: zoom.easing === 'linear' ? 'linear' : 'easeInOut' }} className="relative z-10 grid place-items-center">{visual}<p className="mt-5 text-center text-sm text-muted-foreground">{a.subtitle || scene.voiceover}</p></motion.div>
      {a.textContent && <motion.p initial={{ opacity: 0 }} animate={{ opacity: a.textKeyframes?.[0]?.opacity ?? 1, scale: a.textKeyframes?.[0]?.scale ?? 1 }} className="absolute top-8 z-20" style={{ left: Number(a.textLeft || 24), color: a.textColor, fontSize: a.fontSize, fontWeight: a.fontWeight || 700, fontFamily: a.fontFamily }}>{a.textContent}</motion.p>}
    </motion.div>
  );
}