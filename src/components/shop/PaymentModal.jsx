import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Copy, CheckCircle2, Loader2, Clock, Wallet, AlertCircle } from "lucide-react";

export default function PaymentModal({ item, onClose, user }) {
  const [orderId, setOrderId] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending_payment");
  const [txId, setTxId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderId && paymentStatus === "pending_payment") {
      // Start monitoring for payment
      const interval = setInterval(checkPayment, 10000); // Check every 10 seconds
      
      // Countdown timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        clearInterval(timer);
      };
    }
  }, [orderId, paymentStatus]);

  const checkPayment = async () => {
    if (!orderId || isMonitoring) return;
    
    setIsMonitoring(true);
    try {
      const result = await base44.functions.invoke('monitorKaspaPayment', {
        order_id: orderId
      });

      if (result.data.status === 'payment_confirmed') {
        setPaymentStatus('payment_confirmed');
        setTxId(result.data.tx_id);
      } else if (result.data.status === 'cancelled') {
        setPaymentStatus('cancelled');
      }
    } catch (err) {
      console.error('Failed to check payment:', err);
    } finally {
      setIsMonitoring(false);
    }
  };

  const createOrder = async () => {
    if (!deliveryInfo.trim()) {
      alert('Please provide delivery information (email, Discord, etc.)');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      const order = await base44.entities.ShopOrder.create({
        item_id: item.id,
        item_name: item.name,
        seller_email: item.created_by,
        seller_kaspa_address: item.seller_kaspa_address,
        buyer_email: user.email,
        buyer_name: user.username || user.email.split('@')[0],
        amount_kas: item.price_kas,
        delivery_info: deliveryInfo.trim(),
        order_notes: orderNotes.trim(),
        expires_at: expiresAt.toISOString()
      });

      setOrderId(order.id);
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to create order: ' + err.message);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(item.seller_kaspa_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (paymentStatus === 'payment_confirmed') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-green-500 rounded-2xl p-8 text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">Payment Confirmed!</h3>
          <p className="text-white/80 mb-4">Your payment has been received and verified on the Kaspa blockchain.</p>
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <p className="text-xs text-white/60 mb-1">Transaction ID</p>
            <code className="text-green-400 text-xs break-all">{txId}</code>
          </div>
          <p className="text-white/70 text-sm mb-6">The seller will deliver your purchase to: <strong>{deliveryInfo}</strong></p>
          <Button onClick={onClose} className="w-full bg-green-500 hover:bg-green-600">
            Done
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  if (paymentStatus === 'cancelled') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-red-900 to-orange-900 border-2 border-red-500 rounded-2xl p-8 text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Payment Expired</h3>
          <p className="text-white/80 mb-6">The 30-minute payment window has expired. Please create a new order.</p>
          <Button onClick={onClose} className="w-full bg-red-500 hover:bg-red-600">
            Close
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-black border border-cyan-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{item.name}</h2>
            <p className="text-cyan-400 text-lg font-bold">{item.price_kas} KAS</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!orderId ? (
            <>
              <div>
                <label className="text-white font-semibold mb-2 block">
                  Delivery Information *
                </label>
                <Input
                  value={deliveryInfo}
                  onChange={(e) => setDeliveryInfo(e.target.value)}
                  placeholder="Your email, Discord, or delivery address"
                  className="bg-white/5 border-white/20 text-white"
                />
                <p className="text-white/40 text-xs mt-1">Where should the seller send your purchase?</p>
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">
                  Order Notes (Optional)
                </label>
                <Textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special requests or instructions..."
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>

              <Button
                onClick={createOrder}
                disabled={isCreatingOrder}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12 text-lg"
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-2" />
                    Create Order & Get Payment Address
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Send Payment To</h3>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 font-mono font-bold">{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 rounded-lg p-4 mb-4">
                  <code className="text-cyan-400 text-sm break-all">{item.seller_kaspa_address}</code>
                </div>

                <Button onClick={copyAddress} className="w-full bg-white/10 hover:bg-white/20 border border-white/20">
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Important Instructions
                </h4>
                <ol className="text-white/80 text-sm space-y-2">
                  <li>1. Send <strong className="text-cyan-400">{item.price_kas} KAS</strong> to the address above</li>
                  <li>2. We'll automatically detect your payment within seconds</li>
                  <li>3. Once confirmed, the seller will deliver to: <strong>{deliveryInfo}</strong></li>
                  <li>4. Payment window expires in {formatTime(timeLeft)}</li>
                </ol>
              </div>

              <div className="text-center">
                {isMonitoring && (
                  <div className="flex items-center justify-center gap-2 text-cyan-400 mb-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Checking blockchain...</span>
                  </div>
                )}
                <Button
                  onClick={checkPayment}
                  disabled={isMonitoring}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400"
                >
                  Check Payment Now
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}