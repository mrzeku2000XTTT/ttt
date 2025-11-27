
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  ShoppingCart,
  Heart,
  TrendingUp,
  Filter,
  Star,
  MapPin,
  Package,
  Sparkles,
  Grid3x3,
  List,
  Eye,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Diamond
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const rarityColors = {
  common: { bg: 'from-gray-500/20 to-gray-600/20', text: 'text-gray-300', border: 'border-gray-500/50', badgeBg: 'bg-gray-800', badgeText: 'text-white' },
  uncommon: { bg: 'from-green-500/20 to-emerald-600/20', text: 'text-green-300', border: 'border-green-500/50', badgeBg: 'bg-green-700', badgeText: 'text-white' },
  rare: { bg: 'from-blue-500/20 to-cyan-600/20', text: 'text-blue-300', border: 'border-blue-500/50', badgeBg: 'bg-blue-700', badgeText: 'text-white' },
  epic: { bg: 'from-purple-500/20 to-pink-600/20', text: 'text-purple-300', border: 'border-purple-500/50', badgeBg: 'bg-purple-700', badgeText: 'text-white' },
  legendary: { bg: 'from-yellow-500/20 to-orange-600/20', text: 'text-yellow-300', border: 'border-yellow-500/50', badgeBg: 'bg-gradient-to-r from-yellow-600 to-orange-600', badgeText: 'text-black' }
};

export default function ShopPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const categories = [
    { value: "all", label: "All Categories", icon: "🛍️" },
    { value: "electronics", label: "Electronics", icon: "📱" },
    { value: "fashion", label: "Fashion", icon: "👔" },
    { value: "home", label: "Home & Garden", icon: "🏠" },
    { value: "collectibles", label: "Collectibles", icon: "💎" },
    { value: "art", label: "Art", icon: "🎨" },
    { value: "crypto", label: "Crypto Items", icon: "₿" },
    { value: "books", label: "Books", icon: "📚" },
    { value: "sports", label: "Sports", icon: "⚽" },
    { value: "toys", label: "Toys & Games", icon: "🎮" },
    { value: "other", label: "Other", icon: "📦" },
  ];

  useEffect(() => {
    loadUser();
    loadItems();
    loadCart();
    
    // ✅ Real-time refresh every 5 seconds
    const interval = setInterval(() => {
      loadItems();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchTerm, selectedCategory, selectedCondition, sortBy]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const loadItems = async () => {
    try {
      // ONLY load ShopItems - no NFTs
      const allItems = await base44.entities.ShopItem.filter({
        status: "active",
        stock: { $gt: 0 }
      }, "-created_date");
      
      console.log('🛍️ Loaded', allItems.length, 'active shop items');
      
      setItems(allItems);
    } catch (error) {
      console.error("Failed to load items:", error);
    }
  };

  const loadCart = async () => {
    try {
      const currentUser = await base44.auth.me();
      const carts = await base44.entities.ShoppingCart.filter({
        user_email: currentUser.email
      });
      if (carts.length > 0) {
        setCartCount(carts[0].items?.length || 0);
      }
    } catch (err) {
      console.log("No cart yet");
    }
  };

  const filterAndSortItems = () => {
    let filtered = [...items];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Condition filter
    if (selectedCondition !== "all") {
      filtered = filtered.filter((item) => item.condition === selectedCondition);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case "price_low":
        filtered.sort((a, b) => (a.price_kas || 0) - (b.price_kas || 0));
        break;
      case "price_high":
        filtered.sort((a, b) => (b.price_kas || 0) - (a.price_kas || 0));
        break;
      case "popular":
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
    }

    setFilteredItems(filtered);
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find((c) => c.value === category);
    return cat?.icon || "📦";
  };

  const getConditionColor = (condition) => {
    const colors = {
      new: "bg-green-500/20 text-green-300 border-green-500/30",
      like_new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      good: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      fair: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      poor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    };
    return colors[condition] || colors.good;
  };

  // Check if item is an NFT by checking tags
  const isNFTItem = (item) => {
    return item.tags?.includes('NFT') || item.tags?.includes('AI-Generated');
  };

  const getNFTRarity = (item) => {
    // Try to extract rarity from tags
    const rarityTag = item.tags?.find(tag =>
      ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(tag.toLowerCase())
    );
    return rarityTag?.toLowerCase() || 'common';
  };

  // ✅ Get proper creator name from tags (Agent ZK ID)
  const getCreatorName = (item) => {
    if (!isNFTItem(item)) return null;
    
    // Look for ZK- prefix in tags (Agent ZK ID)
    const zkIdTag = item.tags?.find(tag => tag.startsWith('ZK-'));
    if (zkIdTag) {
      return zkIdTag;
    }
    
    // Fallback to seller username
    return item.seller_username || 'Unknown Creator';
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    TTT Shop
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    Premium marketplace for everything
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link to={createPageUrl("Cart")}>
                  <Button className="relative bg-white/5 border border-white/10 text-white hover:bg-white/10">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Cart
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full text-xs flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to={createPageUrl("CreateShopListing")}>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/50">
                    <Plus className="w-5 h-5 mr-2" />
                    List Item
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="text-2xl font-bold text-white mb-1">{items.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">
                  Total Listings
                </div>
              </div>
            </div>
          </motion.div>

          {/* Categories Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 overflow-x-auto pb-4"
          >
            <div className="flex gap-2 min-w-max">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    selectedCategory === cat.value
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search items, brands, tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                    />
                  </div>

                  <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="all" className="text-white">
                        All Conditions
                      </SelectItem>
                      <SelectItem value="new" className="text-white">
                        New
                      </SelectItem>
                      <SelectItem value="like_new" className="text-white">
                        Like New
                      </SelectItem>
                      <SelectItem value="good" className="text-white">
                        Good
                      </SelectItem>
                      <SelectItem value="fair" className="text-white">
                        Fair
                      </SelectItem>
                      <SelectItem value="poor" className="text-white">
                        Poor
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="newest" className="text-white">
                        Newest First
                      </SelectItem>
                      <SelectItem value="price_low" className="text-white">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price_high" className="text-white">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="popular" className="text-white">
                        Most Popular
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="text-sm text-gray-400">
                    {filteredItems.length} items found
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded ${
                        viewMode === "grid"
                          ? "bg-purple-500/20 text-purple-400"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded ${
                        viewMode === "list"
                          ? "bg-purple-500/20 text-purple-400"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Items Grid */}
          {filteredItems.length === 0 && items.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No items found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
              <Link to={createPageUrl("CreateShopListing")}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Plus className="w-5 h-5 mr-2" />
                  List First Item
                </Button>
              </Link>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredItems.map((item, index) => {
                const isNFT = isNFTItem(item);
                const rarity = getNFTRarity(item);
                const rarityStyle = rarityColors[rarity] || rarityColors.common;
                const creatorName = getCreatorName(item);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={createPageUrl("ShopItemView") + "?id=" + item.id}>
                      <Card className={`backdrop-blur-xl bg-white/5 ${
                        isNFT 
                          ? `bg-gradient-to-br ${rarityStyle.bg} border ${rarityStyle.border}` 
                          : 'border-white/10'
                      } hover:bg-white/10 transition-all group h-full`}>
                        <CardContent className="p-0">
                          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-black/30">
                            {item.images && item.images[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-6xl">
                                {getCategoryIcon(item.category)}
                              </div>
                            )}
                            
                            {/* Top badges */}
                            <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                              {isNFT ? (
                                <Badge className={`${rarityStyle.badgeBg} ${rarityStyle.badgeText} border-none font-bold text-xs shadow-2xl px-3 py-1`}>
                                  {rarity.toUpperCase()}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={getConditionColor(item.condition)}
                                >
                                  {item.condition?.replace("_", " ")}
                                </Badge>
                              )}
                              
                              {item.featured && (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Featured
                                </Badge>
                              )}
                            </div>

                            {/* Verified badge for NFTs */}
                            {isNFT && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-green-700 text-white border-none text-xs font-bold shadow-2xl">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              </div>
                            )}

                            {/* Bottom value badge for NFTs */}
                            {isNFT && (
                              <div className="absolute bottom-2 right-2">
                                <Badge className="bg-black text-white border-none font-bold shadow-2xl flex items-center gap-1.5 px-3 py-1.5">
                                  <Diamond className="w-4 h-4" strokeWidth={2.5} />
                                  <span className="text-sm">{item.price_kas} ZEKU</span>
                                </Badge>
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                              {item.title}
                            </h3>

                            {isNFT && creatorName && (
                              <div className="flex items-center gap-2 mb-3">
                                <Badge className="bg-cyan-500/30 text-cyan-200 border-cyan-500/50 text-xs">
                                  {creatorName}
                                </Badge>
                              </div>
                            )}

                            {!isNFT && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs text-gray-500">
                                  {getCategoryIcon(item.category)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {categories.find((c) => c.value === item.category)?.label}
                                </span>
                              </div>
                            )}

                            <div className="flex items-baseline gap-2 mb-3">
                              <span className="text-2xl font-bold text-purple-400">
                                {item.price_kas} {isNFT ? 'ZEKU' : 'KAS'}
                              </span>
                              {!isNFT && item.shipping_cost_kas > 0 && (
                                <span className="text-xs text-gray-500">
                                  +{item.shipping_cost_kas} KAS shipping
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {item.views || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {item.favorites || 0}
                              </div>
                              {item.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {item.location.split(",")[0]}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
