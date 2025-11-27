import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  Star, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  Shield
} from "lucide-react";

export default function UserProfilePage() {
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load trades
      const userTrades = await base44.entities.Trade.filter({ 
        $or: [
          { seller_address: currentUser.email },
          { buyer_address: currentUser.email }
        ]
      }, '-created_date', 50);
      setTrades(userTrades);

      // Load reviews
      const userReviews = await base44.entities.Review.filter({
        reviewee_address: currentUser.email
      }, '-created_date', 20);
      setReviews(userReviews);

    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    totalTrades: trades.length,
    completedTrades: trades.filter(t => t.status === 'completed').length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    totalReviews: reviews.length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Clock className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{user?.full_name || 'User Profile'}</h1>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Total Trades</div>
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Completed</div>
                </div>
                <div className="text-2xl font-bold text-white">{stats.completedTrades}</div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Rating</div>
                </div>
                <div className="text-2xl font-bold text-white">{stats.avgRating} ⭐</div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Reviews</div>
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Trade History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">Trade History</h2>
                </CardHeader>
                <CardContent className="pt-6">
                  {trades.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No trades yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {trades.map((trade) => (
                        <div
                          key={trade.id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-white font-semibold">
                                {trade.kas_amount} KAS
                              </div>
                              <div className="text-sm text-gray-400">
                                ${trade.fiat_amount}
                              </div>
                            </div>
                            <Badge variant="outline" className={
                              trade.status === 'completed' 
                                ? "bg-green-500/20 text-green-300 border-green-500/30"
                                : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            }>
                              {trade.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(trade.created_date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">Reviews</h2>
                </CardHeader>
                <CardContent className="pt-6">
                  {reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No reviews yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{review.comment}</p>
                          <div className="text-xs text-gray-500">
                            {new Date(review.created_date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}