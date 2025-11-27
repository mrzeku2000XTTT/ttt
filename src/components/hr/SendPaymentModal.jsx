import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, Send, Zap } from "lucide-react";

export default function SendPaymentModal({ isOpen, onClose, onSend, employees, kasPrice }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    type: "bonus",
    amount_usd: "",
    description: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.amount_usd) {
      alert("Please select employee and enter amount");
      return;
    }

    const employee = employees.find(e => e.id === formData.employee_id);
    if (!employee) return;

    setLoading(true);
    try {
      await onSend({
        employee_email: employee.user_email,
        employee_name: employee.full_name,
        to_wallet: employee.wallet_address,
        type: formData.type,
        amount_usd: parseFloat(formData.amount_usd),
        amount_kas: parseFloat(formData.amount_usd) / kasPrice,
        kas_price_at_time: kasPrice,
        description: formData.description,
        status: "completed"
      });
      onClose();
      setFormData({
        employee_id: "",
        type: "bonus",
        amount_usd: "",
        description: ""
      });
    } catch (err) {
      console.error("Failed to send payment:", err);
      alert("Failed to send payment");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedEmployee = employees.find(e => e.id === formData.employee_id);
  const kasAmount = formData.amount_usd ? (parseFloat(formData.amount_usd) / kasPrice).toFixed(2) : "0";

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
              <Zap className="w-6 h-6 text-cyan-400" />
              Instant Payment
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Select Employee *</label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                className="w-full bg-black border border-white/20 text-white rounded-lg px-3 py-2"
                required
              >
                <option value="">Choose employee...</option>
                {employees.filter(e => e.status === 'active').map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} - {emp.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Payment Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-black border border-white/20 text-white rounded-lg px-3 py-2"
              >
                <option value="bonus">Bonus</option>
                <option value="salary">Salary</option>
                <option value="expense_reimbursement">Expense Reimbursement</option>
                <option value="pto_payout">PTO Payout</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Amount (USD) *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount_usd}
                onChange={(e) => setFormData({...formData, amount_usd: e.target.value})}
                placeholder="100.00"
                className="bg-black border-white/20 text-white"
                required
              />
              {formData.amount_usd && (
                <div className="mt-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">In KAS:</span>
                    <span className="text-lg font-bold text-cyan-400">{kasAmount} KAS</span>
                  </div>
                  {selectedEmployee && (
                    <div className="text-xs text-gray-400 mt-2">
                      To: {selectedEmployee.wallet_address.substring(0, 20)}...
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Performance bonus, referral reward, etc."
                className="bg-black border-white/20 text-white"
                rows={3}
              />
            </div>

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
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Payment
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