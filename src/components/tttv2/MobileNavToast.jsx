import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X, Compass, ShoppingBag, Tv, Users, Newspaper, Map, BookOpen } from "lucide-react";

const NAV_ITEMS = [
  { label: "Explore", path: "/Explore", icon: Compass },
  { label: "Products", anchor: "#products", icon: ShoppingBag },
  { label: "Kaspa", path: "/WhatIsKaspa", icon: BookOpen },
  { label: "TTTV", anchor: "#tttv", icon: Tv },
  { label: "Community", anchor: "#community", icon: Users },
  { label: "What's New", anchor: "#news", icon: Newspaper },
  { label: "Roadmap", anchor: "#roadmap", icon: Map },
];

export default function MobileNavToast() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden fixed bottom-6 right-4 z-[60]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="absolute bottom-14 right-0 bg-white rounded-2xl shadow-2xl shadow-black/20 ring-1 ring-zinc-200 p-2 w-48"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              if (item.path) {
                return (
                  <Link key={item.label} to={item.path} onClick={() => setOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 transition-colors">
                      <Icon className="w-4 h-4 text-zinc-400" />
                      <span className="text-[13px] font-medium text-zinc-700">{item.label}</span>
                    </div>
                  </Link>
                );
              }
              return (
                <a key={item.label} href={item.anchor} onClick={() => setOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 transition-colors">
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <span className="text-[13px] font-medium text-zinc-700">{item.label}</span>
                  </div>
                </a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="w-12 h-12 bg-black text-white rounded-full shadow-lg shadow-black/30 flex items-center justify-center"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </motion.button>
    </div>
  );
}