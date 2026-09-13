import React from 'react';
import { motion } from 'framer-motion';
import { Globe2, Laptop, Search } from 'lucide-react';

export default function ETAMotionCard({ scene, compact = false }) {
  const a = scene.advanced || {};
  const browser = a.browserKeyframes?.[0] || {};
  const zoom = a.zoomKeyframes?.[0] || {};
  const media = typeof a.backgroundMedia === 'string' ? { url: a.backgroundMedia, type: 'image' } : a.backgroundMedia;
  let visual = <p className="font-heading text-3xl font-semibold">{scene.component === 'LogoAnimation' ? '◉' : scene.headline}</p>;
  if (scene.component === 'NumberDisplay') visual = <p className="font-heading text-6xl font-semibold tabular-nums">{scene.headline}</p>;
  if (scene.component === 'MacBookAnimated') visual = <div className="text-center"><Laptop className="mx-auto h-20 w-20" /><div className="mx-auto h-1 w-28 rounded-full bg-muted" /></div>;
  if (scene.component === 'Glass') visual = <div style={{ backgroundColor: a.pillBackground, color: a.pillTextColor }} className="flex w-full max-w-sm items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-3 shadow-lg backdrop-blur"><Search className="h-4 w-4" /><span className="text-sm">{a.searchText || scene.headline}</span></div>;
  if (scene.component === 'BrowserWindow') {
    const content = <div className="grid h-32 place-items-center px-4 text-center text-xs text-muted-foreground">{browser.content || scene.visual}</div>;
    visual = a.showShell === false ? content : <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-background shadow-lg"><div className="flex items-center gap-1 border-b border-border px-3 py-2"><i className="h-2 w-2 rounded-full bg-muted-foreground/40" /><i className="h-2 w-2 rounded-full bg-muted-foreground/40" /><Globe2 className="ml-auto h-3 w-3 text-muted-foreground" /></div>{content}</div>;
  }
  const transform = { x: Number(zoom.x || 0), y: Number(zoom.y || 0), scale: Number(zoom.scale || 1), rotateX: browser.rotate ? Number(browser.x || 0) : 0, rotateY: browser.rotate ? Number(browser.y || 0) : 0, rotateZ: browser.rotate ? Number(browser.z || 0) : 0 };
  return (
    <motion.div initial={{ opacity: 0, scale: .9, x: 24 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: .7, ease: 'easeOut' }} className={`relative grid overflow-hidden rounded-2xl border bg-card p-6 ${a.animatedBorder ? 'border-primary ring-2 ring-ring/30' : 'border-border'} ${compact ? 'min-h-52' : 'min-h-80'}`} style={{ backgroundColor: a.backgroundColor, boxShadow: a.boxShadow }}>
      {media?.url && (String(media.type).startsWith('video') ? <video src={media.url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-40" /> : <img src={media.url} alt="Scene background" className="absolute inset-0 h-full w-full object-cover opacity-40" />)}
      <motion.div animate={transform} transition={{ duration: Number(browser.speed || .8), ease: zoom.easing === 'linear' ? 'linear' : 'easeInOut' }} className="relative z-10 grid place-items-center">{visual}<p className="mt-5 text-center text-sm text-muted-foreground">{a.subtitle || scene.voiceover}</p></motion.div>
      {a.textContent && <motion.p initial={{ opacity: 0 }} animate={{ opacity: a.textKeyframes?.[0]?.opacity ?? 1, scale: a.textKeyframes?.[0]?.scale ?? 1 }} className="absolute top-8 z-20" style={{ left: Number(a.textLeft || 24), color: a.textColor, fontSize: a.fontSize, fontWeight: a.fontWeight || 700, fontFamily: a.fontFamily }}>{a.textContent}</motion.p>}
    </motion.div>
  );
}