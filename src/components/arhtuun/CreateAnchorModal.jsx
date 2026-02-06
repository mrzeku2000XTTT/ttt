import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Anchor, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

export default function CreateAnchorModal({ onClose, onSuccess }) {
  const [vector, setVector] = useState("");
  const [weight, setWeight] = useState("");
  const [openLoop, setOpenLoop] = useState("");
  const [pressure, setPressure] = useState("creative_flow");
  const [tags, setTags] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!vector || !weight || !openLoop) return;

    setIsCreating(true);
    try {
      // Generate mock Kaspa data (in production this would be real)
      const mockTxHash = `kaspa:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const mockBlockHeight = Math.floor(Math.random() * 1000000) + 12000000;

      const anchor = await base44.entities.ContinuityAnchor.create({
        vector,
        weight,
        open_loop: openLoop,
        pressure,
        kaspa_tx_hash: mockTxHash,
        block_height: mockBlockHeight,
        anchor_timestamp: new Date().toISOString(),
        context_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_verified: true
      });

      onSuccess(anchor);
    } catch (err) {
      console.error("Failed to create anchor:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                <Anchor className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Create Continuity Anchor</h3>
                <p className="text-white/60 text-xs">Preserve your intentional state</p>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="text-white/80 text-sm font-semibold mb-2 block">
                Vector: Directional Aim
              </label>
              <Input
                value={vector}
                onChange={(e) => setVector(e.target.value)}
                placeholder="What are you trying to bring into existence?"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-white/40 text-xs mt-1">Not the task, but the desired future state</p>
            </div>

            <div>
              <label className="text-white/80 text-sm font-semibold mb-2 block">
                Weight: Contextual Significance
              </label>
              <Textarea
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Why does this matter right now?"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-20"
              />
            </div>

            <div>
              <label className="text-white/80 text-sm font-semibold mb-2 block">
                Open Loop: Point of Suspension
              </label>
              <Input
                value={openLoop}
                onChange={(e) => setOpenLoop(e.target.value)}
                placeholder="Where exactly did you leave off?"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <label className="text-white/80 text-sm font-semibold mb-2 block">
                Pressure: Motivational Quality
              </label>
              <select
                value={pressure}
                onChange={(e) => setPressure(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white"
                style={{ colorScheme: 'dark' }}
              >
                <option value="creative_flow">Creative Flow</option>
                <option value="urgent_solving">Urgent Problem Solving</option>
                <option value="analytical_thinking">Analytical Thinking</option>
                <option value="routine_execution">Routine Execution</option>
              </select>
            </div>

            <div>
              <label className="text-white/80 text-sm font-semibold mb-2 block">
                Context Tags (comma separated)
              </label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="writing, research, project-x"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <div className="p-6 border-t border-white/10 flex justify-end gap-3">
            <Button onClick={onClose} variant="ghost" className="text-white/60">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!vector || !weight || !openLoop || isCreating}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Anchor
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}