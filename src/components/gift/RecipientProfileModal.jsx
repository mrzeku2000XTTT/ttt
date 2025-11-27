import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, User, Heart, Cake, Tag, DollarSign } from "lucide-react";

export default function RecipientProfileModal({ onClose, onSave }) {
  const [profile, setProfile] = useState({
    recipient_name: "",
    relationship: "Friend",
    age_group: "Adult",
    interests: [],
    favorite_categories: [],
    budget_range: ""
  });
  const [interestInput, setInterestInput] = useState("");

  const relationships = ["Partner", "Friend", "Family", "Colleague", "Other"];
  const ageGroups = ["Child", "Teen", "Young Adult", "Adult", "Senior"];
  const categories = ["Electronics", "Fashion", "Home", "Books", "Toys", "Beauty", "Sports", "Other"];

  const addInterest = () => {
    if (interestInput.trim() && !profile.interests.includes(interestInput.trim())) {
      setProfile({
        ...profile,
        interests: [...profile.interests, interestInput.trim()]
      });
      setInterestInput("");
    }
  };

  const toggleCategory = (cat) => {
    setProfile({
      ...profile,
      favorite_categories: profile.favorite_categories.includes(cat)
        ? profile.favorite_categories.filter(c => c !== cat)
        : [...profile.favorite_categories, cat]
    });
  };

  const handleSave = () => {
    if (!profile.recipient_name.trim()) {
      alert('Please enter recipient name');
      return;
    }
    onSave(profile);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-purple-500/30 rounded-xl p-6 max-w-2xl w-full my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-xl flex items-center gap-2">
            <User className="w-6 h-6 text-purple-400" />
            Create Recipient Profile
          </h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-2 block">Recipient Name</label>
            <Input
              value={profile.recipient_name}
              onChange={(e) => setProfile({...profile, recipient_name: e.target.value})}
              placeholder="John Doe"
              className="bg-black border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">Relationship</label>
              <select
                value={profile.relationship}
                onChange={(e) => setProfile({...profile, relationship: e.target.value})}
                className="w-full bg-black border border-white/10 text-white rounded-md p-2"
              >
                {relationships.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-white/60 mb-2 block">Age Group</label>
              <select
                value={profile.age_group}
                onChange={(e) => setProfile({...profile, age_group: e.target.value})}
                className="w-full bg-black border border-white/10 text-white rounded-md p-2"
              >
                {ageGroups.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">Budget Range</label>
            <Input
              value={profile.budget_range}
              onChange={(e) => setProfile({...profile, budget_range: e.target.value})}
              placeholder="$50 - $200"
              className="bg-black border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">Interests & Hobbies</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                placeholder="Gaming, Reading, Cooking..."
                className="bg-black border-white/10 text-white flex-1"
              />
              <Button onClick={addInterest} size="sm" className="bg-purple-500">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs flex items-center gap-2"
                >
                  {interest}
                  <button
                    onClick={() => setProfile({
                      ...profile,
                      interests: profile.interests.filter((_, i) => i !== idx)
                    })}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">Favorite Categories</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`p-2 rounded-lg text-xs transition-all ${
                    profile.favorite_categories.includes(cat)
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Save Profile & Get AI Suggestions
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}