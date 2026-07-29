import React from "react";

export function ChipSvg({ gradId }) {
  return (
    <svg className="w-6 h-6 sm:w-[29px] sm:h-[29px]" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M20 8H40V14C40.0016 14.5299 40.2128 15.0377 40.5875 15.4125C40.9623 15.7872 41.4701 15.9984 42 16H59V24H42C41.4701 24.0016 40.9623 24.2128 40.5875 24.5875C40.2128 24.9623 40.0016 25.4701 40 26V52H20V8ZM18 8H8.00039C4.47435 8 1.56576 10.6083 1.08 14H18V8ZM1 16V24V26V34V36V44H18V36H1V34H18V26H1V24H18V16H1ZM1.08 46C1.56576 49.3917 4.47435 52 8.00039 52H18V46H1.08ZM42 14V8H52.0004C55.5264 8 58.4342 10.6084 58.92 14H42ZM59 26H42V34H59V26ZM59 36H42V44H59V36ZM52.0004 52H42V46H58.92C58.4342 49.3916 55.5264 52 52.0004 52Z" fill={`url(#${gradId})`} />
      <defs>
        <linearGradient id={gradId} x1="30" y1="8" x2="30" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="#999999" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AgentCardFront({ videoSrc, agent, index, zOffset }) {
  return (
    <div
      className="absolute inset-0 rounded-[16px] border border-white/15 pointer-events-none overflow-hidden"
      style={{
        backgroundColor: "#0f0f0f",
        transform: `translateZ(${zOffset}px)`,
        backfaceVisibility: "hidden",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)"
      }}
    >
      <video src={videoSrc} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover rounded-[16px]" />

      <div className="absolute inset-0 p-5 sm:p-6 text-white h-full w-full z-10 bg-black/25">
        <div className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2">
          <ChipSvg gradId={`agent_chip_${index}`} />
        </div>

        {/* Agent identity — top right */}
        <div className="absolute right-5 sm:right-6 top-5 sm:top-6 text-right">
          <div className="text-[10px] sm:text-xs tracking-[0.3em] text-white/50 font-mono uppercase">Agent Internet</div>
          <div className="text-base sm:text-xl font-bold tracking-tight leading-tight">{agent.name}</div>
          <div className="text-[9px] sm:text-[11px] text-cyan-300/80 font-mono">{agent.role}</div>
        </div>

        {/* Skills — bottom left */}
        <div className="absolute left-5 sm:left-6 bottom-5 sm:bottom-6 flex flex-wrap gap-1 max-w-[60%]">
          {agent.skills.map((s) => (
            <span key={s} className="text-[7px] sm:text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/20 bg-white/10 text-white/80">
              {s}
            </span>
          ))}
        </div>

        <div className="absolute right-5 sm:right-6 bottom-5 sm:bottom-6 flex -space-x-3 items-center opacity-90">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 backdrop-blur-[1px] border border-white/10" />
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/35 backdrop-blur-[1px] border border-white/10" />
        </div>
      </div>
    </div>
  );
}

export function AgentCardBack({ videoSrc, agent, zOffset }) {
  return (
    <div
      className="absolute inset-0 rounded-[16px] border border-white/15 pointer-events-none overflow-hidden"
      style={{
        backgroundColor: "#0f0f0f",
        transform: `translateZ(${zOffset}px) rotateX(180deg)`,
        backfaceVisibility: "hidden",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)"
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ filter: "blur(16px)", transform: "scale(1.15)" }}>
        <video src={videoSrc} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
      </div>

      <div className="absolute left-0 right-0 top-4 sm:top-5 h-7 sm:h-9 bg-black/85 backdrop-blur-md z-10" />

      <div className="absolute left-4 sm:left-6 bottom-4 sm:bottom-5 z-20 flex flex-col gap-0.5 sm:gap-1 text-left" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        <div className="font-mono text-[10px] sm:text-[12px] font-medium tracking-[0.14em] text-white select-none">{agent.id}</div>
        <div className="font-mono text-[7px] sm:text-[9px] font-medium text-white/70 tracking-wide flex items-center gap-2 select-none">
          <span className="uppercase">{agent.name}</span>
          <span className="text-white/40 font-light">•</span>
          <span>{agent.protocol}</span>
          <span className="text-white/40 font-light">•</span>
          <span>KEY: {agent.key}</span>
        </div>
      </div>
    </div>
  );
}