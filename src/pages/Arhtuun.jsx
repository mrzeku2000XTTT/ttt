import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import CreateAnchorModal from "@/components/arhtuun/CreateAnchorModal";
import AnchorCard from "@/components/arhtuun/AnchorCard";
import AnchorDetailModal from "@/components/arhtuun/AnchorDetailModal";

export default function ArhtuunPage() {
  const [user, setUser] = useState(null);
  const [anchors, setAnchors] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnchor, setSelectedAnchor] = useState(null);
  const [filterPressure, setFilterPressure] = useState("all");

  useEffect(() => {
    loadUser();
    loadAnchors();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
      base44.auth.redirectToLogin();
    }
  };

  const loadAnchors = async () => {
    try {
      const data = await base44.entities.ContinuityAnchor.list('-anchor_timestamp');
      setAnchors(data);
    } catch (err) {
      console.error("Failed to load anchors:", err);
    }
  };

  const handleAnchorCreated = (anchor) => {
    setAnchors(prev => [anchor, ...prev]);
    setShowCreateModal(false);
  };

  const filteredAnchors = filterPressure === "all" 
    ? anchors 
    : anchors.filter(a => a.pressure === filterPressure);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.3,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [null, Math.random() * 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(white 1px, transparent 1px),
            linear-gradient(90deg, white 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.img
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a2caf932e_image.png"
                alt="Arh'tuun"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-4xl font-black text-white mb-1">Arh'tuun</h1>
                <p className="text-white/60 text-sm">Identity Persistence Protocol</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Anchor
            </Button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-2">The Return Thread</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Continuity Anchors preserve your intentional state across digital interruptions. 
                  Each anchor captures the Vector (what you're creating), Weight (why it matters), 
                  Open Loop (where you left off), and Pressure (nature of engagement) - all verified 
                  on the Kaspa blockchain for authenticity.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-3">
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={filterPressure}
            onChange={(e) => setFilterPressure(e.target.value)}
            className="px-4 py-2 bg-black border border-white/10 rounded-lg text-white text-sm"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all">All Pressures</option>
            <option value="creative_flow">Creative Flow</option>
            <option value="urgent_solving">Urgent Solving</option>
            <option value="analytical_thinking">Analytical</option>
            <option value="routine_execution">Routine</option>
          </select>
          <div className="text-white/40 text-sm">
            {filteredAnchors.length} anchor{filteredAnchors.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Anchors Grid */}
        {filteredAnchors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-white/40" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No Continuity Anchors Yet</h3>
            <p className="text-white/60 text-sm mb-6">Create your first anchor to preserve your intentional state</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Anchor
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredAnchors.map((anchor) => (
                <AnchorCard
                  key={anchor.id}
                  anchor={anchor}
                  onClick={() => setSelectedAnchor(anchor)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateAnchorModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAnchorCreated}
        />
      )}

      {selectedAnchor && (
        <AnchorDetailModal
          anchor={selectedAnchor}
          onClose={() => setSelectedAnchor(null)}
        />
      )}
    </div>
  );
}