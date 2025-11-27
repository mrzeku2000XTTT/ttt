
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, CheckCircle2, AlertCircle, X, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CreateShopListingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_kas: "",
    category: "electronics",
    condition: "new",
    seller_kaspa_address: "",
    location: "",
    shipping_cost_kas: "",
    stock: "1",
    tags: "",
  });
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const categories = [
    { value: "electronics", label: "Electronics" },
    { value: "fashion", label: "Fashion" },
    { value: "home", label: "Home & Garden" },
    { value: "collectibles", label: "Collectibles" },
    { value: "art", label: "Art" },
    { value: "crypto", label: "Crypto Items" },
    { value: "books", label: "Books" },
    { value: "sports", label: "Sports" },
    { value: "toys", label: "Toys & Games" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Pre-fill Kaspa address if available
      if (currentUser.created_wallet_address) {
        setFormData(prev => ({
          ...prev,
          seller_kaspa_address: currentUser.created_wallet_address
        }));
      } else if (currentUser.kasware_address) {
        setFormData(prev => ({
          ...prev,
          seller_kaspa_address: currentUser.kasware_address
        }));
      }
    } catch (err) {
      setError("Please log in to create a listing");
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }

    setUploadingImages(true);
    setError(null);

    try {
      const uploadedUrls = [];
      for (const file of files) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          uploadedUrls.push(file_url);
        } catch (uploadErr) {
          console.error('Failed to upload image:', uploadErr);
          setError(`Failed to upload ${file.name}. Please try again.`);
        }
      }
      
      if (uploadedUrls.length > 0) {
        setImages([...images, ...uploadedUrls]);
        setError(null); // Clear error if at least one image uploaded successfully
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError("Failed to upload images: " + err.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please enter a description");
      return;
    }

    const priceKas = parseFloat(formData.price_kas);
    if (isNaN(priceKas) || priceKas <= 0) {
      setError("Please enter a valid price in KAS");
      return;
    }

    if (!formData.seller_kaspa_address || !formData.seller_kaspa_address.trim()) {
      setError("Please enter your Kaspa wallet address");
      return;
    }

    if (!formData.seller_kaspa_address.startsWith('kaspa:')) {
      setError("Kaspa address must start with 'kaspa:'");
      return;
    }

    if (images.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      await base44.entities.ShopItem.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        price_kas: priceKas,
        category: formData.category,
        condition: formData.condition,
        images: images,
        seller_email: user.email,
        seller_username: user.username || user.email,
        seller_kaspa_address: formData.seller_kaspa_address.trim(),
        location: formData.location.trim(),
        shipping_cost_kas: parseFloat(formData.shipping_cost_kas) || 0,
        stock: parseInt(formData.stock) || 1,
        tags: tags,
        status: "active",
        views: 0,
        favorites: 0,
      });

      setSuccess("✅ Listing created successfully! Redirecting...");

      setTimeout(() => {
        navigate(createPageUrl("Shop"));
      }, 2000);
    } catch (err) {
      console.error("Failed to create listing:", err);
      setError("Failed to create listing: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to={createPageUrl("Shop")}>
              <Button
                variant="ghost"
                className="mb-6 text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              List Your Item
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Share your items with the TTT community
            </p>
          </motion.div>

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
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-300">{success}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Item Details</h2>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Images */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">
                      Photos (up to 10) *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      {images.map((url, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="block">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImages || images.length >= 10}
                      />
                      <div 
                        className={`w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 px-4 py-3 rounded-lg cursor-pointer text-center transition-colors ${
                          (uploadingImages || images.length >= 10) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadingImages ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Photos
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Title *</label>
                    <Input
                      placeholder="e.g., Brand New iPhone 15 Pro Max"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-white/5 border-white/10 text-white text-lg placeholder:text-gray-600"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Description *</label>
                    <Textarea
                      placeholder="Detailed description of your item..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white min-h-[120px] placeholder:text-gray-600"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Kaspa Address */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Your Kaspa Address *</label>
                    <Input
                      placeholder="kaspa:qr..."
                      value={formData.seller_kaspa_address}
                      onChange={(e) => setFormData({ ...formData, seller_kaspa_address: e.target.value })}
                      className="bg-white/5 border-white/10 text-white font-mono placeholder:text-gray-600"
                      disabled={isSubmitting}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Buyers will send KAS to this address. Ensure it's correct.
                    </p>
                  </div>

                  {/* Price & Category */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Price (KAS) *</label>
                      <Input
                        type="number"
                        step="0.00000001" // Kaspa has 8 decimal places
                        placeholder="0.00000000"
                        value={formData.price_kas}
                        onChange={(e) => setFormData({ ...formData, price_kas: e.target.value })}
                        className="bg-white/5 border-white/10 text-white text-lg placeholder:text-gray-600"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Category *</label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="text-white">
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Condition & Stock */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Condition</label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) =>
                          setFormData({ ...formData, condition: value })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
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
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Stock Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Location & Shipping */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Location</label>
                      <Input
                        placeholder="e.g., New York, NY"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Shipping Cost (KAS)
                      </label>
                      <Input
                        type="number"
                        step="0.00000001"
                        placeholder="0.00000000"
                        value={formData.shipping_cost_kas}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping_cost_kas: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Tags (comma-separated)
                    </label>
                    <Input
                      placeholder="e.g., electronics, apple, smartphone, unlocked"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || images.length === 0}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 shadow-lg shadow-purple-500/50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Creating Listing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-3" />
                        Create Listing
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
