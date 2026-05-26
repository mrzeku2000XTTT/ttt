import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ORB_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4af893ff9_generated_image.png";
const CORNER_ART = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8b62e8d8d_generated_image.png";
const YOUTUBE_VIDEO_ID = "k8eynkLKmfU";

export default function TTTLandingPage() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStartedMusic, setHasStartedMusic] = React.useState(false);
  const playerRef = React.useRef(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const musicSrc = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&origin=${origin}`;

  const sendPlayerCommand = (command) => {
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      "*"
    );
  };

  const toggleMusic = () => {
    if (!hasStartedMusic) {
      setHasStartedMusic(true);
      setIsPlaying(true);
      return;
    }

    sendPlayerCommand(isPlaying ? "pauseVideo" : "playVideo");
    setIsPlaying(!isPlaying);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950">
      <div className="absolute inset-0 bg-white" />
      <img src={CORNER_ART} alt="TTT corner art" className="pointer-events-none absolute left-0 top-0 h-56 w-56 object-contain opacity-70 sm:h-80 sm:w-80" />
      <img src={CORNER_ART} alt="TTT corner art" className="pointer-events-none absolute right-0 top-0 h-56 w-56 scale-x-[-1] object-contain opacity-70 sm:h-80 sm:w-80" />
      <img src={CORNER_ART} alt="TTT corner art" className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 scale-y-[-1] object-contain opacity-45 sm:h-80 sm:w-80" />
      <img src={CORNER_ART} alt="TTT corner art" className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 scale-[-1] object-contain opacity-45 sm:h-80 sm:w-80" />
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 0.42, opacity: 0 }}
        animate={{ scale: 1, y: [0, -12, 0], opacity: [1, 0.96, 1] }}
        transition={{ scale: { duration: 1.4, ease: "easeOut" }, opacity: { duration: 0.8, ease: "easeOut" }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.4 } }}
      >
        <img
          src={ORB_IMAGE}
          alt="TTT cosmic orb background"
          className="h-full w-full scale-90 object-contain object-center opacity-100 [image-rendering:auto] transform-gpu md:scale-[0.78]"
        />
      </motion.div>
      <img
        src={ORB_IMAGE}
        alt="TTT orb water reflection"
        className="absolute inset-x-0 bottom-0 h-1/3 w-full origin-bottom scale-y-[-1] object-contain object-bottom opacity-18"
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-white/65 to-transparent" />
      <div className="absolute inset-0 bg-white/5" />
      <iframe
        ref={playerRef}
        title="Mind On My Kaspa by Kas Tunes"
        src={hasStartedMusic ? musicSrc : "about:blank"}
        allow="autoplay; encrypted-media"
        className="pointer-events-none absolute h-px w-px opacity-0"
      />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-8 pt-10 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative h-[min(62vh,620px)] w-full"
        >
          <Link
            to="/TTTGate"
            aria-label="Launch old TTT portal"
            className="absolute inset-0"
          />
        </motion.div>



        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mb-2 text-sm font-medium tracking-[0.45em] text-slate-900/80 sm:text-base"
        >
          地球到火星交易
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs font-medium tracking-[0.32em] text-slate-600/70 sm:text-sm"
        >
          由 Kaspa 提供支持
        </motion.p>
        <motion.button
          type="button"
          onClick={toggleMusic}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-4 rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-900 shadow-sm backdrop-blur-xl transition hover:bg-white hover:shadow-md active:scale-95"
        >
          {isPlaying ? "Pause" : "Play"}
        </motion.button>
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-5 text-[10px] font-semibold uppercase tracking-[0.5em] text-slate-500/60"
        >
          ttt
        </motion.footer>
      </section>
    </main>
  );
}