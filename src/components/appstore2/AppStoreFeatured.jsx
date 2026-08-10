import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Crown, ArrowLeft, Maximize2 } from "lucide-react";

const FEATURED = [
  {
    name: "TTT Builder",
    desc: "AI site builder — prompt to live site",
    path: "/TTTBuilder",
    color: "from-teal-500 to-emerald-700",
    logo: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=200&fit=crop",
    bg: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=70",
  },
  {
    name: "oK Motion Lab",
    desc: "3D studio for rendering & animating brand logos",
    iframe: "https://ok-motion-lab.base44.app/",
    color: "from-slate-800 to-zinc-900",
    logo: "https://ok-motion-lab.base44.app/favicon.ico",
    bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70",
  },
  {
    name: "Buy KAS",
    desc: "Swap crypto instantly at the best rates",
    external: "https://kaspa.com/buy-kas",
    color: "from-teal-400 to-green-600",
    logo: "https://cryptologos.cc/logos/kaspa-kas-logo.png",
    bg: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=70",
  },
  {
    name: "Feed",
    desc: "Social feed with KAS tipping",
    path: "/Feed",
    color: "from-cyan-500 to-blue-600",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png",
    bg: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=70",
  },
  {
    name: "Portal",
    desc: "Enter World of AI or World of Kaspa",
    path: "/Portal",
    color: "from-teal-500 to-violet-700",
    logo: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&q=80",
    bg: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&q=70",
  },
];

export default function AppStoreFeatured() {
  const [iframeApp, setIframeApp] = useState(null);
  const navigate = useNavigate();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-10"
      >
        <h2 className="text-lg font-[800] mb-4">Featured</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURED.map((app, i) => {
            const card = (
              <div
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                className={`relative rounded-2xl bg-gradient-to-br ${app.color} p-4 h-40 flex flex-col justify-between overflow-hidden shadow-lg group cursor-pointer active:scale-[0.98] transition-transform duration-150`}
              >
...
                <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-white/60 group-hover:text-white transition-colors z-10" />
              </div>
            );

            if (app.iframe) {
              return <div key={app.name} onClick={() => setIframeApp(app)}>{card}</div>;
            }
            if (app.external) {
              return <a key={app.name} href={app.external} target="_blank" rel="noopener noreferrer">{card}</a>;
            }
            // Native pointerup navigation — fires on the FIRST tap on touch devices
            const open = () => {
              try { localStorage.setItem('came_from_categories', 'true'); } catch {}
              navigate(app.path);
            };
            return (
              <div
                key={app.name}
                role="link"
                onPointerUp={open}
                onClick={(e) => { if (e.detail === 0) open(); }}
                style={{ touchAction: 'manipulation' }}
              >
                {card}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Fullscreen iframe viewer */}
      <AnimatePresence>
        {iframeApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 h-14 bg-zinc-950 border-b border-white/10 flex-shrink-0">
              <button
                onClick={() => setIframeApp(null)}
                className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors font-medium text-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                App Store
              </button>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-6 h-6 rounded-md bg-black overflow-hidden flex items-center justify-center border border-white/10">
                  <img src={iframeApp.logo} alt={iframeApp.name} className="w-full h-full object-contain" onError={e => e.target.style.display='none'} />
                </div>
                <span className="text-white font-semibold text-sm">{iframeApp.name}</span>
              </div>
              <a
                href={iframeApp.iframe}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-white/50 hover:text-white text-xs transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                Open Tab
              </a>
            </div>
            {/* Iframe */}
            <iframe
              src={iframeApp.iframe}
              className="flex-1 w-full border-0"
              title={iframeApp.name}
              allow="camera; microphone; fullscreen; accelerometer; gyroscope"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}