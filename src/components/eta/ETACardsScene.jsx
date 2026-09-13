import React from 'react';
import { motion } from 'framer-motion';

const counts = { Cards:6, Cards2:10, Cards3:12, Cards4:16 };
export default function ETACardsScene({ scene, advanced, frameProgress }) {
  const progress = Number.isFinite(frameProgress) ? frameProgress : 0;
  const images = advanced.cardImages || [], count = Math.max(images.length, counts[scene.component] || 6);
  const rings = [...(advanced.ringKeyframes || [])].sort((a,b) => a.time - b.time);
  const ring = rings.filter((item) => Number(item.time || 0) <= progress * Number(scene.duration || 3)).at(-1) || rings[0] || {};
  const speed = Number(ring.speed ?? advanced.spinSpeed ?? (10800 / Number(advanced.spinPeriodFrames || 180)));
  const direction = advanced.spinDirection === 'Counter-clockwise' ? -1 : 1;
  const spin = direction * progress * Number(scene.duration || 3) * speed * Math.PI / 180 + Number(advanced.spinPhase || 0);
  const sphereRadius = 82 * Number(ring.radius ?? advanced.sphereRadius ?? 1);
  const width = Number(advanced.cardWidth || 112), height = Number(advanced.cardHeight || 160);
  const transformText = advanced.textTransform === 'Uppercase' ? 'uppercase' : advanced.textTransform === 'Lowercase' ? 'lowercase' : 'none';
  const groupTransform = `translate3d(${Number(advanced.satelliteX || 0)}px,${Number(advanced.satelliteY || 0)}px,${Number(advanced.satelliteZ || 0)}px) rotateX(${Number(ring.tiltX ?? advanced.sphereTiltX ?? 8) + Number(advanced.satelliteRotateX || 0)}deg) rotateY(${Number(advanced.satelliteRotateY || 0)}deg) rotateZ(${Number(ring.tiltZ ?? advanced.sphereTiltZ ?? 0) + Number(advanced.satelliteRotateZ || 0)}deg)`;
  const orbitAngle = progress * Number(scene.duration || 3) * Number(advanced.headlineOrbitSpeed || 12) * Math.PI / 180;
  return <div className="relative h-52 w-full max-w-md" style={{ perspective:Number(advanced.cardPerspective || 900) }}><div className="absolute inset-0" style={{ transformStyle:'preserve-3d', transform:groupTransform }}>{Array.from({ length:count }).map((_,i) => {
    const yUnit = 1 - 2 * (i + .5) / count, radial = Math.sqrt(1 - yUnit * yUnit), theta = i * Math.PI * (3 - Math.sqrt(5)) + spin;
    const x = Math.cos(theta) * radial * sphereRadius, y = yUnit * sphereRadius * .72, z = Math.sin(theta) * radial * sphereRadius;
    return <motion.div key={i} initial={Number.isFinite(frameProgress) ? false : { opacity:0, scale:.7 }} animate={Number.isFinite(frameProgress) ? undefined : { opacity:1, scale:1 }} transition={{ delay:i * .04 }} className="absolute left-1/2 top-1/2 overflow-hidden border border-border bg-background p-2 shadow-2xl" style={{ width, height, marginLeft:-width/2, marginTop:-height/2, borderRadius:Number(advanced.cardRadius || 16), backgroundColor:advanced.cardColor, opacity:Math.min(1, Math.max(0, (progress - i * .025) * 7)), transform:`translate3d(${x}px,${y}px,${z}px) rotateY(${-theta * 180 / Math.PI}deg)`, zIndex:Math.round(z + 200) }}>{images[i % Math.max(images.length,1)]?.url ? <img src={images[i % images.length].url} alt="Animated card" className="h-full w-full object-cover" /> : <DefaultCard frameProgress={progress} delay={i * .2} />}</motion.div>;
  })}</div><p className="absolute inset-x-0 top-1/2 z-[300] -translate-y-1/2 text-center text-foreground" style={{ transform:`translate3d(${Math.cos(orbitAngle)*Number(advanced.headlineOrbitRadius||8)}px,calc(-50% + ${Math.sin(orbitAngle)*Number(advanced.headlineOrbitRadius||8)*Math.cos(Number(advanced.headlineOrbitIncline||.2))}px),${Number(ring.textDepth ?? advanced.cardTextDepth ?? 20)}px)`, fontFamily:advanced.cardFont || 'SF Pro Display', fontSize:Number(advanced.cardFontSize || 28), fontWeight:Number(advanced.cardFontWeight || 700), textTransform:transformText }}>{advanced.centerHeadline || scene.headline}</p></div>;
}
function DefaultCard({ delay, frameProgress }) { return <><i style={{ transform:`scale(${1 + Math.sin(frameProgress*Math.PI*4+delay)*.06})` }} className="block h-20 rounded-lg bg-primary/25" /><i className="mt-3 block h-2 w-4/5 rounded bg-muted" /><i className="mt-2 block h-2 w-1/2 rounded bg-muted" /></>; }