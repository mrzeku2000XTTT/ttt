import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, TrendingUp, Crown, Star, Link2, Plus, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ProposeAppModal from "@/components/appstore/ProposeAppModal";
import AdminIconEditor from "@/components/appstore/AdminIconEditor";

export default function AppStorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [appImages, setAppImages] = useState({});
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  useEffect(() => {
    loadUser();
    loadAppImages();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const loadAppImages = async () => {
    try {
      const customizations = await base44.entities.AppIconCustomization.filter({});
      const imagesMap = {};
      customizations.forEach(c => {
        imagesMap[c.app_id] = c.icon_url;
      });
      setAppImages(imagesMap);
    } catch (err) {
      console.error('Failed to load app images:', err);
    }
  };

  const apps = [
    { name: "TapToTip", icon: "Link2", path: "TapToTip", category: "Finance" },
    { name: "BRAHIM", icon: "Link2", path: "BRAHIM", category: "Tools" },
    { name: "AYOMUIZ", icon: "Link2", path: "AYOMUIZ", category: "Games" },
    { name: "Ayomuiz2", icon: "Link2", path: "AYOMUIZ2", category: "Games" },
    { name: "peculiar", icon: "Link2", path: "Peculiar", category: "Tools", badge: 1 },
    { name: "kehinde", icon: "Link2", path: "Kehinde", category: "Tools" },
    { name: "HAYPHASE", icon: "Link2", path: "HAYPHASE", category: "Tools" },
    { name: "VAULT", icon: "Link2", path: "Vault", category: "Finance" },
    { name: "Olatomiwa", icon: "Link2", path: "Olatomiwa", category: "Tools" },
    { name: "Kolade", icon: "Link2", path: "Kolade", category: "Tools" },
    { name: "KASDATE", icon: "Link2", path: "Kasdate", category: "Social" },
    { name: "MODZ", icon: "Link2", path: "MODZHub", category: "Tools" },
  ];

  const getIconComponent = (iconName) => {
    const icons = { Link2 };
    return icons[iconName] || Link2;
  };

  const filteredApps = searchQuery
    ? apps.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : apps;

  const handleIconSave = (appPath, iconUrl) => {
    setAppImages(prev => ({ ...prev, [appPath]: iconUrl }));
  };

  return (
    <div className="min-h-screen relative bg-slate-950">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/33eac8767_image.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-black text-white mb-2">TTT App Store</h1>
            <p className="text-white/60">Discover amazing apps</p>
          </div>
          {user && (
            <Button
              onClick={() => setShowProposeModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Propose App
            </Button>
          )}
        </motion.div>

        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps..."
            className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {filteredApps.map((app, i) => {
            const Icon = getIconComponent(app.icon);
            const isAdmin = user && user.role === 'admin';
            return (
              <div key={i} className="relative">
                <Link to={createPageUrl(app.path)}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="relative w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-all">
                      {app.premium && (
                        <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                      )}
                      {appImages[app.path] ? (
                        <img src={appImages[app.path]} alt={app.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Icon className="w-8 h-8 text-white/80" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold text-xs mb-0.5">{app.name}</div>
                      <div className="text-white/40 text-[10px]">{app.category}</div>
                    </div>
                  </motion.div>
                </Link>
                
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingApp(app);
                    }}
                    className="absolute top-0 right-0 w-6 h-6 bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/40 rounded-full flex items-center justify-center hover:bg-cyan-500/30 transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-cyan-400" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg">No apps found</p>
          </div>
        )}
      </div>

      {showProposeModal && user && (
        <ProposeAppModal onClose={() => setShowProposeModal(false)} user={user} />
      )}
      
      {editingApp && (
        <AdminIconEditor
          app={editingApp}
          currentIcon={appImages[editingApp.path]}
          onClose={() => setEditingApp(null)}
          onSave={(iconUrl) => handleIconSave(editingApp.path, iconUrl)}
        />
      )}
    </div>
  );
}