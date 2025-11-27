import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Zap, X, Loader2, CheckCircle2, ExternalLink, Package, Image as ImageIcon } from "lucide-react";

export default function ShopWidget({ shopItems, totalItems, userBalance }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  const handleBuyNow = async (item) => {
    if (!window.kasware) {
      alert('❌ Please install Kasware wallet extension first');
      return;
    }

    setSelectedItem(item);
    setIsPaying(true);

    try {
      const accounts = await window.kasware.getAccounts();
      if (accounts.length === 0) {
        await window.kasware.requestAccounts();
        const newAccounts = await window.kasware.getAccounts();
        if (newAccounts.length === 0) {
          throw new Error('No Kasware accounts found');
        }
      }

      const buyerAddress = accounts[0];
      const totalKAS = item.price_kas + (item.shipping_cost_kas || 0);
      const amountInSompi = Math.floor(totalKAS * 100000000);

      const txid = await window.kasware.sendKaspa(item.seller_kaspa_address, amountInSompi);

      if (!txid) {
        throw new Error('Transaction cancelled');
      }

      setOrderConfirmation({
        item: item,
        txid: txid,
        amount: totalKAS,
        buyer: buyerAddress,
        seller: item.seller_kaspa_address,
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString()
      });

      setIsPaying(false);

    } catch (err) {
      console.error('❌ Payment failed:', err);
      alert('❌ Payment failed: ' + err.message);
      setIsPaying(false);
      setSelectedItem(null);
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
  };

  return (
    <>
      <div className="w-full bg-black/90 border border-purple-500/30 rounded-lg overflow-hidden">
        {/* Compact Header */}
        <div className="bg-black/80 px-3 py-2 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5 text-purple-400" />
            <h3 className="text-xs font-bold text-white">TTT Shop</h3>
            <Badge className="bg-purple-500/30 text-purple-300 border-0 text-[10px] px-1.5 py-0">
              {shopItems.length} items
            </Badge>
          </div>
          <div className="text-[10px] text-gray-500">
            💰 {userBalance.toFixed(2)} KAS
          </div>
        </div>

        {/* Compact 3-Column Grid - All Items Visible */}
        <div className="p-2 bg-black/60 max-h-[320px] overflow-y-auto">
          <div className="grid grid-cols-3 gap-2">
            {shopItems.map((item, idx) => {
              const totalCost = item.price_kas + (item.shipping_cost_kas || 0);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-black border border-purple-500/20 rounded-lg overflow-hidden hover:border-purple-500/50 transition-all"
                >
                  {/* Compact Square Image */}
                  <div className="aspect-square bg-black relative">
                    {item.images?.[0] ? (
                      <img 
                        src={item.images[0]} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-500/5">
                        <ImageIcon className="w-8 h-8 text-gray-700" />
                      </div>
                    )}
                    
                    {/* Stock Badge */}
                    {item.stock > 0 && (
                      <div className="absolute top-1 right-1">
                        <Badge className="bg-green-500/90 text-white text-[9px] px-1 py-0">
                          ✓{item.stock}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Compact Info */}
                  <div className="p-1.5">
                    {/* Title - Ultra Compact */}
                    <h4 className="text-white font-semibold text-[10px] mb-1 line-clamp-1">
                      {item.title}
                    </h4>

                    {/* Price */}
                    <div className="flex items-center gap-0.5 mb-1.5">
                      <Badge className="bg-purple-500/40 text-purple-200 border-0 text-[9px] px-1 py-0 font-bold">
                        {item.price_kas} KAS
                      </Badge>
                      {item.shipping_cost_kas > 0 && (
                        <Badge className="bg-blue-500/40 text-blue-200 border-0 text-[8px] px-1 py-0">
                          +{item.shipping_cost_kas}
                        </Badge>
                      )}
                    </div>

                    {/* Compact Buy Button */}
                    <Button
                      onClick={() => handleBuyNow(item)}
                      disabled={item.stock === 0 || isPaying}
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-6 text-[10px] font-bold px-1"
                    >
                      <Zap className="w-2.5 h-2.5 mr-0.5" />
                      Buy {totalCost}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Compact Footer */}
        <div className="bg-black/80 px-3 py-1.5 border-t border-purple-500/20 text-[9px] text-gray-500 text-center">
          💡 Pay with Kasware • Seller manages delivery
        </div>
      </div>

      {/* Order Confirmation Modal */}
      <AnimatePresence>
        {orderConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setOrderConfirmation(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-green-900/40 to-black border-2 border-green-500/50 rounded-2xl p-6 max-w-md w-full"
            >
              {/* Success Icon */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Order Confirmed!</h2>
                <p className="text-xs text-gray-400">Payment sent to seller</p>
              </div>

              {/* Order Details */}
              <div className="space-y-3 mb-6">
                <div className="bg-black/60 rounded-lg p-3 border border-green-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    {orderConfirmation.item.images?.[0] && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-green-500/30">
                        <img src={orderConfirmation.item.images[0]} alt={orderConfirmation.item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm">{orderConfirmation.item.title}</h3>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        {orderConfirmation.amount} KAS
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Order #</span>
                      <code className="text-green-400 font-mono text-[10px]">{orderConfirmation.orderNumber}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Paid</span>
                      <span className="text-white font-bold">{orderConfirmation.amount} KAS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Seller</span>
                      <code className="text-purple-400 font-mono text-[9px]">{truncateAddress(orderConfirmation.seller)}</code>
                    </div>
                  </div>
                </div>

                {/* TX Hash */}
                <div className="bg-black/60 rounded-lg p-2.5 border border-purple-500/20">
                  <div className="text-[10px] text-gray-400 mb-1">Transaction</div>
                  <div className="flex items-center gap-2">
                    <code className="text-[9px] text-purple-400 font-mono break-all flex-1">
                      {orderConfirmation.txid.substring(0, 30)}...
                    </code>
                    <a
                      href={`https://explorer.kaspa.org/txs/${orderConfirmation.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-yellow-300 mb-1.5">What's Next?</h4>
                      <ul className="text-[10px] text-yellow-200 space-y-0.5">
                        <li>✓ Payment confirmed</li>
                        <li>📧 Seller will contact you</li>
                        <li>📦 Arrange delivery with seller</li>
                        <li>⭐ Leave feedback after delivery</li>
                      </ul>
                      <p className="text-[9px] text-yellow-200/70 mt-2 italic">
                        Local marketplace - you coordinate with seller.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setOrderConfirmation(null)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-9"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Done
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kasware Payment Modal */}
      <AnimatePresence>
        {selectedItem && !orderConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => !isPaying && setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border-2 border-purple-500/50 rounded-xl p-5 max-w-sm w-full"
            >
              {isPaying ? (
                <div className="text-center py-6">
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Processing...</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Confirm in Kasware
                  </p>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="text-xs text-purple-300 space-y-0.5">
                      <div>💰 {selectedItem.price_kas + (selectedItem.shipping_cost_kas || 0)} KAS</div>
                      <div className="text-[10px]">📬 {truncateAddress(selectedItem.seller_kaspa_address)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/50">
                      <ShoppingCart className="w-6 h-6 text-purple-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-0.5">Confirm Purchase</h2>
                    <p className="text-[10px] text-gray-500">Pay with Kasware</p>
                  </div>

                  {/* Item Preview */}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
                    <div className="flex gap-2.5 mb-3">
                      {selectedItem.images?.[0] && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-purple-500/30">
                          <img src={selectedItem.images[0]} alt={selectedItem.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-xs mb-1">{selectedItem.title}</h3>
                        <Badge className="bg-purple-500/30 text-purple-300 border-0 text-[9px]">
                          {selectedItem.condition?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price</span>
                        <span className="text-white font-bold">{selectedItem.price_kas} KAS</span>
                      </div>
                      {selectedItem.shipping_cost_kas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Shipping</span>
                          <span className="text-white">{selectedItem.shipping_cost_kas} KAS</span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-purple-500/30 flex justify-between">
                        <span className="text-white font-bold">Total</span>
                        <span className="text-purple-400 font-bold">
                          {totalCost} KAS
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seller */}
                  <div className="bg-black/60 rounded-lg p-2.5 mb-4 border border-purple-500/20">
                    <div className="text-[10px] text-gray-400 mb-1">Seller Wallet</div>
                    <code className="text-[9px] text-purple-400 font-mono break-all">
                      {selectedItem.seller_kaspa_address}
                    </code>
                  </div>

                  {/* Notice */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5 mb-4">
                    <div className="flex items-start gap-1.5">
                      <Package className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-[10px] text-yellow-200">
                        <p className="font-medium mb-0.5">Local Marketplace</p>
                        <p>Coordinate delivery with seller after payment.</p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBuyNow(selectedItem)}
                      disabled={isPaying}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-9 text-xs"
                    >
                      <Zap className="w-4 h-4 mr-1.5" />
                      Pay Now
                    </Button>
                    <Button
                      onClick={() => setSelectedItem(null)}
                      disabled={isPaying}
                      variant="outline"
                      className="border-gray-700 text-white hover:bg-gray-800 h-9 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}