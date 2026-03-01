import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";
import { base44 } from "@/api/base44Client";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";
const ACCENT = "#1a73e8";

function QRImage({ value, size = 200 }) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    if (!value) return;
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then(url => { if (!cancelled) setDataUrl(url); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [value, size]);

  if (!dataUrl) return <div style={{ width: size, height: size, background: '#e8e8e8', borderRadius: 12 }} />;
  return <img src={dataUrl} alt="QR Code" style={{ width: size, height: size, borderRadius: 12, display: 'block' }} />;
}

export default function ReceiveSheet({ address, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [watching, setWatching] = useState(false);
  const [received, setReceived] = useState(false);
  const [prevBalance, setPrevBalance] = useState(null);
  const pollRef = useRef(null);

  // Build kaspa URI: kaspa:<address>[?amount=<kas>]
  const kaspaUri = amount && parseFloat(amount) > 0
    ? `kaspa:${address}?amount=${parseFloat(amount)}`
    : `kaspa:${address}`;

  const copy = () => {
    navigator.clipboard.writeText(`kaspa:${address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startWatching = async () => {
    setWatching(true);
    // snapshot current balance
    const res = await base44.functions.invoke('getKaspaBalance', { address });
    const initial = parseFloat(res?.data?.balanceKAS ?? res?.data?.balance ?? res?.data?.kaspa ?? 0);
    setPrevBalance(initial);

    pollRef.current = setInterval(async () => {
      const r = await base44.functions.invoke('getKaspaBalance', { address });
      const current = parseFloat(r?.data?.balanceKAS ?? r?.data?.balance ?? r?.data?.kaspa ?? 0);
      if (current > initial) {
        clearInterval(pollRef.current);
        setReceived(true);
        setWatching(false);
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 2500);
      }
    }, 5000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: SF }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Receive KAS</span>
        <div style={{ width: 20 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {address ? (
          <>
            {/* Success overlay */}
            <AnimatePresence>
              {received && (
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: 1, duration: 0.4 }}>
                    <CheckCircle2 size={72} color="#34c759" />
                  </motion.div>
                  <div style={{ color: 'white', fontSize: 22, fontWeight: 700 }}>Payment Received!</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Returning to home...</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Amount input */}
            <div style={{ width: '100%' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Request Amount (optional)</div>
              <div style={{ display: 'flex', alignItems: 'center', background: '#1c1c1e', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', gap: 8 }}>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 18, fontWeight: 600, fontFamily: SF }}
                />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600 }}>KAS</span>
              </div>
            </div>

            {/* QR Code */}
            <div style={{ background: 'white', borderRadius: 20, padding: 18, boxShadow: '0 0 40px rgba(26,115,232,0.25)' }}>
              <QRImage value={kaspaUri} size={200} />
            </div>
            {amount && parseFloat(amount) > 0 && (
              <div style={{ background: 'rgba(26,115,232,0.1)', borderRadius: 10, padding: '8px 16px', border: '1px solid rgba(26,115,232,0.2)' }}>
                <span style={{ color: ACCENT, fontSize: 13, fontWeight: 600 }}>Requesting {parseFloat(amount)} KAS</span>
              </div>
            )}

            {/* Address */}
             <div style={{ width: '100%' }}>
               <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6, textAlign: 'center' }}>Your Kaspa Address</div>
               <div style={{ color: 'white', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.7, wordBreak: 'break-all', background: '#1c1c1e', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                 kaspa:{address.startsWith('kaspa:') ? address.slice(6) : address}
               </div>
             </div>

            {/* Copy */}
            <button onClick={copy}
              style={{ width: '100%', background: copied ? 'rgba(52,199,89,0.12)' : '#1c1c1e', border: `1px solid ${copied ? 'rgba(52,199,89,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '14px', color: copied ? '#34c759' : 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "Copied!" : "Copy Address"}
            </button>

            {/* Await payment */}
            {!watching ? (
              <button onClick={startWatching}
                style={{ width: '100%', background: ACCENT, border: 'none', borderRadius: 14, padding: '15px', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: SF }}>
                Await Payment
              </button>
            ) : (
              <div style={{ width: '100%', background: '#1c1c1e', border: '1px solid rgba(26,115,232,0.3)', borderRadius: 14, padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  style={{ width: 16, height: 16, border: '2px solid rgba(26,115,232,0.3)', borderTopColor: ACCENT, borderRadius: '50%' }} />
                <span style={{ color: ACCENT, fontSize: 14, fontWeight: 500 }}>Watching for payment...</span>
              </div>
            )}

            <div style={{ background: 'rgba(26,115,232,0.07)', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(26,115,232,0.15)', width: '100%', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.55 }}>
                Only send <strong style={{ color: 'white' }}>KAS</strong> to this address.
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 60, textAlign: 'center' }}>
            No wallet connected.<br />Create or import a wallet first.
          </div>
        )}
      </div>
    </motion.div>
  );
}