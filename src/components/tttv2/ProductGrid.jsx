import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const PRODUCTS = [
  {
    name: "Kaspa.org",
    desc: "Official Kaspa project — blockDAG protocol",
    url: "https://kaspa.org",
    color: "from-cyan-500 to-teal-500",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png"
  },
  {
    name: "KaspAI",
    desc: "AI-powered Kaspa analytics",
    url: "https://kasp.ai",
    color: "from-violet-500 to-purple-600",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d6f99bc5e_generated_image.png"
  },
  {
    name: "Kasplex",
    desc: "KRC-20 token standard & explorer",
    url: "https://kasplex.org",
    color: "from-amber-500 to-orange-500",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png"
  },
  {
    name: "KSPR Bot",
    desc: "KRC-20 minting & trading bot",
    url: "https://t.me/ksaborbot",
    color: "from-pink-500 to-rose-500",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/04565f09d_generated_image.png"
  },
  {
    name: "Kas.fyi",
    desc: "Kaspa blockchain explorer & stats",
    url: "https://kas.fyi",
    color: "from-emerald-500 to-teal-500",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c45793efd_generated_image.png"
  },
  {
    name: "KasWare",
    desc: "Browser wallet for Kaspa L1",
    url: "https://kasware.xyz",
    color: "from-blue-500 to-indigo-500",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2ea9d0166_generated_image.png"
  },
  {
    name: "Kaspa Hub",
    desc: "Community hub & ecosystem directory",
    url: "https://kaspahub.org",
    color: "from-zinc-600 to-zinc-800",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4b0087a11_generated_image.png"
  },
  {
    name: "Tangem × Kaspa",
    desc: "Hardware wallet for KAS",
    url: "https://tangem.com",
    color: "from-yellow-500 to-amber-500",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png"
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