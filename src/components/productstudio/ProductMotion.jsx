import React, { useEffect, useRef } from 'react';

const presets = {
  'fade-up': [{ opacity: 0.25, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
  zoom: [{ transform: 'scale(.88)' }, { transform: 'scale(1.08)' }],
  drift: [{ transform: 'translateX(-18px)' }, { transform: 'translateX(18px)' }],
  spin: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
  parallax: [{ transform: 'perspective(700px) rotateY(-18deg)' }, { transform: 'perspective(700px) rotateY(18deg)' }],
  reveal: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
};

export default function ProductMotion({ preset = 'none', playing = true, replay = 0, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!playing || !presets[preset]) return;
    // This is an explicitly requested editor preview, not decorative page motion.
    const animation = ref.current.animate(presets[preset], {
      duration: preset === 'spin' ? 4000 : 1800, iterations: Infinity,
      direction: preset === 'spin' ? 'normal' : 'alternate',
      easing: preset === 'spin' ? 'linear' : 'ease-in-out',
    });
    return () => animation.cancel();
  }, [preset, playing, replay]);
  return <div ref={ref} className="h-full w-full">{children}</div>;
}