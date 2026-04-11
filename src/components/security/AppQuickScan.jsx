import React, { useState } from "react";
import { Shield, Search, Zap } from "lucide-react";
import { motion } from "framer-motion";

const APP_LIST = [
  { name: "Arh'tuun", path: "Arhtuun", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a2caf932e_image.png" },
  { name: "TapToTip", path: "TapToTip", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/416c87773_image.png" },
  { name: "BRAHIM", path: "BRAHIMHub", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/88322e438_image.png" },
  { name: "AYOMUIZ", path: "AYOMUIZHub", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/120ea91b8_image.png" },
  { name: "peculiar", path: "Peculiar", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/593d9f9eb_image.png" },
  { name: "kehinde", path: "Kehinde", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a031dc009_image.png" },
  { name: "HAYPHASE", path: "HAYPHASE", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/abc403941_image.png" },
  { name: "Olatomiwa", path: "OlatomiwaHub", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/9a93c0d01_image.png" },
  { name: "MODZ", path: "MODZHub", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/e4ca8d329_image.png" },
  { name: "KFANS", path: "KasFans", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/85ce776d9_image.png" },
  { name: "KASIA", path: "KASIA", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2e9ccc018_image.png" },
  { name: "MMN", path: "MMN", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2944cc272_image.png", round: true },
  { name: "Kurve", path: "Kurve", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7be912bf3_image.png" },
  { name: "KaspaHub", path: "KaspaHub", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/b3c82bda2_image.png", round: true },
  { name: "KFlow", path: "KFlow", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3a29545d4_image.png" },
  { name: "EXPLORER", path: "Explorer", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2b446e5a2_image.png", round: true },
  { name: "ShiLLz", path: "ShiLLz", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/c28359c35_image.png" },
  { name: "KasCompute", path: "KasCompute", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1b55211d7_image.png" },
  { name: "Kurncy", path: "Kurncy", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/009f28f08_image.png" },
  { name: "K gigZ", path: "KGigZ", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/6ff6d06b2_image.png" },
  { name: "Poki", path: "Poki", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cd5bb49da_image.png", round: true },
  { name: "Ksocial", path: "Ksocial", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7eb35a11e_image.png", round: true },
  { name: "VALORANT", path: "Valorant", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0aeac6876_image.png" },
  { name: "KasPlay", path: "KasPlay", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/17dc7c8d0_image.png", round: true },
  { name: "ALPHA", path: "ALPHA", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a37146946_image.png" },
  { name: "OuTKasTT", path: "OuTKasTT", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3d7232b1d_image.png" },
  { name: "Kasplore", path: "Kasplore", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/dbb497c6e_image.png", round: true },
  { name: "OnChain POS", path: "OnChainPOS", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cf40407bc_image.png" },
  { name: "Vox Invicta", path: "VoxInvicta", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/42e7376e4_image.png", round: true },
  { name: "KaSkool", path: "KaSkool", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/403bdf8eb_image.png", round: true },
  { name: "K-University", path: "KUniversity", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/d84e3c738_image.png", round: true },
  { name: "DGT", path: "DGT", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f87dc6ce0_image.png", round: true },
  { name: "Olivia Apps", path: "OliviaApps", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1f4d18802_image.png" },
  { name: "KasLens", path: "KasLens", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/5169e3904_images.png", round: true },
  { name: "Keystone", path: "Keystone", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/dc41afffb_image.png" },
  { name: "KaShop", path: "KaShop", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/00f7c1aac_image.png", round: true },
  { name: "KC Bridge", path: "KCbridge", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a36a42449_image.png" },
  { name: "Flux Kmail", path: "FluxKmail", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0bf1ab743_image.png", round: true },
  { name: "TTT", path: "TTT", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/59c961b71_image.png" },
  { name: "Xùnhuà", path: "Xunhua", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/21e345685_9541BAAA-657B-4CEB-8046-05643663293C.png", round: true },
  { name: "Terra", path: "Terra", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/46832045f_IMG_1195.jpg" },
  { name: "RufzeitK", path: "RufzeitKHome", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7a9ae8d5f_image.png", round: true },
  { name: "KivR", path: "KivR", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a3f7bbc81_IMG_1275.jpg" },
  { name: "SilverScript", path: "SilverScript", icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e8d0baae0_IMG_0166.png" },
  { name: "Freedom", path: "Freedom", icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c93b4796d_generated_image.png" },
  { name: "Prompto", path: "Prompto", icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png" },
  { name: "Speed", path: "Speed", icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/078ebbdaf_generated_image.png" },
  { name: "Farlands", path: "Farlands", icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/869680b72_IMG_0177.jpeg", round: true },
  { name: "Velour", path: "V1", icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/585acf464_generated_image.png", round: true },
  { name: "Klock", path: "Klock", icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3a8b4c791_generated_image.png" },
  { name: "KaChing", path: "StakeDAG", icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2c211776c_generated_image.png" },
  { name: "K Learning", path: "Learning", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0f7f76839_image.png", round: true },
  { name: "BMT Univ", path: "BMTUniv", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/ab3b7f637_image.png", round: true },
  { name: "Hwork", path: "Hwork", icon: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/98c209fd7_IMG_0173.jpeg" },
  { name: "CoinSpace", path: "CoinSpace", icon: "https://www.google.com/s2/favicons?domain=coin.space&sz=128" },
];

export default function AppQuickScan({ onScanApp }) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? APP_LIST.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    : APP_LIST;

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-sm">Quick Scan — TTT Ecosystem</h2>
          <p className="text-white/30 text-[11px]">Tap any app to run a full security audit</p>
        </div>
      </div>

      {/* Mini search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter apps..."
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-white/80 placeholder-white/20 text-xs focus:outline-none focus:border-cyan-500/30"
        />
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {filtered.map((app, i) => (
          <motion.button
            key={app.path}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.02, 0.4) }}
            whileHover={{ scale: 1.08, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onScanApp(app)}
            className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/30 hover:bg-cyan-500/[0.04] transition-all duration-300 relative overflow-hidden"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* App Icon */}
            <div className={`relative w-12 h-12 ${app.round ? 'rounded-full' : 'rounded-xl'} overflow-hidden bg-white/5 border border-white/10 group-hover:border-cyan-500/30 transition-all shadow-lg group-hover:shadow-cyan-500/10`}>
              <img
                src={app.icon}
                alt={app.name}
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none'; }}
              />
              {/* Scan overlay on hover */}
              <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-300" />
              </div>
            </div>
            
            {/* App Name */}
            <span className="text-white/50 text-[10px] font-medium text-center leading-tight group-hover:text-white/80 transition-colors line-clamp-2 relative z-10">
              {app.name}
            </span>
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/20 text-xs">No apps match "{search}"</p>
        </div>
      )}
    </div>
  );
}