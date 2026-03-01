import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, QrCode, Plus, ArrowDownLeft, ArrowUpRight,
  CreditCard, ChevronRight, Bell, Settings, Eye, EyeOff,
  Home, Wallet, History, User, Scan, ArrowLeft, X, Check
} from "lucide-react";

const TERRA_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/46832045f_IMG_1195.jpg";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";

const TRANSACTIONS = [
  { id: 1, name: "Alex Martinez", type: "received", amount: 125.00, time: "Today, 2:14 PM", avatar: "AM" },
  { id: 2, name: "Coffee Shop", type: "sent", amount: 6.50, time: "Today, 9:30 AM", avatar: "CS" },
  { id: 3, name: "Jordan Lee", type: "received", amount: 320.00, time: "Yesterday", avatar: "JL" },
  { id: 4, name: "Netflix", type: "sent", amount: 15.99, time: "Mar 28", avatar: "N" },
  { id: 5, name: "Sam Wilson", type: "sent", amount: 45.00, time: "Mar 27", avatar: "SW" },
  { id: 6, name: "Freelance Work", type: "received", amount: 850.00, time: "Mar 25", avatar: "FW" },
];

const CARD_COLOR = "#0a0a0a";
const ACCENT = "#1a73e8";

function Avatar({ initials, size = 40, color = "#1c1c1e" }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size / 2,
        background: color, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: size * 0.36, fontFamily: SF, fontWeight: 600 }}>
        {initials}
      </span>
    </div>
  );
}

function SendMoneySheet({ onClose }) {
  const [step, setStep] = useState(1); // 1=amount, 2=confirm, 3=done
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
      style={{
        position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200,
        display: 'flex', flexDirection: 'column', fontFamily: SF,
        top: 'calc(var(--sat,0px) + 7.5rem)',
        bottom: 'calc(env(safe-area-inset-bottom,0px) + 4rem)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Send Money</span>
        <div style={{ width: 20 }} />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px' }}
          >
            <input
              placeholder="To: Name or @username"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              style={{
                background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 15,
                outline: 'none', fontFamily: SF, marginBottom: 24,
              }}
            />
            {/* Amount display */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Amount</span>
              <span style={{ color: 'white', fontSize: 52, fontWeight: 700, letterSpacing: -2 }}>
                ${amount || "0"}
              </span>
            </div>
            {/* Numpad */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, marginBottom: 16 }}>
              {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k => (
                <button key={k} onClick={() => handleKey(k)}
                  style={{
                    background: k === "⌫" ? '#2c2c2e' : '#1c1c1e',
                    border: 'none', color: 'white', fontSize: 22, fontWeight: 500,
                    padding: '18px 0', cursor: 'pointer', borderRadius: 10, fontFamily: SF,
                    transition: 'background 0.1s',
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
            <button
              onClick={() => amount && recipient && setStep(2)}
              style={{
                background: amount && recipient ? ACCENT : '#2c2c2e',
                color: 'white', border: 'none', borderRadius: 14, padding: '16px',
                fontSize: 16, fontWeight: 600, cursor: amount && recipient ? 'pointer' : 'default',
                fontFamily: SF, transition: 'background 0.2s',
              }}
            >
              Continue
            </button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', gap: 24 }}
          >
            <Avatar initials={recipient.slice(0, 2).toUpperCase()} size={72} color="#1c1c1e" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 6 }}>Sending to</div>
              <div style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>{recipient}</div>
            </div>
            <div style={{
              background: '#1c1c1e', borderRadius: 18, padding: '24px 32px',
              textAlign: 'center', width: '100%',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 }}>Amount</div>
              <div style={{ color: 'white', fontSize: 44, fontWeight: 700 }}>${amount}</div>
            </div>
            <div style={{ background: '#1c1c1e', borderRadius: 14, padding: '14px 18px', width: '100%', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                <span>Fee</span><span>$0.00</span>
              </div>
            </div>
            <div style={{ marginTop: 'auto', width: '100%', display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '16px', fontSize: 16, cursor: 'pointer', fontFamily: SF }}>
                Back
              </button>
              <button onClick={() => setStep(3)} style={{ flex: 2, background: ACCENT, border: 'none', color: 'white', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: SF }}>
                Send ${amount}
              </button>
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '24px' }}
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              style={{ width: 80, height: 80, borderRadius: 40, background: '#1a4a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Check size={36} color="#34c759" strokeWidth={3} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sent!</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
                ${amount} sent to {recipient}
              </div>
            </div>
            <button onClick={onClose} style={{ marginTop: 24, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '14px 32px', fontSize: 16, cursor: 'pointer', fontFamily: SF }}>
              Done
            </button>
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
      style={{
        position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: SF,
        top: 'calc(var(--sat,0px) + 7.5rem)',
        bottom: 'calc(env(safe-area-inset-bottom,0px) + 4rem)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Request Money</span>
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
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Request Amount</span>
            <span style={{ color: 'white', fontSize: 52, fontWeight: 700, letterSpacing: -2 }}>${amount || "0"}</span>
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
            Request ${amount || "0"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function TerraPage() {
  const [tab, setTab] = useState("home");
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [sheet, setSheet] = useState(null); // "send" | "request" | null

  const balance = 2847.63;
  const displayBalance = balanceHidden ? "••••••" : `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        background: '#000', fontFamily: SF, overflow: 'hidden',
        top: 'calc(var(--sat,0px) + 7.5rem)',
        bottom: 'calc(env(safe-area-inset-bottom,0px) + 4rem)',
      }}
    >
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img src={TERRA_LOGO} alt="Terra" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%' }} />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Terra</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><Bell size={20} /></button>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><Settings size={20} /></button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {tab === "home" && (
          <div>
            {/* Balance Card */}
            <div style={{ margin: '0 16px 20px', background: '#0d0d0d', borderRadius: 22, padding: '28px 24px', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
              {/* subtle grid pattern */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(26,115,232,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Total Balance</span>
                <button onClick={() => setBalanceHidden(h => !h)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                  {balanceHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              <div style={{ color: 'white', fontSize: 42, fontWeight: 700, letterSpacing: -1.5, marginBottom: 20 }}>
                {displayBalance}
              </div>
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

            {/* Quick Send Row */}
            <div style={{ margin: '0 16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Quick Send</span>
                <span style={{ color: ACCENT, fontSize: 13 }}>See All</span>
              </div>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
                {[{ n: "Alex", i: "AM" }, { n: "Jordan", i: "JL" }, { n: "Sam", i: "SW" }, { n: "Casey", i: "CA" }, { n: "Morgan", i: "MO" }].map(p => (
                  <button key={p.n} onClick={() => setSheet("send")}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Avatar initials={p.i} size={50} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{p.n}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div style={{ margin: '0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Recent</span>
                <span style={{ color: ACCENT, fontSize: 13 }}>See All</span>
              </div>
              <div style={{ background: '#0d0d0d', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                {TRANSACTIONS.map((tx, i) => (
                  <div key={tx.id}
                    style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <Avatar initials={tx.avatar} size={42} color="#1c1c1e" />
                    <div style={{ flex: 1, marginLeft: 12 }}>
                      <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{tx.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{tx.time}</div>
                    </div>
                    <div style={{
                      color: tx.type === "received" ? "#34c759" : "rgba(255,255,255,0.8)",
                      fontSize: 15, fontWeight: 600
                    }}>
                      {tx.type === "received" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "wallet" && (
          <div style={{ padding: '0 16px' }}>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Wallet</h2>
            {/* Card */}
            <div style={{ background: '#0d0d0d', borderRadius: 20, padding: '24px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden', height: 160 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(26,115,232,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 }}>Terra Card • ••• 4291</div>
              <div style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>$2,847.63</div>
              <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
                <CreditCard size={32} color="rgba(255,255,255,0.15)" />
              </div>
            </div>
            {[{ label: "Add Money", sub: "From bank or card" }, { label: "Withdraw", sub: "To your bank" }, { label: "Cards", sub: "Manage your cards" }].map(item => (
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

        {tab === "history" && (
          <div style={{ padding: '0 16px' }}>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>History</h2>
            <div style={{ background: '#0d0d0d', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              {TRANSACTIONS.map((tx, i) => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: tx.type === "received" ? '#1a3a1a' : '#2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    {tx.type === "received" ? <ArrowDownLeft size={18} color="#34c759" /> : <ArrowUpRight size={18} color="rgba(255,255,255,0.6)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{tx.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{tx.time}</div>
                  </div>
                  <div style={{ color: tx.type === "received" ? "#34c759" : "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 15 }}>
                    {tx.type === "received" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 32px' }}>
              <div style={{ width: 72, height: 72, borderRadius: 36, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 26, fontWeight: 600 }}>TU</span>
              </div>
              <div style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>Terra User</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>@terra.user</div>
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
            style={{
              flex: 1, background: 'none', border: 'none', padding: '10px 0 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              cursor: 'pointer', color: tab === t.id ? ACCENT : 'rgba(255,255,255,0.35)',
              transition: 'color 0.2s',
            }}>
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