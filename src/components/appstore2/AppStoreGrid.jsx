import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";

const APPS = [
  // ── Featured / Core ──
  { name: "Feed", path: "Feed", cat: "Community", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png", desc: "Social feed + KAS tips" },
  { name: "Agent ZK", path: "AgentZK", cat: "AI", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png", desc: "Crypto identity", premium: true },
  { name: "TTTV", path: "Browser", cat: "Media", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/04565f09d_generated_image.png", desc: "Ad-free video browser" },
  { name: "Bridge", path: "Bridge", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c45793efd_generated_image.png", desc: "Send KAS cross-layer" },
  { name: "StakeDAG", path: "StakeDAG", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png", desc: "Prediction markets", admin: true },
  { name: "DAGKnight", path: "DAGKnightWallet", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2ea9d0166_generated_image.png", desc: "Advanced wallet", premium: true },
  { name: "Hikaru", path: "Hikaru", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ede6944ce_generated_image.png", desc: "AI image studio" },
  { name: "Zeku AI", path: "ZekuAI", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d6f99bc5e_generated_image.png", desc: "Premium AI assistant", premium: true },
  { name: "Xùnhuà", path: "Xunhua", cat: "Creative", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/21e345685_9541BAAA-657B-4CEB-8046-05643663293C.png", desc: "AI sketch to image" },
  { name: "Terra", path: "Terra", cat: "Finance", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/46832045f_IMG_1195.jpg", desc: "Kaspa wallet manager" },

  // ── Finance ──
  { name: "TapToTip", path: "TapToTip", cat: "Finance", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/416c87773_image.png", desc: "Quick KAS tipping" },
  { name: "Kurve", path: "Kurve", cat: "Finance", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7be912bf3_image.png", desc: "Kaspa charts" },
  { name: "CoinSpace", path: "CoinSpace", cat: "Finance", logo: "https://www.google.com/s2/favicons?domain=coin.space&sz=128", desc: "Wallet app" },
  { name: "OnChain POS", path: "OnChainPOS", cat: "Finance", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cf40407bc_image.png", desc: "Point of sale" },
  { name: "KC Bridge", path: "KCbridge", cat: "Finance", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a36a42449_image.png", desc: "Cross-chain bridge" },
  { name: "Kurncy", path: "Kurncy", cat: "Finance", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/009f28f08_image.png", desc: "Currency exchange" },
  { name: "KivR", path: "KivR", cat: "Finance", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a3f7bbc81_IMG_1275.jpg", desc: "IVR + KAS payments" },
  { name: "VAULT", path: "Vault", cat: "Finance", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/08768f52c_generated_image.png", desc: "Secure vault" },

  // ── AI ──
  { name: "Freedom", path: "Freedom", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c93b4796d_generated_image.png", desc: "Privacy AI tools" },
  { name: "Prompto", path: "Prompto", cat: "AI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png", desc: "Prompt engineering" },
  { name: "Arh'tuun", path: "Arhtuun", cat: "AI", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a2caf932e_image.png", desc: "Continuity anchors", premium: true, admin: true },

  // ── Games ──
  { name: "VALORANT", path: "ValorantArena", cat: "Games", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0aeac6876_image.png", desc: "Arena mode" },
  { name: "KasPlay", path: "KasPlay", cat: "Games", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/17dc7c8d0_image.png", desc: "Kaspa games" },
  { name: "Poki", path: "Poki", cat: "Games", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cd5bb49da_image.png", desc: "Mini games" },
  { name: "Duel", path: "DuelLobby", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/779ea9300_generated_image.png", desc: "1v1 duels" },
  { name: "AYOMUIZ", path: "AYOMUIZHub", cat: "Games", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/120ea91b8_image.png", desc: "Game hub" },
  { name: "Farlands", path: "Farlands", cat: "Games", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/869680b72_IMG_0177.jpeg", desc: "Exploration game" },

  // ── Tools ──
  { name: "KASIA", path: "KASIA", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2e9ccc018_image.png", desc: "Kaspa toolbox" },
  { name: "KFlow", path: "KFlow", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3a29545d4_image.png", desc: "Workflow builder" },
  { name: "EXPLORER", path: "Explorer", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2b446e5a2_image.png", desc: "Block explorer" },
  { name: "KasCompute", path: "KasCompute", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1b55211d7_image.png", desc: "Compute tasks" },
  { name: "K GigZ", path: "KGigZ", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/6ff6d06b2_image.png", desc: "Gig marketplace" },
  { name: "BRAHIM", path: "BRAHIMHub", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/88322e438_image.png", desc: "Tools hub" },
  { name: "Peculiar", path: "Peculiar", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/593d9f9eb_image.png", desc: "Unique tools" },
  { name: "Kehinde", path: "Kehinde", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a031dc009_image.png", desc: "Utilities" },
  { name: "HAYPHASE", path: "HAYPHASE", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/abc403941_image.png", desc: "Phase tools" },
  { name: "Olatomiwa", path: "OlatomiwaHub", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/9a93c0d01_image.png", desc: "Hub app" },
  { name: "Kolade", path: "Kolade", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3003a579e_generated_image.png", desc: "Tools" },
  { name: "MODZ", path: "MODZHub", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/e4ca8d329_image.png", desc: "Mods hub" },
  { name: "Olivia Apps", path: "OliviaApps", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1f4d18802_image.png", desc: "App collection" },
  { name: "Keystone", path: "Keystone", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/dc41afffb_image.png", desc: "Hardware wallet" },
  { name: "Klock", path: "Klock", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3a8b4c791_generated_image.png", desc: "Clock / timer" },
  { name: "Speed", path: "Speed", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/078ebbdaf_generated_image.png", desc: "Quick image gen" },
  { name: "DAG", path: "DAGVisualizer", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4a4455642_generated_image.png", desc: "DAG visualizer" },
  { name: "Voxa", path: "Voxa", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bab833b9c_generated_image.png", desc: "Voice tools" },
  { name: "ShiLLz", path: "ShiLLz", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/c28359c35_image.png", desc: "Shill manager" },
  { name: "OuTKasTT", path: "OuTKasTT", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3d7232b1d_image.png", desc: "Kaspa tools" },
  { name: "Kasplore", path: "Kasplore", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/dbb497c6e_image.png", desc: "Explorer" },
  { name: "ALPHA", path: "ALPHA", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a37146946_image.png", desc: "Alpha tools" },
  { name: "TTT", path: "TTT", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/59c961b71_image.png", desc: "Classic TTT" },
  { name: "SIMPLE", path: "SIMPLE", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/138abbca3_generated_image.png", desc: "Simple tools" },
  { name: "KasLens", path: "KasLens", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/5169e3904_images.png", desc: "Data lens" },
  { name: "Vox Invicta", path: "VoxInvicta", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/42e7376e4_image.png", desc: "Voice platform" },
  { name: "MMN", path: "MMN", cat: "Tools", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/2944cc272_image.png", desc: "Network" },

  // ── Creative ──
  { name: "Canvas", path: "Canvas", cat: "Creative", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b26fd671d_generated_image.png", desc: "Template studio" },

  // ── Education ──
  { name: "K Learning", path: "Learning", cat: "Education", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0f7f76839_image.png", desc: "Learning hub" },
  { name: "BMT Univ", path: "BMTUniv", cat: "Education", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/ab3b7f637_image.png", desc: "University" },
  { name: "K-University", path: "KUniversity", cat: "Education", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/d84e3c738_image.png", desc: "Kaspa education" },
  { name: "KaSkool", path: "KaSkool", cat: "Education", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/403bdf8eb_image.png", desc: "Learn Kaspa", admin: true },
  { name: "Hwork", path: "Hwork", cat: "Education", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/98c209fd7_IMG_0173.jpeg", desc: "Homework helper" },

  // ── Community ──
  { name: "KFANS", path: "KasFans", cat: "Community", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/85ce776d9_image.png", desc: "Fan community" },
  { name: "Area 51", path: "Area51", cat: "Community", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/63bd53d0e_generated_image.png", desc: "Experimental zone" },
  { name: "KaspaHub", path: "KaspaHub", cat: "Community", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/b3c82bda2_image.png", desc: "Community hub" },
  { name: "DGT", path: "DGT", cat: "Community", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f87dc6ce0_image.png", desc: "Digital governance" },

  // ── Social ──
  { name: "Ksocial", path: "Ksocial", cat: "Social", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7eb35a11e_image.png", desc: "Social network" },

  // ── Media ──
  { name: "CineKas", path: "Cinekas", cat: "Media", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e33356a93_generated_image.png", desc: "Movie browser", admin: true },

  // ── Communication ──
  { name: "RufzeitK", path: "RufzeitKHome", cat: "Communication", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7a9ae8d5f_image.png", desc: "Call system" },
  { name: "Flux Kmail", path: "FluxKmail", cat: "Communication", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0bf1ab743_image.png", desc: "Encrypted email" },

  // ── Dev Tools ──
  { name: "SilverScript", path: "SilverScript", cat: "Dev Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e8d0baae0_IMG_0166.png", desc: "Smart contracts" },

  // ── Shop ──
  { name: "KaShop", path: "KaShop", cat: "Shop", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/00f7c1aac_image.png", desc: "Buy with KAS" },
  { name: "Velour", path: "V1", cat: "Shop", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/585acf464_generated_image.png", desc: "Merchandise" },

  // ── Security ──
  { name: "Security Audit", path: "SecurityAudit", cat: "Security", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/81791a703_generated_image.png", desc: "Audit your app" },

  // ── New ──
  { name: "Krust", path: "Krust", cat: "Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f58b46dd1_image.png", desc: "Web weaver" },
  { name: "OneShot", path: "UICloner", cat: "Dev Tools", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ee7187675_generated_image.png", desc: "Clone & vibe-code any UI", admin: true },
];

function AppIcon({ app }) {
  if (app.logo) {
    return (
      <img
        src={app.logo}
        alt={app.name}
        className="w-full h-full object-cover rounded-2xl"
        loading="lazy"
      />
    );
  }
  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center">
      <span className="text-xl font-[900] text-zinc-500">{app.name[0]}</span>
    </div>
  );
}

export default function AppStoreGrid({ search, category, isAdmin }) {
  const filtered = APPS.filter((app) => {
    if (app.admin && !isAdmin) return false;
    if (category !== "All" && app.cat !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return app.name.toLowerCase().includes(q) || app.cat.toLowerCase().includes(q) || app.desc.toLowerCase().includes(q);
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-400 text-sm">
        No apps found.
      </div>
    );
  }

  return (
    <div>
      {category === "All" && !search && (
        <h2 className="text-lg font-[800] mb-4">All Apps</h2>
      )}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-5">
        {filtered.map((app, i) => (
          <Link key={app.name + app.path} to={createPageUrl(app.path)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="relative w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                <AppIcon app={app} />
                {app.premium && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                    <Crown className="w-2.5 h-2.5 text-yellow-900" />
                  </div>
                )}
              </div>
              <div className="text-center max-w-[72px]">
                <p className="text-[11px] font-semibold text-zinc-800 truncate leading-tight">{app.name}</p>
                <p className="text-[9px] text-zinc-400 truncate">{app.desc}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}