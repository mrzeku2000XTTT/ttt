import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, Save } from "lucide-react";

export default function EditJobModal({ isOpen, onClose, job, onUpdate, kasPrice }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        department: job.department || "",
        location: job.location || "",
        employment_type: job.employment_type || "full_time",
        salary_range_min: job.salary_range_min || "",
        salary_range_max: job.salary_range_max || "",
        description: job.description || "",
        is_remote: job.is_remote || false
      });
    }
  }, [job]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(job.id, formData);
      onClose();
    } catch (err) {
      console.error("Failed to update job:", err);
      alert("Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !formData) return null;

  const kasMin = formData.salary_range_min ? Math.round(formData.salary_range_min / kasPrice) : 0;
  const kasMax = formData.salary_range_max ? Math.round(formData.salary_range_max / kasPrice) : 0;

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
          className="bg-zinc-900 border border-white/20 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Job Listing</h2>
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
                <label className="text-sm text-gray-300 mb-2 block">Job Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-black border-white/20 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="bg-black border-white/20 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="bg-black border-white/20 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Employment Type</label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                  className="w-full bg-black border border-white/20 text-white rounded-lg px-3 py-2"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Min Salary (USD)</label>
                <Input
                  type="number"
                  value={formData.salary_range_min}
                  onChange={(e) => setFormData({...formData, salary_range_min: parseFloat(e.target.value) || ""})}
                  className="bg-black border-white/20 text-white"
                />
                {formData.salary_range_min && (
                  <div className="text-xs text-cyan-400 mt-1">≈ {kasMin.toLocaleString()} KAS</div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Max Salary (USD)</label>
                <Input
                  type="number"
                  value={formData.salary_range_max}
                  onChange={(e) => setFormData({...formData, salary_range_max: parseFloat(e.target.value) || ""})}
                  className="bg-black border-white/20 text-white"
                />
                {formData.salary_range_max && (
                  <div className="text-xs text-cyan-400 mt-1">≈ {kasMax.toLocaleString()} KAS</div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-black border-white/20 text-white min-h-32"
                rows={6}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_remote}
                onChange={(e) => setFormData({...formData, is_remote: e.target.checked})}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-300">Remote Position</label>
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
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
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