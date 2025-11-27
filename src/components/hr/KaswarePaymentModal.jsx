import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Send, CheckCircle2, Wallet } from "lucide-react";

export default function KaswarePaymentModal({ isOpen, onClose, employee, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState("");

  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      if (!window.kasware) {
        alert("Please install Kasware wallet extension");
        setLoading(false);
        return;
      }

      // Request account access
      const accounts = await window.kasware.requestAccounts();
      
      // Convert KAS to sompi (1 KAS = 100,000,000 sompi)
      const sompiAmount = Math.floor(parseFloat(amount) * 100000000);

      // Send transaction
      const txId = await window.kasware.sendKaspa(employee.wallet_address, sompiAmount);

      setSuccess(true);
      setTimeout(() => {
        onSuccess({
          txId,
          amount: parseFloat(amount),
          employee_email: employee.user_email,
          employee_name: employee.full_name,
          to_wallet: employee.wallet_address
        });
        onClose();
        setSuccess(false);
        setAmount("");
      }, 2000);
    } catch (err) {
      console.error("Payment failed:", err);
      alert("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-900 border border-white/20 rounded-2xl p-4 md:p-6 max-w-md w-full mx-4"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-cyan-400" />
              Pay with Kasware
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!success ? (
            <>
              <div className="mb-6 p-4 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Employee:</span>
                    <span className="font-bold text-white">{employee.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Role:</span>
                    <span className="font-semibold text-purple-400">{employee.role}</span>
                  </div>
                  <div className="text-xs font-mono text-gray-500 bg-black/40 p-2 rounded mt-2">
                    To: {employee.wallet_address}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm text-gray-300 mb-2 block">Amount (KAS)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00"
                  className="bg-black border-white/20 text-white text-lg"
                  required
                />
              </div>

              <Button
                onClick={handlePay}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Payment
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Payment Sent! 🎉</h3>
              <p className="text-gray-300">
                {amount} KAS sent to {employee.full_name}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}