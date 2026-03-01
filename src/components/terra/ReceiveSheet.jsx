import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, Download } from "lucide-react";
import QRCode from "npm:qrcode"; // won't work in browser - use canvas approach

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";
const ACCENT = "#1a73e8";

// QR code generation using a free CDN-based approach via canvas
function QRCanvas({ value, size = 240 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    // Use qrcode-generator via dynamic script
    const generate = async () => {
      // Load qrcodejs if not already loaded
      if (!window.qrcode) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Use a div-based QR approach since QRCode lib creates divs
      const div = document.createElement('div');
      div.style.display = 'none';
      document.body.appendChild(div);

      new window.QRCode(div, {
        text: value,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M,
      });

      // Get the generated canvas from the div
      setTimeout(() => {
        const qrCanvas = div.querySelector('canvas');
        if (qrCanvas) {
          ctx.drawImage(qrCanvas, 0, 0, size, size);
        }
        document.body.removeChild(div);
      }, 100);
    };

    generate();
  }, [value, size]);

  return (
    <canvas ref={canvasRef} width={size} height={size}
      style={{ borderRadius: 12, display: 'block' }} />
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
            {/* QR Code */}
            <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 0 40px rgba(26,115,232,0.2)' }}>
              <QRCanvas value={address} size={220} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8 }}>Your Kaspa Address</div>
              <div style={{ color: 'white', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.6, wordBreak: 'break-all', background: '#1c1c1e', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {address}
              </div>
            </div>

            <button onClick={copy}
              style={{ width: '100%', background: copied ? 'rgba(52,199,89,0.15)' : '#1c1c1e', border: `1px solid ${copied ? 'rgba(52,199,89,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '16px', color: copied ? '#34c759' : 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: 500, cursor: 'pointer', fontFamily: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "Address Copied!" : "Copy Address"}
            </button>

            <div style={{ background: 'rgba(26,115,232,0.08)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(26,115,232,0.2)', width: '100%', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.5 }}>
                Only send <strong style={{ color: 'white' }}>KAS</strong> or KRC-20 tokens to this address. Sending other assets may result in permanent loss.
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