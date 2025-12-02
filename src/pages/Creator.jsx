import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Copy, CheckCircle2, TrendingUp, DollarSign, Users, 
  Package, Plus, Loader2, BarChart3, ExternalLink, Sparkles,
  ShoppingBag, Search, X, Share
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function CreatorPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    totalPending: 0,
    balance: 0,
    clicks: 0,
    conversions: 0,
    conversionRate: 0,
    epc: 0
  });
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('referrals');
  const [clickHistory, setClickHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    product_name: '',
    product_description: '',
    supplier_url: '',
    cost_price: '',
    selling_price: '',
    category: 'other'
  });
  const [isGeneratingProduct, setIsGeneratingProduct] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Generate or get referral code
      let code = currentUser.referral_code;
      if (!code) {
        code = `TTT-${currentUser.email.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        await base44.auth.updateMe({ referral_code: code });
      }
      setReferralCode(code);

      // Load referral stats
      await loadReferralStats(currentUser.email);
      
      // Load dropshipping products
      await loadProducts(currentUser.email);
      
      // Load orders
      await loadOrders(currentUser.email);
    } catch (err) {
      console.error('Failed to load:', err);
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const loadReferralStats = async (email) => {
    try {
      const referrals = await base44.entities.CreatorReferral.filter({
        creator_email: email
      });
      
      setClickHistory(referrals.slice(0, 10));

      const today = new Date().setHours(0, 0, 0, 0);
      const todayRefs = referrals.filter(r => 
        new Date(r.created_date).setHours(0, 0, 0, 0) === today
      );

      const clicks = referrals.length;
      const conversions = referrals.filter(r => r.converted).length;
      const totalEarnings = referrals.reduce((sum, r) => sum + (r.earnings || 0), 0);
      const todayEarnings = todayRefs.reduce((sum, r) => sum + (r.earnings || 0), 0);

      // Generate chart data (last 7 days)
      const chartDataArr = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayRefs = referrals.filter(r => {
          const refDate = new Date(r.created_date);
          refDate.setHours(0, 0, 0, 0);
          return refDate.getTime() === date.getTime();
        });

        chartDataArr.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          earnings: dayRefs.reduce((sum, r) => sum + (r.earnings || 0), 0),
          clicks: dayRefs.length
        });
      }

      setStats({
        todayEarnings,
        totalPending: totalEarnings * 0.7, // 70% pending
        balance: totalEarnings * 0.3, // 30% available
        clicks,
        conversions,
        conversionRate: clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : 0,
        epc: clicks > 0 ? (totalEarnings / clicks).toFixed(2) : 0
      });

      setChartData(chartDataArr);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadProducts = async (email) => {
    try {
      const prods = await base44.entities.DropshippingProduct.filter({
        creator_email: email
      }, '-created_date', 50);
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadOrders = async (email) => {
    try {
      const ordersList = await base44.entities.DropshippingOrder.filter({
        creator_email: email
      }, '-created_date', 100);
      setOrders(ordersList);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Delete this product?')) return;
    try {
      await base44.entities.DropshippingProduct.delete(productId);
      await loadProducts(user.email);
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const generateReferralLink = () => {
    return `https://base44.pxf.io/c/6733401/2049275/25619?trafcat=${referralCode}`;
  };

  const copyReferralLink = async () => {
    const link = generateReferralLink();
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAIProductGeneration = async () => {
    if (!aiPrompt.trim()) return;

    setIsGeneratingProduct(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert dropshipping product researcher. Based on this request: "${aiPrompt}", find a trending profitable product to sell. Include: product name, compelling description, estimated supplier cost, recommended selling price, category, and a realistic Aliexpress-style product URL.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            product_description: { type: "string" },
            supplier_url: { type: "string" },
            cost_price: { type: "number" },
            selling_price: { type: "number" },
            category: { type: "string" }
          }
        }
      });

      setProductForm({
        ...response,
        cost_price: response.cost_price?.toString() || '',
        selling_price: response.selling_price?.toString() || ''
      });
      setShowAddProduct(true);
      setAiPrompt('');
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setIsGeneratingProduct(false);
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.product_name || !productForm.cost_price || !productForm.selling_price) {
      alert('Please fill in product name, cost price, and selling price');
      return;
    }

    setIsAddingProduct(true);
    try {
      const cost = parseFloat(productForm.cost_price);
      const price = parseFloat(productForm.selling_price);
      const profit = price - cost;

      // Generate product image with AI
      let imageUrl = '';
      try {
        const imgRes = await base44.integrations.Core.GenerateImage({
          prompt: `Professional product photo of ${productForm.product_name} on white background, e-commerce style, high quality`
        });
        imageUrl = imgRes.url;
      } catch (err) {
        imageUrl = 'https://via.placeholder.com/400x400?text=Product';
      }

      await base44.entities.DropshippingProduct.create({
        creator_email: user.email,
        product_name: productForm.product_name,
        product_description: productForm.product_description,
        product_image: imageUrl,
        supplier_url: productForm.supplier_url,
        cost_price: cost,
        selling_price: price,
        profit_margin: profit,
        category: productForm.category,
        status: 'active',
        orders_count: 0,
        total_revenue: 0
      });

      setProductForm({
        product_name: '',
        product_description: '',
        supplier_url: '',
        cost_price: '',
        selling_price: '',
        category: 'other'
      });
      setShowAddProduct(false);
      await loadProducts(user.email);
    } catch (err) {
      console.error('Failed to add product:', err);
      alert('Failed to add product. Please try again.');
    } finally {
      setIsAddingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Creator Dashboard</h1>
          <p className="text-gray-400">Manage your referrals and dropshipping business</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'referrals'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Referrals
          </button>
          <button
            onClick={() => setActiveTab('dropshipping')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'dropshipping'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Dropshipping
          </button>
        </div>

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Link Card */}
              <Card className="bg-zinc-900 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <h3 className="text-white font-bold">Create a Link</h3>
                  <p className="text-sm text-gray-400">Promote any brand with a simple link</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Brand</label>
                      <Input
                        value="Base44"
                        disabled
                        className="bg-black border-white/20 text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={copyReferralLink}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        {copiedLink ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          const link = generateReferralLink();
                          const shareText = `Join Base44 - The AI-Powered App Builder!\n\nBuild apps without code, powered by AI.\n${link}`;
                          if (navigator.share) {
                            navigator.share({ title: 'Base44', text: shareText });
                          } else {
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
                          }
                        }}
                        className="bg-white/10 border border-white/20 hover:bg-white/20"
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="bg-black border border-white/20 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-2">Your referral link:</p>
                      <code className="text-xs text-cyan-400 break-all">
                        {generateReferralLink()}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Terms */}
              <Card className="bg-zinc-900 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <h3 className="text-white font-bold">Contract Terms</h3>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Purchase</span>
                    <span className="text-white font-bold">Earn USD 100.00</span>
                  </div>
                  <div className="text-xs text-gray-500">Referred spend: 30 DAY</div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-gray-400">Sign Up</span>
                    <span className="text-white font-bold">Earn USD 8.00</span>
                  </div>
                  <div className="text-xs text-gray-500">Referred spend: 30 DAY</div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-gray-400 text-sm">Today's Earnings</h3>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    ${stats.todayEarnings.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">$0.00 so far this last week</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-gray-400 text-sm">Total Pending</h3>
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    ${stats.totalPending.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-gray-400 text-sm">Balance</h3>
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    ${stats.balance.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">Auto-Withdraw min ($10.00 KAS)</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Clicks */}
            {clickHistory.length > 0 && (
              <Card className="bg-zinc-900 border-white/10">
                <CardHeader className="border-b border-white/10">
                  <h3 className="text-white font-bold">Recent Clicks</h3>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {clickHistory.map((click) => (
                      <div key={click.id} className="flex items-center justify-between py-2 border-b border-white/5">
                        <div>
                          <div className="text-sm text-white">
                            {click.converted ? '✅ Converted' : '👁️ Click'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(click.clicked_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          {click.earnings > 0 && (
                            <div className="text-sm text-green-400 font-bold">
                              +${click.earnings.toFixed(2)}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">{click.conversion_type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Chart */}
            <Card className="bg-zinc-900 border-white/10">
              <CardHeader className="border-b border-white/10">
                <h3 className="text-white font-bold">Snapshot</h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="earnings" 
                        stroke="#06b6d4" 
                        strokeWidth={3}
                        dot={{ fill: '#06b6d4', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-white/10">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Clicks</div>
                    <div className="text-white font-bold text-lg">{stats.clicks}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Actions</div>
                    <div className="text-white font-bold text-lg">{stats.conversions}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Action Earnings</div>
                    <div className="text-white font-bold text-lg">${stats.totalPending.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Conversion Rate</div>
                    <div className="text-white font-bold text-lg">{stats.conversionRate}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">EPC</div>
                    <div className="text-white font-bold text-lg">${stats.epc}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dropshipping Tab */}
        {activeTab === 'dropshipping' && (
          <div className="space-y-6">
            {/* Dropshipping Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-sm">Products</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{products.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400 text-sm">Orders</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{orders.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-400 text-sm">Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${products.reduce((sum, p) => sum + (p.total_revenue || 0), 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-400 text-sm">Profit</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    ${orders.reduce((sum, o) => sum + (o.profit || 0), 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* AI Product Generator */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">AI Dropshipping Assistant</h3>
                    <p className="text-sm text-gray-400">Find trending products to sell</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., 'trending tech gadgets under $30' or 'best selling home decor'"
                    className="flex-1 bg-black border-white/20 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleAIProductGeneration()}
                  />
                  <Button
                    onClick={handleAIProductGeneration}
                    disabled={isGeneratingProduct || !aiPrompt.trim()}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    {isGeneratingProduct ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Add Product Modal */}
            <AnimatePresence>
              {showAddProduct && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
                  onClick={() => setShowAddProduct(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-zinc-900 border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Add Product</h2>
                      <Button
                        onClick={() => setShowAddProduct(false)}
                        variant="ghost"
                        size="sm"
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Product Name</label>
                        <Input
                          value={productForm.product_name}
                          onChange={(e) => setProductForm({...productForm, product_name: e.target.value})}
                          className="bg-black border-white/20 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Description</label>
                        <Textarea
                          value={productForm.product_description}
                          onChange={(e) => setProductForm({...productForm, product_description: e.target.value})}
                          className="bg-black border-white/20 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Supplier URL</label>
                        <Input
                          value={productForm.supplier_url}
                          onChange={(e) => setProductForm({...productForm, supplier_url: e.target.value})}
                          placeholder="https://aliexpress.com/item/..."
                          className="bg-black border-white/20 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Cost Price ($)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={productForm.cost_price}
                            onChange={(e) => setProductForm({...productForm, cost_price: e.target.value})}
                            className="bg-black border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Selling Price ($)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={productForm.selling_price}
                            onChange={(e) => setProductForm({...productForm, selling_price: e.target.value})}
                            className="bg-black border-white/20 text-white"
                          />
                        </div>
                      </div>

                      {productForm.cost_price && productForm.selling_price && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <div className="text-sm text-green-400">
                            Profit per sale: ${(parseFloat(productForm.selling_price) - parseFloat(productForm.cost_price)).toFixed(2)}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleAddProduct}
                        disabled={isAddingProduct}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 h-12"
                      >
                        {isAddingProduct ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Adding Product...
                          </>
                        ) : (
                          <>
                            <Package className="w-5 h-5 mr-2" />
                            Add Product to Store
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Your Products</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowOrders(true)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Orders ({orders.length})
                </Button>
                <Button
                  onClick={() => setShowAddProduct(true)}
                  className="bg-white/10 border border-white/20 hover:bg-white/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-lg mb-2">No products yet</p>
                <p className="text-white/20 text-sm">Use AI to find trending products to sell</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="bg-zinc-900 border-white/10 hover:border-white/20 transition-all">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-white/5 rounded-t-lg overflow-hidden">
                        <img
                          src={product.product_image}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="text-white font-bold mb-2 line-clamp-1">{product.product_name}</h4>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.product_description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Cost:</span>
                            <span className="text-white">${product.cost_price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Price:</span>
                            <span className="text-white font-bold">${product.selling_price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                            <span className="text-gray-500">Profit:</span>
                            <span className="text-green-400 font-bold">${product.profit_margin.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(product.supplier_url, '_blank')}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Source
                          </Button>
                          <Button
                            onClick={() => deleteProduct(product.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-gray-500">{product.orders_count} orders</span>
                          <span className="text-green-400">${product.total_revenue?.toFixed(2) || '0.00'} revenue</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Orders Modal */}
            <AnimatePresence>
              {showOrders && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
                  onClick={() => setShowOrders(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-zinc-900 border border-white/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                  >
                    <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-6 z-10">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Orders</h2>
                        <Button
                          onClick={() => setShowOrders(false)}
                          variant="ghost"
                          size="sm"
                          className="text-white/60 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-6">
                      {orders.length === 0 ? (
                        <div className="text-center py-20">
                          <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-4" />
                          <p className="text-white/40">No orders yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <Card key={order.id} className="bg-black border-white/10">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="text-white font-bold">{order.product_name}</h4>
                                    <p className="text-sm text-gray-400">{order.customer_name}</p>
                                  </div>
                                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                                    order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                                    order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {order.status}
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Amount:</span>
                                    <div className="text-white font-semibold">${order.order_amount.toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Profit:</span>
                                    <div className="text-green-400 font-semibold">${order.profit.toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Date:</span>
                                    <div className="text-white font-semibold">
                                      {new Date(order.created_date).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}