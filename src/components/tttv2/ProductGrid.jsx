import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const PRODUCTS = [
  {
    name: "Kaspa.org",
    desc: "Official Kaspa project — blockDAG protocol",
    url: "https://kaspa.org",
    color: "from-cyan-500 to-teal-500",
    logo: "https://cryptologos.cc/logos/kaspa-kas-logo.png?v=041"
  },
  {
    name: "KaspAI",
    desc: "AI-powered Kaspa analytics",
    url: "https://kasp.ai",
    color: "from-violet-500 to-purple-600",
    logo: "https://pbs.twimg.com/profile_images/1825985565697167360/LJjUp5PY_400x400.jpg"
  },
  {
    name: "Kasplex",
    desc: "KRC-20 token standard & explorer",
    url: "https://kasplex.org",
    color: "from-amber-500 to-orange-500",
    logo: "https://kasplex.org/assets/png/LOGO1-1-DV2KMDbu.png"
  },
  {
    name: "KSPR Bot",
    desc: "KRC-20 minting & trading bot",
    url: "https://t.me/kspr_home_bot",
    color: "from-pink-500 to-rose-500",
    logo: "https://pbs.twimg.com/profile_images/1719654688747167744/rIb_jn2c_400x400.jpg"
  },
  {
    name: "Kas.fyi",
    desc: "Kaspa blockchain explorer & stats",
    url: "https://kas.fyi",
    color: "from-emerald-500 to-teal-500",
    logo: "https://pbs.twimg.com/profile_images/1658547689494286337/wBwyas0P_400x400.jpg"
  },
  {
    name: "KasWare",
    desc: "Browser wallet for Kaspa L1",
    url: "https://kasware.xyz",
    color: "from-blue-500 to-indigo-500",
    logo: "https://www.kasware.xyz/static/media/home-main.6b611fab36e5a2e49994.png"
  },
  {
    name: "Kaspa Hub",
    desc: "Community hub & ecosystem directory",
    url: "https://kaspahub.org",
    color: "from-zinc-600 to-zinc-800",
    logo: "https://pbs.twimg.com/profile_images/1822717712076460032/a8UMhB8z_400x400.jpg"
  },
  {
    name: "Tangem × Kaspa",
    desc: "Hardware wallet for KAS",
    url: "https://tangem.com/en/wallet-for/kaspa/",
    color: "from-yellow-500 to-amber-500",
    logo: "https://pbs.twimg.com/profile_images/1795478474100805632/fy0c6gym_400x400.jpg"
  },
];

export default function ProductGrid() {
  return (
    <section id="products" className="py-20 sm:py-28 px-5">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Kaspa Ecosystem</p>
          <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Explore the community.</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {PRODUCTS.map((p, i) => {
            const Wrapper = p.path ? Link : "a";
            const wrapperProps = p.path
              ? { to: p.path }
              : { href: p.url, target: "_blank", rel: "noopener noreferrer" };
            return (
              <Wrapper key={p.name} {...wrapperProps}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="group bg-white rounded-2xl p-5 sm:p-6 ring-1 ring-zinc-200/60 hover:ring-zinc-300 hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-500 cursor-pointer h-full"
                >
                  <div className="w-12 h-12 rounded-[14px] mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                    <img src={p.logo} alt={p.name} className="w-full h-full object-cover rounded-[14px]" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-0.5">{p.name}</h3>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">{p.desc}</p>
                </motion.div>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}