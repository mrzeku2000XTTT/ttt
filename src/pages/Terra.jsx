import React, { useState, useEffect } from "react";
import ProfileTab from "@/components/terra/ProfileTab";
import WalletManager, { WalletMenuSheet, BackupSeedSheet, ImportWalletSheet, DeleteConfirmSheet } from "@/components/terra/WalletManager";
import ReceiveSheet from "@/components/terra/ReceiveSheet";
import SendSheet from "@/components/terra/SendSheet";
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

function CreateWalletModal({ onClose, onCreated }) {
  const [step, setStep] = useState("confirm"); // confirm | loading | reveal | backup
  const [wallet, setWallet] = useState(null);
  const [wordCount, setWordCount] = useState(12);
  const [copied, setCopied] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);

  const generate = async () => {
    setStep("loading");
    try {
      const res = await base44.functions.invoke('createKaspaWallet', { wordCount });
      if (res.data?.error) throw new Error(res.data.error);
      setWallet(res.data);
      setStep("reveal");
    } catch (err) {
      console.error('Wallet generation failed:', err);
      setStep("error");
    }
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(wallet.mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finish = () => {
    onCreated(wallet);
    onClose();
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: SF }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Create Wallet</span>
        <div style={{ width: 20 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {step === "confirm" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: 36, background: '#1a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Shield size={32} color={ACCENT} />
              </div>
              <div style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>New Kaspa Wallet</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6 }}>
                A new wallet with a recovery phrase will be generated. Keep it safe — it's the only way to recover your funds.
              </div>
            </div>

            <div style={{ background: '#1c1c1e', borderRadius: 16, padding: '16px', border: '1px solid rgba(255,165,0,0.2)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="#ff9500" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>
                  Never share your recovery phrase with anyone. Terra will never ask for it. Store it offline in a safe place.
                </div>
              </div>
            </div>

            <div style={{ background: '#1c1c1e', borderRadius: 14, padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 12 }}>Recovery phrase length</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[12, 24].map(n => (
                  <button key={n} onClick={() => setWordCount(n)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${wordCount === n ? ACCENT : 'rgba(255,255,255,0.1)'}`, background: wordCount === n ? 'rgba(26,115,232,0.15)' : 'transparent', color: wordCount === n ? ACCENT : 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    {n} words
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate}
              style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: SF }}>
              Generate Wallet
            </button>
          </motion.div>
        )}

        {step === "loading" && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <RefreshCw size={36} color={ACCENT} />
            </motion.div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Generating secure wallet...</div>
          </div>
        )}

        {step === "error" && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, padding: '0 20px' }}>
            <AlertTriangle size={36} color="#ff9500" />
            <div style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>Something went wrong</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' }}>Failed to generate wallet. Please try again.</div>
            <button onClick={() => setStep("confirm")}
              style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: 14, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: SF }}>
              Try Again
            </button>
          </div>
        )}

        {step === "reveal" && wallet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Your Recovery Phrase</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Write these {wordCount} words down in order</div>
            </div>

            <div style={{ background: '#1c1c1e', borderRadius: 16, padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {wallet.mnemonic.split(' ').map((word, i) => (
                  <div key={i} style={{ background: '#2c2c2e', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, minWidth: 14 }}>{i + 1}</span>
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{word}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={copyMnemonic}
              style={{ background: '#2c2c2e', color: copied ? '#34c759' : 'rgba(255,255,255,0.8)', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Copy size={16} />
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>

            <div style={{ background: '#1c1c1e', borderRadius: 14, padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Your Kaspa Address</div>
              <div style={{ color: 'white', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{wallet.address}</div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={backupConfirmed} onChange={e => setBackupConfirmed(e.target.checked)}
                style={{ marginTop: 2, width: 18, height: 18, accentColor: ACCENT }} />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5 }}>
                I have written down my recovery phrase and stored it safely. I understand that losing it means losing access to my funds.
              </span>
            </label>

            <button onClick={finish} disabled={!backupConfirmed}
              style={{ background: backupConfirmed ? ACCENT : '#2c2c2e', color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: backupConfirmed ? 'pointer' : 'default', fontFamily: SF }}>
              Done — Open Wallet
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// LocalStorage helpers for multi-wallet
function loadStoredWallets() {
  try { return JSON.parse(localStorage.getItem('terra_wallets') || '[]'); } catch { return []; }
}
function saveStoredWallets(wallets) {
  localStorage.setItem('terra_wallets', JSON.stringify(wallets));
}

export default function TerraPage() {
  const [tab, setTab] = useState("home");
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [kasPrice, setKasPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Multi-wallet state
  const [wallets, setWallets] = useState([]); // [{address, mnemonic, label}]
  const [activeWalletIdx, setActiveWalletIdx] = useState(0);
  const [balances, setBalances] = useState({}); // {address: balance}

  // Wallet menu/sheets state
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => { loadData(); }, []);

  const activeWallet = wallets[activeWalletIdx] || null;
  const walletAddress = activeWallet?.address || null;

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load wallets: start from localStorage, seed from user profile
      let stored = loadStoredWallets();
      const profileAddr = currentUser?.created_wallet_address || currentUser?.kaspa_address;
      if (profileAddr && !stored.find(w => w.address === profileAddr)) {
        stored = [{ address: profileAddr, mnemonic: '', label: 'Main Wallet' }, ...stored];
        saveStoredWallets(stored);
      }
      setWallets(stored);

      // Fetch KAS price
      const priceRes = await base44.functions.invoke('getKaspaPrice', {});
      const price = priceRes?.data?.price || priceRes?.data?.usd || null;
      setKasPrice(price);

      // Fetch balances for all wallets
      if (stored.length > 0) {
        const balMap = {};
        await Promise.all(stored.map(async (w) => {
          if (!w.address) return;
          const balRes = await base44.functions.invoke('getKaspaBalance', { address: w.address });
          balMap[w.address] = balRes?.data?.balance ?? balRes?.data?.kaspa ?? 0;
        }));
        setBalances(balMap);
      }
    } catch (err) {
      console.log('Terra load error:', err);
    }
    setLoading(false);
  };

  const addWallet = (w) => {
    const newWallet = { address: w.address, mnemonic: w.mnemonic || '', label: w.label || `Wallet ${wallets.length + 1}` };
    const updated = [...wallets, newWallet];
    setWallets(updated);
    saveStoredWallets(updated);
    setActiveWalletIdx(updated.length - 1);
    // save primary to user profile if first
    if (wallets.length === 0) {
      base44.auth.updateMe({ created_wallet_address: w.address }).catch(() => {});
    }
  };

  const deleteActiveWallet = () => {
    const updated = wallets.filter((_, i) => i !== activeWalletIdx);
    setWallets(updated);
    saveStoredWallets(updated);
    setActiveWalletIdx(Math.max(0, activeWalletIdx - 1));
    if (updated.length === 0) {
      base44.auth.updateMe({ created_wallet_address: '' }).catch(() => {});
    }
  };

  const kasBalanceNum = parseFloat(balances[walletAddress]) || 0;
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
            {/* Wallet Cards + Manage */}
            <div style={{ margin: '16px 16px 8px' }}>
              {wallets.length > 0 ? (
                <WalletManager
                  wallets={wallets}
                  activeIdx={activeWalletIdx}
                  onChangeIdx={setActiveWalletIdx}
                  balances={balances}
                  kasPrice={kasPrice}
                  loading={loading}
                  balanceHidden={balanceHidden}
                  onMenuOpen={() => setShowWalletMenu(true)}
                />
              ) : (
                /* Empty card placeholder */
                <div style={{ background: '#0d0d0d', borderRadius: 22, padding: '28px 24px', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>No wallet</div>
                </div>
              )}
            </div>

            {/* Quick toggle row */}
            <div style={{ margin: '8px 16px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={loadData} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}><RefreshCw size={14} /></button>
              <button onClick={() => setBalanceHidden(h => !h)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
                {balanceHidden ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ margin: '0 16px 20px', display: 'flex', gap: 10 }}>
              {[
                { icon: <ArrowUpRight size={18} />, label: "Send", action: () => setSheet("send"), color: ACCENT },
                { icon: <ArrowDownLeft size={18} />, label: "Receive", action: () => setSheet("receive"), color: '#1c4a3a' },
                { icon: <Plus size={18} />, label: "New", action: () => setShowCreateWallet(true), color: '#2c2c2e' },
                { icon: <QrCode size={18} />, label: "Import", action: () => setShowImport(true), color: '#2c2c2e' },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action}
                  style={{ flex: 1, background: btn.color, border: 'none', borderRadius: 14, padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'white' }}>
                  {btn.icon}
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Create Wallet CTA — shown when no wallet connected */}
            {!loading && wallets.length === 0 && (
              <div style={{ margin: '0 16px 20px', background: '#0d0d0d', borderRadius: 18, padding: '24px', border: '1px solid rgba(26,115,232,0.2)', textAlign: 'center' }}>
                <div style={{ color: 'white', fontSize: 17, fontWeight: 700, marginBottom: 6 }}>No Wallet Connected</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>
                  Create a new Kaspa wallet to send, receive, and manage your KAS.
                </div>
                <button onClick={() => setShowCreateWallet(true)}
                  style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: 14, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: SF, width: '100%' }}>
                  Create Wallet
                </button>
              </div>
            )}

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
                onClick={() => item.label === "Send KAS" ? setSheet("send") : item.label === "Receive KAS" ? setSheet("receive") : null}>
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
          <ProfileTab
            user={user}
            walletAddress={walletAddress}
            shortAddress={shortAddress}
            onWalletCreated={(addr) => {
              addWallet({ address: addr, mnemonic: '', label: 'Main Wallet' });
              base44.auth.updateMe({ created_wallet_address: addr }).catch(() => {});
            }}
            onOpenCreateWallet={() => setShowCreateWallet(true)}
          />
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
        {sheet === "send" && <SendSheet onClose={() => setSheet(null)} activeWallet={activeWallet} />}
        {sheet === "receive" && <ReceiveSheet onClose={() => setSheet(null)} address={walletAddress} onSuccess={() => { setSheet(null); setTab("home"); loadData(); }} />}
        {showCreateWallet && (
          <CreateWalletModal
            onClose={() => setShowCreateWallet(false)}
            onCreated={(w) => addWallet(w)}
          />
        )}
        {showWalletMenu && (
          <WalletMenuSheet
            wallet={activeWallet}
            onClose={() => setShowWalletMenu(false)}
            onBackup={() => setShowBackup(true)}
            onImport={() => setShowImport(true)}
            onDelete={() => setShowDelete(true)}
          />
        )}
        {showBackup && activeWallet?.mnemonic && (
          <BackupSeedSheet wallet={activeWallet} onClose={() => setShowBackup(false)} />
        )}
        {showBackup && !activeWallet?.mnemonic && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: SF, gap: 16 }}>
            <AlertTriangle size={40} color="#ff9500" />
            <div style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>No seed phrase stored</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: '0 32px' }}>
              This wallet was imported by address only. To backup, import the wallet using its seed phrase.
            </div>
            <button onClick={() => setShowBackup(false)} style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '14px 32px', fontSize: 15, cursor: 'pointer', fontFamily: SF }}>
              Close
            </button>
          </motion.div>
        )}
        {showImport && (
          <ImportWalletSheet
            onClose={() => setShowImport(false)}
            onImported={(w) => addWallet(w)}
          />
        )}
        {showDelete && activeWallet && (
          <DeleteConfirmSheet
            wallet={activeWallet}
            onClose={() => setShowDelete(false)}
            onDeleted={deleteActiveWallet}
          />
        )}
      </AnimatePresence>
    </div>
  );
}