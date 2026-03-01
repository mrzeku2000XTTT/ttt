import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, ScanLine, AlertTriangle, RefreshCw, Zap
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";
const ACCENT = "#1a73e8";

// ── QR Scanner using browser camera + jsQR ──────────────────────────────────
function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadJsQR = async () => {
      if (!window.jsQR) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
    };

    const startCamera = async () => {
      try {
        await loadJsQR();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setLoaded(true);
          scanLoop();
        }
      } catch (e) {
        setError('Camera access denied. Please allow camera permission and try again.');
      }
    };

    const scanLoop = () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code && code.data) {
        onScan(code.data);
        stop();
        return;
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    };

    const stop = () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };

    startCamera();
    return () => stop();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 400, display: 'flex', flexDirection: 'column', fontFamily: SF }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}><X size={18} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Scan QR Code</span>
        <div style={{ width: 36 }} />
      </div>

      {error ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 32px' }}>
          <AlertTriangle size={40} color="#ff9500" />
          <div style={{ color: 'white', fontSize: 15, textAlign: 'center', lineHeight: 1.6 }}>{error}</div>
          <button onClick={onClose}
            style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 14, padding: '14px 28px', fontSize: 15, cursor: 'pointer', fontFamily: SF }}>
            Close
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Viewfinder */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 240, height: 240, border: '2px solid rgba(255,255,255,0.8)', borderRadius: 16 }} />
              {/* Corner accents */}
              {[
                { top: -2, left: -2, borderTop: '4px solid white', borderLeft: '4px solid white', borderRadius: '4px 0 0 0' },
                { top: -2, right: -2, borderTop: '4px solid white', borderRight: '4px solid white', borderRadius: '0 4px 0 0' },
                { bottom: -2, left: -2, borderBottom: '4px solid white', borderLeft: '4px solid white', borderRadius: '0 0 0 4px' },
                { bottom: -2, right: -2, borderBottom: '4px solid white', borderRight: '4px solid white', borderRadius: '0 0 4px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 30, height: 30, ...s }} />
              ))}
              {/* Scan line animation */}
              {loaded && (
                <motion.div
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  style={{ position: 'absolute', left: 8, right: 8, height: 2, background: ACCENT, borderRadius: 1 }}
                />
              )}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Point camera at a Kaspa QR code</div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// Parse kaspa: URI → { address, amount }
function parseKaspaQR(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('kaspa:')) {
    // e.g. kaspa:qr...?amount=10.5
    const [addrPart, query] = trimmed.replace('kaspa:', '').split('?');
    const address = 'kaspa:' + addrPart;
    let amount = '';
    if (query) {
      const params = new URLSearchParams(query);
      amount = params.get('amount') || '';
    }
    return { address, amount };
  }
  // Plain address
  if (trimmed.startsWith('kaspa:q') || trimmed.startsWith('kaspa:p')) {
    return { address: trimmed, amount: '' };
  }
  return null;
}

// ── Main SendSheet ───────────────────────────────────────────────────────────
export default function SendSheet({ onClose, activeWallet, onBalanceUpdate, balance }) {
  const [step, setStep] = useState('input'); // input | confirm | sending | done | error
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [txId, setTxId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const balanceNum = parseFloat(balance) || 0;
  const maxSendable = Math.max(0, balanceNum - 0.0001); // Reserve fee

  const hasMnemonic = activeWallet?.mnemonic;

  const handleKey = (k) => {
    if (k === "⌫") setAmount(a => a.slice(0, -1));
    else if (k === "." && amount.includes(".")) return;
    else if (amount.length < 10) setAmount(a => a + k);
  };

  const handleScan = (raw) => {
   setShowScanner(false);
   const parsed = parseKaspaQR(raw);
   if (parsed) {
     setRecipient(parsed.address.startsWith('kaspa:') ? parsed.address : 'kaspa:' + parsed.address);
     if (parsed.amount) setAmount(parsed.amount);
   } else if (raw.trim().startsWith('kaspa:')) {
     setRecipient(raw.trim());
   } else {
     setErrorMsg('Invalid QR code. Expected a Kaspa address.');
   }
  };

  const handleSend = async () => {
    setStep('sending');
    setErrorMsg('');
    try {
      if (!hasMnemonic) throw new Error('No seed phrase stored for this wallet. Import the wallet with its seed phrase to send.');
      const res = await base44.functions.invoke('sendKaspaTransaction', {
        mnemonic: activeWallet.mnemonic,
        fromAddress: activeWallet.address,
        toAddress: recipient.trim(),
        amountKas: parseFloat(amount),
      });
      if (res.data?.error) throw new Error(res.data.error);
      setTxId(res.data.txId || '');
      setStep('done');
      // Refresh balance after successful transaction
      if (onBalanceUpdate) {
        setTimeout(() => onBalanceUpdate(), 2000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Transaction failed');
      setStep('error');
    }
  };

  const canContinue = recipient.startsWith('kaspa:') && parseFloat(amount) > 0;

  return (
    <>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: SF }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Send KAS</span>
          <div style={{ width: 20 }} />
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
              {/* Recipient row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, background: '#1c1c1e', border: `1px solid ${recipient.startsWith('kaspa:') ? 'rgba(52,199,89,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    placeholder="kaspa:q... recipient address"
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'monospace', padding: 0 }}
                  />
                </div>
                <button onClick={() => setShowScanner(true)}
                  style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 14px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 13 }}>
                  <ScanLine size={18} />
                  Scan
                </button>
              </div>

              {/* Amount */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Amount (KAS)</span>
                <span style={{ color: 'white', fontSize: 54, fontWeight: 700, letterSpacing: -2 }}>{amount || "0"}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>KAS</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Balance: {balanceNum.toFixed(8)} KAS</span>
              </div>

              {/* Numpad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, marginBottom: 14 }}>
                {["1","2","3","4","5","6","7","8","9",".","0","⌫"].map(k => (
                  <button key={k} onClick={() => handleKey(k)}
                    style={{ background: k === "⌫" ? '#2c2c2e' : '#1c1c1e', border: 'none', color: 'white', fontSize: 22, fontWeight: 500, padding: '17px 0', cursor: 'pointer', borderRadius: 10, fontFamily: SF }}>
                    {k}
                  </button>
                ))}
              </div>

              {!hasMnemonic && (
                <div style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertTriangle size={15} color="#ff9500" />
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>This wallet has no seed phrase stored. Import it with a seed phrase to send.</span>
                </div>
              )}

              <button onClick={() => canContinue && setStep('confirm')}
                style={{ background: canContinue ? ACCENT : '#2c2c2e', color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: canContinue ? 'pointer' : 'default', fontFamily: SF }}>
                Continue
              </button>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(26,115,232,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={28} color={ACCENT} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>You're sending</div>
                <div style={{ color: 'white', fontSize: 40, fontWeight: 700 }}>{amount} KAS</div>
              </div>
              <div style={{ background: '#1c1c1e', borderRadius: 14, padding: '16px', width: '100%', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>To</div>
                <div style={{ color: 'white', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>{recipient}</div>
              </div>
              <div style={{ background: '#1c1c1e', borderRadius: 14, padding: '14px 16px', width: '100%', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Network fee</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>~0.0001 KAS</span>
              </div>
              <div style={{ marginTop: 'auto', width: '100%', display: 'flex', gap: 12 }}>
                <button onClick={() => setStep('input')}
                  style={{ flex: 1, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '16px', fontSize: 16, cursor: 'pointer', fontFamily: SF }}>Back</button>
                <button onClick={handleSend}
                  style={{ flex: 2, background: ACCENT, border: 'none', color: 'white', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: SF }}>
                  Confirm & Send
                </button>
              </div>
            </motion.div>
          )}

          {step === 'sending' && (
            <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <RefreshCw size={40} color={ACCENT} />
              </motion.div>
              <div style={{ color: 'white', fontSize: 17, fontWeight: 600 }}>Broadcasting transaction...</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Signing and submitting to Kaspa network</div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '24px' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                style={{ width: 80, height: 80, borderRadius: 40, background: '#1a4a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={36} color="#34c759" strokeWidth={3} />
              </motion.div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sent!</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{amount} KAS sent successfully</div>
              </div>
              {txId && (
                <div style={{ background: '#1c1c1e', borderRadius: 12, padding: '12px 14px', width: '100%', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginBottom: 4 }}>Transaction ID</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{txId}</div>
                </div>
              )}
              <button onClick={onClose}
                style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '14px 32px', fontSize: 16, cursor: 'pointer', fontFamily: SF, marginTop: 12 }}>
                Done
              </button>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '24px' }}>
              <AlertTriangle size={48} color="#ff9500" />
              <div style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>Transaction Failed</div>
              <div style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 12, padding: '14px', width: '100%', color: '#ff6b6b', fontSize: 13, lineHeight: 1.5, textAlign: 'center' }}>
                {errorMsg}
              </div>
              <button onClick={() => setStep('input')}
                style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: 14, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: SF }}>
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* QR Scanner overlay */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}