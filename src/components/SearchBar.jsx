import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Search, X, ShoppingCart, CheckCircle2, Diamond, ArrowUpDown, TrendingUp, Activity, Bot, Users, Gamepad2, AlertTriangle, Settings, ShoppingBag, Brain, Shield, Wallet, Network, History, Trophy, MessageSquare, Crown, User, Camera, Video, Terminal, LayoutGrid, Briefcase, Clock, Download, Bell, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const rarityColors = {
  common: { bg: 'from-gray-500/20 to-gray-600/20', border: 'border-gray-500/50' },
  uncommon: { bg: 'from-green-500/20 to-emerald-600/20', border: 'border-green-500/50' },
  rare: { bg: 'from-blue-500/20 to-cyan-600/20', border: 'border-blue-500/50' },
  epic: { bg: 'from-purple-500/20 to-pink-600/20', border: 'border-purple-500/50' },
  legendary: { bg: 'from-yellow-500/20 to-orange-600/20', border: 'border-yellow-500/50' }
};

export default function SearchBar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [shopItems, setShopItems] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    loadShopItems();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      filterResults();
      setIsOpen(true);
    } else {
      setFilteredResults([]);
      setIsOpen(false);
    }
  }, [searchQuery, shopItems]);

  const loadShopItems = async () => {
    try {
      const items = await base44.entities.ShopItem.filter({
        status: "active",
        stock: { $gt: 0 }
      }, "-created_date", 100);
      
      setShopItems(items);
    } catch (err) {
      console.error("Failed to load shop items:", err);
    }
  };

  const filterResults = () => {
    const query = searchQuery.toLowerCase().trim();
    
    // All available apps/pages
    const allApps = [
      { name: 'Agent FYE', path: 'AgentFYE', description: 'Fire Yields - Financial Portfolio', iconComponent: TrendingUp },
      { name: 'TTTV', path: 'Browser', description: 'Video Browser', iconComponent: Video },
      { name: 'Camera', path: 'Feed', description: 'Social Feed', iconComponent: Camera },
      { name: 'Photos', path: 'Feed', description: 'Photo Feed', iconComponent: Video },
      { name: 'Feed', path: 'Feed', description: 'Encrypted Feed', iconComponent: Users },
      { name: 'Messages', path: 'AgentMessages', description: 'Chat with agents', iconComponent: MessageSquare, premium: true },
      { name: 'Agent ZK', path: 'AgentZK', description: 'Personal AI Agent', iconComponent: Bot, premium: true },
      { name: 'Zeku AI', path: 'ZekuAI', description: 'Smart Research', iconComponent: Brain, premium: true },
      { name: 'Send KAS', path: 'Bridge', description: 'Bridge & Transfer', iconComponent: ArrowUpDown },
      { name: 'Wallet', path: 'Wallet', description: 'Your Wallet', iconComponent: Wallet },
      { name: 'Shop', path: 'Shop', description: 'NFT Shop', iconComponent: ShoppingCart },
      { name: 'Marketplace', path: 'Marketplace', description: 'P2P Marketplace', iconComponent: ShoppingBag },
      { name: 'TTT ID', path: 'RegisterTTTID', description: 'Register Identity', iconComponent: Shield },
      { name: 'DAGKnight', path: 'DAGKnightWallet', description: 'DAG Wallet', iconComponent: Network, premium: true },
      { name: 'Arcade', path: 'Arcade', description: 'Games', iconComponent: Gamepad2 },
      { name: 'Analytics', path: 'Analytics', description: 'Stats & Charts', iconComponent: TrendingUp },
      { name: 'History', path: 'History', description: 'Transaction History', iconComponent: History },
      { name: 'Settings', path: 'Settings', description: 'App Settings', iconComponent: Settings },
      { name: 'Profile', path: 'Profile', description: 'Your Profile', iconComponent: User },
      { name: 'Premium', path: 'Subscription', description: 'Subscription', iconComponent: Crown },
      { name: 'NFT Mint', path: 'NFTMint', description: 'Create NFTs', iconComponent: Trophy },
      { name: 'Categories', path: 'Categories', description: 'All Apps', iconComponent: LayoutGrid },
    ];

    // Filter apps by search query
    const appResults = allApps
      .filter(app => {
        const nameMatch = app.name.toLowerCase().includes(query);
        const descMatch = app.description?.toLowerCase().includes(query);
        const pathMatch = app.path?.toLowerCase().includes(query);
        return nameMatch || descMatch || pathMatch;
      })
      .slice(0, 5)
      .map(app => ({
        type: 'page',
        name: app.name,
        path: app.path,
        description: app.description,
        iconComponent: app.iconComponent,
        premium: app.premium
      }));
    
    // Filter shop items (NFTs)
    const nftResults = shopItems
      .filter(item => {
        const isNFT = item.tags?.includes('NFT') || item.tags?.includes('AI-Generated');
        if (!isNFT) return false;
        
        const titleMatch = item.title?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(query));
        
        return titleMatch || descMatch || tagMatch;
      })
      .slice(0, 6);

    setFilteredResults([...appResults, ...nftResults.map(item => ({ type: 'nft', ...item }))]);
  };

  const handleItemClick = (result) => {
    if (result.type === 'page') {
      navigate(createPageUrl(result.path));
    } else if (result.type === 'nft') {
      navigate(createPageUrl("ShopItemView") + "?id=" + result.id);
    }
    setSearchQuery("");
    setIsOpen(false);
  };

  const getNFTRarity = (item) => {
    return item.tags?.find(tag => 
      ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(tag.toLowerCase())
    )?.toLowerCase() || 'common';
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search NFTs, items, pages..."
          className="w-full h-10 pl-10 pr-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-0 right-0 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="p-2 space-y-1">
                {filteredResults.map((result, index) => {
                  if (result.type === 'page') {
                    const IconComp = result.iconComponent;
                    return (
                      <motion.button
                        key={`page-${result.path}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleItemClick(result)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left group"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          {IconComp && <IconComp className="w-6 h-6 text-cyan-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                            {result.name}
                            {result.premium && <Crown className="w-3 h-3 text-yellow-400" />}
                          </div>
                          <div className="text-gray-400 text-xs truncate">
                            {result.description}
                          </div>
                        </div>
                      </motion.button>
                    );
                  } else if (result.type === 'nft') {
                    const rarity = getNFTRarity(result);
                    const rarityStyle = rarityColors[rarity] || rarityColors.common;
                    
                    return (
                      <motion.button
                        key={`nft-${result.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleItemClick(result)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br ${rarityStyle.bg} border ${rarityStyle.border} hover:border-white/50 transition-all group`}
                      >
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                          {result.images?.[0] ? (
                            <img
                              src={result.images[0]}
                              alt={result.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-black/30 flex items-center justify-center text-2xl">
                              🎨
                            </div>
                          )}
                          <div className="absolute top-1 left-1">
                            <div className="bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase">
                              {rarity}
                            </div>
                          </div>
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-white font-bold text-sm mb-1 truncate group-hover:text-purple-400 transition-colors">
                            {result.title}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Diamond className="w-3 h-3 text-purple-400" strokeWidth={2.5} />
                            <span className="text-purple-400 font-bold text-sm">
                              {result.price_kas} ZEKU
                            </span>
                          </div>
                          <div className="text-gray-400 text-xs truncate">
                            by {result.seller_username || 'Seller'}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-lg transition-all shadow-lg flex items-center gap-2 group-hover:scale-105">
                            <ShoppingCart className="w-4 h-4 text-white" />
                            <span className="text-white text-xs font-bold">BUY</span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {filteredResults.some(r => r.type === 'nft') && (
              <div className="border-t border-white/10 p-3 bg-black/50">
                <button
                  onClick={() => {
                    navigate(createPageUrl("Shop"));
                    setSearchQuery("");
                    setIsOpen(false);
                  }}
                  className="text-purple-400 hover:text-purple-300 text-xs font-semibold transition-colors"
                >
                  View all NFTs in Shop →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}