import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Play, ExternalLink, Sparkles } from "lucide-react";

const VIDEO_ID = "IJ0EgjKzZvo";

export default function KaspaShortPlayer() {
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const iframeRef = useRef(null);

  // Build YouTube embed URL with autoplay + loop + mute toggle.
  // Using `playlist=ID` is required for `loop=1` to work.
  const src = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${VIDEO_ID}&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1`;

  // Toggle mute by reloading iframe with new mute param (simplest reliable approach without YT API script).
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = src;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  const togglePlay = () => {
    if (!iframeRef.current) return;
    // postMessage to YouTube iframe API
    const command = playing ? "pauseVideo" : "playVideo";
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      "*"
    );
    setPlaying(!playing);
  };

  return (
    <section className="py-20 sm:py-28 px-5 bg-gradient-to-b from-white via-zinc-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Watch & Learn
          </div>
          <h2 className="text-4xl sm:text-5xl font-[950] tracking-tighter mb-4">Kaspa in 60 seconds.</h2>
          <p className="text-zinc-500 text-base max-w-xl mx-auto">
            A quick visual primer on why Kaspa is rewriting the rules of proof-of-work.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[auto,1fr] gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
          {/* Vertical Short Player */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
            className="relative mx-auto"
          >
            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-violet-500/30 blur-3xl rounded-[2.5rem] opacity-60" />

            {/* Phone-style frame */}
            <div className="relative w-[280px] sm:w-[320px] aspect-[9/16] rounded-[2rem] overflow-hidden bg-black ring-[6px] ring-zinc-900 shadow-2xl">
              <iframe
                ref={iframeRef}
                src={src}
                title="What is Kaspa?"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ border: 0 }}
              />

              {/* Top gradient overlay */}
              <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

              {/* Bottom gradient overlay */}
              <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

              {/* Top label */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  ● Live
                </div>
                <a
                  href={`https://www.youtube.com/shorts/${VIDEO_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-white/30 transition-colors"
                  title="Open on YouTube"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                <button
                  onClick={togglePlay}
                  className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  <Play className={`w-4 h-4 ${playing ? "opacity-60" : ""}`} fill="white" />
                </button>

                <button
                  onClick={() => setMuted(!muted)}
                  className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-colors flex items-center gap-2"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span className="text-[10px] font-bold pr-1">Tap for sound</span>
                    </>
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <p className="text-[11px] font-bold text-cyan-600 tracking-widest uppercase mb-3">About this video</p>
            <h3 className="text-2xl sm:text-3xl font-[900] tracking-tight mb-5 text-zinc-900">
              The fastest, fairest crypto you've never heard of.
            </h3>
            <p className="text-zinc-600 text-[15px] leading-relaxed mb-6">
              This 60-second short breaks down the core idea behind Kaspa: a proof-of-work cryptocurrency that processes
              <span className="font-bold text-zinc-900"> thousands of transactions per second </span>
              using a revolutionary <span className="font-bold text-zinc-900">blockDAG architecture</span>. No premine, no ICO,
              no VC funding — just pure decentralized math doing what Bitcoin promised, but at internet speed.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0">
              <div className="bg-white rounded-xl p-3 ring-1 ring-zinc-200/60 text-center">
                <div className="text-lg font-[900] text-cyan-600">10K+</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">TPS</div>
              </div>
              <div className="bg-white rounded-xl p-3 ring-1 ring-zinc-200/60 text-center">
                <div className="text-lg font-[900] text-violet-600">1s</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Blocks</div>
              </div>
              <div className="bg-white rounded-xl p-3 ring-1 ring-zinc-200/60 text-center">
                <div className="text-lg font-[900] text-emerald-600">0%</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Premine</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}