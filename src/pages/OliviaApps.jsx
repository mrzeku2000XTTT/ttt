import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  Eye,
  Play,
  Share2,
  Search,
  X,
  LayoutGrid
} from "lucide-react";

export default function OliviaAppsPage() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
      setUser(null);
    }
  };

  const bridgeMindApps = [
    { id: "oracle", name: "Oracle", icon: Eye, path: "Oracle", description: "Seek wisdom and insights" },
    { id: "truman", name: "Truman", icon: Play, path: "Truman", description: "Watch and learn" },
    { id: "shill", name: "Shill", icon: Share2, path: "Shill", description: "Your link-in-bio page" },
    { id: "optiqcode", name: "OptiqCode", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/e603efa8b_image.png", path: "https://optiqcode.com", description: "Visual Code Identity", isExternal: true, blackBackground: true },
    { id: "digidripbot", name: "DigiDripBot", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e5403251_image.png", path: "https://t.me/ser_minning_bot", description: "Mining Bot", isExternal: true, blackBackground: true },
    { id: "kasmi", name: "Kasmi", icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/ae03059d0_image.png", path: "Kasmi", description: "Kasmi App", blackBackground: true },
    ];

  const filteredApps = bridgeMindApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-black" />
      
      <div className="relative z-10 h-screen w-full flex flex-col px-3 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Categories")}>
            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1f4d18802_image.png" 
              alt="OLIVIA APPS Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-black text-white/90 tracking-tight leading-none uppercase">
                OLIVIA APPS
              </h1>
              <p className="text-xs text-white/50 font-medium">Community Apps & Tools</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto md:mx-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="w-full h-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="flex-1 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 content-start overflow-y-auto pb-20">
          {filteredApps.map((app, index) => {
            const Icon = app.icon;
            const isImage = typeof app.icon === 'string';

            const content = (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`w-16 h-16 rounded-2xl ${app.blackBackground ? 'bg-black border-white/20' : 'bg-white/5 border-white/10'} backdrop-blur-md border flex items-center justify-center relative overflow-hidden hover:bg-white/10 transition-colors group`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isImage ? (
                    <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-7 h-7 text-white/90" strokeWidth={1.5} />
                  )}
                </div>
                <span className="text-white/90 text-[10px] font-medium text-center line-clamp-1 w-full px-0.5">
                  {app.name}
                </span>
              </motion.div>
            );

            if (app.isExternal) {
              return (
                <a
                  key={app.id}
                  href={app.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={app.id}
                to={createPageUrl(app.path)}
                className="block"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}