import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, Loader2, Shield, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SHOP_PAYMENT_ADDRESS = 'kaspa:qztuntfq3z55d6y6nnafw4ff2cgxg4uw64klsjlylcwnxfs7e7yj5qkh7utrk';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null, balance: 0 });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadCart();
    checkKaswareWallet();
  }, []);

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const carts = await base44.entities.ShoppingCart.filter({
        user_email: currentUser.email
      });

      if (carts.length > 0) {
        setCart(carts[0]);
        
        // Load full item details
        const itemIds = carts[0].items?.map(i => i.item_id) || [];
        if (itemIds.length > 0) {
          const allItems = await base44.entities.ShopItem.list();
          const cartItems = allItems.filter(item => itemIds.includes(item.id));
          setItems(cartItems.map(item => ({
            ...item,
            quantity: carts[0].items.find(i => i.item_id === item.id)?.quantity || 1
          })));
        }
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkKaswareWallet = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          const balanceResult = await window.kasware.getBalance();
          const balance = balanceResult.total || 0;
          setKaswareWallet({
            connected: true,
            address: accounts[0],
            balance: balance / 1e8
          });
        }
      } catch (err) {
        console.log('Kasware not connected');
      }
    }
  };

  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      alert('Kasware wallet not found. Please install Kasware extension.');
      return;
    }

    try {
      await window.kasware.requestAccounts();
      await checkKaswareWallet();
    } catch (err) {
      alert('Failed to connect Kasware wallet');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const updatedItems = cart.items.filter(i => i.item_id !== itemId);
      const newTotal = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      
      await base44.entities.ShoppingCart.update(cart.id, {
        items: updatedItems,
        total: newTotal
      });
      
      await loadCart();
    } catch (err) {
      alert('Failed to remove item from cart');
    }
  };

  const handleCheckout = async () => {
    if (!kaswareWallet.connected) {
      alert('Please connect Kasware wallet first');
      return;
    }

    const total = items.reduce((sum, item) => sum + (item.price_kas * item.quantity) + (item.shipping_cost_kas || 0), 0);

    if (kaswareWallet.balance < total) {
      alert(`Insufficient balance. Need ${total.toFixed(8)} KAS`);
      return;
    }

    setIsCheckingOut(true);

    try {
      const satoshis = Math.floor(total * 100000000);
      const txHash = await window.kasware.sendKaspa(SHOP_PAYMENT_ADDRESS, satoshis);

      // Update stock for all items
      for (const item of items) {
        await base44.entities.ShopItem.update(item.id, {
          stock: item.stock - item.quantity
        });
      }

      // Clear cart
      await base44.entities.ShoppingCart.update(cart.id, {
        items: [],
        total: 0
      });

      alert(`🎉 Purchase successful!\n\nTX: ${txHash}\n\nYour order will be processed soon!`);
      navigate(createPageUrl("Shop"));

    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price_kas * item.quantity), 0);
  const shipping = items.reduce((sum, item) => sum + ((item.shipping_cost_kas || 0) * item.quantity), 0);
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to={createPageUrl("Shop")}>
              <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Shopping Cart</h1>
                <p className="text-gray-400">{totalItems} items</p>
              </div>
            </div>
          </motion.div>

          {items.length === 0 ? (
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Your cart is empty</h3>
                <p className="text-gray-400 mb-6">Add some items to get started!</p>
                <Link to={createPageUrl("Shop")}>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                    Browse Shop
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-black/30 rounded-lg overflow-hidden flex-shrink-0">
                            {item.images?.[0] ? (
                              <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">
                                📦
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <Link to={createPageUrl("ShopItemView") + "?id=" + item.id}>
                              <h3 className="text-white font-semibold mb-1 hover:text-purple-400 transition-colors">
                                {item.title}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                {item.condition?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xl font-bold text-purple-400">
                                {item.price_kas} KAS
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => removeFromCart(item.id)}
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <div>
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 sticky top-24">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-white font-semibold text-lg mb-4">Order Summary</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Subtotal:</span>
                        <span className="text-white font-semibold">{subtotal.toFixed(2)} KAS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Shipping:</span>
                        <span className="text-white font-semibold">{shipping.toFixed(2)} KAS</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-purple-400">
                            {total.toFixed(2)} KAS
                          </span>
                        </div>
                      </div>
                    </div>

                    {!kaswareWallet.connected ? (
                      <Button
                        onClick={connectKasware}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 h-12"
                      >
                        <Shield className="w-5 h-5 mr-2" />
                        Connect Kasware
                      </Button>
                    ) : (
                      <>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300">
                          Connected: {kaswareWallet.balance.toFixed(4)} KAS
                        </div>
                        <Button
                          onClick={handleCheckout}
                          disabled={isCheckingOut}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-lg font-semibold"
                        >
                          {isCheckingOut ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Zap className="w-5 h-5 mr-2" />
                              Checkout - {total.toFixed(2)} KAS
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}