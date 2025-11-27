import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Plus, X, Search, ExternalLink, DollarSign, 
  ShoppingBag, Loader2, Sparkles, Check, Trash2, Edit2,
  TrendingUp, Package, Heart, Tag, ShoppingCart, Send, Link2,
  Bell, Share2, Copy, Users, TrendingDown, Zap, UserPlus, Mail
} from "lucide-react";
import RecipientProfileModal from "@/components/gift/RecipientProfileModal";
import NotificationCenter from "@/components/gift/NotificationCenter";
import PriceHistoryChart from "@/components/gift/PriceHistoryChart";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GiftPage() {
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [carts, setCarts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [kasPrice, setKasPrice] = useState(0.15);
  const [quickSearch, setQuickSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [cartName, setCartName] = useState("");
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareableCart, setShareableCart] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [alertItem, setAlertItem] = useState(null);
  const [targetPrice, setTargetPrice] = useState(0);
  const [recipientProfiles, setRecipientProfiles] = useState([]);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCart, setInviteCart] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState("view");
  const [isSecretSanta, setIsSecretSanta] = useState(false);
  const [pricePredictions, setPricePredictions] = useState({});
  
  const [newItem, setNewItem] = useState({
    product_name: "",
    product_url: "",
    product_image: "",
    price_usd: 0,
    store_name: "",
    category: "Other",
    priority: "medium",
    notes: ""
  });

  useEffect(() => {
    loadData();
    fetchKasPrice();
    const priceInterval = setInterval(fetchKasPrice, 60000);
    return () => clearInterval(priceInterval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const items = await base44.entities.WishlistItem.filter({
        user_email: currentUser.email
      }, '-created_date');
      setWishlist(items);

      const userCarts = await base44.entities.GiftCart.filter({
        user_email: currentUser.email
      }, '-created_date');
      setCarts(userCarts);

      const alerts = await base44.entities.PriceAlert.filter({
        user_email: currentUser.email
      });
      setPriceAlerts(alerts);

      const profiles = await base44.entities.RecipientProfile.filter({
        user_email: currentUser.email
      });
      setRecipientProfiles(profiles);

      await trackActivity('view_item', null, null);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKasPrice = async () => {
    try {
      const response = await base44.functions.invoke('getKaspaPrice');
      if (response.data?.price) {
        setKasPrice(response.data.price);
      }
    } catch (err) {
      console.error('Failed to fetch KAS price:', err);
    }
  };

  const quickAddProduct = async () => {
    if (!quickSearch.trim()) return;

    setIsSearching(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for "${quickSearch}" product and provide realistic shopping information in JSON format:
{
  "products": [
    {
      "product_name": "exact product name",
      "product_url": "https://amazon.com/...",
      "product_image": "https://m.media-amazon.com/...",
      "price_usd": 29.99,
      "store_name": "Amazon",
      "category": "Electronics"
    }
  ]
}

Find the BEST 3 results from popular stores (Amazon, eBay, Walmart, Target, Best Buy). Use real URLs and realistic prices. Automatically categorize each product.`,
        response_json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  product_url: { type: "string" },
                  product_image: { type: "string" },
                  price_usd: { type: "number" },
                  store_name: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (response.products && response.products.length > 0) {
        const bestProduct = response.products[0];
        await addToWishlist({
          ...bestProduct,
          priority: "medium",
          notes: ""
        });
        setQuickSearch("");
      }
    } catch (err) {
      console.error('Quick add failed:', err);
      alert('Failed to add product: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const searchProducts = async () => {
    if (!quickSearch.trim()) return;

    setIsSearching(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for "${quickSearch}" product and provide realistic shopping information in JSON format:
{
  "products": [
    {
      "product_name": "exact product name",
      "product_url": "https://amazon.com/...",
      "product_image": "https://m.media-amazon.com/...",
      "price_usd": 29.99,
      "store_name": "Amazon"
    }
  ]
}

Find 5 real products from popular stores (Amazon, eBay, Walmart, Target, Best Buy). Use real product URLs and realistic prices.`,
        response_json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  product_url: { type: "string" },
                  product_image: { type: "string" },
                  price_usd: { type: "number" },
                  store_name: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSearchResults(response.products || []);
    } catch (err) {
      console.error('Search failed:', err);
      alert('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const addToWishlist = async (item = newItem) => {
    setIsAdding(true);
    try {
      const priceKas = kasPrice > 0 ? (item.price_usd / kasPrice) : 0;

      await base44.entities.WishlistItem.create({
        user_email: user.email,
        product_name: item.product_name,
        product_url: item.product_url,
        product_image: item.product_image || '',
        price_usd: parseFloat(item.price_usd),
        price_kas: priceKas,
        store_name: item.store_name || 'Unknown',
        category: item.category || 'Other',
        priority: item.priority || 'medium',
        notes: item.notes || ''
      });

      await loadData();
      setShowAddModal(false);
      setSearchResults([]);
      setQuickSearch("");
      setNewItem({
        product_name: "",
        product_url: "",
        product_image: "",
        price_usd: 0,
        store_name: "",
        category: "Other",
        priority: "medium",
        notes: ""
      });
    } catch (err) {
      console.error('Failed to add item:', err);
      alert('Failed to add item: ' + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Remove this item from your wishlist?')) return;

    try {
      await base44.entities.WishlistItem.delete(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const markAsPurchased = async (item) => {
    try {
      await base44.entities.WishlistItem.update(item.id, {
        is_purchased: true,
        purchased_date: new Date().toISOString()
      });
      await loadData();
    } catch (err) {
      console.error('Failed to mark as purchased:', err);
    }
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const createCart = async () => {
    if (!cartName.trim() || selectedItems.length === 0) {
      alert('Please name your cart and select items');
      return;
    }

    try {
      const cartItems = selectedItems.map(item => ({
        wishlist_item_id: item.id,
        product_name: item.product_name,
        product_url: item.product_url,
        price_usd: item.price_usd,
        price_kas: item.price_kas
      }));

      const totalUSD = selectedItems.reduce((sum, item) => sum + item.price_usd, 0);
      const totalKAS = selectedItems.reduce((sum, item) => sum + item.price_kas, 0);

      await base44.entities.GiftCart.create({
        user_email: user.email,
        cart_name: cartName,
        items: cartItems,
        total_usd: totalUSD,
        total_kas: totalKAS,
        share_code: Math.random().toString(36).substring(7)
      });

      await loadData();
      setShowCartModal(false);
      setSelectedItems([]);
      setCartName("");
    } catch (err) {
      console.error('Failed to create cart:', err);
      alert('Failed to create cart: ' + err.message);
    }
  };

  const deleteCart = async (id) => {
    if (!confirm('Delete this cart?')) return;
    try {
      await base44.entities.GiftCart.delete(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete cart:', err);
    }
  };

  const setPriceAlert = async () => {
    if (!alertItem || targetPrice <= 0) return;

    try {
      await base44.entities.PriceAlert.create({
        user_email: user.email,
        wishlist_item_id: alertItem.id,
        target_price_usd: targetPrice,
        current_price_usd: alertItem.price_usd,
        last_checked: new Date().toISOString()
      });

      await loadData();
      setShowPriceAlertModal(false);
      setAlertItem(null);
      setTargetPrice(0);
    } catch (err) {
      console.error('Failed to set alert:', err);
      alert('Failed to set price alert');
    }
  };

  const shareCart = async (cart) => {
    try {
      await base44.entities.GiftCart.update(cart.id, {
        is_shared: true,
        owner_name: user.username || user.email.split('@')[0]
      });

      const shareUrl = `${window.location.origin}/Gift?share=${cart.share_code}`;
      navigator.clipboard.writeText(shareUrl);
      
      setShareableCart({ ...cart, shareUrl });
      setShowShareModal(true);
    } catch (err) {
      console.error('Failed to share cart:', err);
    }
  };

  const claimItem = async (itemId, cartId = null) => {
    if (!user) {
      alert('Please log in to claim items');
      return;
    }

    try {
      await base44.entities.ClaimedItem.create({
        wishlist_item_id: itemId,
        cart_id: cartId,
        claimer_email: user.email,
        claimer_name: user.username || user.email.split('@')[0]
      });

      await base44.entities.WishlistItem.update(itemId, {
        is_claimed: true,
        claims_count: 1
      });

      alert('✅ Item claimed! The owner won\'t see that you claimed it.');
      await loadData();
    } catch (err) {
      console.error('Failed to claim item:', err);
      alert('Failed to claim item');
    }
  };

  const trackActivity = async (type, itemId, category) => {
    try {
      await base44.entities.UserActivity.create({
        user_email: user?.email,
        activity_type: type,
        item_id: itemId,
        category: category
      });
    } catch (err) {
      console.error('Failed to track activity:', err);
    }
  };

  const saveRecipientProfile = async (profileData) => {
    try {
      const newProfile = await base44.entities.RecipientProfile.create({
        user_email: user.email,
        ...profileData
      });
      
      await loadData();
      setShowRecipientModal(false);
      setSelectedRecipientId(newProfile.id);
      generateAdvancedSuggestions(newProfile.id);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile');
    }
  };

  const generateAdvancedSuggestions = async (recipientId = null) => {
    setIsGeneratingSuggestions(true);
    setShowAISuggestions(true);

    try {
      const response = await base44.functions.invoke('generateAdvancedSuggestions', {
        recipientProfileId: recipientId || selectedRecipientId,
        occasion: occasion,
        budget: null
      });

      setAiSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      alert('Failed to generate suggestions');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const addSuggestionToWishlist = async (suggestion) => {
    try {
      await addToWishlist({
        product_name: suggestion.product_name,
        product_url: suggestion.product_url || `https://www.amazon.com/s?k=${encodeURIComponent(suggestion.product_name)}`,
        product_image: suggestion.product_image || '',
        price_usd: suggestion.estimated_price_usd,
        store_name: suggestion.store_name,
        category: suggestion.category,
        priority: 'medium',
        notes: suggestion.reason
      });
      
      alert('✅ Added to wishlist!');
    } catch (err) {
      console.error('Failed to add suggestion:', err);
      alert('Failed to add to wishlist');
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim() || !inviteCart) return;

    try {
      await base44.entities.WishlistInvitation.create({
        cart_id: inviteCart.id,
        owner_email: user.email,
        invitee_email: inviteEmail,
        permission: invitePermission,
        is_secret_santa: isSecretSanta
      });

      await base44.entities.GiftNotification.create({
        user_email: inviteEmail,
        type: 'invitation',
        title: isSecretSanta ? '🎅 Secret Santa Invitation!' : '🎁 Wishlist Invitation',
        message: `${user.username || user.email} invited you to view their ${inviteCart.cart_name}`,
        action_url: `/Gift?cart=${inviteCart.id}`
      });

      alert('✅ Invitation sent!');
      setShowInviteModal(false);
      setInviteEmail("");
    } catch (err) {
      console.error('Failed to send invitation:', err);
      alert('Failed to send invitation');
    }
  };

  const getPricePrediction = async (itemId) => {
    try {
      const response = await base44.functions.invoke('predictPriceDrop', { itemId });
      setPricePredictions(prev => ({
        ...prev,
        [itemId]: response.data.prediction
      }));
    } catch (err) {
      console.error('Failed to get prediction:', err);
    }
  };

  const filteredWishlist = wishlist.filter(item => {
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
    const priorityMatch = filterPriority === 'all' || item.priority === filterPriority;
    return categoryMatch && priorityMatch;
  });

  const totalUSD = filteredWishlist.reduce((sum, item) => sum + (item.price_usd || 0), 0);
  const totalKAS = filteredWishlist.reduce((sum, item) => sum + (item.price_kas || 0), 0);

  const priorityColors = {
    low: 'bg-white/5 text-white/60 border-white/10',
    medium: 'bg-white/10 text-white/80 border-white/20',
    high: 'bg-white/20 text-white border-white/30'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black border border-white/20 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Gift Wishlist</h1>
                <p className="text-white/40 text-xs">Track your dream items with KAS prices</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && <NotificationCenter user={user} />}
              <Button
                onClick={() => setShowCartModal(true)}
                disabled={selectedItems.length === 0}
                size="sm"
                className="bg-black border border-white/20 text-white hover:bg-white/5 h-8 px-3"
              >
                <ShoppingCart className="w-3 h-3 mr-1.5" />
                <span className="text-xs">Cart ({selectedItems.length})</span>
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                size="sm"
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-8 px-3"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                <span className="text-xs">Add</span>
              </Button>
            </div>
          </div>

          {/* Active Alerts */}
          {priceAlerts.filter(a => !a.is_triggered).length > 0 && (
            <Card className="bg-black border-white/10 mt-4">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-white/80 text-xs font-semibold">
                  <Bell className="w-3 h-3" />
                  <span>{priceAlerts.filter(a => !a.is_triggered).length} Price Alerts Active</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Card className="bg-black border-white/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-white/40 text-[10px] mb-0.5">
                  <Package className="w-2.5 h-2.5" />
                  <span>Items</span>
                </div>
                <div className="text-xl font-bold text-white">{filteredWishlist.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-white/40 text-[10px] mb-0.5">
                  <DollarSign className="w-2.5 h-2.5" />
                  <span>USD</span>
                </div>
                <div className="text-xl font-bold text-white">${totalUSD.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-white/40 text-[10px] mb-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>KAS</span>
                </div>
                <div className="text-xl font-bold text-white">{totalKAS.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Add */}
          <div className="mt-3">
            <Card className="bg-black border-white/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3 h-3 text-white/60" />
                  <span className="text-white/80 text-xs font-medium">Quick Add with AI</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && quickAddProduct()}
                    placeholder="Type what you want..."
                    className="bg-black border-white/10 text-white placeholder:text-white/30 flex-1 h-8 text-xs"
                  />
                  <Button
                    onClick={quickAddProduct}
                    disabled={isSearching || !quickSearch.trim()}
                    size="sm"
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-8 px-3"
                  >
                    {isSearching ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3 h-3 mr-1" />
                        <span className="text-xs">Add</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-white/30 text-[10px] mt-1.5">AI finds and adds the best match automatically</p>
              </CardContent>
            </Card>
          </div>

          {/* Advanced AI & Recipient Profiles */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              onClick={() => setShowRecipientModal(true)}
              size="sm"
              className="bg-black border border-white/10 text-white hover:bg-white/5 h-8"
            >
              <UserPlus className="w-3 h-3 mr-1.5" />
              <span className="text-xs">Add Recipient</span>
            </Button>
            <Button
              onClick={() => generateAdvancedSuggestions()}
              size="sm"
              className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-8"
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              <span className="text-xs">AI Gifts</span>
            </Button>
          </div>

          {recipientProfiles.length > 0 && (
            <div className="mt-2">
              <label className="text-[10px] text-white/40 mb-1.5 block">For Recipient:</label>
              <select
                value={selectedRecipientId || ""}
                onChange={(e) => setSelectedRecipientId(e.target.value)}
                className="w-full bg-black border border-white/10 text-white text-xs rounded-md p-1.5 h-7"
              >
                <option value="">General</option>
                {recipientProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.recipient_name} ({p.relationship})</option>
                ))}
              </select>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 mt-3">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-black border-white/10 text-white text-xs h-7 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Fashion">Fashion</SelectItem>
                <SelectItem value="Home">Home</SelectItem>
                <SelectItem value="Books">Books</SelectItem>
                <SelectItem value="Toys">Toys</SelectItem>
                <SelectItem value="Beauty">Beauty</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="bg-black border-white/10 text-white text-xs h-7 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Shopping Carts Section */}
        {carts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <h2 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Your Shopping Carts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {carts.map((cart) => (
                <Card key={cart.id} className="bg-black border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-medium text-xs mb-0.5">{cart.cart_name}</h3>
                        <p className="text-white/40 text-[10px]">{cart.items?.length || 0} items</p>
                      </div>
                      <Button
                        onClick={() => deleteCart(cart.id)}
                        size="sm"
                        variant="ghost"
                        className="text-white/40 hover:text-red-400 hover:bg-red-500/10 h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="bg-white/5 rounded-lg p-2 mb-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-white/40 text-[10px]">USD</span>
                        <span className="text-white font-semibold text-xs">${cart.total_usd?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-[10px]">KAS</span>
                        <span className="text-white font-semibold text-xs">{cart.total_kas?.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5 mb-2 max-h-20 overflow-y-auto">
                      {cart.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="text-white/40 text-[10px] truncate">
                          • {item.product_name}
                        </div>
                      ))}
                      {cart.items?.length > 3 && (
                        <div className="text-white/30 text-[10px]">
                          +{cart.items.length - 3} more...
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        onClick={() => {
                          setInviteCart(cart);
                          setShowInviteModal(true);
                        }}
                        size="sm"
                        className="bg-black border border-white/10 text-white hover:bg-white/5 h-7 text-[10px]"
                      >
                        <Mail className="w-2.5 h-2.5 mr-1" />
                        Invite
                      </Button>
                      <Button
                        onClick={() => shareCart(cart)}
                        size="sm"
                        className="bg-black border border-white/10 text-white hover:bg-white/5 h-7 text-[10px]"
                      >
                        <Share2 className="w-2.5 h-2.5 mr-1" />
                        Link
                      </Button>
                      {cart.items?.slice(0, 2).map((item, idx) => (
                        <Button
                          key={idx}
                          onClick={() => window.open(item.product_url, '_blank')}
                          size="sm"
                          className="bg-black border border-white/10 text-white hover:bg-white/5 h-7 text-[10px]"
                        >
                          <ExternalLink className="w-2.5 h-2.5 mr-1" />
                          Shop
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Wishlist Grid */}
        {filteredWishlist.length === 0 ? (
          <div className="text-center py-20">
            <Gift className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm mb-1">Your wishlist is empty</p>
            <p className="text-white/30 text-xs mb-4">Start adding items you want!</p>
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
              className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-8"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              <span className="text-xs">Add Your First Item</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWishlist.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className={`bg-black transition-all ${
                  item.is_purchased ? 'opacity-50' : ''
                } ${
                  selectedItems.find(i => i.id === item.id) 
                    ? 'border-white/30 ring-1 ring-white/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}>
                  <CardContent className="p-3">
                    <button
                      onClick={() => toggleItemSelection(item)}
                      className="absolute top-1.5 right-1.5 z-10"
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        selectedItems.find(i => i.id === item.id)
                          ? 'bg-white/20 border-white/40'
                          : 'bg-black/60 border-white/20'
                      }`}>
                        {selectedItems.find(i => i.id === item.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </button>

                    {item.product_image && (
                      <div className="relative mb-2 rounded-lg overflow-hidden bg-white/5">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-32 object-cover"
                        />
                        {item.is_purchased && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Badge className="bg-white/20 text-white border-white/30 text-[10px]">
                              <Check className="w-2 h-2 mr-1" />
                              Purchased
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mb-2">
                      <h3 className="text-white font-medium text-xs mb-0.5 line-clamp-2">
                        {item.product_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                        <ShoppingBag className="w-2.5 h-2.5" />
                        <span>{item.store_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge className={`${priorityColors[item.priority]} text-[10px] px-1.5 py-0.5`}>
                        {item.priority}
                      </Badge>
                      <Badge className="bg-white/5 text-white/40 border-white/10 text-[10px] px-1.5 py-0.5">
                        {item.category}
                      </Badge>
                    </div>

                    <div className="bg-white/5 rounded-lg p-2 mb-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-white/40 text-[10px]">USD</span>
                        <span className="text-white font-semibold text-xs">${item.price_usd.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-[10px]">KAS</span>
                        <span className="text-white font-semibold text-xs">{item.price_kas.toFixed(2)}</span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-white/60 text-xs mb-3 line-clamp-2">{item.notes}</p>
                    )}

                    {item.price_history && item.price_history.length > 0 && (
                      <PriceHistoryChart 
                        item={item} 
                        prediction={pricePredictions[item.id]}
                      />
                    )}

                    {pricePredictions[item.id] && !item.price_history && (
                      <div className="bg-black border border-white/10 rounded-lg p-2 mb-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <TrendingDown className="w-2.5 h-2.5 text-white/60" />
                          <span className="text-[10px] text-white/80 font-medium">AI Prediction</span>
                        </div>
                        <p className="text-white/40 text-[10px]">{pricePredictions[item.id].best_time_to_buy}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-1.5">
                      <Button
                        onClick={() => {
                          window.open(item.product_url, '_blank');
                          trackActivity('view_item', item.id, item.category);
                        }}
                        size="sm"
                        className="bg-black border border-white/10 text-white hover:bg-white/5 h-7 text-[10px] px-2 col-span-2"
                      >
                        <ExternalLink className="w-2.5 h-2.5 mr-1" />
                        View
                      </Button>
                      {!item.is_purchased && (
                        <>
                          <Button
                            onClick={() => {
                              setAlertItem(item);
                              setTargetPrice(item.price_usd * 0.8);
                              setShowPriceAlertModal(true);
                            }}
                            size="sm"
                            className="bg-black border border-white/10 text-white/60 hover:bg-white/5 h-7 w-7 p-0"
                          >
                            <Bell className="w-2.5 h-2.5" />
                          </Button>
                          <Button
                            onClick={() => getPricePrediction(item.id)}
                            size="sm"
                            className="bg-black border border-white/10 text-white/60 hover:bg-white/5 h-7 w-7 p-0"
                          >
                            <TrendingDown className="w-2.5 h-2.5" />
                          </Button>
                          <Button
                            onClick={() => deleteItem(item.id)}
                            size="sm"
                            className="bg-black border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </>
                      )}
                      {item.is_purchased && (
                        <Button
                          onClick={() => deleteItem(item.id)}
                          size="sm"
                          className="bg-black border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => !isSearching && !isAdding && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Add to Wishlist</h2>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* AI Search */}
              <div className="mb-6">
                <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  AI Product Search
                </label>
                <div className="flex gap-2">
                  <Input
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                    placeholder="Just type what you want... AI will find it!"
                    className="bg-black border-white/10 text-white flex-1"
                  />
                  <Button
                    onClick={searchProducts}
                    disabled={isSearching || !quickSearch.trim()}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-white/40 text-xs mt-2">AI will search multiple stores and show you the best options</p>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm text-white/60 mb-3">Search Results - Click to Add</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <Card
                        key={idx}
                        className="bg-black border-white/10 cursor-pointer hover:border-cyan-500/50 transition-all"
                        onClick={() => addToWishlist(result)}
                      >
                        <CardContent className="p-3">
                          {result.product_image && (
                            <img
                              src={result.product_image}
                              alt={result.product_name}
                              className="w-full h-32 object-cover rounded-lg mb-2"
                            />
                          )}
                          <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                            {result.product_name}
                          </h4>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">{result.store_name}</span>
                            <span className="text-green-400 font-bold">${result.price_usd}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Add Form */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm text-white/60 mb-4">Or Add Manually</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Product Name *</label>
                    <Input
                      value={newItem.product_name}
                      onChange={(e) => setNewItem({...newItem, product_name: e.target.value})}
                      placeholder="e.g. iPhone 15 Pro Max"
                      className="bg-black border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Product URL *</label>
                    <Input
                      value={newItem.product_url}
                      onChange={(e) => setNewItem({...newItem, product_url: e.target.value})}
                      placeholder="https://amazon.com/..."
                      className="bg-black border-white/10 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Price (USD) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newItem.price_usd}
                        onChange={(e) => setNewItem({...newItem, price_usd: parseFloat(e.target.value) || 0})}
                        placeholder="29.99"
                        className="bg-black border-white/10 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Store Name</label>
                      <Input
                        value={newItem.store_name}
                        onChange={(e) => setNewItem({...newItem, store_name: e.target.value})}
                        placeholder="Amazon"
                        className="bg-black border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Category</label>
                      <Select
                        value={newItem.category}
                        onValueChange={(value) => setNewItem({...newItem, category: value})}
                      >
                        <SelectTrigger className="bg-black border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Fashion">Fashion</SelectItem>
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Books">Books</SelectItem>
                          <SelectItem value="Toys">Toys</SelectItem>
                          <SelectItem value="Beauty">Beauty</SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Priority</label>
                      <Select
                        value={newItem.priority}
                        onValueChange={(value) => setNewItem({...newItem, priority: value})}
                      >
                        <SelectTrigger className="bg-black border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Image URL (optional)</label>
                    <Input
                      value={newItem.product_image}
                      onChange={(e) => setNewItem({...newItem, product_image: e.target.value})}
                      placeholder="https://..."
                      className="bg-black border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Notes</label>
                    <Textarea
                      value={newItem.notes}
                      onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                      placeholder="Why you want this..."
                      className="bg-black border-white/10 text-white min-h-[80px]"
                    />
                  </div>

                  <Button
                    onClick={() => addToWishlist()}
                    disabled={isAdding || !newItem.product_name || !newItem.product_url || !newItem.price_usd}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Wishlist
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Cart Modal */}
      <AnimatePresence>
        {showCartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowCartModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 rounded-xl p-6 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Create Shopping Cart
                </h2>
                <Button
                  onClick={() => setShowCartModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Cart Name</label>
                  <Input
                    value={cartName}
                    onChange={(e) => setCartName(e.target.value)}
                    placeholder="e.g., Birthday Wishlist, Christmas 2025"
                    className="bg-black border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Selected Items ({selectedItems.length})</label>
                  <div className="bg-black border border-white/10 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium truncate">{item.product_name}</div>
                          <div className="text-white/60 text-xs">${item.price_usd.toFixed(2)}</div>
                        </div>
                        <button
                          onClick={() => toggleItemSelection(item)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">Total USD</span>
                    <span className="text-green-400 font-bold text-lg">
                      ${selectedItems.reduce((sum, item) => sum + item.price_usd, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Total KAS</span>
                    <span className="text-cyan-400 font-bold text-lg">
                      {selectedItems.reduce((sum, item) => sum + item.price_kas, 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={createCart}
                  disabled={!cartName.trim() || selectedItems.length === 0}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Create Cart
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Price Alert Modal */}
      <AnimatePresence>
        {showPriceAlertModal && alertItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowPriceAlertModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-orange-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-400" />
                  Set Price Alert
                </h3>
                <Button
                  onClick={() => setShowPriceAlertModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-white text-sm mb-2">{alertItem.product_name}</p>
                  <p className="text-white/60 text-xs">Current: ${alertItem.price_usd.toFixed(2)}</p>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Alert me when price drops to:</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                    className="bg-black border-white/10 text-white"
                  />
                  <p className="text-white/40 text-xs mt-2">
                    {((1 - targetPrice / alertItem.price_usd) * 100).toFixed(0)}% discount
                  </p>
                </div>

                <Button
                  onClick={setPriceAlert}
                  disabled={targetPrice <= 0 || targetPrice >= alertItem.price_usd}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Set Alert
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Cart Modal */}
      <AnimatePresence>
        {showShareModal && shareableCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-cyan-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-cyan-400" />
                  Share Wishlist
                </h3>
                <Button
                  onClick={() => setShowShareModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white text-sm font-semibold mb-2">{shareableCart.cart_name}</p>
                  <p className="text-white/60 text-xs mb-3">
                    Friends can view and anonymously claim items. You won't see who claimed what! 🎁
                  </p>
                  <div className="bg-black border border-white/10 rounded-lg p-3 mb-3">
                    <code className="text-cyan-400 text-xs break-all">{shareableCart.shareUrl}</code>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareableCart.shareUrl);
                      alert('✅ Link copied to clipboard!');
                    }}
                    className="w-full bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-white/60">
                      <p className="font-semibold text-white mb-1">Anonymous Claiming</p>
                      <p>Friends can claim items secretly. You'll be surprised on your special day!</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestions Modal */}
      <AnimatePresence>
        {showAISuggestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto"
            onClick={() => setShowAISuggestions(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-purple-500/30 rounded-xl p-6 max-w-2xl w-full my-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Gift Suggestions
                </h3>
                <Button
                  onClick={() => setShowAISuggestions(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="mb-4">
                <Input
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="Optional: Occasion (Birthday, Anniversary, Christmas...)"
                  className="bg-black border-white/10 text-white"
                />
              </div>

              {isGeneratingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
                  <p className="text-white/60 text-sm">Analyzing your wishlist...</p>
                </div>
              ) : aiSuggestions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {aiSuggestions.map((suggestion, idx) => (
                    <Card key={idx} className="bg-black border-white/10 hover:border-white/20 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-semibold text-sm flex-1">{suggestion.product_name}</h4>
                          <Badge className="bg-white/10 text-white border-white/20">
                            ${suggestion.estimated_price_usd}
                          </Badge>
                        </div>
                        <p className="text-white/60 text-xs mb-3">{suggestion.reason}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-white/5 text-white/60 border-white/10 text-[10px]">
                            {suggestion.category}
                          </Badge>
                          <span className="text-white/40 text-[10px]">{suggestion.store_name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(
                              suggestion.product_url || `https://www.amazon.com/s?k=${encodeURIComponent(suggestion.product_name)}`,
                              '_blank'
                            )}
                            size="sm"
                            className="flex-1 bg-black border border-white/10 text-white hover:bg-white/5 h-8 text-xs"
                          >
                            <ExternalLink className="w-3 h-3 mr-1.5" />
                            View on {suggestion.store_name}
                          </Button>
                          <Button
                            onClick={() => addSuggestionToWishlist(suggestion)}
                            size="sm"
                            className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-8 px-3"
                          >
                            <Plus className="w-3 h-3 mr-1.5" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Click below to get personalized suggestions</p>
                </div>
              )}

              <Button
                onClick={() => generateAdvancedSuggestions()}
                disabled={isGeneratingSuggestions}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isGeneratingSuggestions ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Suggestions
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipient Profile Modal */}
      <AnimatePresence>
        {showRecipientModal && (
          <RecipientProfileModal
            onClose={() => setShowRecipientModal(false)}
            onSave={saveRecipientProfile}
          />
        )}
      </AnimatePresence>

      {/* Invite Friends Modal */}
      <AnimatePresence>
        {showInviteModal && inviteCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-400" />
                  Invite Friends
                </h3>
                <Button onClick={() => setShowInviteModal(false)} variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Cart: {inviteCart.cart_name}</label>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Friend's Email</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="bg-black border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Permission Level</label>
                  <select
                    value={invitePermission}
                    onChange={(e) => setInvitePermission(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white rounded-md p-2"
                  >
                    <option value="view">View Only</option>
                    <option value="claim">View & Claim Items</option>
                    <option value="contribute">View, Claim & Add Items</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSecretSanta}
                    onChange={(e) => setIsSecretSanta(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-white/60">
                    🎅 Secret Santa Mode (hide claims from owner)
                  </label>
                </div>

                <Button
                  onClick={sendInvitation}
                  disabled={!inviteEmail.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}