import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus, ExternalLink } from "lucide-react";

export default function NextdoorPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProposeModal, setShowProposeModal] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    }
  };

  const apps = [
    { id: 1, name: "TTTV", path: "Browser", icon: "🎬", category: "Entertainment", description: "Watch videos and streams" },
    { id: 2, name: "Agent ZK", path: "AgentZK", icon: "🤖", category: "AI", description: "Your personal AI agent" },
    { id: 3, name: "TTT Feed", path: "Feed", icon: "📱", category: "Social", description: "Connect with the community" },
    { id: 4, name: "Marketplace", path: "Marketplace", icon: "🛍️", category: "Shopping", description: "Buy and sell items" },
    { id: 5, name: "Wallet", path: "Wallet", icon: "💰", category: "Finance", description: "Manage your funds" },
    { id: 6, name: "NFT Mint", path: "NFTMint", icon: "🎨", category: "NFT", description: "Create and mint NFTs" },
    { id: 7, name: "Arcade", path: "Arcade", icon: "🎮", category: "Gaming", description: "Play games" },
    { id: 8, name: "K-University", path: "KUniversity", icon: "📚", category: "Education", description: "Learn and grow" },
    { id: 9, name: "Hercules", path: "Hercules", icon: "💪", category: "Tools", description: "Powerful utilities" },
    { id: 10, name: "Analytics", path: "Analytics", icon: "📊", category: "Analytics", description: "Track performance" },
  ];

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl('OliviaApps'))}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white font-black text-3xl">Nextdoor</h1>
              <p className="text-zinc-400 text-sm">Your neighborhood app store</p>
            </div>
          </div>
          {user && (
            <Button
              onClick={() => setShowProposeModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Propose App
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps..."
            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-12"
          />
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => navigate(createPageUrl(app.path))}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 flex flex-col items-center gap-3 transition-all hover:scale-105 hover:border-purple-500/50 group"
            >
              <div className="text-5xl">{app.icon}</div>
              <div className="text-center">
                <h3 className="text-white font-bold text-sm">{app.name}</h3>
                <p className="text-zinc-500 text-xs mt-1">{app.category}</p>
              </div>
            </button>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500">No apps found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Propose App Modal */}
      {showProposeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
            <h3 className="text-white font-bold text-xl mb-4">Propose New App</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Have an idea for a new app? Let us know!
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowProposeModal(false)}
                variant="ghost"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowProposeModal(false);
                  navigate(createPageUrl('AppStore'));
                }}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
              >
                Go to App Store
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}