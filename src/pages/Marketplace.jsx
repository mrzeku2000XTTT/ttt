import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Plus, Loader2, TrendingUp, DollarSign, Users, Star, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MarketplacePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [backgroundUrl, setBackgroundUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm, categoryFilter, sortBy]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load marketplace background if set by admin
      const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      if (adminUsers.length > 0 && adminUsers[0].marketplace_background_url) {
        setBackgroundUrl(adminUsers[0].marketplace_background_url);
        console.log('🎨 Loaded marketplace background:', adminUsers[0].marketplace_background_url);
      }

      const allListings = await base44.entities.Listing.list('-created_date');
      setListings(allListings);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = [...listings];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.title?.toLowerCase().includes(term) ||
        listing.description?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(listing => listing.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => (a.price_kas || 0) - (b.price_kas || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price_kas || 0) - (a.price_kas || 0));
        break;
      case "popular":
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default: // recent
        // Already sorted by created_date
        break;
    }

    setFilteredListings(filtered);
  };

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "buy", label: "Buy KAS" },
    { value: "sell", label: "Sell KAS" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Admin-controlled Background */}
      {backgroundUrl ? (
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url('${backgroundUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90" />
        </div>
      ) : (
        // Default background effects
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'monospace' }}>
                    P2P Marketplace
                  </h1>
                  <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: 'monospace' }}>
                    Buy & Sell KAS Locally with Escrow Protection
                  </p>
                </div>
              </div>

              <Link to={createPageUrl("CreateListing")}>
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg shadow-cyan-500/50">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Listing
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-white mb-1">{listings.length}</div>
                  <div className="text-xs text-gray-400">Active Listings</div>
                </CardContent>
              </Card>
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {listings.filter(l => l.type === 'buy').length}
                  </div>
                  <div className="text-xs text-gray-400">Buy Offers</div>
                </CardContent>
              </Card>
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {listings.filter(l => l.type === 'sell').length}
                  </div>
                  <div className="text-xs text-gray-400">Sell Offers</div>
                </CardContent>
              </Card>
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {listings.filter(l => l.status === 'completed').length}
                  </div>
                  <div className="text-xs text-gray-400">Completed</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800">
              <CardContent className="p-6">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search listings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-black border-zinc-700 text-white"
                    />
                  </div>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[200px] bg-black border-zinc-700 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value} className="text-white">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[200px] bg-black border-zinc-700 text-white">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="recent" className="text-white">Most Recent</SelectItem>
                      <SelectItem value="price-low" className="text-white">Price: Low to High</SelectItem>
                      <SelectItem value="price-high" className="text-white">Price: High to Low</SelectItem>
                      <SelectItem value="popular" className="text-white">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Listings Grid */}
          {filteredListings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <ShoppingBag className="w-20 h-20 text-gray-700 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">No Listings Found</h2>
              <p className="text-gray-400 mb-8">
                {searchTerm || categoryFilter !== "all" 
                  ? 'Try adjusting your filters'
                  : 'Be the first to create a listing!'}
              </p>
              <Link to={createPageUrl("CreateListing")}>
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Listing
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`${createPageUrl("TradeView")}?id=${listing.id}`}>
                    <Card className="bg-black/80 backdrop-blur-xl border-zinc-800 hover:border-cyan-500/50 transition-all h-full group">
                      <CardHeader className="border-b border-zinc-800 pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={listing.type === 'buy' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}>
                            {listing.type === 'buy' ? 'Buying KAS' : 'Selling KAS'}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {listing.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold text-white">{listing.kas_amount}</div>
                            <div className="text-xs text-gray-500">KAS</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-cyan-400">${listing.fiat_amount}</div>
                            <div className="text-xs text-gray-500">USD</div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6">
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Location:</span>
                            <span className="text-white">{listing.location}</span>
                          </div>
                          {listing.meeting_notes && (
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {listing.meeting_notes}
                            </p>
                          )}
                        </div>

                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}