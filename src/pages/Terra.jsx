import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, Plus, ArrowDownLeft, ArrowUpRight,
  CreditCard, ChevronRight, Eye, EyeOff,
  Home, Wallet, History, User, Scan, X, Check, RefreshCw,
  Copy, AlertTriangle, Shield
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";
const ACCENT = "#1a73e8";

function Avatar({ initials, size = 40, color = "#1c1c1e" }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: size * 0.36, fontFamily: SF, fontWeight: 600 }}>{initials}</span>
    </div>
  );
}

function SendMoneySheet({ onClose }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleKey = (k) => {
    if (k === "⌫") setAmount(a => a.slice(0, -1));
    else if (k === "." && amount.includes(".")) return;
    else if (amount.length < 8) setAmount(a => a + k);
  };

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: SF }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Send KAS</span>
        <div style={{ width: 20 }} />
      </div>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
            <input placeholder="To: Kaspa address or @username" value={recipient} onChange={e => setRecipient(e.target.value)}
              style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', fontFamily: SF, marginBottom: 24 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Amount (KAS)</span>
              <span style={{ color: 'white', fontSize: 52, fontWeight: 700, letterSpacing: -2 }}>{amount || "0"} KAS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, marginBottom: 16 }}>
              {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k => (
                <button key={k} onClick={() => handleKey(k)}
                  style={{ background: k === "⌫" ? '#2c2c2e' : '#1c1c1e', border: 'none', color: 'white', fontSize: 22, fontWeight: 500, padding: '18px 0', cursor: 'pointer', borderRadius: 10, fontFamily: SF }}>
                  {k}
                </button>
              ))}
            </div>
            <button onClick={() => amount && recipient && setStep(2)}
              style={{ background: amount && recipient ? ACCENT : '#2c2c2e', color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: amount && recipient ? 'pointer' : 'default', fontFamily: SF }}>
              Continue
            </button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', gap: 24 }}>
            <Avatar initials={recipient.slice(0, 2).toUpperCase()} size={72} color="#1c1c1e" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 6 }}>Sending to</div>
              <div style={{ color: 'white', fontSize: 16, fontWeight: 700, wordBreak: 'break-all' }}>{recipient}</div>
            </div>
            <div style={{ background: '#1c1c1e', borderRadius: 18, padding: '24px 32px', textAlign: 'center', width: '100%', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 }}>Amount</div>
              <div style={{ color: 'white', fontSize: 44, fontWeight: 700 }}>{amount} KAS</div>
            </div>
            <div style={{ marginTop: 'auto', width: '100%', display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '16px', fontSize: 16, cursor: 'pointer', fontFamily: SF }}>Back</button>
              <button onClick={() => setStep(3)} style={{ flex: 2, background: ACCENT, border: 'none', color: 'white', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: SF }}>Send {amount} KAS</button>
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '24px' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              style={{ width: 80, height: 80, borderRadius: 40, background: '#1a4a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={36} color="#34c759" strokeWidth={3} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sent!</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>{amount} KAS sent to {recipient}</div>
            </div>
            <button onClick={onClose} style={{ marginTop: 24, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '14px 32px', fontSize: 16, cursor: 'pointer', fontFamily: SF }}>Done</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RequestSheet({ onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const handleKey = (k) => {
    if (k === "⌫") setAmount(a => a.slice(0, -1));
    else if (k === "." && amount.includes(".")) return;
    else if (amount.length < 8) setAmount(a => a + k);
  };

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: SF }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Request KAS</span>
        <div style={{ width: 20 }} />
      </div>
      {sent ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}
            style={{ width: 80, height: 80, borderRadius: 40, background: '#1a3a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={36} color="#30b0c7" strokeWidth={3} />
          </motion.div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 700 }}>Request Sent!</div>
          <button onClick={onClose} style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '14px 32px', fontSize: 16, cursor: 'pointer', fontFamily: SF }}>Done</button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Request Amount (KAS)</span>
            <span style={{ color: 'white', fontSize: 52, fontWeight: 700, letterSpacing: -2 }}>{amount || "0"} KAS</span>
          </div>
          <input placeholder="Add a note..." value={note} onChange={e => setNote(e.target.value)}
            style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', fontFamily: SF, marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, marginBottom: 16 }}>
            {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k => (
              <button key={k} onClick={() => handleKey(k)}
                style={{ background: k === "⌫" ? '#2c2c2e' : '#1c1c1e', border: 'none', color: 'white', fontSize: 22, fontWeight: 500, padding: '18px 0', cursor: 'pointer', borderRadius: 10, fontFamily: SF }}>
                {k}
              </button>
            ))}
          </div>
          <button onClick={() => amount && setSent(true)}
            style={{ background: amount ? '#2c5282' : '#2c2c2e', color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: amount ? 'pointer' : 'default', fontFamily: SF }}>
            Request {amount || "0"} KAS
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function TerraPage() {
  const [tab, setTab] = useState("home");
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [kasBalance, setKasBalance] = useState(null);
  const [kasPrice, setKasPrice] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const addr = currentUser?.created_wallet_address || currentUser?.kaspa_address;
      setWalletAddress(addr);

      // Fetch KAS price
      const priceRes = await base44.functions.invoke('getKaspaPrice', {});
      const price = priceRes?.data?.price || priceRes?.data?.usd || null;
      setKasPrice(price);

      // Fetch balance if wallet address exists
      if (addr) {
        const balRes = await base44.functions.invoke('getKaspaBalance', { address: addr });
        const bal = balRes?.data?.balance ?? balRes?.data?.kaspa ?? null;
        setKasBalance(bal);
      }
    } catch (err) {
      console.log('Terra load error:', err);
    }
    setLoading(false);
  };

  const kasBalanceNum = parseFloat(kasBalance) || 0;
  const kasPriceNum = parseFloat(kasPrice) || 0;
  const usdValue = kasBalanceNum * kasPriceNum;

  const displayKas = balanceHidden ? "•••••• KAS" : `${kasBalanceNum.toLocaleString("en-US", { maximumFractionDigits: 2 })} KAS`;
  const displayUsd = balanceHidden ? "••••••" : `≈ $${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

  const shortAddress = walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : "No wallet connected";

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#000', fontFamily: SF, overflow: 'hidden' }}>
      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {tab === "home" && (
          <div>
            {/* Balance Card */}
            <div style={{ margin: '16px 16px 20px', background: '#0d0d0d', borderRadius: 22, padding: '28px 24px', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(26,115,232,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Total Balance</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button onClick={loadData} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0 }}>
                    <RefreshCw size={14} />
                  </button>
                  <button onClick={() => setBalanceHidden(h => !h)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                    {balanceHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
              {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 28, fontWeight: 600, marginBottom: 4 }}>Loading...</div>
              ) : (
                <>
                  <div style={{ color: 'white', fontSize: 36, fontWeight: 700, letterSpacing: -1, marginBottom: 4 }}>{displayKas}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 20 }}>{displayUsd}</div>
                </>
              )}
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginBottom: 18, fontFamily: 'monospace' }}>{shortAddress}</div>
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { icon: <ArrowUpRight size={18} />, label: "Send", action: () => setSheet("send"), color: ACCENT },
                  { icon: <ArrowDownLeft size={18} />, label: "Request", action: () => setSheet("request"), color: '#1c4a3a' },
                  { icon: <Plus size={18} />, label: "Add", action: () => {}, color: '#2c2c2e' },
                  { icon: <QrCode size={18} />, label: "QR", action: () => {}, color: '#2c2c2e' },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action}
                    style={{ flex: 1, background: btn.color, border: 'none', borderRadius: 14, padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'white' }}>
                    {btn.icon}
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* KAS Price Info */}
            {kasPrice && (
              <div style={{ margin: '0 16px 20px', background: '#0d0d0d', borderRadius: 14, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>KAS Price</span>
                <span style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>${kasPriceNum.toFixed(4)}</span>
              </div>
            )}

            {/* Empty State for Transactions */}
            <div style={{ margin: '0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Recent Activity</span>
              </div>
              <div style={{ background: '#0d0d0d', borderRadius: 18, padding: '32px 16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>No transactions yet</div>
                <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, marginTop: 6 }}>Send or receive KAS to see activity</div>
              </div>
            </div>
          </div>
        )}

        {tab === "wallet" && (
          <div style={{ padding: '16px 16px 0' }}>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Wallet</h2>
            <div style={{ background: '#0d0d0d', borderRadius: 20, padding: '24px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden', minHeight: 140 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(26,115,232,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 }}>Terra Wallet</div>
              <div style={{ color: 'white', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
                {loading ? "..." : `${kasBalanceNum.toLocaleString("en-US", { maximumFractionDigits: 2 })} KAS`}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                {loading ? "" : displayUsd}
              </div>
              <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
                <CreditCard size={32} color="rgba(255,255,255,0.15)" />
              </div>
            </div>
            <div style={{ background: '#0d0d0d', borderRadius: 14, padding: '14px 18px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Kaspa Address</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {walletAddress || "No wallet connected"}
              </div>
            </div>
            {[{ label: "Send KAS", sub: "Transfer to another address" }, { label: "Receive KAS", sub: "Share your address" }, { label: "Transaction History", sub: "View all activity" }].map(item => (
              <div key={item.label} style={{ background: '#0d0d0d', borderRadius: 14, padding: '16px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => item.label === "Send KAS" ? setSheet("send") : item.label === "Receive KAS" ? setSheet("request") : null}>
                <div>
                  <div style={{ color: 'white', fontSize: 15, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{item.sub}</div>
                </div>
                <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div style={{ padding: '16px 16px 0' }}>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Activity</h2>
            <div style={{ background: '#0d0d0d', borderRadius: 18, padding: '40px 16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>No transaction history</div>
              <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, marginTop: 6 }}>Your KAS transactions will appear here</div>
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 32px' }}>
              <div style={{ width: 72, height: 72, borderRadius: 36, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 26, fontWeight: 600 }}>
                  {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>{user?.full_name || user?.username || "Terra User"}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>{user?.email || ""}</div>
              {walletAddress && (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 6, fontFamily: 'monospace' }}>{shortAddress}</div>
              )}
            </div>
            {[
              { label: "Personal Info", sub: "Name, email, phone" },
              { label: "Security", sub: "Password, biometrics" },
              { label: "Notifications", sub: "Alerts, updates" },
              { label: "Linked Banks", sub: "Manage accounts" },
              { label: "Help & Support", sub: "FAQ, contact us" },
            ].map(item => (
              <div key={item.label} style={{ background: '#0d0d0d', borderRadius: 14, padding: '16px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ color: 'white', fontSize: 15, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{item.sub}</div>
                </div>
                <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{ display: 'flex', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 4, flexShrink: 0 }}>
        {[
          { id: "home", icon: <Home size={22} />, label: "Home" },
          { id: "wallet", icon: <Wallet size={22} />, label: "Wallet" },
          { id: "scan", icon: <Scan size={22} />, label: "Scan", action: () => setSheet("send") },
          { id: "history", icon: <History size={22} />, label: "Activity" },
          { id: "profile", icon: <User size={22} />, label: "Profile" },
        ].map(t => (
          <button key={t.id} onClick={() => t.action ? t.action() : setTab(t.id)}
            style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', color: tab === t.id ? ACCENT : 'rgba(255,255,255,0.35)', transition: 'color 0.2s' }}>
            {t.icon}
            <span style={{ fontSize: 10, fontWeight: 500 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Sheets */}
      <AnimatePresence>
        {sheet === "send" && <SendMoneySheet onClose={() => setSheet(null)} />}
        {sheet === "request" && <RequestSheet onClose={() => setSheet(null)} />}
      </AnimatePresence>
    </div>
  );
}