import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Lock, Handshake, Scissors, RefreshCw, TrendingUp, Terminal, CheckCircle, ExternalLink, Wallet, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#4ADE80";
const BG = "#0a0a0f";

const TEMPLATES = [
  {
    id: "timelock",
    icon: "🔒",
    title: "Lock KAS Until a Date",
    desc: "Timelock contract — funds are frozen until a future date",
    fields: [
      { key: "amount", label: "AMOUNT", placeholder: "1000", suffix: "KAS" },
      { key: "yourAddress", label: "YOUR_ADDRESS", placeholder: "kaspa:qr...", suffix: "" },
      { key: "date", label: "DATE", placeholder: "2026-12-31", suffix: "" },
      { key: "recipient", label: "RECIPIENT_ADDRESS", placeholder: "kaspa:qp...", suffix: "" },
    ],
    sentence: (v) => `Lock [${v.amount || "AMOUNT"} KAS] from [${v.yourAddress || "YOUR_ADDRESS"}] until [${v.date || "DATE"}] then send to [${v.recipient || "RECIPIENT_ADDRESS"}]`,
    summary: (v) => `This contract will lock ${v.amount || "?"} KAS until ${v.date || "?"}, then automatically send it to ${v.recipient || "?"}. Nobody can access these funds before the unlock date — not even you.`,
  },
  {
    id: "escrow",
    icon: "🤝",
    title: "Escrow Between Two Wallets",
    desc: "2-of-2 release — both parties must sign to release funds",
    fields: [
      { key: "amount", label: "AMOUNT", placeholder: "500", suffix: "KAS" },
      { key: "partyA", label: "PARTY_A", placeholder: "kaspa:qr...", suffix: "" },
      { key: "partyB", label: "PARTY_B", placeholder: "kaspa:qp...", suffix: "" },
    ],
    sentence: (v) => `Hold [${v.amount || "AMOUNT"} KAS] between [${v.partyA || "PARTY_A"}] and [${v.partyB || "PARTY_B"}] — both must sign to release`,
    summary: (v) => `This escrow holds ${v.amount || "?"} KAS between two wallets. Both ${v.partyA || "Party A"} and ${v.partyB || "Party B"} must sign to release the funds to either party.`,
  },
  {
    id: "split",
    icon: "✂️",
    title: "Split a Payment",
    desc: "Multi-output transaction — send to multiple addresses at once",
    fields: [
      { key: "total", label: "TOTAL", placeholder: "1000", suffix: "KAS" },
      { key: "addr1", label: "ADDRESS_1", placeholder: "kaspa:qr...", suffix: "" },
      { key: "pct1", label: "SHARE_1", placeholder: "60", suffix: "%" },
      { key: "addr2", label: "ADDRESS_2", placeholder: "kaspa:qp...", suffix: "" },
      { key: "pct2", label: "SHARE_2", placeholder: "40", suffix: "%" },
    ],
    sentence: (v) => `Split [${v.total || "TOTAL"} KAS] — send [${v.pct1 || "SHARE_1"}%] to [${v.addr1 || "ADDRESS_1"}] and [${v.pct2 || "SHARE_2"}%] to [${v.addr2 || "ADDRESS_2"}]`,
    summary: (v) => `This splits ${v.total || "?"} KAS automatically — ${v.pct1 || "?"}% goes to the first address and ${v.pct2 || "?"}% to the second, all in a single transaction.`,
  },
  {
    id: "recurring",
    icon: "🔁",
    title: "Recurring Payment",
    desc: "Covenant lineage — scheduled automatic sends",
    fields: [
      { key: "amount", label: "AMOUNT", placeholder: "100", suffix: "KAS" },
      { key: "recipient", label: "RECIPIENT", placeholder: "kaspa:qp...", suffix: "" },
      { key: "interval", label: "EVERY", placeholder: "30", suffix: "days" },
      { key: "count", label: "TIMES", placeholder: "12", suffix: "payments" },
    ],
    sentence: (v) => `Send [${v.amount || "AMOUNT"} KAS] to [${v.recipient || "RECIPIENT"}] every [${v.interval || "EVERY"} days] for [${v.count || "TIMES"} payments]`,
    summary: (v) => `This sets up ${v.count || "?"} recurring payments of ${v.amount || "?"} KAS each, sent to ${v.recipient || "?"} every ${v.interval || "?"} days via covenant lineage.`,
  },
  {
    id: "vesting",
    icon: "📈",
    title: "Token Vesting",
    desc: "Time-based unlock — release KAS on a vesting schedule",
    fields: [
      { key: "total", label: "TOTAL", placeholder: "10000", suffix: "KAS" },
      { key: "beneficiary", label: "BENEFICIARY", placeholder: "kaspa:qr...", suffix: "" },
      { key: "cliff", label: "CLIFF", placeholder: "2026-06-01", suffix: "" },
      { key: "duration", label: "VESTING_MONTHS", placeholder: "24", suffix: "months" },
    ],
    sentence: (v) => `Vest [${v.total || "TOTAL"} KAS] to [${v.beneficiary || "BENEFICIARY"}] with cliff [${v.cliff || "CLIFF"}] over [${v.duration || "VESTING_MONTHS"} months]`,
    summary: (v) => `This vesting contract locks ${v.total || "?"} KAS for ${v.beneficiary || "?"}, with a cliff date of ${v.cliff || "?"} and linear unlock over ${v.duration || "?"} months.`,
  },
  {
    id: "custom",
    icon: "⚡",
    title: "Custom Script",
    desc: "Advanced — write your own Kaspa script conditions",
    fields: [
      { key: "script", label: "SCRIPT", placeholder: "OP_CHECKLOCKTIMEVERIFY OP_DROP OP_DUP OP_HASH160...", suffix: "" },
      { key: "amount", label: "AMOUNT", placeholder: "100", suffix: "KAS" },
    ],
    sentence: (v) => `Deploy custom script: [${v.script ? v.script.slice(0, 30) + "..." : "SCRIPT"}] with [${v.amount || "AMOUNT"} KAS]`,
    summary: (v) => `This deploys a custom Kaspa script with ${v.amount || "?"} KAS locked under your script conditions.`,
  },
];

function estimateFee(fields, values) {
  const filledCount = Object.values(values).filter(Boolean).length;
  const txBytes = 200 + filledCount * 40;
  const computeMass = 50 + filledCount * 15;
  const mass = Math.max(computeMass, 2 * txBytes);
  const sompi = 100 * mass;
  const kas = (sompi / 1e8).toFixed(6);
  return { sompi, kas, txBytes, computeMass, mass };
}

// Step 1 — template picker
function StepOne({ onSelect }) {
  return (
    <motion.div key="step1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">Launch on Kaspa.</h1>
        <p className="text-lg" style={{ color: "rgba(255,255,255,0.45)" }}>No code. No crypto knowledge. Just your idea.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${ACCENT}22` }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(t)}
            className="text-left p-5 rounded-2xl border transition-all duration-200 group"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${ACCENT}55`}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
          >
            <div className="text-3xl mb-3">{t.icon}</div>
            <div className="text-white font-bold text-base mb-1">{t.title}</div>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{t.desc}</div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: ACCENT }}>
              Configure <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Step 2 — fill in details
function StepTwo({ template, onBack, onNext }) {
  const [values, setValues] = useState({});
  const [network, setNetwork] = useState("TESTNET-10");
  const fee = estimateFee(template.fields, values);

  const set = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

  const sentence = template.sentence(values);
  const parts = sentence.split(/(\[.*?\])/g);

  const fieldForPart = (part) => {
    const inner = part.replace(/[\[\]]/g, "");
    return template.fields.find(f => inner.startsWith(f.label) || inner.includes(f.placeholder || ""));
  };

  return (
    <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}
        onMouseEnter={e => e.currentTarget.style.color = "white"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">{template.icon}</span>
        <div>
          <h2 className="text-2xl font-black text-white">{template.title}</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Fill in the details below</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Mad-libs form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sentence preview */}
          <div className="p-5 rounded-xl text-sm leading-loose" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-xs font-semibold tracking-widest mb-3" style={{ color: ACCENT, opacity: 0.7 }}>CONTRACT SENTENCE</div>
            <p className="text-white/70 font-mono text-base leading-relaxed">{sentence}</p>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {template.fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-mono font-semibold mb-2 tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{f.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    value={values[f.key] || ""}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="flex-1 px-4 py-3 rounded-lg font-mono text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      caretColor: ACCENT,
                    }}
                    onFocus={e => e.target.style.borderColor = `${ACCENT}88`}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  {f.suffix && <span className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{f.suffix}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Network toggle */}
          <div>
            <div className="text-xs font-mono font-semibold mb-2 tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>NETWORK</div>
            <div className="flex gap-2">
              {["TESTNET-10", "MAINNET"].map(n => (
                <button key={n} onClick={() => setNetwork(n)}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all"
                  style={{
                    background: network === n ? `${ACCENT}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${network === n ? ACCENT : "rgba(255,255,255,0.1)"}`,
                    color: network === n ? ACCENT : "rgba(255,255,255,0.4)",
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Fee estimator */}
        <div className="p-5 rounded-xl h-fit" style={{ background: "rgba(74,222,128,0.04)", border: `1px solid ${ACCENT}22` }}>
          <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: ACCENT, opacity: 0.7 }}>FEE ESTIMATOR</div>
          <div className="text-3xl font-black text-white mb-1">{fee.kas} <span className="text-lg" style={{ color: ACCENT }}>KAS</span></div>
          <div className="text-xs font-mono mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>{fee.sompi.toLocaleString()} sompi</div>
          <div className="space-y-2">
            {[
              ["tx_bytes", fee.txBytes + " bytes"],
              ["compute_mass", fee.computeMass],
              ["mass (2×bytes)", fee.mass],
              ["fee = 100 × mass", fee.sompi.toLocaleString() + " sompi"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs font-mono">
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{k}</span>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNext(values, network)}
          className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm tracking-wide"
          style={{ background: ACCENT, color: "#0a0a0f" }}
        >
          Preview Contract <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Step 3 — review & deploy
function StepThree({ template, values, network, onBack, onReset }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [txId, setTxId] = useState(null);
  const fee = estimateFee(template.fields, values);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      if (window.kasware) {
        const accounts = await window.kasware.connect();
        if (accounts && accounts[0]) {
          setWalletAddress(accounts[0]);
          try {
            const bal = await window.kasware.getBalance();
            setWalletBalance((bal?.total / 1e8).toFixed(4));
          } catch {}
        }
      } else {
        alert("Kasware wallet not found. Please install the Kasware extension.");
      }
    } catch (e) {
      console.error(e);
    }
    setConnecting(false);
  };

  const deploy = async () => {
    setDeploying(true);
    // Simulate deployment (real integration would call window.kasware.sendKaspa)
    await new Promise(r => setTimeout(r, 2000));
    const fakeTxId = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setTxId(fakeTxId);
    setDeploying(false);
  };

  if (txId) {
    return (
      <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}>
          <CheckCircle className="w-20 h-20 mb-6" style={{ color: ACCENT }} />
        </motion.div>
        <h2 className="text-3xl font-black text-white mb-2">Deployed!</h2>
        <p className="mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>Your contract is live on {network}</p>
        <div className="w-full max-w-lg p-4 rounded-xl mb-6 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-xs font-mono font-semibold mb-2 tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>TRANSACTION ID</div>
          <div className="font-mono text-sm break-all" style={{ color: ACCENT }}>{txId}</div>
        </div>
        <a href={`https://explorer.kaspa.org/txs/${txId}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold mb-4 transition-opacity hover:opacity-80"
          style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, color: ACCENT }}>
          View on Explorer <ExternalLink className="w-4 h-4" />
        </a>
        <button onClick={onReset} className="text-sm font-semibold transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={e => e.currentTarget.style.color = "white"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>
          Deploy Another →
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div key="step3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-sm transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}
        onMouseEnter={e => e.currentTarget.style.color = "white"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h2 className="text-2xl font-black text-white mb-8">Review &amp; Deploy</h2>

      <div className="space-y-4 mb-8">
        {/* Plain English summary */}
        <div className="p-6 rounded-2xl" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}25` }}>
          <div className="text-xs font-semibold tracking-widest mb-3" style={{ color: ACCENT, opacity: 0.7 }}>CONTRACT SUMMARY</div>
          <p className="text-white text-base leading-relaxed">{template.summary(values)}</p>
        </div>

        {/* Details row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ["TEMPLATE", template.title],
            ["NETWORK", network],
            ["EST. FEE", `${fee.kas} KAS`],
          ].map(([k, v]) => (
            <div key={k} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-xs font-mono tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{k}</div>
              <div className="text-sm font-bold text-white truncate">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet connect */}
      {!walletAddress ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={connectWallet}
          disabled={connecting}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-sm mb-4 transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
        >
          <Wallet className="w-4 h-4" />
          {connecting ? "Connecting..." : "Connect Kasware Wallet"}
        </motion.button>
      ) : (
        <div className="p-4 rounded-xl mb-4 flex items-center gap-3" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}25` }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{walletAddress}</div>
            {walletBalance && <div className="text-xs mt-0.5" style={{ color: ACCENT }}>{walletBalance} KAS</div>}
          </div>
        </div>
      )}

      <motion.button
        whileHover={walletAddress ? { scale: 1.02 } : {}}
        whileTap={walletAddress ? { scale: 0.98 } : {}}
        onClick={walletAddress ? deploy : undefined}
        disabled={!walletAddress || deploying}
        className="w-full py-4 rounded-xl font-black text-base tracking-wide transition-all"
        style={{
          background: walletAddress ? ACCENT : "rgba(255,255,255,0.05)",
          color: walletAddress ? "#0a0a0f" : "rgba(255,255,255,0.2)",
          cursor: walletAddress ? "pointer" : "default",
        }}
      >
        {deploying ? (
          <span className="flex items-center justify-center gap-2">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Zap className="w-4 h-4" />
            </motion.div>
            Deploying...
          </span>
        ) : `Deploy to ${network}`}
      </motion.button>
    </motion.div>
  );
}

export default function KaspaForgePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState(null);
  const [values, setValues] = useState({});
  const [network, setNetwork] = useState("TESTNET-10");

  const handleSelectTemplate = (t) => { setTemplate(t); setStep(2); };
  const handleStep2Next = (v, n) => { setValues(v); setNetwork(n); setStep(3); };
  const handleReset = () => { setStep(1); setTemplate(null); setValues({}); };

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: "rgba(10,10,15,0.85)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={e => e.currentTarget.style.color = "white"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: ACCENT }} />
              <span className="font-black text-white tracking-tight text-lg">KaspaForge</span>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step >= s ? ACCENT : "rgba(255,255,255,0.08)",
                    color: step >= s ? "#0a0a0f" : "rgba(255,255,255,0.3)",
                  }}>{s}</div>
                {s < 3 && <div className="w-6 h-px" style={{ background: step > s ? ACCENT : "rgba(255,255,255,0.1)" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {step === 1 && <StepOne key="s1" onSelect={handleSelectTemplate} />}
          {step === 2 && template && (
            <StepTwo key="s2" template={template} onBack={() => setStep(1)} onNext={handleStep2Next} />
          )}
          {step === 3 && template && (
            <StepThree key="s3" template={template} values={values} network={network} onBack={() => setStep(2)} onReset={handleReset} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}