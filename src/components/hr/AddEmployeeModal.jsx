import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Plus } from "lucide-react";

export default function AddEmployeeModal({ isOpen, onClose, onAdd }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_email: "",
    wallet_address: "",
    full_name: "",
    agentzk_username: "",
    resume_url: "",
    role: "",
    department: "",
    salary_usd: "",
    pto_accrual_rate: "10",
    hire_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.user_email || !formData.wallet_address || !formData.full_name || !formData.role || !formData.salary_usd) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        ...formData,
        salary_usd: parseFloat(formData.salary_usd),
        pto_accrual_rate: parseFloat(formData.pto_accrual_rate),
        pto_balance_hours: 0
      });
      onClose();
      setFormData({
        user_email: "",
        wallet_address: "",
        full_name: "",
        agentzk_username: "",
        resume_url: "",
        role: "",
        department: "",
        salary_usd: "",
        pto_accrual_rate: "10",
        hire_date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error("Failed to add employee:", err);
      alert("Failed to add employee");
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
          className="bg-zinc-900 border border-white/20 rounded-2xl p-4 md:p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto mx-4"
          >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Add Employee</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Full Name *</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="John Doe"
                  className="bg-black border-white/20 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Email *</label>
                <Input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                  placeholder="john@company.com"
                  className="bg-black border-white/20 text-white"
                  required
                />
                </div>

                <div>
                <label className="text-sm text-gray-300 mb-2 block">Agent ZK Username</label>
                <Input
                  value={formData.agentzk_username}
                  onChange={(e) => setFormData({...formData, agentzk_username: e.target.value})}
                  placeholder="@username"
                  className="bg-black border-white/20 text-white"
                />
                </div>

                <div>
                <label className="text-sm text-gray-300 mb-2 block">Resume URL</label>
                <Input
                  value={formData.resume_url}
                  onChange={(e) => setFormData({...formData, resume_url: e.target.value})}
                  placeholder="https://..."
                  className="bg-black border-white/20 text-white"
                />
                </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Role/Title *</label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="Senior Engineer"
                  className="bg-black border-white/20 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="Engineering"
                  className="bg-black border-white/20 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Monthly Salary (USD) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.salary_usd}
                  onChange={(e) => setFormData({...formData, salary_usd: e.target.value})}
                  placeholder="5000"
                  className="bg-black border-white/20 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">PTO Hours/Month</label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.pto_accrual_rate}
                  onChange={(e) => setFormData({...formData, pto_accrual_rate: e.target.value})}
                  className="bg-black border-white/20 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Hire Date</label>
                <Input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  className="bg-black border-white/20 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Kaspa Wallet Address *</label>
              <Input
                value={formData.wallet_address}
                onChange={(e) => setFormData({...formData, wallet_address: e.target.value})}
                placeholder="kaspa:qq..."
                className="bg-black border-white/20 text-white font-mono text-sm"
                required
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
                className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
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