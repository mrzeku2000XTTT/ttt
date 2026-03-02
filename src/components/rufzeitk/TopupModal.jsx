import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, X, CheckCircle, Copy, Check, Key } from "lucide-react";
import QRCode from "qrcode";

const PAYMENT_ADDRESS = "kaspa:qqfk829q3wf6cyy9al4tzfc67x5spwatzc0g8fkexgrdve33sdh6s2nyh3car";
const BYPASS_KEY = "rufzeitk_bypass";

export default function TopupModal({ onClose, onSuccess }) {
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
        since_timestamp: ts
      });
      if (res.data?.success) {
        clearInterval(pollRef.current);
        setStep("confirmed");
        setTimeout(() => {
          onSuccess(res.data.credits_added);
          onClose();
        }, 2500);
      }
    } catch {}
    setChecking(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(PAYMENT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

            <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
              <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
              <span>Waiting for payment...</span>
            </div>
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