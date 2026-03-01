import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check } from "lucide-react";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";

function QRCanvas({ value, size = 220 }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!value) return;

    const loadAndRender = async () => {
      // Load qrcode lib if not present
      if (!window.QRCode || !window.QRCode.toCanvas) {
        await new Promise((resolve, reject) => {
          // remove any stale script
          const existing = document.querySelector('script[data-qrlib]');
          if (existing) existing.remove();
          const s = document.createElement('script');
          s.setAttribute('data-qrlib', '1');
          s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      setReady(true);
    };

    loadAndRender().catch(console.error);
  }, [value]);

  useEffect(() => {
    if (!ready || !value || !canvasRef.current) return;
    if (!window.QRCode || !window.QRCode.toCanvas) return;
    window.QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }, (err) => { if (err) console.error('QR render error:', err); });
  }, [ready, value, size]);

  return (
    <canvas ref={canvasRef}
      width={size} height={size}
      style={{ borderRadius: 12, display: 'block', width: size, height: size }} />
  );
}

export default function ReceiveSheet({ address, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: SF }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Receive KAS</span>
        <div style={{ width: 20 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        {address ? (
          <>
            <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 0 40px rgba(26,115,232,0.25)' }}>
              <QRCanvas value={address} size={220} />
            </div>

            <div style={{ width: '100%' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>Your Kaspa Address</div>
              <div style={{ color: 'white', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.7, wordBreak: 'break-all', background: '#1c1c1e', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                {address}
              </div>
            </div>

            <button onClick={copy}
              style={{ width: '100%', background: copied ? 'rgba(52,199,89,0.12)' : '#1c1c1e', border: `1px solid ${copied ? 'rgba(52,199,89,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '16px', color: copied ? '#34c759' : 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: 500, cursor: 'pointer', fontFamily: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "Copied!" : "Copy Address"}
            </button>

            <div style={{ background: 'rgba(26,115,232,0.07)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(26,115,232,0.15)', width: '100%', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.55 }}>
                Only send <strong style={{ color: 'white' }}>KAS</strong> to this address. Sending other assets may result in permanent loss.
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