import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift, ShoppingCart, ExternalLink, Check, Loader2,
  Users, Heart, DollarSign, TrendingUp, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

export default function SharedCartPage() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimedItems, setClaimedItems] = useState([]);
  const [myClaimedItems, setMyClaimedItems] = useState([]);

  useEffect(() => {
    loadSharedCart();
  }, []);

  const loadSharedCart = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const urlParams = new URLSearchParams(window.location.search);
      const shareCode = urlParams.get('share');

      if (!shareCode) {
        alert('Invalid share link');
        return;
      }

      const carts = await base44.entities.GiftCart.filter({ share_code: shareCode });
      if (carts.length === 0) {
        alert('Cart not found');
        return;
      }

      setCart(carts[0]);

      const claims = await base44.entities.ClaimedItem.filter({
        cart_id: carts[0].id
      });
      setClaimedItems(claims);

      if (currentUser) {
        const myClaims = claims.filter(c => c.claimer_email === currentUser.email);
        setMyClaimedItems(myClaims);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const claimItem = async (item) => {
    if (!user) {
      alert('Please log in to claim items');
      base44.auth.redirectToLogin();
      return;
    }

    const alreadyClaimed = myClaimedItems.find(c => c.wishlist_item_id === item.wishlist_item_id);
    if (alreadyClaimed) {
      alert('You already claimed this item!');
      return;
    }

    try {
      await base44.entities.ClaimedItem.create({
        wishlist_item_id: item.wishlist_item_id,
        cart_id: cart.id,
        claimer_email: user.email,
        claimer_name: user.username || user.email.split('@')[0]
      });

      alert('✅ Item claimed! The owner won\'t see it was you.');
      await loadSharedCart();
    } catch (err) {
      console.error('Failed to claim:', err);
      alert('Failed to claim item');
    }
  };

  const markAsPurchased = async (claimId) => {
    try {
      await base44.entities.ClaimedItem.update(claimId, {
        is_purchased: true
      });

      alert('✅ Marked as purchased!');
      await loadSharedCart();
    } catch (err) {
      console.error('Failed to mark:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Gift className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">Cart not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{cart.cart_name}</h1>
              <p className="text-white/60 text-sm">
                Shared by {cart.owner_name || 'Anonymous'}
                {cart.occasion && ` • ${cart.occasion}`}
              </p>
            </div>
          </div>

          <Card className="bg-black border-white/10">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-white/60 text-xs mb-1">Items</div>
                  <div className="text-white font-bold text-lg">{cart.items?.length || 0}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs mb-1">Total USD</div>
                  <div className="text-green-400 font-bold text-lg">${cart.total_usd?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs mb-1">Total KAS</div>
                  <div className="text-cyan-400 font-bold text-lg">{cart.total_kas?.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Claimed Items */}
        {myClaimedItems.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 mb-6">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                Your Claimed Items ({myClaimedItems.length})
              </h3>
              <div className="space-y-2">
                {myClaimedItems.map((claim) => {
                  const item = cart.items.find(i => i.wishlist_item_id === claim.wishlist_item_id);
                  return (
                    <div key={claim.id} className="flex items-center justify-between bg-black/40 rounded-lg p-2">
                      <span className="text-white text-sm">{item?.product_name}</span>
                      <Button
                        onClick={() => markAsPurchased(claim.id)}
                        disabled={claim.is_purchased}
                        size="sm"
                        className={claim.is_purchased ? "bg-green-500/20 text-green-400" : "bg-purple-500"}
                      >
                        {claim.is_purchased ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Purchased
                          </>
                        ) : (
                          'Mark Purchased'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cart Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cart.items?.map((item, idx) => {
            const isClaimed = myClaimedItems.find(c => c.wishlist_item_id === item.wishlist_item_id);
            const claimCount = claimedItems.filter(c => c.wishlist_item_id === item.wishlist_item_id).length;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`bg-black transition-all ${
                  isClaimed ? 'border-pink-500/50 ring-2 ring-pink-500/20' : 'border-white/10'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-white font-semibold text-sm flex-1">{item.product_name}</h3>
                      {claimCount > 0 && (
                        <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs">
                          {claimCount} claimed
                        </Badge>
                      )}
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/60 text-xs">USD</span>
                        <span className="text-white font-bold">${item.price_usd?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-xs">KAS</span>
                        <span className="text-cyan-400 font-bold">{item.price_kas?.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => window.open(item.product_url, '_blank')}
                        size="sm"
                        variant="outline"
                        className="flex-1 border-white/10 text-white hover:bg-white/5"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Store
                      </Button>
                      <Button
                        onClick={() => claimItem(item)}
                        disabled={!!isClaimed}
                        size="sm"
                        className={isClaimed 
                          ? "bg-pink-500/20 text-pink-400" 
                          : "bg-gradient-to-r from-pink-500 to-purple-500"
                        }
                      >
                        {isClaimed ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Claimed
                          </>
                        ) : (
                          <>
                            <Heart className="w-3 h-3 mr-1" />
                            Claim
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}