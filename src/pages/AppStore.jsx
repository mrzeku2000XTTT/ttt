import React, { useState, useEffect, useRef } from "react";

function CinekasLogoCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const G = '#00f5a0', B = '#00b4ff', W = 'rgba(255,255,255,0.9)';
    let animId;
    function draw(t) {
      ctx.clearRect(0, 0, 120, 120);
      const cx = 60, cy = 60, R = 22;
      for (let i = 0; i < 3; i++) {
        const phase = (t * 0.8 + i / 3) * Math.PI * 2;
        const ox = Math.cos(phase) * 9, oy = Math.sin(phase) * 9;
        const a0 = i * Math.PI * 2 / 3 + t * 0.4;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const a = a0 + k * Math.PI * 2 / 3;
          const px = cx + ox + Math.cos(a) * R, py = cy + oy + Math.sin(a) * R;
          k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        const alpha = 0.6 + 0.25 * Math.sin(t * 1.5 + i);
        ctx.strokeStyle = i === 0 ? G : i === 1 ? B : W;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.13;
        ctx.fillStyle = i === 0 ? G : i === 1 ? B : W;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    function loop(ts) { draw((ts || 0) / 1000); animId = requestAnimationFrame(loop); }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);
  return <canvas ref={canvasRef} width={120} height={120} style={{ width: 64, height: 64 }} />;
}
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, TrendingUp, Crown, Star, Link2, Plus, Edit2, Eye } from "lucide-react";
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
    { name: "Arh'tuun", icon: "Link2", path: "Arhtuun", category: "AI", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a2caf932e_image.png", premium: true },
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
    { name: "Area 51", icon: "Link2", path: "Area51", category: "Community", defaultIcon: "https://ui-avatars.com/api/?name=A51&size=128&background=000000&color=10b981&bold=true" },
    { name: "KASIA", icon: "Link2", path: "KASIA", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2e9ccc018_image.png" },
    { name: "MMN", icon: "Link2", path: "MMN", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2944cc272_image.png", circular: true },
    { name: "Kurve", icon: "Link2", path: "Kurve", category: "Finance", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7be912bf3_image.png" },
    { name: "CoinSpace", icon: "Link2", path: "CoinSpace", category: "Finance", defaultIcon: "https://www.google.com/s2/favicons?domain=coin.space&sz=128" },
    { name: "KaspaHub", icon: "Link2", path: "KaspaHub", category: "Community", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/b3c82bda2_image.png", circular: true },
    { name: "KFlow", icon: "Link2", path: "KFlow", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3a29545d4_image.png", objectFit: "contain" },
    { name: "EXPLORER", icon: "Link2", path: "Explorer", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2b446e5a2_image.png", circular: true },
    { name: "ShiLLz", icon: "Link2", path: "ShiLLz", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/c28359c35_image.png" },
    { name: "KasCompute", icon: "Link2", path: "KasCompute", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1b55211d7_image.png" },
    { name: "Kurncy", icon: "Link2", path: "Kurncy", category: "Finance", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/009f28f08_image.png" },
    { name: "K gigZ", icon: "Link2", path: "KGigZ", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/6ff6d06b2_image.png" },
    { name: "Poki", icon: "Link2", path: "Poki", category: "Games", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cd5bb49da_image.png", circular: true },
    { name: "Ksocial", icon: "Link2", path: "Ksocial", category: "Social", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7eb35a11e_image.png", circular: true },
    { name: "VALORANT", icon: "Link2", path: "Valorant", category: "Games", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0aeac6876_image.png" },
    { name: "KasPlay", icon: "Link2", path: "KasPlay", category: "Games", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/17dc7c8d0_image.png", circular: true },
    { name: "ALPHA", icon: "Link2", path: "ALPHA", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a37146946_image.png" },
    { name: "OuTKasTT", icon: "Link2", path: "OuTKasTT", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3d7232b1d_image.png" },
    { name: "Kasplore", icon: "Link2", path: "Kasplore", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/dbb497c6e_image.png", circular: true },
    { name: "OnChain POS", icon: "Link2", path: "OnChainPOS", category: "Finance", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cf40407bc_image.png" },
    { name: "Vox Invicta", icon: "Link2", path: "VoxInvicta", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/42e7376e4_image.png", circular: true },
    { name: "KaSkool", icon: "Link2", path: "KaSkool", category: "Education", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/403bdf8eb_image.png", circular: true },
    { name: "K-University", icon: "Link2", path: "KUniversity", category: "Education", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/d84e3c738_image.png", circular: true },
    { name: "DGT", icon: "Link2", path: "DGT", category: "Community", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f87dc6ce0_image.png", circular: true },
    { name: "Olivia Apps", icon: "Link2", path: "OliviaApps", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1f4d18802_image.png" },
    { name: "KasLens", icon: "Link2", path: "KasLens", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/5169e3904_images.png", circular: true },
    { name: "Keystone", icon: "Link2", path: "Keystone", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/dc41afffb_image.png" },
    { name: "KaShop", icon: "ShoppingBag", path: "KaShop", category: "Shop", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/00f7c1aac_image.png", circular: true },
    { name: "KC Bridge", icon: "Link2", path: "KCbridge", category: "Finance", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a36a42449_image.png" },
    { name: "Flux Kmail", icon: "Link2", path: "FluxKmail", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0bf1ab743_image.png", circular: true },
    { name: "TTT", icon: "Link2", path: "TTT", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/59c961b71_image.png" },
    { name: "Xùnhuà", icon: "Link2", path: "Xunhua", category: "Creative", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/21e345685_9541BAAA-657B-4CEB-8046-05643663293C.png", circular: true },
    { name: "Terra", icon: "Link2", path: "Terra", category: "Tools", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/46832045f_IMG_1195.jpg" },
    { name: "RufzeitK", icon: "Link2", path: "RufzeitKHome", category: "Communication", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7a9ae8d5f_image.png", circular: true },
    { name: "KivR", icon: "Link2", path: "KivR", category: "Finance", defaultIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a3f7bbc81_IMG_1275.jpg", objectFit: "cover" },
    { name: "SilverScript", icon: "Link2", path: "SilverScript", category: "Dev Tools", defaultIcon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e8d0baae0_IMG_0166.png" },
    { name: "Hwork", icon: "Link2", path: "Hwork", category: "Education", defaultIcon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/98c209fd7_IMG_0173.jpeg" },
    { name: "DAG", icon: "Link2", path: "DAGVisualizer", category: "Tools", defaultIcon: "https://api.iconify.design/mdi/cube-outline.svg?color=%2300d4aa&width=128&height=128", isEmoji: false },
    { name: "Voxa", icon: "Link2", path: "Voxa", category: "Tools", defaultIcon: "https://ui-avatars.com/api/?name=Vx&size=128&background=000000&color=ffffff&bold=true" },
    { name: "Freedom", icon: "Link2", path: "Freedom", category: "AI", defaultIcon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c93b4796d_generated_image.png", circular: false },
    { name: "Prompto", icon: "Link2", path: "Prompto", category: "AI", defaultIcon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png" },
    { name: "CineKas", icon: "Eye", path: "Cinekas", category: "Media", isCinekas: true, adminOnly: true },
    { name: "Speed", icon: "Link2", path: "Speed", category: "Tools", defaultIcon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/078ebbdaf_generated_image.png" },
    { name: "Farlands", icon: "Link2", path: "Farlands", category: "Games", defaultIcon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6399bc2ad_generated_image.png", circular: true },
      ];

  const getIconComponent = (iconName) => {
    const icons = { Link2, Eye };
    return icons[iconName] || Link2;
  };

  const isAdmin = user && user.role === 'admin';
  
  const filteredApps = (searchQuery
    ? apps.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : apps).filter(app => {
      if (app.adminOnly && !isAdmin) return false;
      if (app.name === "KaSkool" && !isAdmin) return false;
      if (app.name === "Arh'tuun" && !isAdmin) return false;
      return true;
    });



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
                    {app.isCinekas ? (
                      <CinekasLogoCanvas />
                    ) : appImages[app.path] ? (
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