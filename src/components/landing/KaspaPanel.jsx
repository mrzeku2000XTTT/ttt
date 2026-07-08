import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Copy, Check, ArrowRight, Zap, Network, Shield, Sparkles, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

const SESSION_KEY = "kaspa_panel_wallet";
const ONBOARDING_KEY = "kaspa_onboarding_v1";
const KASPA_LOGO = "https://cryptologos.cc/logos/kaspa-kas-logo.png";

const IOS_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const SPRING = { type: "spring", stiffness: 320, damping: 32 };
// iOS-style step transition — fade + subtle scale (no horizontal slide, which
// caused text to render poorly on first mount)
const STEP_TRANSITION = { duration: 0.35, ease: [0.4, 0, 0.2, 1] };

function truncateAddress(addr) {
  if (!addr) return "";
  const clean = addr.startsWith("kaspa:") ? addr : `kaspa:${addr}`;
  return `${clean.slice(0, 10)}…${clean.slice(-6)}`;
}

function StepIcon({ type }) {
  const common = "w-16 h-16 flex items-center justify-center";
  if (type === "kaspa") {
    return (
      <div className={common}>
        <img src={KASPA_LOGO} alt="Kaspa" width={64} height={64} draggable={false}
          className="w-16 h-16 object-contain"
          style={{ filter: "drop-shadow(0 0 24px rgba(70,130,255,0.35))" }} />
      </div>
    );
  }
  const icons = { network: Network, zap: Zap, shield: Shield, sparkles: Sparkles };
  const Icon = icons[type] || Sparkles;
  return (
    <div className={common + " rounded-3xl"} style={{ background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.2)" }}>
      <Icon className="w-8 h-8" style={{ color: "#0A84FF" }} strokeWidth={1.8} />
    </div>
  );
}

const STEPS = [
  { icon: "kaspa", title: "Welcome to Kaspa", subtitle: "The fastest proof-of-work cryptocurrency",
    body: "Kaspa is a Layer-1 blockchain built on BlockDAG — a revolutionary architecture that processes blocks in parallel instead of one at a time." },
  { icon: "network", title: "Not a Chain. A Graph.", subtitle: "GhostDAG protocol",
    body: "Traditional blockchains orphan conflicting blocks. Kaspa's GhostDAG orders them in parallel — more throughput, no wasted work, true decentralization." },
  { icon: "zap", title: "1 Block Per Second", subtitle: "Instant confirmation",
    body: "Transactions settle in seconds. Send KAS to anyone, anywhere on Earth — faster than any traditional payment rail." },
  { icon: "shield", title: "Fair From Day One", subtitle: "No premine · No ICO · No dev tax",
    body: "Kaspa launched with zero premine and zero developer allocation. The creators mined alongside everyone else. Truly fair, truly decentralized." },
];

export default function KaspaPanel({ onClose }) {
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  const [source, setSource] = useState(null);
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [price, setPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [priceLoading, setPriceLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (saved?.address) { setAddress(saved.address); setSource(saved.source || "session"); }
      if (localStorage.getItem(ONBOARDING_KEY) === "true") setOnboardingDone(true);
    } catch {}
    detectWallet();
    fetchPrice();
  }, []);

  const fetchPrice = async () => {
    setPriceLoading(true);
    try {
      const res = await base44.functions.invoke("getKaspaPrice", {});
      const data = res?.data || res;
      if (data?.price) { setPrice(data.price); setPriceChange(data.change24h ?? null); }
    } catch {}
    setPriceLoading(false);
  };

  const persist = (addr, src) => {
    setAddress(addr); setSource(src);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ address: addr, source: src })); } catch {}
  };

  const detectWallet = async () => {
    setChecking(true); setError(null);
    if (typeof window.kasware !== "undefined") {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts?.length > 0) { persist(accounts[0], "kasware"); setChecking(false); return; }
      } catch {}
    }
    try {
      const me = await base44.auth.me();
      const saved = me?.created_wallet_address || me?.kasware_address;
      if (saved) { persist(saved, "profile"); setChecking(false); return; }
    } catch {}
    if (address) { setChecking(false); return; }
    setChecking(false);
  };

  const connectKasware = async () => {
    if (typeof window.kasware === "undefined") { setError("Kasware wallet not detected. Generate a wallet to continue."); return; }
    setConnecting(true); setError(null);
    try {
      const accounts = await window.kasware.requestAccounts();
      if (accounts?.length > 0) persist(accounts[0], "kasware");
    } catch (err) { setError(err?.message || "Failed to connect Kasware."); }
    finally { setConnecting(false); }
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const completeOnboarding = () => {
    try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch {}
    setOnboardingDone(true);
  };

  const openDashboard = () => {
    completeOnboarding();
    onClose?.();
    navigate("/Home");
  };

  const cleanAddress = address ? (address.startsWith("kaspa:") ? address : `kaspa:${address}`) : "";

  // ============ TOP BAR (shared) ============
  const TopBar = () => (
    <div className="flex items-center justify-between px-5 pt-4 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
      <button onClick={onClose} className="focus:outline-none active:scale-95 transition-transform" title="Back to landing">
        <span className="text-2xl font-bold tracking-tight" style={{
          fontFamily: IOS_FONT,
          background: "linear-gradient(180deg, #fff5cc 0%, #f0d060 25%, #c8960c 60%, #6b4200 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>TTT</span>
      </button>

      {/* Top-right: price + wallet address */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(28,28,30,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {priceLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-white/30" />
          ) : price != null ? (
            <>
              <span className="text-xs font-semibold text-white tabular-nums" style={{ fontFamily: IOS_FONT }}>
                ${price < 1 ? price.toFixed(4) : price.toFixed(2)}
              </span>
              {priceChange != null && (
                <span className="text-[10px] font-medium tabular-nums flex items-center" style={{ color: priceChange >= 0 ? "#30D158" : "#FF453A" }}>
                  {priceChange >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                  {Math.abs(priceChange).toFixed(1)}%
                </span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-white/30" style={{ fontFamily: IOS_FONT }}>—</span>
          )}
        </div>
        {cleanAddress && (
          <button onClick={copyAddress} className="px-2.5 py-1 rounded-full active:scale-95 transition-transform" style={{ background: "rgba(28,28,30,0.8)", border: "1px solid rgba(255,255,255,0.08)" }} title={cleanAddress}>
            <span className="text-[10px] font-medium text-white/60 tabular-nums" style={{ fontFamily: IOS_FONT }}>{truncateAddress(cleanAddress)}</span>
          </button>
        )}
      </div>
    </div>
  );

  // ============ PROGRESS DOTS ============
  const ProgressDots = ({ current, total }) => (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-1.5 rounded-full transition-all duration-300" style={{
          width: i === current ? 24 : 6,
          background: i <= current ? "#0A84FF" : "rgba(255,255,255,0.15)",
        }} />
      ))}
    </div>
  );

  // ============ ONBOARDING STEPS ============
  const renderOnboardingStep = () => {
    // Step 4: Wallet connection
    if (step === 4) {
      return (
        <StepShell step={4} total={6}>
          <StepIcon type="kaspa" />
          <h1 className="text-2xl font-bold text-white text-center mt-5" style={{ fontFamily: IOS_FONT }}>Connect Your Wallet</h1>
          <p className="text-sm text-white/50 text-center mt-1.5 px-2" style={{ fontFamily: IOS_FONT }}>Your gateway to the Kaspa ecosystem</p>

          <div className="w-full mt-7">
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                <span className="text-sm text-white/40" style={{ fontFamily: IOS_FONT }}>Detecting wallet…</span>
              </div>
            ) : cleanAddress ? (
              <div className="w-full rounded-2xl p-4" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <img src={KASPA_LOGO} alt="Kaspa" className="w-7 h-7 object-contain" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white" style={{ fontFamily: IOS_FONT }}>Wallet Connected</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wide" style={{ fontFamily: IOS_FONT }}>{source === "kasware" ? "Kasware Extension" : "Profile Wallet"}</div>
                  </div>
                  <Check className="w-5 h-5 text-[#30D158]" />
                </div>
                <button onClick={copyAddress} className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-xs text-white/70 font-mono truncate">{truncateAddress(cleanAddress)}</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-[#30D158] flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
                </button>
              </div>
            ) : (
              <div className="w-full">
                {error && (
                  <div className="mb-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,69,58,0.1)" }}>
                    <p className="text-xs text-[#FF453A]" style={{ fontFamily: IOS_FONT }}>{error}</p>
                  </div>
                )}
                <p className="text-sm text-white/50 text-center mb-4 px-2" style={{ fontFamily: IOS_FONT }}>No wallet detected. Connect Kasware or generate one to continue.</p>
                <button onClick={connectKasware} disabled={connecting}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{ background: "rgba(10,132,255,0.15)", border: "1px solid rgba(10,132,255,0.3)", color: "#0A84FF", fontFamily: IOS_FONT }}>
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <img src={KASPA_LOGO} alt="" className="w-4 h-4 object-contain" />}
                  {connecting ? "Connecting…" : "Connect Kasware"}
                </button>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] uppercase tracking-wider text-white/30" style={{ fontFamily: IOS_FONT }}>or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <button onClick={() => navigate("/WalletHub")}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  style={{ background: "#0A84FF", color: "#fff", fontFamily: IOS_FONT }}>
                  <ExternalLink className="w-4 h-4" /> Generate a Wallet
                </button>
                <p className="mt-3 text-[10px] text-white/30 text-center" style={{ fontFamily: IOS_FONT }}>Generate one, then return — it'll be detected automatically.</p>
              </div>
            )}
          </div>

          {cleanAddress && <NextButton onClick={() => setStep(5)} />}
        </StepShell>
      );
    }

    // Step 5: Ready / Dashboard unlock
    if (step === 5) {
      return (
        <StepShell step={5} total={6}>
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={SPRING}
            className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "rgba(48,209,88,0.15)", border: "1px solid rgba(48,209,88,0.3)" }}>
            <Check className="w-8 h-8 text-[#30D158]" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-2xl font-bold text-white text-center mt-5" style={{ fontFamily: IOS_FONT }}>You're Ready</h1>
          <p className="text-sm text-white/50 text-center mt-1.5 px-2" style={{ fontFamily: IOS_FONT }}>Welcome to the Kaspa ecosystem</p>

          <div className="w-full mt-7 rounded-2xl p-4 space-y-3" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3">
              <img src={KASPA_LOGO} alt="" className="w-6 h-6 object-contain" />
              <span className="text-sm text-white/70" style={{ fontFamily: IOS_FONT }}>Kaspa fundamentals</span>
              <Check className="w-4 h-4 text-[#30D158] ml-auto" />
            </div>
            {cleanAddress && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(10,132,255,0.15)" }}>
                  <span className="text-[8px] text-[#0A84FF]">✓</span>
                </div>
                <span className="text-xs text-white/50 font-mono truncate" style={{ fontFamily: IOS_FONT }}>{truncateAddress(cleanAddress)}</span>
                <Check className="w-4 h-4 text-[#30D158] ml-auto" />
              </div>
            )}
          </div>

          <button onClick={openDashboard}
            className="w-full mt-6 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: "#0A84FF", color: "#fff", fontFamily: IOS_FONT, boxShadow: "0 4px 24px rgba(10,132,255,0.35)" }}>
            Open TTT Dashboard <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => { completeOnboarding(); onClose?.(); }}
            className="w-full mt-2.5 py-2.5 text-sm text-white/40 active:scale-[0.98] transition-transform" style={{ fontFamily: IOS_FONT }}>
            Back to landing
          </button>
        </StepShell>
      );
    }

    // Steps 0-3: Educational
    const s = STEPS[step];
    return (
      <StepShell step={step} total={6}>
        <StepIcon type={s.icon} />
        <h1 className="text-2xl font-bold text-white text-center mt-5 px-4" style={{ fontFamily: IOS_FONT }}>{s.title}</h1>
        <p className="text-sm font-medium text-[#0A84FF] text-center mt-1.5" style={{ fontFamily: IOS_FONT }}>{s.subtitle}</p>
        <p className="text-sm text-white/50 text-center mt-4 px-4 leading-relaxed" style={{ fontFamily: IOS_FONT }}>{s.body}</p>
        <NextButton label="Continue" onClick={() => setStep(step + 1)} />
      </StepShell>
    );
  };

  // ============ STEP SHELL ============
  const StepShell = ({ children, step: currentStep, total }) => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <AnimatePresence mode="wait">
        <motion.div key={currentStep}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={STEP_TRANSITION}
          style={{ willChange: "opacity" }}
          className="w-full max-w-sm flex flex-col items-center">
          {children}
        </motion.div>
      </AnimatePresence>
      <div className="mt-8">
        <ProgressDots current={currentStep} total={total} />
      </div>
    </div>
  );

  // ============ NEXT BUTTON ============
  const NextButton = ({ label = "Continue", onClick }) => (
    <button onClick={onClick}
      className="w-full mt-7 py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      style={{ background: "#0A84FF", color: "#fff", fontFamily: IOS_FONT, boxShadow: "0 4px 24px rgba(10,132,255,0.3)" }}>
      {label} <ArrowRight className="w-4 h-4" />
    </button>
  );

  // ============ DASHBOARD-READY VIEW (onboarding already done) ============
  const renderReadyView = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="w-full max-w-sm flex flex-col items-center">
        <img src={KASPA_LOGO} alt="Kaspa" className="w-16 h-16 object-contain" style={{ filter: "drop-shadow(0 0 24px rgba(70,130,255,0.35))" }} />
        <h1 className="text-2xl font-bold text-white text-center mt-5" style={{ fontFamily: IOS_FONT }}>Kaspa Dashboard</h1>
        <p className="text-sm text-white/50 text-center mt-1.5" style={{ fontFamily: IOS_FONT }}>Your gateway to the Kaspa ecosystem</p>

        <div className="w-full mt-7 rounded-2xl p-5" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 mb-4">
            <img src={KASPA_LOGO} alt="" className="w-8 h-8 object-contain" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white" style={{ fontFamily: IOS_FONT }}>Kaspa Wallet</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wide" style={{ fontFamily: IOS_FONT }}>{source === "kasware" ? "Kasware · Connected" : source === "profile" ? "Profile Wallet" : "Session Wallet"}</div>
            </div>
            <button onClick={detectWallet} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            </button>
          </div>
          {cleanAddress ? (
            <>
              <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5" style={{ fontFamily: IOS_FONT }}>Connected Address</div>
              <button onClick={copyAddress} className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform" style={{ background: "rgba(255,255,255,0.04)" }}>
                <span className="text-xs text-white/70 font-mono truncate">{truncateAddress(cleanAddress)}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-[#30D158] flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
              </button>
              <div className="mt-1.5 text-[10px] text-white/30" style={{ fontFamily: IOS_FONT }}>Tap to copy full address</div>
            </>
          ) : (
            <p className="text-xs text-white/40 text-center py-2" style={{ fontFamily: IOS_FONT }}>No wallet connected</p>
          )}
        </div>

        <button onClick={openDashboard}
          className="w-full mt-5 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: "#0A84FF", color: "#fff", fontFamily: IOS_FONT, boxShadow: "0 4px 24px rgba(10,132,255,0.35)" }}>
          Open TTT Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#000000", fontFamily: IOS_FONT }}>
      <TopBar />
      {onboardingDone ? renderReadyView() : renderOnboardingStep()}
      <div className="text-center pb-4 text-[10px] text-white/20" style={{ fontFamily: IOS_FONT, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}>
        © TTT PLATFORM · POWERED BY KASPA
      </div>
    </motion.div>
  );
}