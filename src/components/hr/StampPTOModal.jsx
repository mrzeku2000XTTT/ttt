import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Loader2, Shield, CheckCircle2, AlertCircle } from "lucide-react";

export default function StampPTOModal({ isOpen, onClose, conversionData, onStamp }) {
  const [loading, setLoading] = useState(false);
  const [stamped, setStamped] = useState(false);

  const handleStamp = async () => {
    setLoading(true);
    try {
      // Check if Kasware is available
      if (!window.kasware) {
        alert("Please install Kasware wallet extension");
        setLoading(false);
        return;
      }

      // Request account access
      const accounts = await window.kasware.requestAccounts();
      const wallet = accounts[0];

      // Create stamp message
      const stampMessage = `TTT HR PTO Stamp
Employee: ${conversionData.employee_name}
PTO Hours: ${conversionData.hours}
KAS Amount: ${conversionData.amount_kas}
USD Value: $${conversionData.amount_usd}
Timestamp: ${new Date().toISOString()}

This signature proves that ${conversionData.amount_kas} KAS is locked for this PTO conversion and can be claimed by the employee.`;

      // Sign with Kasware
      const signature = await window.kasware.signMessage(stampMessage);

      // Save stamp
      await onStamp({
        employee_wallet: wallet,
        kasware_signature: signature,
        stamp_message: stampMessage
      });

      setStamped(true);
      setTimeout(() => {
        onClose();
        setStamped(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to stamp:", err);
      alert("Failed to stamp PTO: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          className="bg-zinc-900 border border-white/20 rounded-2xl p-6 max-w-lg w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              Stamp PTO Conversion
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!stamped ? (
            <>
              <div className="mb-6 p-4 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Employee:</span>
                    <span className="font-bold text-white">{conversionData.employee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">PTO Hours:</span>
                    <span className="font-bold text-purple-400">{conversionData.hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">KAS Amount:</span>
                    <span className="font-bold text-cyan-400">{conversionData.amount_kas} KAS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">USD Value:</span>
                    <span className="font-bold text-green-400">${conversionData.amount_usd}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-400 mb-1">What is PTO Stamping?</div>
                    <div className="text-sm text-gray-300">
                      Stamping creates an immutable proof that this KAS amount is locked and guaranteed for the employee. 
                      Your Kasware signature will verify this conversion on the blockchain.
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStamp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 h-12"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Sign with Kasware
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
              <h3 className="text-xl font-bold text-white mb-2">PTO Stamped! 🎉</h3>
              <p className="text-gray-300">
                Your signature has been recorded on the blockchain
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}