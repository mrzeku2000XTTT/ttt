import { ExternalLink, Gamepad2, Star, Users, Zap } from "lucide-react";

export default function Farlands() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-yellow-500/10 via-black to-black" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Icon */}
        <div className="mb-6 relative">
          <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl shadow-yellow-500/30 border-2 border-yellow-500/30">
            <img
              src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/869680b72_IMG_0177.jpeg"
              alt="Farlands"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <Gamepad2 className="w-4 h-4 text-black" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-white text-4xl font-black mb-2 tracking-tight">Farlands</h1>
        <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-4">Web3 Adventure Game</p>
        <p className="text-white/60 text-base leading-relaxed mb-8">
          Explore a vast open world, build your empire, and earn real rewards in this blockchain-powered adventure game.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 w-full mb-10">
          {[
            { icon: Star, label: "Play & Earn" },
            { icon: Users, label: "Multiplayer" },
            { icon: Zap, label: "On-Chain" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <Icon className="w-5 h-5 text-yellow-400" />
              <span className="text-white/70 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href="https://farlands.world"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg rounded-2xl shadow-lg shadow-yellow-500/30 transition-all active:scale-95"
        >
          <ExternalLink className="w-5 h-5" />
          Play Farlands
        </a>

        <p className="mt-4 text-white/30 text-xs">Opens in a new tab • farlands.world</p>
      </div>
    </div>
  );
}