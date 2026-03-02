import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, X, CheckCircle, Copy, Check, Key } from "lucide-react";
import QRCode from "qrcode";

const PAYMENT_ADDRESS = "kaspa:qqfk829q3wf6cyy9al4tzfc67x5spwatzc0g8fkexgrdve33sdh6s2nyh3car";
const BYPASS_KEY = "rufzeitk_bypass";

export default function TopupModal({ onClose, onSuccess, kaspaAddress }) {
  const [amount, setAmount] = useState(10);
  const [step, setStep] = useState("select"); // select | awaiting | confirmed
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sinceTimestamp, setSinceTimestamp] = useState(null);
  const pollRef = useRef(null);
  const [bypassCode, setBypassCode] = useState("");
  const [bypassError, setBypassError] = useState("");
  const [bypassLoading, setBypassLoading] = useState(false);
  const [bypassSuccess, setBypassSuccess] = useState(false);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleProceed = async () => {
    const ts = Date.now();
    setSinceTimestamp(ts);
    setStep("awaiting");

    // Generate QR
    const kaspaUri = `kaspa:${PAYMENT_ADDRESS.replace("kaspa:", "")}?amount=${amount}`;
    const url = await QRCode.toDataURL(kaspaUri, { width: 220, margin: 1, color: { dark: "#00d4ff", light: "#000000" } });
    setQrDataUrl(url);

    // Start polling
    pollRef.current = setInterval(() => checkPayment(amount, ts), 8000);
  };

  const checkPayment = async (amt, ts) => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await base44.functions.invoke("checkRufzeitKPayment", {
        amount_kas: amt,
        since_timestamp: ts,
        kaspa_address: kaspaAddress
      });
      if (res.data?.success) {
        clearInterval(pollRef.current);
        setStep("confirmed");
        setTimeout(() => {
          onSuccess(res.data.credits_added);
          onClose();
        }, 2500);
      }
    } catch (err) {
      console.error("Payment check error:", err);
    }
    setChecking(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(PAYMENT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyBypassCode = async () => {
    if (!bypassCode.trim()) return;
    setBypassLoading(true);
    setBypassError("");
    try {
      const results = await base44.entities.RufzeitKBypassCode.filter({ code: bypassCode.trim(), is_active: true });
      if (results.length === 0) { setBypassError("Invalid or expired code."); setBypassLoading(false); return; }
      const codeRecord = results[0];
      if (codeRecord.uses_remaining !== -1 && codeRecord.uses_remaining <= 0) {
        setBypassError("This code has no uses remaining.");
        setBypassLoading(false);
        return;
      }
      if (codeRecord.uses_remaining !== -1) {
        await base44.entities.RufzeitKBypassCode.update(codeRecord.id, { uses_remaining: codeRecord.uses_remaining - 1 });
      }
      localStorage.setItem(BYPASS_KEY, "true");
      setBypassSuccess(true);
      console.log("Bypass code applied! BYPASS_KEY set to true");
      setTimeout(() => { console.log("Calling onSuccess with bypass"); onSuccess(0); onClose(); }, 1500);
    } catch {
      setBypassError("Failed to verify code. Try again.");
    }
    setBypassLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {step === "select" && (
          <>
            <h2 className="text-white font-bold text-xl mb-1">Top Up Credits</h2>
            <p className="text-white/40 text-sm mb-6">1 KAS = 1 minute of calling</p>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {[5, 10, 20, 50].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    amount === v
                      ? "bg-cyan-500 text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {v} KAS
                </button>
              ))}
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-6 text-center">
              <div className="text-white/40 text-xs mb-1">You will receive</div>
              <div className="text-cyan-400 font-black text-3xl">{amount}</div>
              <div className="text-white/40 text-xs">minutes of call time</div>
            </div>

            <button
              onClick={handleProceed}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 rounded-xl transition-colors"
            >
              Pay {amount} KAS
            </button>

            {/* Bypass code section */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/30 text-xs mb-2 flex items-center gap-1"><Key className="w-3 h-3" /> Have a bypass code?</p>
              {bypassSuccess ? (
                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold justify-center py-2">
                  <CheckCircle className="w-4 h-4" /> Bypass activated!
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={bypassCode}
                    onChange={e => { setBypassCode(e.target.value); setBypassError(""); }}
                    placeholder="Enter code..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 outline-none focus:border-white/30"
                    onKeyDown={e => e.key === "Enter" && applyBypassCode()}
                  />
                  <button
                    onClick={applyBypassCode}
                    disabled={bypassLoading || !bypassCode.trim()}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-sm font-bold px-4 rounded-lg transition-colors"
                  >
                    {bypassLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
              {bypassError && <p className="text-red-400 text-xs mt-1">{bypassError}</p>}
            </div>
          </>
        )}

        {step === "awaiting" && (
          <>
            <h2 className="text-white font-bold text-xl mb-1">Send {amount} KAS</h2>
            <p className="text-white/40 text-sm mb-4">Scan QR or copy the address below</p>

            {qrDataUrl && (
              <div className="flex justify-center mb-4">
                <img src={qrDataUrl} alt="QR Code" className="rounded-xl" style={{ width: 180, height: 180 }} />
              </div>
            )}

            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-2 justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/60 font-mono mb-4 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="truncate">{PAYMENT_ADDRESS}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-white/40 text-sm mb-4">
              <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
              <span>Waiting for payment...</span>
            </div>

            <button
              onClick={() => {
                clearInterval(pollRef.current);
                setStep("select");
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
          </>
        )}

        {step === "confirmed" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="w-16 h-16 text-green-400" />
            <div className="text-white font-bold text-xl">Payment Confirmed!</div>
            <div className="text-white/50 text-sm">+{amount} minutes added to your account</div>
          </div>
        )}
      </div>
    </div>
  );
}