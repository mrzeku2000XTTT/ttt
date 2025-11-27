import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, DollarSign, Calendar } from "lucide-react";

export default function PTOConversionModal({ isOpen, onClose, employee, onConvert, kasPrice }) {
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState("");

  const hourlyRate = employee ? (employee.salary_usd / 160) : 0; // ~160 work hours/month
  const conversionRate = 0.8; // 80% of hourly rate for PTO conversion
  const usdValue = hours ? (parseFloat(hours) * hourlyRate * conversionRate).toFixed(2) : "0";
  const kasValue = hours ? (parseFloat(usdValue) / kasPrice).toFixed(2) : "0";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hours || parseFloat(hours) <= 0) {
      alert("Please enter valid hours");
      return;
    }

    if (parseFloat(hours) > employee.pto_balance_hours) {
      alert("Not enough PTO balance");
      return;
    }

    setLoading(true);
    try {
      await onConvert({
        hours: parseFloat(hours),
        amount_usd: parseFloat(usdValue),
        amount_kas: parseFloat(kasValue)
      });
      onClose();
      setHours("");
    } catch (err) {
      console.error("Failed to convert PTO:", err);
      alert("Failed to convert PTO");
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
          className="bg-zinc-900 border border-white/20 rounded-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Convert PTO to KAS</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="text-sm text-gray-300 mb-1">{employee.full_name}</div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Available PTO:</span>
              <span className="text-xl font-bold text-purple-400">{employee.pto_balance_hours}h</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Hours to Convert</label>
              <Input
                type="number"
                step="0.5"
                max={employee.pto_balance_hours}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="8"
                className="bg-black border-white/20 text-white"
                required
              />
            </div>

            {hours && parseFloat(hours) > 0 && (
              <div className="p-4 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Hourly Rate:</span>
                  <span className="font-semibold text-white">${hourlyRate.toFixed(2)}/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Conversion Rate:</span>
                  <span className="font-semibold text-white">80%</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">USD Value:</span>
                    <span className="text-lg font-bold text-green-400">${usdValue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">KAS Value:</span>
                    <span className="text-xl font-bold text-cyan-400">{kasValue} KAS</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !hours || parseFloat(hours) <= 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Convert to KAS
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}