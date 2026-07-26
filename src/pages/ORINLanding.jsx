import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, Brain, ArrowLeft } from "lucide-react";

// Compass Rose SVG logo
function CompassRose({ size = 28, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="14" stroke="#C9A84C" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="3" fill="#C9A84C" />
      {/* N */}
      <polygon points="16,2 14.2,12 16,10 17.8,12" fill="#C9A84C" />
      {/* S */}
      <polygon points="16,30 14.2,20 16,22 17.8,20" fill="#C9A84C" opacity="0.6" />
      {/* E */}
      <polygon points="30,16 20,14.2 22,16 20,17.8" fill="#C9A84C" opacity="0.6" />
      {/* W */}
      <polygon points="2,16 12,14.2 10,16 12,17.8" fill="#C9A84C" opacity="0.6" />
      {/* diagonals */}
      <polygon points="27.1,4.9 19.5,13.2 21.2,14.9" fill="#C9A84C" opacity="0.35" />
      <polygon points="4.9,27.1 12.5,18.8 10.8,17.1" fill="#C9A84C" opacity="0.35" />
      <polygon points="27.1,27.1 18.8,19.5 17.1,21.2" fill="#C9A84C" opacity="0.35" />
      <polygon points="4.9,4.9 13.2,12.5 14.9,10.8" fill="#C9A84C" opacity="0.35" />
    </svg>
  );
}

// Compass Rose in a rounded square (for cards)
function CompassBadge({ size = 36 }) {
  return (
    <div
      style={{ width: size, height: size, background: "#C9A84C", borderRadius: size * 0.28 }}
      className="flex items-center justify-center flex-shrink-0"
    >
      <CompassRose size={size * 0.65} />
    </div>
  );
}

const CARDS = [
  {
    id: 1,
    match: 98,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=700&h=500&fit=crop",
    label: "ORIN matched this for you",
    sub: "Based on 6 past trips · boutique · city center · mid-range",
  },
  {
    id: 2,
    match: 94,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=700&h=500&fit=crop",
    label: "Playfair Display",
    sub: "Based on 6 past trips",
    blurred: true,
  },
  {
    id: 3,
    match: 91,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700&h=500&fit=crop",
    label: "Playfair Display",
    sub: "Based on 6 past trips",
    blurred: true,
  },
];

const FEATURES = [
  { title: "Learns Your Travel Style", desc: "ORIN builds a memory of your budget range, preferred locations, hotel style, and past choices — no more starting from scratch." },
  { title: "Smarter Picks Every Time", desc: "The more you use ORIN, the better it gets. Suggestions improve as it understands what you actually like." },
  { title: "No More Endless Filtering", desc: "Skip the comparison trap. ORIN surfaces stays that fit you, not a list of everything available." },
  { title: "Your Preferences, Private", desc: "Your travel data stays yours. ORIN uses it only to improve your experience — never shared or sold." },
];

const STEPS = [
  { step: "01", title: "Tell ORIN where you're going", desc: "Drop in your destination and travel dates." },
  { step: "02", title: "ORIN learns from your choices", desc: "Rate stays, save favorites, and let it observe your patterns." },
  { step: "03", title: "Get matched, not just listed", desc: "ORIN surfaces hotels that actually fit your style and budget." },
];

export default function ORINLanding() {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#070B14", color: "#fff", fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 52,
        background: "rgba(7,11,20,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            to="/AppStoreV2"
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", padding: "4px 6px 4px 0", textDecoration: "none" }}
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </Link>
          <CompassBadge size={30} />
          <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 17, letterSpacing: "0.04em", color: "#fff" }}>Landed</span>
        </div>
        <Link
          to="/ORIN"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#C9A84C", color: "#070B14",
            fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 13,
            padding: "7px 16px", borderRadius: 999, textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          Launch App →
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", height: "100vh", minHeight: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 60 }}>
        {/* Full-bleed background image */}
        <img
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&h=900&fit=crop"
          alt="Luxury overwater bungalows"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        />
        {/* Dark gradient overlay — bottom heavy */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(7,11,20,0.15) 0%, rgba(7,11,20,0.3) 40%, rgba(7,11,20,0.85) 70%, rgba(7,11,20,1) 100%)",
        }} />

        {/* Hero text */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 540, padding: "0 24px" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 13, letterSpacing: "0.15em", color: "rgba(255,255,255,0.55)", marginBottom: 12, fontStyle: "italic" }}>
            Travel Intelligence System
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "clamp(36px, 8vw, 56px)", lineHeight: 1.1, margin: "0 0 8px", color: "#fff" }}>
            Hotels that know
          </h1>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "clamp(36px, 8vw, 56px)", lineHeight: 1.1, margin: "0 0 20px", color: "#C9A84C" }}>
            how you travel
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", maxWidth: 460, margin: "0 auto 32px", fontFamily: "Georgia, serif" }}>
            ORIN learns your preferences over time — budget, location style, hotel vibe — and uses that to surface stays that actually fit you. No more searching from scratch every trip.
          </p>
        </div>

        {/* thin gold divider */}
        <div style={{ position: "relative", zIndex: 2, width: "80%", maxWidth: 500, height: 1, background: "linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)", marginBottom: 0 }} />
      </section>

      {/* ── CARD CAROUSEL ── */}
      <section style={{ background: "#070B14", overflow: "hidden", position: "relative" }}>
        {/* The layout: left peek | center featured | right peek */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0 40px", gap: 0 }}>

          {/* LEFT peek card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              position: "relative", width: 200, height: 290, borderRadius: 18,
              overflow: "hidden", flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.06)",
              filter: "blur(2px) brightness(0.45)",
              marginRight: -40, zIndex: 1,
            }}
          >
            <img src={CARDS[2].image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(7,11,20,0.9) 100%)" }} />
            <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 999, padding: "3px 9px" }}>
              <span style={{ fontSize: 10, color: "#C9A84C", fontFamily: "Georgia, serif" }}>✦ Match</span>
            </div>
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 3, background: "rgba(0,0,0,0.4)", borderRadius: 999, padding: "3px 8px" }}>
              <Star style={{ width: 10, height: 10, color: "#C9A84C", fill: "#C9A84C" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif" }}>{CARDS[2].match}%</span>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 12px" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Playfair Display</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "Georgia, serif" }}>Based on 6 past trips</p>
            </div>
          </motion.div>

          {/* CENTER featured card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              position: "relative", width: 320, height: 380, borderRadius: 22,
              overflow: "hidden", flexShrink: 0,
              border: "1.5px solid rgba(201,168,76,0.45)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,168,76,0.1)",
              zIndex: 3,
            }}
          >
            <img src={CARDS[0].image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(7,11,20,0.05) 20%, rgba(7,11,20,0.88) 100%)" }} />
            <div style={{ position: "absolute", top: 14, left: 14 }}>
              <CompassBadge size={36} />
            </div>
            <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.5)", borderRadius: 999, padding: "5px 11px", backdropFilter: "blur(8px)" }}>
              <Star style={{ width: 12, height: 12, color: "#C9A84C", fill: "#C9A84C" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif" }}>98%</span>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 20px 20px" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, marginBottom: 5 }}>
                <span style={{ color: "#C9A84C" }}>ORIN</span>{" "}
                <span style={{ color: "#fff" }}>matched this for you</span>
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Georgia, serif" }}>
                Based on 6 past trips · boutique · city center · mid-range
              </p>
            </div>
          </motion.div>

          {/* RIGHT peek card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              position: "relative", width: 200, height: 290, borderRadius: 18,
              overflow: "hidden", flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.06)",
              filter: "blur(2px) brightness(0.45)",
              marginLeft: -40, zIndex: 1,
            }}
          >
            <img src={CARDS[1].image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(7,11,20,0.9) 100%)" }} />
            <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 999, padding: "3px 9px" }}>
              <span style={{ fontSize: 10, color: "#C9A84C", fontFamily: "Georgia, serif" }}>✦ Match</span>
            </div>
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 3, background: "rgba(0,0,0,0.4)", borderRadius: 999, padding: "3px 8px" }}>
              <Star style={{ width: 10, height: 10, color: "#C9A84C", fill: "#C9A84C" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif" }}>{CARDS[1].match}%</span>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 12px" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Playfair Display</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "Georgia, serif" }}>Based on 6 past trips</p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── CTA BUTTONS ── */}
      <section style={{ background: "#070B14", display: "flex", justifyContent: "center", gap: 14, padding: "10px 24px 60px" }}>
        <Link
          to="/ORIN"
          style={{
            background: "#C9A84C", color: "#070B14",
            fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 14,
            padding: "13px 26px", borderRadius: 999, textDecoration: "none",
            display: "flex", alignItems: "center", gap: 6,
            letterSpacing: "0.01em",
          }}
        >
          Start Your Travel Profile →
        </Link>
        <a
          href="#how"
          style={{
            background: "transparent", color: "#fff",
            fontFamily: "Georgia, serif", fontSize: 14,
            padding: "13px 26px", borderRadius: 999, textDecoration: "none",
            border: "1.5px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center",
            letterSpacing: "0.01em",
          }}
        >
          See how it works
        </a>
      </section>

      {/* thin gold divider */}
      <div style={{ width: "100%", height: 1, background: "linear-gradient(to right, transparent, rgba(201,168,76,0.3), transparent)" }} />

      {/* ── FEATURES ── */}
      <section style={{ background: "#070B14", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 700, color: "#fff", marginBottom: 10 }}>
              Built for frequent travelers
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, fontFamily: "Georgia, serif" }}>
              If you value convenience over comparison, ORIN was made for you.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{
                  padding: "24px 22px",
                  borderRadius: 16,
                  border: "1px solid rgba(201,168,76,0.15)",
                  background: "rgba(201,168,76,0.03)",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 999, background: "#C9A84C", marginBottom: 14 }} />
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, fontFamily: "Georgia, serif" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background: "#070B14", padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 700, color: "#fff", marginBottom: 10 }}>
              How ORIN works
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, fontFamily: "Georgia, serif" }}>
              Three simple steps to smarter hotel booking.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  display: "flex", gap: 20, alignItems: "flex-start",
                  padding: "20px 22px", borderRadius: 16,
                  border: "1px solid rgba(201,168,76,0.12)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "rgba(201,168,76,0.25)", lineHeight: 1, minWidth: 36 }}>{s.step}</span>
                <div>
                  <h3 style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "Georgia, serif" }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ background: "#070B14", padding: "20px 24px 80px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: 560, margin: "0 auto", textAlign: "center",
            padding: "52px 40px",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(7,11,20,0) 100%)",
          }}
        >
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            Ready to travel smarter?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 28, fontFamily: "Georgia, serif" }}>
            Build your travel profile and let ORIN find stays that actually fit you.
          </p>
          <Link
            to="/ORIN"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#C9A84C", color: "#070B14",
              fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 14,
              padding: "13px 28px", borderRadius: 999, textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            Launch ORIN
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <CompassRose size={16} />
          <span style={{ fontSize: 11, letterSpacing: "0.25em", color: "rgba(255,255,255,0.2)", fontFamily: "Georgia, serif", textTransform: "uppercase" }}>
            Landed · Travel Intelligence
          </span>
        </div>
      </footer>

    </div>
  );
}