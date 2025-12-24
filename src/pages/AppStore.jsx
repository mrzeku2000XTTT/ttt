import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, TrendingUp, Crown, Star, Link2, Plus, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ProposeAppModal from "@/components/appstore/ProposeAppModal";

export default function AppStorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [appImages, setAppImages] = useState({});
  const [showProposeModal, setShowProposeModal] = useState(false);

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
    { name: "SIMPLE", icon: "Link2", path: "SIMPLE", category: "Tools", defaultIcon: "😊", isEmoji: true },
    { name: "K Learning Hub", icon: "Link2", path: "Learning", category: "Education", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0f7f76839_image.png", circular: true },
    { name: "BMT Univ", icon: "Link2", path: "BMTUniv", category: "Education", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/ab3b7f637_image.png", circular: true },
    { name: "TapToTip", icon: "Link2", path: "TapToTip", category: "Finance", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/416c87773_image.png" },
    { name: "BRAHIM", icon: "Link2", path: "BRAHIMHub", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/88322e438_image.png" },
    { name: "AYOMUIZ", icon: "Link2", path: "AYOMUIZHub", category: "Games", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/120ea91b8_image.png" },
    { name: "peculiar", icon: "Link2", path: "Peculiar", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/593d9f9eb_image.png" },
    { name: "kehinde", icon: "Link2", path: "Kehinde", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a031dc009_image.png" },
    { name: "HAYPHASE", icon: "Link2", path: "HAYPHASE", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/abc403941_image.png" },
    { name: "VAULT", icon: "Link2", path: "Vault", category: "Finance" },
    { name: "Olatomiwa", icon: "Link2", path: "OlatomiwaHub", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/9a93c0d01_image.png" },
    { name: "Kolade", icon: "Link2", path: "Kolade", category: "Tools" },
    { name: "MODZ", icon: "Link2", path: "MODZHub", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/e4ca8d329_image.png" },
    { name: "KFANS", icon: "Link2", path: "KasFans", category: "Community", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/85ce776d9_image.png" },
    { name: "Duel", icon: "Link2", path: "DuelLobby", category: "Games", defaultIcon: "https://ui-avatars.com/api/?name=Duel&size=128&background=ef4444&color=fff&bold=true" },
    { name: "Area 51", icon: "Link2", path: "Area51", category: "Community", defaultIcon: "https://ui-avatars.com/api/?name=👽+A51&size=128&background=000000&color=10b981&bold=true&font-size=0.28" },
    { name: "KASIA", icon: "Link2", path: "KASIA", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2e9ccc018_image.png" },
    { name: "MMN", icon: "Link2", path: "MMN", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2944cc272_image.png", circular: true },
    { name: "Kurve", icon: "Link2", path: "Kurve", category: "Finance", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7be912bf3_image.png" },
    { name: "CoinSpace", icon: "Link2", path: "CoinSpace", category: "Finance", defaultIcon: "https://www.google.com/s2/favicons?domain=coin.space&sz=128" },
    { name: "KaspaHub", icon: "Link2", path: "KaspaHub", category: "Community", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/b3c82bda2_image.png", circular: true },
    { name: "KFlow", icon: "Link2", path: "KFlow", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3a29545d4_image.png", objectFit: "contain" },
    { name: "EXPLORER", icon: "Link2", path: "Explorer", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2b446e5a2_image.png", circular: true },
    { name: "ShiLLz", icon: "Link2", path: "ShiLLz", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/c28359c35_image.png" },
    { name: "KasCompute", icon: "Link2", path: "KasCompute", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1b55211d7_image.png" },
    { name: "Kurncy", icon: "Link2", path: "Kurncy", category: "Finance", defaultIcon: "https://ui-avatars.com/api/?name=K&size=128&background=06b6d4&color=fff&bold=true" },
    { name: "K gigZ", icon: "Link2", path: "https://kgigz.base44.app", category: "Tools", defaultIcon: "https://ui-avatars.com/api/?name=KG&size=128&background=8b5cf6&color=fff&bold=true", isExternal: true },
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



  return (
    <div className="min-h-screen relative bg-black">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=2000&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.4
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-black text-white mb-2">K - Apps Store</h1>
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
            const linkProps = app.isExternal 
              ? { href: app.path, target: "_blank", rel: "noopener noreferrer" }
              : { to: createPageUrl(app.path) };
            const LinkComponent = app.isExternal ? 'a' : Link;
            
            return (
              <LinkComponent key={i} {...linkProps}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`relative w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 ${app.circular ? 'rounded-full' : 'rounded-xl'} flex items-center justify-center group-hover:bg-white/10 transition-all`}>
                    {app.premium && (
                      <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                    )}
                    {appImages[app.path] ? (
                      <img src={appImages[app.path]} alt={app.name} className={`w-full h-full ${app.objectFit || 'object-cover'} ${app.circular ? 'rounded-full' : 'rounded-xl'}`} />
                    ) : app.isEmoji ? (
                      <span className="text-3xl">{app.defaultIcon}</span>
                    ) : app.defaultIcon ? (
                      <img src={app.defaultIcon} alt={app.name} className={`w-full h-full ${app.objectFit || 'object-cover'} ${app.circular ? 'rounded-full' : 'rounded-xl'}`} />
                    ) : (
                      <Icon className="w-8 h-8 text-white/80" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold text-xs mb-0.5">{app.name}</div>
                    <div className="text-white/40 text-[10px]">{app.category}</div>
                  </div>
                </motion.div>
              </LinkComponent>
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
    </div>
  );
}