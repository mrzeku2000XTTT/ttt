import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, Loader2, Shield, Award } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BadgeManagerModal({ onClose }) {
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedUsernames, setFeedUsernames] = useState([]);
  
  // New badge form
  const [newUsername, setNewUsername] = useState("");
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeColor, setNewBadgeColor] = useState("cyan");

  const colorOptions = [
    { value: "cyan", label: "Cyan", class: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" },
    { value: "purple", label: "Purple", class: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
    { value: "yellow", label: "Yellow", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
    { value: "red", label: "Red", class: "bg-red-500/20 text-red-400 border-red-500/40" },
    { value: "green", label: "Green", class: "bg-green-500/20 text-green-400 border-green-500/40" },
    { value: "blue", label: "Blue", class: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
    { value: "pink", label: "Pink", class: "bg-pink-500/20 text-pink-400 border-pink-500/40" },
  ];

  useEffect(() => {
    loadBadges();
    loadFeedUsernames();
  }, []);

  const loadBadges = async () => {
    setIsLoading(true);
    try {
      const allBadges = await base44.entities.UserBadge.list();
      setBadges(allBadges);
    } catch (err) {
      console.error("Failed to load badges:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeedUsernames = async () => {
    try {
      const posts = await base44.entities.Post.list('-created_date', 500);
      const uniqueUsernames = [...new Set(posts.map(p => p.author_name).filter(Boolean))];
      setFeedUsernames(uniqueUsernames.sort());
    } catch (err) {
      console.error("Failed to load feed usernames:", err);
    }
  };

  const handleAddBadge = async () => {
    if (!newUsername.trim() || !newBadgeName.trim()) return;

    setIsSaving(true);
    try {
      await base44.entities.UserBadge.create({
        username: newUsername.trim(),
        badge_name: newBadgeName.trim().toUpperCase(),
        badge_color: newBadgeColor,
        is_active: true
      });

      setNewUsername("");
      setNewBadgeName("");
      setNewBadgeColor("cyan");
      await loadBadges();
    } catch (err) {
      console.error("Failed to add badge:", err);
      alert("Failed to add badge");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!confirm("Delete this badge?")) return;

    try {
      await base44.entities.UserBadge.delete(badgeId);
      await loadBadges();
    } catch (err) {
      console.error("Failed to delete badge:", err);
      alert("Failed to delete badge");
    }
  };

  const handleToggleBadge = async (badge) => {
    try {
      await base44.entities.UserBadge.update(badge.id, {
        is_active: !badge.is_active
      });
      await loadBadges();
    } catch (err) {
      console.error("Failed to toggle badge:", err);
    }
  };

  const getColorClass = (color) => {
    const colorMap = {
      cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/40",
      yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
      red: "bg-red-500/20 text-red-400 border-red-500/40",
      green: "bg-green-500/20 text-green-400 border-green-500/40",
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      pink: "bg-pink-500/20 text-pink-400 border-pink-500/40"
    };
    return colorMap[color] || colorMap.cyan;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-black border border-white/20 rounded-xl w-full max-w-lg max-h-[85vh] md:max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-white">Badge Manager</h2>
                <p className="text-[10px] md:text-xs text-white/50">Assign custom badges to users</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Add Badge Form */}
        <div className="p-3 md:p-4 border-b border-white/10 bg-white/5">
          <div className="space-y-2">
            {/* Feed Users Dropdown */}
            <div>
              <label className="text-[10px] md:text-xs text-white/60 mb-1 block">Select from Feed ({feedUsernames.length})</label>
              <select
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                size="4"
                className="w-full bg-white/5 border border-white/20 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-white/40 transition-colors max-h-24 overflow-y-auto"
              >
                <option value="" className="bg-zinc-900 text-white/40">Choose a user...</option>
                {feedUsernames.map(username => (
                  <option key={username} value={username} className="bg-zinc-900 text-white">
                    {username}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username"
                className="bg-white/5 border-white/20 text-white text-sm h-9"
              />
              <Input
                value={newBadgeName}
                onChange={(e) => setNewBadgeName(e.target.value)}
                placeholder="Badge (VIP, MOD)"
                className="bg-white/5 border-white/20 text-white text-sm h-9"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={newBadgeColor}
                onChange={(e) => setNewBadgeColor(e.target.value)}
                className="flex-1 bg-white/5 border border-white/20 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-white/40"
              >
                {colorOptions.map(color => (
                  <option key={color.value} value={color.value} className="bg-zinc-900">
                    {color.label}
                  </option>
                ))}
              </select>

              <Button
                onClick={handleAddBadge}
                disabled={isSaving || !newUsername.trim() || !newBadgeName.trim()}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 h-9 px-3"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span className="text-xs md:text-sm">Add</span>
                  </>
                )}
              </Button>
            </div>

            {/* Preview */}
            {newBadgeName && (
              <div className="flex items-center gap-2 text-xs pt-1">
                <span className="text-white/50">Preview:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getColorClass(newBadgeColor)}`}>
                  {newBadgeName.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Badges List */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {isLoading ? (
            <div className="text-center py-6">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/50 text-xs">No badges assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-2.5 md:p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => handleToggleBadge(badge)}
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                        badge.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      <Shield className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-white font-semibold text-xs md:text-sm truncate">{badge.username}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getColorClass(badge.badge_color)} flex-shrink-0`}>
                          {badge.badge_name}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40">
                        {badge.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeleteBadge(badge.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0 flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}