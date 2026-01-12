import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, BookOpen, Plus, X, Search as SearchIcon, Loader2, Users, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function CoursesPage() {
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Tech",
    pricing_type: "free",
    price: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    loadUser();
    loadCommunities();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const loadCommunities = async () => {
    try {
      const allCommunities = await base44.entities.Community.list('-created_date');
      setCommunities(allCommunities || []);
    } catch (err) {
      console.error('Failed to load communities:', err);
      setCommunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      await base44.entities.Community.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pricing_type: formData.pricing_type,
        price: formData.pricing_type === 'paid' ? parseFloat(formData.price) : 0,
        member_count: 0,
        is_trending: false,
        is_verified: false
      });

      setFormData({
        title: "",
        description: "",
        category: "Tech",
        pricing_type: "free",
        price: 0
      });
      setShowCreateModal(false);
      await loadCommunities();
    } catch (err) {
      console.error('Failed to create community:', err);
      alert('Failed to create community');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditCommunity = (community) => {
    setEditingCommunity(community);
    setFormData({
      title: community.title,
      description: community.description,
      category: community.category,
      pricing_type: community.pricing_type,
      price: community.price || 0
    });
    setShowEditModal(true);
  };

  const handleUpdateCommunity = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await base44.entities.Community.update(editingCommunity.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pricing_type: formData.pricing_type,
        price: formData.pricing_type === 'paid' ? parseFloat(formData.price) : 0
      });

      setShowEditModal(false);
      setEditingCommunity(null);
      setFormData({
        title: "",
        description: "",
        category: "Tech",
        pricing_type: "free",
        price: 0
      });

      await loadCommunities();
    } catch (err) {
      console.error('Failed to update community:', err);
      alert('Failed to update community');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCommunity = async (communityId) => {
    if (!confirm("Are you sure you want to delete this community?")) return;

    try {
      await base44.entities.Community.delete(communityId);
      await loadCommunities();
    } catch (err) {
      console.error('Failed to delete community:', err);
      alert('Failed to delete community');
    }
  };

  const categories = [
    { icon: "🎨", name: "All" },
    { icon: "💻", name: "Technology" },
    { icon: "💰", name: "Business" },
    { icon: "📣", name: "Marketing" },
    { icon: "🪙", name: "Crypto" },
    { icon: "🥕", name: "Health" },
    { icon: "📚", name: "Education" },
    { icon: "🎨", name: "Design" },
    { icon: "❓", name: "Other" }
  ];

  const filteredCommunities = communities
    .filter(community => {
      const matchesSearch = community.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || community.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (b.member_count || 0) - (a.member_count || 0));

  const CommunityModal = ({ isEdit = false }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl max-w-2xl w-full"
      >
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit' : 'Create New'} Community</h3>
          <button
            onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={isEdit ? handleUpdateCommunity : handleCreateCommunity} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Community Name *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Kaspa Blockchain Mastery"
              className="bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-600 focus:bg-black focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will members learn and achieve in this community?"
              className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:bg-black focus:border-orange-500 resize-none"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Technology">💻 Technology</option>
                <option value="Business">💰 Business</option>
                <option value="Marketing">📣 Marketing</option>
                <option value="Crypto">🪙 Crypto</option>
                <option value="Health">🥕 Health</option>
                <option value="Education">📚 Education</option>
                <option value="Design">🎨 Design</option>
                <option value="Other">❓ Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Pricing</label>
              <select
                value={formData.pricing_type}
                onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {formData.pricing_type === 'paid' && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Price (USD/month)</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99"
                className="bg-zinc-900/80 border-zinc-700 text-white focus:bg-black focus:border-orange-500"
                min="1"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}
              variant="outline"
              className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                `${isEdit ? 'Update' : 'Create'} Community`
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      <div className="fixed inset-0 z-0 bg-zinc-950" />

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40 relative">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("KaSkool")}>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-zinc-800">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Discover Communities</h1>
                <p className="text-sm text-zinc-400">or create your own</p>
              </div>
            </div>
            {user && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-[73px] z-30 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-4">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <span>{cat.icon}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
        <div className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities..."
            className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Communities List */}
        <div className="space-y-3">
          {filteredCommunities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg">No communities found</p>
              {user && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-orange-500 hover:bg-orange-600"
                >
                  Create the first one
                </Button>
              )}
            </motion.div>
          ) : (
            filteredCommunities.map((community, idx) => {
              const isOwner = user && community.created_by === user.email;
              
              return (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-4xl">
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white mb-1">{community.title}</h3>
                          <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{community.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-zinc-400">
                              <Users className="w-4 h-4" />
                              <span>{(community.member_count || 0).toLocaleString()}</span>
                              <span className="text-zinc-600">Members</span>
                            </div>
                            <span className="text-zinc-600">•</span>
                            {community.pricing_type === "free" ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                                Free
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                                ${community.price}/month
                              </Badge>
                            )}
                            {isOwner && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                                  Owner
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        {isOwner && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditCommunity(community)}
                              size="sm"
                              variant="outline"
                              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteCommunity(community.id)}
                              size="sm"
                              variant="destructive"
                              className="bg-red-500/20 border-red-500/30 hover:bg-red-500/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && <CommunityModal />}
      {showEditModal && <CommunityModal isEdit />}
    </div>
  );
}