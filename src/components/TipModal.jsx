import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, CheckCircle, Clock, AlertCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const TIP_API_BASE = "https://kaspa-node-proxy-nebulouslabs.replit.app";

export default function TipModal({ isOpen, onClose }) {
  const [step, setStep] = useState("form"); // form, payment, success, expired
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [tipData, setTipData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes in seconds
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === "payment" && tipData) {
      const interval = setInterval(() => {
        checkTipStatus(tipData.tipId);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [step, tipData]);

  useEffect(() => {
    if (step === "payment" && tipData?.expiresAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const expires = new Date(tipData.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          setStep("expired");
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, tipData]);

  const createTipRequest = async () => {
    if (!recipientAddress) {
      toast.error("Recipient address is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${TIP_API_BASE}/api/tip/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientAddress,
          amount: amount ? parseFloat(amount) : null,
          senderName: senderName || "Anonymous",
          message: message || ""
        })
      });

      const data = await response.json();

      if (data.success) {
        setTipData(data);
        setStep("payment");
        toast.success("Tip request created!");
      } else {
        toast.error(data.error || "Failed to create tip request");
      }
    } catch (err) {
      console.error("Create tip error:", err);
      toast.error("Failed to create tip request");
    }
    setLoading(false);
  };

  const checkTipStatus = async (tipId) => {
    try {
      const response = await fetch(`${TIP_API_BASE}/api/tip/status/${tipId}`);
      const status = await response.json();

      if (status.status === "confirmed") {
        setTipData(prev => ({ ...prev, amountReceived: status.amountReceived }));
        setStep("success");
        triggerConfetti();
      } else if (status.status === "partial") {
        toast.warning(`Partial payment received: ${status.amountReceived} KAS`);
      } else if (status.status === "expired") {
        setStep("expired");
      }
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  const triggerConfetti = () => {
    // Simple confetti effect
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const colors = ["#4fd1c5", "#6366f1", "#ec4899"];

    (function frame() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) return;

      const particleCount = 3;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}%;
          top: -10px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          animation: fall ${0.5 + Math.random() * 0.5}s linear;
        `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
      }

      requestAnimationFrame(frame);
    })();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recipientAddress || tipData?.recipientAddress);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const resetModal = () => {
    setStep("form");
    setRecipientAddress("");
    setAmount("");
    setSenderName("");
    setMessage("");
    setTipData(null);
    setTimeRemaining(1800);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Send Tip</h2>
                    <p className="text-xs text-white/60">Kaspa blockchain</p>
                  </div>
                </div>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon"
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {step === "form" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/80 mb-2 block">
                      Recipient Address <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="kaspa:qr..."
                      className="bg-white/5 border-white/10 text-white h-12 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/80 mb-2 block">
                      Amount in KAS (optional)
                    </label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="10"
                      className="bg-white/5 border-white/10 text-white h-12 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/80 mb-2 block">
                      Your Name (optional)
                    </label>
                    <Input
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Anonymous"
                      className="bg-white/5 border-white/10 text-white h-12 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/80 mb-2 block">
                      Message (optional)
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Thanks for your work!"
                      className="bg-white/5 border-white/10 text-white rounded-lg resize-none min-h-[100px]"
                    />
                  </div>

                  <Button
                    onClick={createTipRequest}
                    disabled={loading || !recipientAddress}
                    className="w-full bg-[#4fd1c5] hover:bg-[#45c0b5] text-black h-12 rounded-lg font-bold disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Tip Request"}
                  </Button>
                </div>
              )}

              {step === "payment" && tipData && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-xl">
                    <img
                      src={tipData.qrCode}
                      alt="QR Code"
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-white/60 mb-1">Recipient Address</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-white font-mono break-all flex-1">
                          {tipData.recipientAddress}
                        </p>
                        <Button
                          onClick={handleCopy}
                          size="sm"
                          className="bg-white/10 hover:bg-white/20 text-white"
                        >
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {amount && (
                      <div>
                        <p className="text-xs text-white/60 mb-1">Amount to Send</p>
                        <p className="text-lg font-bold text-[#4fd1c5]">{amount} KAS</p>
                      </div>
                    )}

                    {message && (
                      <div>
                        <p className="text-xs text-white/60 mb-1">Message</p>
                        <p className="text-sm text-white/80">{message}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#4fd1c5]/10 border border-[#4fd1c5]/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-[#4fd1c5]" />
                      <span className="text-sm text-white font-semibold">
                        Time Remaining: {formatTime(timeRemaining)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#4fd1c5]/30 border-t-[#4fd1c5] rounded-full animate-spin" />
                      <span className="text-sm text-white/80">Waiting for payment...</span>
                    </div>
                  </div>

                  <p className="text-center text-sm text-white/60">
                    Scan with Kaspium wallet or copy address
                  </p>
                </div>
              )}

              {step === "success" && tipData && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Tip Received! 🎉</h3>
                    <p className="text-lg text-[#4fd1c5] font-semibold">
                      {tipData.amountReceived} KAS sent successfully
                    </p>
                  </div>

                  {message && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-sm text-white/60 mb-1">Message sent:</p>
                      <p className="text-sm text-white">{message}</p>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      resetModal();
                      onClose();
                    }}
                    className="w-full bg-[#4fd1c5] hover:bg-[#45c0b5] text-black h-12 rounded-lg font-bold"
                  >
                    Done
                  </Button>
                </div>
              )}

              {step === "expired" && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Tip Request Expired</h3>
                    <p className="text-sm text-white/60">
                      The 30-minute window has passed without payment
                    </p>
                  </div>

                  <Button
                    onClick={resetModal}
                    className="w-full bg-[#4fd1c5] hover:bg-[#45c0b5] text-black h-12 rounded-lg font-bold"
                  >
                    Create New Tip Request
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}