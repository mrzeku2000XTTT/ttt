import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ArrowUpDown,
  TrendingUp,
  Activity,
  Bot,
  Users,
  Gamepad2,
  AlertTriangle,
  Settings,
  ShoppingBag,
  Brain,
  Shield,
  Wallet,
  Network,
  History,
  ShoppingCart,
  Trophy,
  MessageSquare,
  Crown,
  User,
  Camera,
  Image as ImageIcon,
  Video,
  Terminal,
  Plus,
  Upload,
  X,
  Briefcase,
  Gift,
  BookOpen,
  Wrench,
  Flame,
  Moon,
  Eye,
  LayoutGrid,
  FileText
} from "lucide-react";
import EncryptedNotepad from "@/components/feed/EncryptedNotepad";
import AppIconGenerator from "@/components/categories/AppIconGenerator";

export default function CategoriesPage() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showNotepad, setShowNotepad] = useState(false);
  const [apps, setApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showIconGenerator, setShowIconGenerator] = useState(false);
  const [customIcons, setCustomIcons] = useState({});
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    loadInitialData();
    loadBackgroundImage();
    loadCustomIcons();
  }, []);

  useEffect(() => {
    if (user !== null) {
      loadAppsOrder();
    }
  }, [user, subscription]);

  const loadInitialData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
      setUser(false);
    }
    
    checkSubscription();
  };

  const checkSubscription = () => {
    const saved = localStorage.getItem('subscription');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.isActive && data.expiresAt < Date.now()) {
        data.isActive = false;
      }
      setSubscription(data);
    } else {
      setSubscription(null);
    }
  };

  const loadAppsOrder = () => {
    const isAdmin = user && user.role === 'admin';
    const hasPremium = subscription?.isActive || isAdmin;

    const defaultApps = [
      { id: "appstore", name: "App Store", icon: "LayoutGrid", path: "AppStore" },
      { id: "gate", name: "Gate", icon: "Activity", path: "Gate" },
      { id: "bullmoon", name: "Bull Moon", icon: "Moon", path: "BullMoon" },
      { id: "timer", name: "Timer", icon: "Activity", path: "Timer" },
      { id: "tttv", name: "TTTV", icon: "Video", path: "Browser" },
      { id: "camera", name: "Camera", icon: "Camera", path: "QRScanner" },
      { id: "photos", name: "Photos", icon: "ImageIcon", path: "Feed" },
      { id: "feed", name: "Feed", icon: "Users", path: "Feed" },
      { id: "bullreels", name: "Bull Reels", icon: "Flame", path: "ProofOfBullish" },
      { id: "kasfans", name: "KAS Fans", icon: "Users", path: "KasFans" },
      { id: "kaspanodemap", name: "Kaspa Node Map", icon: "Network", path: "KaspaNodeMap" },
      { id: "life", name: "LIFE", icon: "Activity", path: "Life" },
      { id: "swan", name: "SWAN.AI", icon: "Terminal", path: "SWAN", premium: true },
      { id: "agentzk", name: "Agent ZK", icon: "Bot", path: "AgentZK", premium: true },
      { id: "zekuai", name: "Zeku AI", icon: "Brain", path: "ZekuAI", premium: true },
      { id: "agentfye", name: "Agent FYE", icon: "TrendingUp", path: "AgentFYE" },
      { id: "knowledge", name: "Knowledge", icon: "BookOpen", path: "KnowledgeBase", blackOnBlack: true },
      { id: "sendkas", name: "Send KAS", icon: "ArrowUpDown", path: "Bridge" },
      { id: "wallet", name: "Wallet", icon: "Wallet", path: "Wallet" },
      { id: "shop", name: "Shop", icon: "ShoppingCart", path: "Shop" },
      { id: "tttprofile", name: "TTT Profile", icon: "User", path: "TTTProfile" },
      { id: "market", name: "Market", icon: "ShoppingBag", path: "Marketplace" },
      { id: "tttid", name: "TTT ID", icon: "Shield", path: "RegisterTTTID" },
      { id: "dagknight", name: "DAGKnight", icon: "Network", path: "DAGKnightWallet", premium: true },
      { id: "analytics", name: "Analytics", icon: "TrendingUp", path: "Analytics" },
      { id: "history", name: "History", icon: "History", path: "History" },
      { id: "god", name: "GOD", icon: "Activity", path: "God" },
      { id: "singularity", name: "SINGULARITY", icon: "Brain", path: "Singularity", blackOnBlack: true },
      { id: "veritas", name: "Veritas", icon: "Eye", path: "Veritas" },
      { id: "vibe", name: "VIBE", icon: "Wallet", path: "Vibe", blackOnBlack: true },
      { id: "tools", name: "Tools", icon: "Wrench", path: "Tools" },
      { id: "settings", name: "Settings", icon: "Settings", path: "Settings" },
      { id: "profile", name: "Profile", icon: "User", path: "Profile" },
      { id: "premium", name: "Premium", icon: "Crown", path: "Subscription" },
      { id: "vprogs", name: "VProgs", icon: "Terminal", path: "VProgs" },
      { id: "ios", name: "iOS", icon: "Settings", path: "IOS" },
      { id: "hypemind", name: "HYPEMIND", icon: "Brain", path: "HYPEMIND" },
      { id: "bible", name: "Bible", icon: "BookOpen", path: "Bible" },
      { id: "articles", name: "Articles", icon: "FileText", path: "Articles" },
      ];

    if (isAdmin) {
      defaultApps.push(
        { id: "arcade", name: "Arcade", icon: "Gamepad2", path: "Arcade" },
        { id: "hub", name: "Hub", icon: "Activity", path: "Hub" },
        { id: "ssh", name: "SSH", icon: "Terminal", path: "SSHManager" },
        { id: "gift", name: "GIFT", icon: "Gift", path: "Gift" },
        { id: "calculator", name: "Calculator", icon: "Activity", path: "Calculator" }
        );
        }

        const saved = localStorage.getItem('categories_apps_order');
    if (saved) {
      try {
        const savedOrder = JSON.parse(saved);
        // Remove duplicates from saved order
        const uniqueOrder = [...new Set(savedOrder)];
        const orderedApps = uniqueOrder.map(id => defaultApps.find(app => app.id === id)).filter(Boolean);
        const newApps = defaultApps.filter(app => !uniqueOrder.includes(app.id));
        const finalApps = [...orderedApps, ...newApps];
        
        // Ensure no duplicate IDs in final array
        const seenIds = new Set();
        const deduplicatedApps = finalApps.filter(app => {
          if (seenIds.has(app.id)) return false;
          seenIds.add(app.id);
          return true;
        });
        
        setApps(deduplicatedApps);
        // Save cleaned order back to localStorage
        localStorage.setItem('categories_apps_order', JSON.stringify(deduplicatedApps.map(app => app.id)));
        return;
      } catch (err) {
        console.error('Failed to load apps order:', err);
      }
    }

    setApps(defaultApps);
  };

  const saveAppsOrder = (newApps) => {
    const order = newApps.map(app => app.id);
    localStorage.setItem('categories_apps_order', JSON.stringify(order));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(apps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setApps(items);
    saveAppsOrder(items);
  };

  const getIconComponent = (iconName) => {
    const icons = {
      Video, Camera, ImageIcon, Users, MessageSquare, Bot, Brain, 
      ArrowUpDown, Wallet, ShoppingCart, ShoppingBag, Shield, Network,
      Gamepad2, TrendingUp, AlertTriangle, History, Settings, User, Crown,
      Activity, Terminal, Briefcase, Gift, BookOpen, Flame, Moon, Wrench, Eye, LayoutGrid, FileText
    };
    return icons[iconName] || Users;
  };

  const handleAppClick = () => {
    localStorage.setItem('came_from_categories', 'true');
  };

  const loadBackgroundImage = () => {
    const saved = localStorage.getItem('categories_background');
    const savedType = localStorage.getItem('categories_background_type');
    if (saved) {
      setBackgroundImage(saved);
      setIsVideo(savedType === 'video');
    } else {
      // Set default video background for all users
      setBackgroundImage('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/b4b2c9ab1_file.mp4');
      setIsVideo(true);
    }
  };

  const loadCustomIcons = async () => {
    try {
      const customizations = await base44.entities.AppIconCustomization.filter({});
      const iconsMap = {};
      customizations.forEach(c => {
        iconsMap[c.app_id] = c.icon_url;
      });
      setCustomIcons(iconsMap);
    } catch (err) {
      console.error('Failed to load custom icons:', err);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoFile = file.type.startsWith('video/');
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBackgroundImage(file_url);
      setIsVideo(isVideoFile);
      localStorage.setItem('categories_background', file_url);
      localStorage.setItem('categories_background_type', isVideoFile ? 'video' : 'image');
    } catch (err) {
      console.error('Failed to upload background:', err);
      alert('Failed to upload background');
    } finally {
      setIsUploading(false);
    }
  };

  const isPremium = subscription?.isActive;
  const isAdmin = user && user.role === 'admin';

  // Filter apps based on search query
  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen overflow-hidden bg-black">
      {/* Background */}
      {backgroundImage ? (
        isVideo ? (
          <div className="fixed inset-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              src={backgroundImage}
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          <div 
            className="fixed inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )
      ) : (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Background Upload Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="fixed right-4 md:right-6 z-[100] w-10 h-10 md:w-12 md:h-12 bg-black/80 border border-white/20 hover:border-white/40 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
        title="Upload Background"
      >
        <Upload className="w-4 h-4 md:w-5 md:h-5 text-white/80" strokeWidth={2} />
      </motion.button>

      {/* Notepad Button */}
      {!showNotepad && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNotepad(true)}
          className="fixed left-4 md:left-6 z-[100] w-10 h-10 md:w-12 md:h-12 bg-black/80 border border-white/20 hover:border-white/40 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
          title="Encrypted Notepad"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 text-white/80" strokeWidth={2} />
        </motion.button>
      )}

      {/* Icon Generator Button (Admin Only) */}
      {isAdmin && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowIconGenerator(true)}
          className="fixed left-4 md:left-6 z-[100] w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 border border-white/20 hover:border-white/40 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 10rem)' }}
          title="App Icon Generator"
        >
          <Wrench className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2} />
        </motion.button>
      )}

      <AnimatePresence>
        {showNotepad && (
          <EncryptedNotepad onClose={() => setShowNotepad(false)} />
        )}
      </AnimatePresence>

      {showIconGenerator && (
        <AppIconGenerator
          apps={apps}
          onClose={() => setShowIconGenerator(false)}
          onUpdate={loadCustomIcons}
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-screen w-full flex flex-col px-3 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black text-white/90 tracking-tight">
            All Apps
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="w-full h-10 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-4 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
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

        {/* Apps Grid with Drag & Drop */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="apps" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex-1 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 content-start overflow-y-auto pb-20"
              >
                {filteredApps.map((app, index) => {
                  const Icon = getIconComponent(app.icon);
                  const isAdmin = user && user.role === 'admin';
                  const isLocked = app.premium && !isPremium && !isAdmin;

                  return (
                    <Draggable key={app.id} draggableId={app.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={isLocked ? 'opacity-40' : ''}
                        >
                          <Link
                            to={createPageUrl(app.path)}
                            onClick={handleAppClick}
                            className="block"
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ 
                                opacity: 1, 
                                scale: snapshot.isDragging ? 1.1 : 1,
                                rotate: snapshot.isDragging ? 5 : 0
                              }}
                              transition={{ 
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex flex-col items-center gap-0.5"
                              style={{
                                cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                              }}
                            >
                              <div className={`w-12 h-12 rounded-2xl ${
                                app.blackOnBlack 
                                  ? 'bg-black border-black'
                                  : 'bg-black/60 backdrop-blur-md border border-white/20'
                              } flex items-center justify-center relative overflow-hidden ${
                                snapshot.isDragging ? 'shadow-2xl border-white/30' : ''
                              }`}>
                                {customIcons[app.id] && !app.blackOnBlack ? (
                                  <img 
                                    src={customIcons[app.id]} 
                                    alt={app.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Icon className={`w-6 h-6 ${app.blackOnBlack ? 'text-black' : 'text-white/90'}`} strokeWidth={1.5} />
                                )}
                                {app.premium && (
                                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-500/90 rounded-full flex items-center justify-center">
                                    <Crown className="w-2 h-2 text-black" />
                                  </div>
                                )}
                              </div>
                              <span className="text-white/90 text-[9px] font-medium text-center line-clamp-1 w-full px-0.5">
                                {app.name}
                              </span>
                            </motion.div>
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}