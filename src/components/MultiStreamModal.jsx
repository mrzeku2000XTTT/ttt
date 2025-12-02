import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MultiStreamModal({ isOpen, onClose, onConfirm }) {
  const [streams, setStreams] = useState([]);
  const [customUrl, setCustomUrl] = useState("");

  const quickStreams = [
    { name: "NFL Live", url: "https://sportsurge.io" },
    { name: "NBA Live", url: "https://nbastream.nu" },
    { name: "Soccer Live", url: "https://soccerstreams-100.tv" },
    { name: "MLB Live", url: "https://mlb66.ir" },
    { name: "NHL Live", url: "https://nhlstream.nu" },
    { name: "UFC/Boxing", url: "https://methstreams.com" },
    { name: "College Sports", url: "https://crackstreams.biz" },
    { name: "Formula 1", url: "https://f1livegp.me" },
  ];

  const addStream = (stream) => {
    if (streams.length >= 4) {
      alert("Maximum 4 streams allowed");
      return;
    }
    setStreams([...streams, stream]);
  };

  const addCustomStream = () => {
    if (!customUrl.trim()) return;
    if (streams.length >= 4) {
      alert("Maximum 4 streams allowed");
      return;
    }
    setStreams([...streams, { name: "Custom Stream", url: customUrl }]);
    setCustomUrl("");
  };

  const removeStream = (index) => {
    setStreams(streams.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (streams.length === 0) {
      alert("Please select at least one stream");
      return;
    }
    onConfirm(streams);
    onClose();
    setStreams([]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-900 border border-white/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Multi Stream / CHOOSE GAMES (MAX 4)</h2>
              <p className="text-white/60 text-sm mt-1">Select up to 4 streams to watch simultaneously</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Selected Streams */}
          {streams.length > 0 && (
            <div className="mb-6 bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-white font-bold mb-3">Selected Streams ({streams.length}/4)</h3>
              <div className="space-y-2">
                {streams.map((stream, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div>
                      <div className="text-white font-semibold">{stream.name}</div>
                      <div className="text-white/60 text-xs truncate">{stream.url}</div>
                    </div>
                    <Button
                      onClick={() => removeStream(i)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stream Options */}
          <div className="mb-6">
            <h3 className="text-white font-bold mb-3">Quick Select</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickStreams.map((stream, i) => (
                <button
                  key={i}
                  onClick={() => addStream(stream)}
                  disabled={streams.length >= 4}
                  className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-white/10 rounded-lg p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-white font-semibold text-sm">{stream.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL Input */}
          <div className="mb-6">
            <h3 className="text-white font-bold mb-3">Add Custom Stream</h3>
            <div className="flex gap-2">
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste stream URL..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                onKeyPress={(e) => e.key === 'Enter' && addCustomStream()}
              />
              <Button
                onClick={addCustomStream}
                disabled={streams.length >= 4 || !customUrl.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={streams.length === 0}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-white font-bold"
            >
              Start Multi Stream ({streams.length})
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 h-12"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}