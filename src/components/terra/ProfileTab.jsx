import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Shield, Key, Wallet, Check, X,
  Eye, EyeOff, Copy, User, AlertTriangle, Edit2, CheckCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";
const ACCENT = "#1a73e8";

function Field({ label, value, mono = false }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ background: '#1c1c1e', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ color: 'white', fontSize: mono ? 12 : 14, fontFamily: mono ? 'monospace' : SF, wordBreak: 'break-all', flex: 1 }}>{value || "—"}</div>
        {value && (
          <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#34c759' : 'rgba(255,255,255,0.3)', flexShrink: 0, padding: 0 }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function RegisterSheet({ user, walletAddress, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(user?.full_name || "");
  const [tttId, setTttId] = useState(user?.ttt_id || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [kaspaAddr, setKaspaAddr] = useState(walletAddress || "");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!displayName.trim()) return setError("Display name is required.");
    if (!tttId.trim()) return setError("TTT ID is required.");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(tttId.trim())) return setError("TTT ID must be 3–20 chars (letters, numbers, _).");
    if (password && password.length < 6) return setError("Password must be at least 6 characters.");
    if (password && password !== confirmPassword) return setError("Passwords do not match.");

    setSaving(true);
    try {
      const updateData = {
        full_name: displayName.trim(),
        ttt_id: tttId.trim().toLowerCase(),
        username: tttId.trim().toLowerCase(),
      };
      if (kaspaAddr.trim()) updateData.created_wallet_address = kaspaAddr.trim();
      if (password) updateData.terra_pin = password;

      await base44.auth.updateMe(updateData);
      setSaved(true);
      setTimeout(() => {
        onSaved({ displayName: displayName.trim(), tttId: tttId.trim().toLowerCase(), kaspaAddr: kaspaAddr.trim() });
        onClose();
      }, 1200);
    } catch (err) {
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: SF }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Setup Profile</span>
        <div style={{ width: 20 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {saved ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}>
              <CheckCircle size={60} color="#34c759" />
            </motion.div>
            <div style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>Profile Saved!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 72, height: 72, borderRadius: 36, background: '#1a2a4a', border: `2px solid ${ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <span style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>
                  {displayName[0]?.toUpperCase() || "?"}
                </span>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, paddingLeft: 4 }}>Display Name</div>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name"
                style={{ width: '100%', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', fontFamily: SF, boxSizing: 'border-box' }} />
            </div>

            {/* TTT ID */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, paddingLeft: 4 }}>TTT ID <span style={{ color: 'rgba(255,255,255,0.25)' }}>(unique username)</span></div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>@</span>
                <input value={tttId} onChange={e => setTttId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="yourttdid"
                  style={{ width: '100%', background: '#1c1c1e', border: `1px solid ${tttId.length >= 3 ? 'rgba(52,199,89,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '14px 16px 14px 34px', color: 'white', fontSize: 15, outline: 'none', fontFamily: SF, boxSizing: 'border-box' }} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 4, paddingLeft: 4 }}>3–20 chars. Letters, numbers, underscore only.</div>
            </div>

            {/* Kaspa Address */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, paddingLeft: 4 }}>Kaspa Address</div>
              <input value={kaspaAddr} onChange={e => setKaspaAddr(e.target.value)} placeholder="kaspa:q..."
                style={{ width: '100%', background: '#1c1c1e', border: `1px solid ${kaspaAddr.startsWith('kaspa:') ? 'rgba(52,199,89,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
              {kaspaAddr && !kaspaAddr.startsWith('kaspa:') && (
                <div style={{ color: '#ff9500', fontSize: 11, marginTop: 4, paddingLeft: 4 }}>Address should start with kaspa:</div>
              )}
            </div>

            {/* Password */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, paddingLeft: 4 }}>App Password <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span></div>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Set a password" type={showPw ? "text" : "password"}
                  style={{ width: '100%', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 44px 14px 16px', color: 'white', fontSize: 15, outline: 'none', fontFamily: SF, boxSizing: 'border-box' }} />
                <button onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" type={showPw ? "text" : "password"}
                  style={{ width: '100%', background: '#1c1c1e', border: `1px solid ${confirmPassword && confirmPassword !== password ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', fontFamily: SF, boxSizing: 'border-box' }} />
              )}
            </div>

            {error && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,59,48,0.1)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,59,48,0.2)' }}>
                <AlertTriangle size={16} color="#ff3b30" />
                <span style={{ color: '#ff3b30', fontSize: 13 }}>{error}</span>
              </div>
            )}

            <button onClick={handleSave} disabled={saving}
              style={{ background: saving ? '#2c2c2e' : ACCENT, color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: SF, marginTop: 4 }}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ProfileTab({ user, walletAddress, shortAddress, onWalletCreated, onOpenCreateWallet }) {
  const [showRegister, setShowRegister] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const displayName = profileData?.displayName || user?.full_name || user?.username || "Terra User";
  const tttId = profileData?.tttId || user?.ttt_id || user?.username || null;
  const kaspa = profileData?.kaspaAddr || walletAddress || null;
  const isSetup = tttId && kaspa;

  return (
    <div style={{ padding: '16px 16px 0', fontFamily: SF }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 24px' }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: isSetup ? '#1a2a4a' : '#1c1c1e', border: `2px solid ${isSetup ? ACCENT : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 30, fontWeight: 700 }}>
            {displayName[0]?.toUpperCase() || "?"}
          </span>
        </div>
        <div style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>{displayName}</div>
        {tttId && <div style={{ color: ACCENT, fontSize: 14, marginTop: 2 }}>@{tttId}</div>}
        {user?.email && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>{user.email}</div>}
      </div>

      {/* Setup banner if incomplete */}
      {!isSetup && (
        <div style={{ background: '#0d1a2e', borderRadius: 16, padding: '18px', marginBottom: 16, border: '1px solid rgba(26,115,232,0.3)' }}>
          <div style={{ color: 'white', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Complete Your Profile</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
            Register your TTT ID and connect a Kaspa address to start using Terra.
          </div>
          <button onClick={() => setShowRegister(true)}
            style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: SF, width: '100%' }}>
            Setup Profile
          </button>
        </div>
      )}

      {/* Profile info cards */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8, paddingLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Identity</div>
        <Field label="TTT ID" value={tttId ? `@${tttId}` : null} />
        <Field label="Display Name" value={displayName} />
        <Field label="Email" value={user?.email} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8, paddingLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Wallet</div>
        <Field label="Kaspa Address" value={kaspa} mono />
        {!kaspa && (
          <button onClick={onOpenCreateWallet}
            style={{ width: '100%', background: '#0d1a2e', border: '1px dashed rgba(26,115,232,0.4)', borderRadius: 12, padding: '14px', color: ACCENT, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: SF }}>
            + Create Kaspa Wallet
          </button>
        )}
      </div>

      {/* Security info */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8, paddingLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Security</div>
        <div style={{ background: '#1c1c1e', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Key size={18} color={user?.terra_pin ? '#34c759' : 'rgba(255,255,255,0.3)'} />
          <div>
            <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>App Password</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{user?.terra_pin ? "Password set" : "Not set"}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {user?.terra_pin ? <Check size={16} color="#34c759" /> : <AlertTriangle size={16} color="#ff9500" />}
          </div>
        </div>
      </div>

      {/* Edit button */}
      <button onClick={() => setShowRegister(true)}
        style={{ width: '100%', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        <Edit2 size={16} />
        Edit Profile
      </button>

      <AnimatePresence>
        {showRegister && (
          <RegisterSheet
            user={user}
            walletAddress={kaspa}
            onClose={() => setShowRegister(false)}
            onSaved={(data) => {
              setProfileData(data);
              if (data.kaspaAddr) onWalletCreated(data.kaspaAddr);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}