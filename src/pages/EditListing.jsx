
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Listing } from "@/entities/Listing";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EditListingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [listing, setListing] = useState(null);
  const [wallet, setWallet] = useState({ connected: false, address: null });
  const [contractAddress, setContractAddress] = useState("0x7A4f6C9B2128F10d3B7Aa01bf288825d4e1b5194"); // Updated to working contract
  const [formData, setFormData] = useState({
    fiat_amount: "",
    payment_method: "PayPal",
    payment_details: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
    checkWallet();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const urlParams = new URLSearchParams(window.location.search);
      const listingId = urlParams.get('listing');
      
      if (!listingId) {
        setError('No listing ID provided');
        setIsLoading(false);
        return;
      }

      const listings = await Listing.filter({ id: listingId });
      if (listings.length === 0) {
        setError('Listing not found');
        setIsLoading(false);
        return;
      }

      const currentListing = listings[0];
      setListing(currentListing);

      // Pre-fill form
      setFormData({
        fiat_amount: currentListing.fiat_amount.toString(),
        payment_method: currentListing.payment_method,
        payment_details: currentListing.payment_details
      });

    } catch (err) {
      console.error('Failed to load listing:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!listing) {
      setError('Listing not loaded');
      return;
    }

    // Check if user is the seller
    if (listing.seller_address?.toLowerCase() !== wallet.address?.toLowerCase()) {
      setError('Only the seller can edit this listing');
      return;
    }

    // Check if listing is still open
    if (listing.status !== 'open') {
      setError('Cannot edit listing - trade is already in progress or completed');
      return;
    }

    const fiatAmount = parseFloat(formData.fiat_amount);

    if (!fiatAmount || fiatAmount <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (!formData.payment_details.trim()) {
      setError('Please provide payment details');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await Listing.update(listing.id, {
        fiat_amount: fiatAmount,
        payment_method: formData.payment_method,
        payment_details: formData.payment_details.trim()
      });

      setSuccess('✅ Listing updated successfully!');
      
      setTimeout(() => {
        navigate(createPageUrl("TradeView") + "?listing=" + listing.id);
      }, 1500);

    } catch (err) {
      console.error('Failed to update listing:', err);
      setError(err.message || 'Failed to update listing');
    } finally {
      setIsSaving(false);
    }
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
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl mb-4">{error || 'Listing not found'}</p>
          <Link to={createPageUrl("Marketplace")}>
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const rate = listing.kas_amount && formData.fiat_amount
    ? (parseFloat(formData.fiat_amount) / listing.kas_amount).toFixed(4)
    : '0';

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to={createPageUrl("TradeView") + "?listing=" + listing.id}>
              <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Trade
              </Button>
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Edit Listing
            </h1>
            <p className="text-gray-400 text-lg">
              Update payment details for your {listing.kas_amount} KAS listing
            </p>
          </motion.div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="backdrop-blur-xl bg-red-500/20 border-red-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="backdrop-blur-xl bg-green-500/20 border-green-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <Save className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-300">{success}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Listing Details</h2>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* KAS Amount (Read-only) */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">KAS Amount (Locked in Escrow)</label>
                    <Input
                      type="text"
                      value={listing.kas_amount + " KAS"}
                      disabled
                      className="bg-white/10 border-white/10 text-gray-500 text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Cannot change - KAS already locked in contract</p>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Price (USD)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 0.17"
                      value={formData.fiat_amount}
                      onChange={(e) => setFormData({...formData, fiat_amount: e.target.value})}
                      className="bg-white/5 border-white/10 text-white text-lg placeholder:text-gray-600"
                      disabled={isSaving}
                      required
                    />
                    {listing.kas_amount && formData.fiat_amount && (
                      <p className="text-xs text-cyan-400 mt-1">Rate: ${rate} per KAS</p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Payment Method</label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({...formData, payment_method: value})}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        <SelectItem value="PayPal" className="text-white">PayPal</SelectItem>
                        <SelectItem value="Venmo" className="text-white">Venmo</SelectItem>
                        <SelectItem value="CashApp" className="text-white">Cash App</SelectItem>
                        <SelectItem value="Zelle" className="text-white">Zelle</SelectItem>
                        <SelectItem value="BankTransfer" className="text-white">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Payment Details</label>
                    <Input
                      placeholder="PayPal.me link or username"
                      value={formData.payment_details}
                      onChange={(e) => setFormData({...formData, payment_details: e.target.value})}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                      disabled={isSaving}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Where buyers should send payment</p>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white disabled:opacity-50 shadow-lg shadow-cyan-500/50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-3" />
                        Update Listing
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
