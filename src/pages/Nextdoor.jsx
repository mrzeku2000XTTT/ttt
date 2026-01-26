import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus, ExternalLink } from "lucide-react";

export default function NextdoorPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProposeModal, setShowProposeModal] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    }
  };

  const apps = [
    { 
      id: 1, 
      name: "Latoyabarre", 
      url: "https://latoyabarre.base44.app", 
      icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/17e21f2a1_image.png", 
      category: "Business", 
      description: "Professional services" 
    },
  ];

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const appName = searchParams.get('app');
  const selectedApp = appName ? apps.find(a => a.name.toLowerCase() === appName.toLowerCase()) : null;

  if (selectedApp) {
    return (
      <div className="w-full bg-black flex flex-col" style={{ height: 'calc(100vh - 7.5rem - var(--sat, 0px))' }}>
        <div className="bg-zinc-950 border-b border-zinc-800 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(createPageUrl('Nextdoor'))}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <img 
              src={selectedApp.icon}
              alt={selectedApp.name}
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-white font-bold text-lg">{selectedApp.name}</h1>
          </div>
          <a 
            href={selectedApp.url} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white h-8 text-xs">
              <ExternalLink className="w-3 h-3 mr-2" />
              Open
            </Button>
          </a>
        </div>
        <div className="flex-1 w-full" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}>
          <iframe
            src={selectedApp.url}
            className="w-full h-full border-0"
            title={selectedApp.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl('OliviaApps'))}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white font-black text-3xl">Nextdoor</h1>
              <p className="text-zinc-400 text-sm">Your neighborhood app store</p>
            </div>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps..."
            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-12"
          />
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => navigate(`${createPageUrl('Nextdoor')}?app=${encodeURIComponent(app.name)}`)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2 flex items-center justify-center transition-all hover:scale-105 hover:border-purple-500/50">
                <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
              </div>
              <span className="text-white text-xs text-center line-clamp-2">{app.name}</span>
            </button>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500">No apps found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}