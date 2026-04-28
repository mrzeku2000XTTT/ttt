import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Twitter, Instagram, Linkedin } from "lucide-react";

/**
 * BrandPreview — live landing page preview that builds itself
 * from whatever fields exist on the brand record.
 * Renders progressively as the agent fills in: name, palette, voice, logo, copy.
 */
export default function BrandPreview({ brand }) {
  const palette = brand?.palette || [];
  const primary = palette[0] || "#06b6d4";
  const accent = palette[1] || "#a855f7";
  const dark = palette[2] || "#0a0a0a";
  const light = palette[3] || "#fafafa";

  const heroBg = useMemo(
    () => `radial-gradient(1200px 600px at 20% 0%, ${hexToRgba(primary, 0.35)} 0%, transparent 60%),
           radial-gradient(900px 500px at 90% 100%, ${hexToRgba(accent, 0.3)} 0%, transparent 60%),
           linear-gradient(135deg, ${dark} 0%, #000 100%)`,
    [primary, accent, dark]
  );

  const empty = !brand || (!brand.name && !brand.description);

  if (empty) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm">Live preview</div>
          <p className="text-white/40 text-xs mt-1 max-w-[220px]">
            Your landing page builds itself here as you chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky preview frame label */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-black/70 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
        <div className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
          Live Preview · {brand.completion || 0}%
        </div>
        <div className="w-12" />
      </div>

      {/* Rendered landing page */}
      <motion.div
        key={`${brand.name}-${palette.join("")}-${brand.logo_url || ""}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-full"
        style={{ background: heroBg, color: light }}
      >
        {/* Mini nav */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2">
            {brand.logo_url ? (
              <div className="w-7 h-7 rounded-lg bg-white overflow-hidden flex-shrink-0">
                <img src={brand.logo_url} alt="" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                style={{ background: primary, color: dark }}
              >
                {(brand.name || "B").charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-[900] tracking-tight text-sm">{brand.name || "Untitled"}</span>
          </div>
          <button
            className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full"
            style={{ background: hexToRgba(light, 0.1), border: `1px solid ${hexToRgba(light, 0.2)}` }}
          >
            Get started
          </button>
        </div>

        {/* Hero */}
        <div className="px-5 pt-12 pb-10 text-center">
          {brand.logo_url && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-white p-2 shadow-2xl"
            >
              <img src={brand.logo_url} alt="" className="w-full h-full object-contain" />
            </motion.div>
          )}

          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-4xl sm:text-5xl font-[900] tracking-tight leading-[1.05]"
            style={{ color: light }}
          >
            {brand.tagline || brand.name || "Your headline"}
          </motion.h1>

          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-md mx-auto text-sm leading-relaxed"
            style={{ color: hexToRgba(light, 0.7) }}
          >
            {brand.hero_copy || brand.description || "Tell the world what you do."}
          </motion.p>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            <button
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-xs tracking-wide shadow-lg"
              style={{ background: primary, color: dark }}
            >
              Start now <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              className="px-5 py-2.5 rounded-full font-bold text-xs tracking-wide"
              style={{ background: hexToRgba(light, 0.08), color: light, border: `1px solid ${hexToRgba(light, 0.18)}` }}
            >
              Learn more
            </button>
          </motion.div>
        </div>

        {/* Palette strip */}
        {palette.length > 0 && (
          <div className="px-5">
            <div className="rounded-xl overflow-hidden flex h-10 shadow-lg" style={{ border: `1px solid ${hexToRgba(light, 0.1)}` }}>
              {palette.map((c, i) => (
                <div key={c + i} className="flex-1" style={{ background: c }} />
              ))}
            </div>
          </div>
        )}

        {/* Audience + Industry */}
        {(brand.target_audience || brand.industry) && (
          <div className="px-5 mt-8 grid grid-cols-2 gap-3">
            {brand.industry && (
              <Card light={light} accent={accent}>
                <div className="text-[9px] font-bold tracking-widest uppercase opacity-60 mb-1">Industry</div>
                <div className="text-sm font-bold">{brand.industry}</div>
              </Card>
            )}
            {brand.target_audience && (
              <Card light={light} accent={accent}>
                <div className="text-[9px] font-bold tracking-widest uppercase opacity-60 mb-1">For</div>
                <div className="text-sm font-bold leading-snug">{brand.target_audience}</div>
              </Card>
            )}
          </div>
        )}

        {/* Voice */}
        {brand.voice && (
          <div className="px-5 mt-6">
            <Card light={light} accent={primary}>
              <div className="text-[9px] font-bold tracking-widest uppercase opacity-60 mb-2">Voice</div>
              <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: hexToRgba(light, 0.85) }}>
                {brand.voice}
              </div>
            </Card>
          </div>
        )}

        {/* Social bios */}
        {brand.social_bios && (brand.social_bios.twitter || brand.social_bios.instagram || brand.social_bios.linkedin) && (
          <div className="px-5 mt-6 space-y-2">
            {brand.social_bios.twitter && (
              <SocialRow icon={Twitter} label="Twitter" text={brand.social_bios.twitter} light={light} />
            )}
            {brand.social_bios.instagram && (
              <SocialRow icon={Instagram} label="Instagram" text={brand.social_bios.instagram} light={light} />
            )}
            {brand.social_bios.linkedin && (
              <SocialRow icon={Linkedin} label="LinkedIn" text={brand.social_bios.linkedin} light={light} />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 mt-10 pb-8 text-center">
          <div className="text-[10px] tracking-widest uppercase font-bold" style={{ color: hexToRgba(light, 0.4) }}>
            © {brand.name || "Brand"} · Built with NODA
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Card({ children, light, accent }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: hexToRgba(light, 0.05),
        border: `1px solid ${hexToRgba(accent || light, 0.18)}`,
        color: light,
      }}
    >
      {children}
    </div>
  );
}

function SocialRow({ icon: Icon, label, text, light }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{ background: hexToRgba(light, 0.05), border: `1px solid ${hexToRgba(light, 0.12)}` }}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: light }} />
      <div className="min-w-0">
        <div className="text-[9px] font-bold tracking-widest uppercase opacity-60 mb-0.5">{label}</div>
        <div className="text-[11px] leading-snug" style={{ color: hexToRgba(light, 0.85) }}>{text}</div>
      </div>
    </div>
  );
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}