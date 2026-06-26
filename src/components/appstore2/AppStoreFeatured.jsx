import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Crown, ArrowLeft, Maximize2 } from "lucide-react";

const FEATURED = [
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
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl bg-gradient-to-br ${app.color} p-4 h-40 flex flex-col justify-between overflow-hidden shadow-lg group cursor-pointer`}
              >
                {app.bg && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                    style={{ backgroundImage: `url(${app.bg})` }}
                  />
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-60 mix-blend-multiply`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 right-3 w-14 h-14 rounded-xl overflow-hidden shadow-lg opacity-95 group-hover:scale-110 transition-transform z-10 bg-black flex items-center justify-center">
                  <img src={app.logo} alt={app.name} className="w-full h-full object-contain" onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML = `<span class="text-white font-bold text-lg">${app.name[0]}</span>`; }} />
                </div>
                {app.premium && (
                  <Crown className="absolute top-3 left-3 w-4 h-4 text-yellow-300 z-10 drop-shadow-lg" />
                )}
                <div />
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-sm mb-0.5 drop-shadow-md">{app.name}</h3>
                  <p className="text-white/85 text-[11px] leading-tight drop-shadow">{app.desc}</p>
                </div>
                <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-white/60 group-hover:text-white transition-colors z-10" />
              </motion.div>
            );

            if (app.iframe) {
              return <div key={app.name} onClick={() => setIframeApp(app)}>{card}</div>;
            }
            return app.external
              ? <a key={app.name} href={app.external} target="_blank" rel="noopener noreferrer">{card}</a>
              : <Link key={app.name} to={app.path} onClick={() => { try { localStorage.setItem('came_from_categories', 'true'); } catch {} }}>{card}</Link>;
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