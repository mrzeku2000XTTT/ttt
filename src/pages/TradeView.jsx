
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowLeft, Shield, Clock, CheckCircle2, AlertTriangle,
  Send, Loader2, XCircle, MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CONTRACT_ADDRESSES = {
  mainnet: '0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194',
  testnet: '0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194'
};

export default function TradeViewPage() {
  const [listing, setListing] = useState(null);
  const [trade, setTrade] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState({ connected: false, address: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    checkWallet();
  }, []);

  const checkWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWallet({ connected: true, address: accounts[0] });
        }
      } catch (err) {
        console.error('Failed to check wallet:', err);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not found. Please install MetaMask extension.');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await checkWallet();
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const urlParams = new URLSearchParams(window.location.search);
      const listingId = urlParams.get('listing');

      if (!listingId) {
        setError('No listing ID provided');
        setIsLoading(false);
        return;
      }

      const listings = await base44.entities.Listing.filter({ id: listingId });
      if (listings.length === 0) {
        setError('Listing not found');
        setIsLoading(false);
        return;
      }

      const currentListing = listings[0];
      setListing(currentListing);

      const trades = await base44.entities.Trade.filter({ listing_id: listingId });
      if (trades.length > 0) {
        const currentTrade = trades[0];
        setTrade(currentTrade);

        const tradeMessages = await base44.entities.TradeMessage.filter({ trade_id: currentTrade.id }, '-created_date');
        setMessages(tradeMessages);
      }

    } catch (err) {
      console.error('Failed to load trade:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTrade = async () => {
    if (!wallet.connected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🤝 Accepting trade...');

      const newTrade = await base44.entities.Trade.create({
        listing_id: listing.id,
        seller_address: listing.seller_address,
        buyer_address: wallet.address,
        kas_amount: listing.kas_amount,
        fiat_amount: listing.fiat_amount,
        status: "in_progress"
      });

      await base44.entities.Listing.update(listing.id, {
        status: "in_progress",
        buyer_address: wallet.address
      });

      console.log('✅ Trade accepted! Trade ID:', newTrade.id);

      setTrade(newTrade);
      await loadData();

    } catch (err) {
      console.error('Failed to accept trade:', err);
      setError(err.message || 'Failed to accept trade');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPaymentSent = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await base44.entities.Trade.update(trade.id, {
        status: "payment_sent",
        buyer_confirmed: true
      });

      await loadData();

    } catch (err) {
      console.error('Failed to confirm payment sent:', err);
      setError(err.message || 'Failed to confirm payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPaymentReceived = async () => {
    if (!confirm('Confirm you received the payment? This will release KAS from escrow to the buyer.')) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('💸 [Frontend] Releasing KAS from escrow to buyer...');
      console.log('💸 [Frontend] User Address:', wallet.address);

      const contractTradeId = listing.contract_trade_id !== undefined && listing.contract_trade_id !== null
        ? listing.contract_trade_id
        : trade?.contract_trade_id;

      if (contractTradeId === undefined || contractTradeId === null) {
        throw new Error('Contract trade ID not found. This listing may have been created before the fix. Please contact support.');
      }

      console.log('💸 [Frontend] Using contract trade ID:', contractTradeId);

      // Encode function call: confirmPaymentReceived(uint256)
      const functionSignature = '0x8c8e8fee'; // keccak256("confirmPaymentReceived(uint256)") first 4 bytes
      const paddedTradeId = contractTradeId.toString(16).padStart(64, '0');
      const data = functionSignature + paddedTradeId;

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet.address,
          to: (listing.contract_address || CONTRACT_ADDRESSES.mainnet),
          data: data
        }]
      });

      console.log('✅ [Frontend] Release transaction sent! Hash:', txHash);

      await base44.entities.Trade.update(trade.id, {
        status: "completed",
        seller_confirmed: true,
        tx_hash: txHash
      });

      await base44.entities.Listing.update(listing.id, { status: "completed" });

      console.log('✅ [Frontend] Backend updated: Payment Received, Trade Completed');
      await loadData();

    } catch (err) {
      console.error('❌ [Frontend] Failed to release funds:', err);
      if (err.code === 4001) {
        setError('Transaction cancelled by user');
      } else {
        setError(err.message || 'Failed to release funds');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelTrade = async () => {
    if (!confirm('Are you sure you want to cancel this trade? KAS will be refunded to seller.')) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('❌ [Frontend] Cancelling trade...');

      const contractTradeId = listing.contract_trade_id !== undefined && listing.contract_trade_id !== null
        ? listing.contract_trade_id
        : trade?.contract_trade_id;

      if (contractTradeId === undefined || contractTradeId === null) {
        throw new Error('Contract trade ID not found. Cannot cancel trade.');
      }

      // Encode function call: cancelTrade(uint256)
      const functionSignature = '0xc2bc2efc'; // keccak256("cancelTrade(uint256)") first 4 bytes
      const paddedTradeId = contractTradeId.toString(16).padStart(64, '0');
      const data = functionSignature + paddedTradeId;

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet.address,
          to: (listing.contract_address || CONTRACT_ADDRESSES.mainnet),
          data: data
        }]
      });

      console.log('✅ [Frontend] Cancellation transaction sent! Hash:', txHash);

      await base44.entities.Trade.update(trade.id, { status: "cancelled", tx_hash: txHash });
      await base44.entities.Listing.update(listing.id, { status: "cancelled" });

      console.log('✅ [Frontend] Backend updated: Trade Cancelled');
      await loadData();

    } catch (err) {
      console.error('❌ [Frontend] Failed to cancel trade:', err);
      if (err.code === 4001) {
        setError('Transaction cancelled by user');
      } else {
        setError(err.message || 'Failed to cancel trade');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!confirm('Are you sure you want to raise a dispute?')) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('⚠️ [Frontend] Raising dispute...');

      const contractTradeId = listing.contract_trade_id !== undefined && listing.contract_trade_id !== null
        ? listing.contract_trade_id
        : trade?.contract_trade_id;

      if (contractTradeId === undefined || contractTradeId === null) {
        throw new Error('Contract trade ID not found. Cannot raise dispute.');
      }

      // Encode function call: raiseDispute(uint256)
      const functionSignature = '0x6b1f5f68'; // keccak256("raiseDispute(uint256)") first 4 bytes
      const paddedTradeId = contractTradeId.toString(16).padStart(64, '0');
      const data = functionSignature + paddedTradeId;

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet.address,
          to: (listing.contract_address || CONTRACT_ADDRESSES.mainnet),
          data: data
        }]
      });

      console.log('✅ [Frontend] Dispute transaction sent! Hash:', txHash);

      await base44.entities.Trade.update(trade.id, { status: "disputed", tx_hash: txHash });

      console.log('✅ [Frontend] Backend updated: Dispute Raised');
      await loadData();

    } catch (err) {
      console.error('❌ [Frontend] Failed to raise dispute:', err);
      if (err.code === 4001) {
        setError('Transaction cancelled by user');
      } else {
        setError(err.message || 'Failed to raise dispute');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !trade) return;

    try {
      await base44.entities.TradeMessage.create({
        trade_id: trade.id,
        sender_address: wallet.address,
        message: newMessage.trim()
      });

      setNewMessage("");
      await loadData();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const isSeller = user && listing && listing.seller_address?.toLowerCase() === wallet.address?.toLowerCase();
  const isBuyer = user && trade && trade.buyer_address?.toLowerCase() === wallet.address?.toLowerCase();

  const getStatusBadge = (status) => {
    const configs = {
      open: { icon: Clock, color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", text: "Open" },
      in_progress: { icon: Loader2, color: "bg-blue-500/20 text-blue-300 border-blue-500/30", text: "In Progress" },
      payment_sent: { icon: CheckCircle2, color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", text: "Payment Sent" },
      completed: { icon: CheckCircle2, color: "bg-green-500/20 text-green-300 border-green-500/30", text: "Completed" },
      cancelled: { icon: XCircle, color: "bg-gray-500/20 text-gray-300 border-gray-500/30", text: "Cancelled" },
      disputed: { icon: AlertTriangle, color: "bg-red-500/20 text-red-300 border-red-500/30", text: "Disputed" }
    };

    const config = configs[status] || configs.open;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-4 h-4 mr-1" />
        {config.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl mb-4">{error || 'Listing not found'}</p>
          <Link to={createPageUrl("Marketplace")}>
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl("Marketplace")}>
            <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white hover:bg-white/5">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Trade Details</h1>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(trade?.status || listing.status)}
                      {isSeller && listing.status === 'open' && (
                        <Link to={createPageUrl("EditListing") + "?listing=" + listing.id}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
                          >
                            Edit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">KAS Amount</div>
                      <div className="text-3xl font-bold text-white">{listing.kas_amount} KAS</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Price</div>
                      <div className="text-3xl font-bold text-cyan-400">${listing.fiat_amount}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm text-gray-400 mb-2">Location</div>
                    <div className="text-white font-semibold">{listing.location}</div>
                  </div>

                  {listing.meeting_notes && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Meeting Notes</div>
                      <div className="bg-black/30 rounded-lg p-3 text-white text-sm">
                        {listing.meeting_notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {!wallet.connected && (
                <Card className="backdrop-blur-xl bg-yellow-500/20 border-yellow-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-200">
                        Connect your MetaMask wallet to interact with this trade.
                      </p>
                    </div>
                    <Button
                      onClick={connectWallet}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    >
                      Connect Wallet
                    </Button>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Card className="backdrop-blur-xl bg-red-500/20 border-red-500/30">
                  <CardContent className="p-6 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </CardContent>
                </Card>
              )}

              {wallet.connected && (
                <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                  <CardHeader className="border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Actions</h2>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    {listing.status === "open" && !isSeller && (
                      <Button
                        onClick={handleAcceptTrade}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Accept Trade
                          </>
                        )}
                      </Button>
                    )}

                    {listing.status === "open" && isSeller && (
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="font-semibold text-blue-200">Waiting for Buyer</p>
                          <p className="text-sm text-blue-300">Your KAS is locked in escrow</p>
                        </div>
                      </div>
                    )}

                    {trade && trade.status === "in_progress" && isBuyer && !trade.buyer_confirmed && (
                      <Button
                        onClick={handleConfirmPaymentSent}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            I Sent Payment
                          </>
                        )}
                      </Button>
                    )}

                    {trade && trade.status === "in_progress" && isSeller && (
                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="font-semibold text-yellow-200">Waiting for Payment</p>
                          <p className="text-sm text-yellow-300">Buyer should send ${listing.fiat_amount} cash in person</p>
                        </div>
                      </div>
                    )}

                    {trade && trade.status === "payment_sent" && isSeller && !trade.seller_confirmed && (
                      <Button
                        onClick={handleConfirmPaymentReceived}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            I Received Payment - Release KAS
                          </>
                        )}
                      </Button>
                    )}

                    {trade && trade.status === "payment_sent" && isBuyer && (
                      <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="font-semibold text-cyan-200">Waiting for Seller</p>
                          <p className="text-sm text-cyan-300">Seller is verifying payment</p>
                        </div>
                      </div>
                    )}

                    {trade && (trade.status === "in_progress" || trade.status === "payment_sent") && (isSeller || isBuyer) && (
                      <>
                        <Button
                          onClick={handleCancelTrade}
                          disabled={isProcessing}
                          variant="outline"
                          className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel Trade
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={handleRaiseDispute}
                          disabled={isProcessing}
                          variant="outline"
                          className="w-full bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Raise Dispute
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {trade && trade.status === "completed" && (
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="font-semibold text-green-200">Trade Completed!</p>
                          <p className="text-sm text-green-300">KAS has been released to buyer</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold text-white">Chat</h2>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {trade ? (
                    <>
                      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                        {messages.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-8">No messages yet</p>
                        ) : (
                          messages.map((msg) => {
                            const isOwnMessage = msg.sender_address?.toLowerCase() === wallet.address?.toLowerCase();
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg p-3 ${
                                    isOwnMessage
                                      ? 'bg-cyan-500/20 text-cyan-100'
                                      : 'bg-white/10 text-gray-200'
                                  }`}
                                >
                                  <p className="text-sm">{msg.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(msg.created_date).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                          disabled={!wallet.connected}
                        />
                        <Button
                          type="submit"
                          disabled={!newMessage.trim() || !wallet.connected}
                          className="bg-cyan-500 hover:bg-cyan-600"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Chat will be available once trade is accepted
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-cyan-500/20 border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-cyan-200">
                      <p className="font-semibold mb-2">Escrow Protected</p>
                      <p>KAS is locked in smart contract. Funds only release when both parties confirm, or refunded on cancel.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
