import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Star, Clock, TrendingUp, Plus, User, Briefcase, Code, Palette, Video, PenTool, Music, BarChart3, Brain, ChevronDown, MapPin, DollarSign, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ServiceCard from "@/components/jobs/ServiceCard";
import CreateServiceModal from "@/components/jobs/CreateServiceModal";

export default function JobsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("jobs"); // "jobs" or "services"

  const categories = [
    { name: "All", icon: Briefcase },
    { name: "Graphics & Design", icon: Palette },
    { name: "Programming & Tech", icon: Code },
    { name: "Digital Marketing", icon: TrendingUp },
    { name: "Video & Animation", icon: Video },
    { name: "Writing & Translation", icon: PenTool },
    { name: "Music & Audio", icon: Music },
    { name: "Business", icon: BarChart3 },
    { name: "AI Services", icon: Brain }
  ];

  useEffect(() => {
    loadUser();
    loadServices();
    loadJobs();
  }, [selectedCategory, sortBy]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      let query = { is_active: true };
      if (selectedCategory !== "All") {
        query.category = selectedCategory;
      }

      const sortField = sortBy === "popular" ? "-orders_completed" : sortBy === "rating" ? "-rating" : "-created_date";
      const listings = await base44.entities.ServiceListing.filter(query, sortField, 50);
      setServices(listings);
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const jobListings = await base44.entities.HRJobListing.filter({ status: 'active' }, '-created_date', 100);
      setJobs(jobListings);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  };

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Glassmorphism */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
              Find the perfect
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text">
                {activeTab === "jobs" ? "job opportunity" : "freelance services"}
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Powered by Agent ZK - {activeTab === "jobs" ? "Career opportunities from verified companies" : "Verified professionals for your business"}
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex gap-2">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-white/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for any service..."
                    className="bg-transparent border-none text-white placeholder-white/40 focus-visible:ring-0"
                  />
                </div>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8">
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`group relative px-6 py-3 rounded-xl transition-all ${
                    selectedCategory === cat.name
                      ? "bg-white/10 backdrop-blur-xl border border-white/30"
                      : "bg-black/20 backdrop-blur-xl border border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${selectedCategory === cat.name ? "text-cyan-400" : "text-white/60 group-hover:text-white"}`} />
                    <span className={`text-sm font-medium ${selectedCategory === cat.name ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                      {cat.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "jobs"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <Briefcase className="w-4 h-4 inline mr-2" />
            Job Openings ({filteredJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "services"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <Star className="w-4 h-4 inline mr-2" />
            Freelance Services ({filteredServices.length})
          </button>
        </div>

        {/* Filters & Sort Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white/60 hover:text-white hover:border-white/30 transition-all"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>
            
            <div className="text-white/40 text-sm">
              {activeTab === "jobs" ? `${filteredJobs.length} jobs available` : `${filteredServices.length} services available`}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Service
              </Button>
            )}

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-2 pr-10 text-white/80 text-sm hover:border-white/30 focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
              <ChevronDown className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : activeTab === "jobs" ? (
          filteredJobs.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white/60 mb-2">No jobs found</h3>
              <p className="text-white/40">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-purple-400 transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {job.department}
                          </Badge>
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            {job.employment_type?.replace('_', ' ')}
                          </Badge>
                          {job.is_remote && (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Remote</Badge>
                          )}
                        </div>
                      </div>
                      <Building2 className="w-8 h-8 text-purple-400/50" />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        ${job.salary_range_min?.toLocaleString()} - ${job.salary_range_max?.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User className="w-4 h-4" />
                        {job.posted_by_username}
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {job.skills.slice(0, 3).map((skill, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-black/40 border border-white/10 rounded text-gray-400">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="text-xs px-2 py-1 text-gray-500">+{job.skills.length - 3}</span>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        if (job.posted_by_wallet) {
                          navigate(createPageUrl('AgentZKChat') + `?targetAddress=${encodeURIComponent(job.posted_by_wallet)}&targetName=${encodeURIComponent(job.posted_by_username || 'Employer')}`);
                        } else {
                          alert('Employer contact not available');
                        }
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Apply Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          filteredServices.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white/60 mb-2">No services found</h3>
              <p className="text-white/40">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Create Service Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateServiceModal
            user={user}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadServices();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}