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
  FileText,
  Phone
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
  const [groups, setGroups] = useState({});
  const [openGroupId, setOpenGroupId] = useState(null);
  const [draggedApp, setDraggedApp] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    loadInitialData();
    loadBackgroundImage();
    loadCustomIcons();
    loadGroups();
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
      { id: "oliviaapps", name: "OLIVIA APPS", icon: "Brain", path: "OliviaApps", customIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1f4d18802_image.png" },
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
      { id: "agentzk2", name: "Agent ZK 2", icon: "Network", path: "AgentZK2", premium: true },
      { id: "zekuai", name: "Zeku AI", icon: "Brain", path: "ZekuAI", premium: true },
      { id: "agentfye", name: "Agent FYE", icon: "TrendingUp", path: "AgentFYE" },
      { id: "knowledge", name: "Knowledge", icon: "BookOpen", path: "KnowledgeBase", blackOnBlack: true },
      { id: "sendkas", name: "Send KAS", icon: "ArrowUpDown", path: "Bridge" },
      { id: "wallet", name: "Wallet", icon: "Wallet", path: "Wallet" },
      { id: "shop", name: "Shop", icon: "ShoppingCart", path: "Shop" },
      { id: "market", name: "Market", icon: "ShoppingBag", path: "Marketplace" },
      { id: "tttid", name: "TTT ID", icon: "Shield", path: "RegisterTTTID" },
      { id: "dagknight", name: "DAGKnight", icon: "Network", path: "DAGKnightWallet", premium: true },
      { id: "analytics", name: "Analytics", icon: "TrendingUp", path: "Analytics" },
      { id: "history", name: "History", icon: "History", path: "History" },
      { id: "god", name: "GOD", icon: "Activity", path: "God" },
      { id: "singularity", name: "SINGULARITY", icon: "Brain", path: "Singularity", blackOnBlack: true },
      { id: "veritas", name: "Veritas", icon: "Eye", path: "Veritas" },
      { id: "vibe", name: "VIBE", icon: "Wallet", path: "Vibe", blackOnBlack: true },
      { id: "terra", name: "Terra", icon: "Globe", path: "Terra", customIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/791e2bd15_IMG_1195.jpg" },
      { id: "tools", name: "Tools", icon: "Wrench", path: "Tools" },
      { id: "settings", name: "Settings", icon: "Settings", path: "Settings" },
      { id: "profile", name: "Profile", icon: "User", path: "Profile" },
      { id: "premium", name: "Premium", icon: "Crown", path: "Subscription" },
      { id: "vprogs", name: "VProgs", icon: "Terminal", path: "VProgs" },
      { id: "ios", name: "iOS", icon: "Settings", path: "IOS" },
      { id: "hypemind", name: "HYPEMIND", icon: "Brain", path: "HYPEMIND" },
      { id: "bible", name: "Bible", icon: "BookOpen", path: "Bible" },
      { id: "articles", name: "Articles", icon: "FileText", path: "Articles" },
      { id: "bmtuniv", name: "BMT Univ", icon: "BookOpen", path: "BMTUniv" },
      { id: "llmscraper", name: "LLM Miner", icon: "Terminal", path: "LLMScraper" },
      { id: "kivr", name: "KivR", icon: "Phone", path: "KivR", customIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a3f7bbc81_IMG_1275.jpg" },
      ];

    // Public apps available to everyone
    defaultApps.push(
      { id: "calculator", name: "Calculator", icon: "Activity", path: "Calculator" }
    );

    // Admin-only apps
    if (isAdmin) {
      defaultApps.push(
        { id: "arcade", name: "Arcade", icon: "Gamepad2", path: "Arcade" },
        { id: "hub", name: "Hub", icon: "Activity", path: "Hub" },
        { id: "ssh", name: "SSH", icon: "Terminal", path: "SSHManager" },
        { id: "gift", name: "GIFT", icon: "Gift", path: "Gift" }
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
      Activity, Terminal, Briefcase, Gift, BookOpen, Flame, Moon, Wrench, Eye, LayoutGrid, FileText, Phone
    };
    return icons[iconName] || Users;
  };

  const handleAppClick = () => {
    localStorage.setItem('came_from_categories', 'true');
  };

  const generateFuturisticBackground = async () => {
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: "Dark futuristic background for a high-tech AI crypto dashboard. Deep black and midnight-blue gradient canvas with subtle neon blue and violet light streaks across the scene. Soft glowing particles floating in the air for atmosphere. The bottom half of the image is a glossy, mirror-like reflective floor that faintly reflects imaginary UI icons above it with realistic blur and light falloff. Gentle horizontal light beams in the distance for depth. Soft lens flares and glow halos around light sources. Cinematic, minimal, premium, sci-fi style. No text, no logos, no people, no UI elements. Ultra-high resolution, clean composition. Volumetric lighting, ray-traced reflections, subtle bokeh particles, ambient cyberpunk glow, OLED-style contrast, 8K ultra-sharp. Glossy reflective black floor mirroring soft blue and purple UI light sources, symmetrical layout, minimal sci-fi HUD aesthetic."
      });
      
      const imageUrl = result.url;
      setBackgroundImage(imageUrl);
      setIsVideo(false);
      localStorage.setItem('categories_background', imageUrl);
      localStorage.setItem('categories_background_type', 'image');
    } catch (err) {
      console.error('Failed to generate background:', err);
    }
  };

  const loadBackgroundImage = () => {
    const saved = localStorage.getItem('categories_background');
    const savedType = localStorage.getItem('categories_background_type');
    if (saved) {
      setBackgroundImage(saved);
      setIsVideo(savedType === 'video');
    } else {
      // Generate futuristic background on first load
      generateFuturisticBackground();
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

  const loadGroups = () => {
    try {
      const saved = localStorage.getItem('categories_groups');
      if (saved) {
        setGroups(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const saveGroups = (newGroups) => {
    localStorage.setItem('categories_groups', JSON.stringify(newGroups));
    setGroups(newGroups);
  };

  const createGroup = (app1Id, app2Id) => {
    const groupId = `group_${Date.now()}`;
    const newGroups = {
      ...groups,
      [groupId]: {
        id: groupId,
        name: 'Folder',
        apps: [app1Id, app2Id]
      }
    };
    
    // Remove apps from main grid
    const updatedApps = apps.filter(app => app.id !== app1Id && app.id !== app2Id);
    updatedApps.push({ id: groupId, name: 'Folder', icon: 'LayoutGrid', isGroup: true });
    
    setApps(updatedApps);
    saveAppsOrder(updatedApps);
    saveGroups(newGroups);
  };

  const addToGroup = (groupId, appId) => {
    const newGroups = {
      ...groups,
      [groupId]: {
        ...groups[groupId],
        apps: [...groups[groupId].apps, appId]
      }
    };
    
    const updatedApps = apps.filter(app => app.id !== appId);
    setApps(updatedApps);
    saveAppsOrder(updatedApps);
    saveGroups(newGroups);
  };

  const removeFromGroup = (groupId, appId) => {
    const group = groups[groupId];
    const updatedGroupApps = group.apps.filter(id => id !== appId);
    
    if (updatedGroupApps.length <= 1) {
      // Dissolve group
      const newGroups = { ...groups };
      delete newGroups[groupId];
      
      const remainingAppId = updatedGroupApps[0];
      const updatedApps = apps.filter(app => app.id !== groupId);
      
      // Add back remaining apps
      const allDefaultApps = loadAllDefaultApps();
      if (remainingAppId) {
        const remainingApp = allDefaultApps.find(a => a.id === remainingAppId);
        if (remainingApp) updatedApps.push(remainingApp);
      }
      const removedApp = allDefaultApps.find(a => a.id === appId);
      if (removedApp) updatedApps.push(removedApp);
      
      setApps(updatedApps);
      saveAppsOrder(updatedApps);
      saveGroups(newGroups);
    } else {
      const newGroups = {
        ...groups,
        [groupId]: {
          ...group,
          apps: updatedGroupApps
        }
      };
      
      // Add app back to main grid
      const allDefaultApps = loadAllDefaultApps();
      const removedApp = allDefaultApps.find(a => a.id === appId);
      if (removedApp) {
        const updatedApps = [...apps, removedApp];
        setApps(updatedApps);
        saveAppsOrder(updatedApps);
      }
      saveGroups(newGroups);
    }
  };

  const loadAllDefaultApps = () => {
    const isAdmin = user && user.role === 'admin';
    return [
      { id: "appstore", name: "App Store", icon: "LayoutGrid", path: "AppStore" },
      { id: "oliviaapps", name: "OLIVIA APPS", icon: "Brain", path: "OliviaApps", customIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/1f4d18802_image.png" },
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
      { id: "agentzk2", name: "Agent ZK 2", icon: "Network", path: "AgentZK2", premium: true },
      { id: "zekuai", name: "Zeku AI", icon: "Brain", path: "ZekuAI", premium: true },
      { id: "agentfye", name: "Agent FYE", icon: "TrendingUp", path: "AgentFYE" },
      { id: "knowledge", name: "Knowledge", icon: "BookOpen", path: "KnowledgeBase", blackOnBlack: true },
      { id: "sendkas", name: "Send KAS", icon: "ArrowUpDown", path: "Bridge" },
      { id: "wallet", name: "Wallet", icon: "Wallet", path: "Wallet" },
      { id: "shop", name: "Shop", icon: "ShoppingCart", path: "Shop" },
      { id: "market", name: "Market", icon: "ShoppingBag", path: "Marketplace" },
      { id: "tttid", name: "TTT ID", icon: "Shield", path: "RegisterTTTID" },
      { id: "dagknight", name: "DAGKnight", icon: "Network", path: "DAGKnightWallet", premium: true },
      { id: "analytics", name: "Analytics", icon: "TrendingUp", path: "Analytics" },
      { id: "history", name: "History", icon: "History", path: "History" },
      { id: "god", name: "GOD", icon: "Activity", path: "God" },
      { id: "singularity", name: "SINGULARITY", icon: "Brain", path: "Singularity", blackOnBlack: true },
      { id: "veritas", name: "Veritas", icon: "Eye", path: "Veritas" },
      { id: "vibe", name: "VIBE", icon: "Wallet", path: "Vibe", blackOnBlack: true },
      { id: "terra", name: "Terra", icon: "Globe", path: "Terra", customIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/791e2bd15_IMG_1195.jpg" },
      { id: "tools", name: "Tools", icon: "Wrench", path: "Tools" },
      { id: "settings", name: "Settings", icon: "Settings", path: "Settings" },
      { id: "profile", name: "Profile", icon: "User", path: "Profile" },
      { id: "premium", name: "Premium", icon: "Crown", path: "Subscription" },
      { id: "vprogs", name: "VProgs", icon: "Terminal", path: "VProgs" },
      { id: "ios", name: "iOS", icon: "Settings", path: "IOS" },
      { id: "hypemind", name: "HYPEMIND", icon: "Brain", path: "HYPEMIND" },
      { id: "bible", name: "Bible", icon: "BookOpen", path: "Bible" },
      { id: "articles", name: "Articles", icon: "FileText", path: "Articles" },
      { id: "bmtuniv", name: "BMT Univ", icon: "BookOpen", path: "BMTUniv" },
      { id: "llmscraper", name: "LLM Miner", icon: "Terminal", path: "LLMScraper" },
      { id: "kivr", name: "KivR", icon: "Phone", path: "KivR", customIcon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a3f7bbc81_IMG_1275.jpg" },
      { id: "calculator", name: "Calculator", icon: "Activity", path: "Calculator" },
      ...(isAdmin ? [
        { id: "arcade", name: "Arcade", icon: "Gamepad2", path: "Arcade" },
        { id: "hub", name: "Hub", icon: "Activity", path: "Hub" },
        { id: "ssh", name: "SSH", icon: "Terminal", path: "SSHManager" },
        { id: "gift", name: "GIFT", icon: "Gift", path: "Gift" }
      ] : [])
    ];
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

      {/* Group Modal */}
      <AnimatePresence>
        {openGroupId && groups[openGroupId] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setOpenGroupId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={groups[openGroupId].name}
                  onChange={(e) => {
                    const newGroups = {
                      ...groups,
                      [openGroupId]: {
                        ...groups[openGroupId],
                        name: e.target.value
                      }
                    };
                    saveGroups(newGroups);
                  }}
                  className="bg-transparent text-white text-xl font-bold focus:outline-none border-b border-white/20 focus:border-white/40 px-2 py-1"
                />
                <button
                  onClick={() => setOpenGroupId(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {groups[openGroupId].apps.map((appId) => {
                  const allDefaultApps = loadAllDefaultApps();
                  const app = allDefaultApps.find(a => a.id === appId);
                  if (!app) return null;

                  const Icon = getIconComponent(app.icon);
                  const isAdmin = user && user.role === 'admin';
                  const isLocked = app.premium && !isPremium && !isAdmin;

                  return (
                    <div key={appId} className="relative group">
                      <Link
                        to={createPageUrl(app.path)}
                        onClick={() => {
                          handleAppClick();
                          setOpenGroupId(null);
                        }}
                        className={`block ${isLocked ? 'opacity-40' : ''}`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className={`w-14 h-14 rounded-2xl ${
                            app.blackOnBlack 
                              ? 'bg-black border-black'
                              : 'bg-black/60 backdrop-blur-md border border-white/20'
                          } flex items-center justify-center relative overflow-hidden`}>
                            {(customIcons[app.id] || app.customIcon) && !app.blackOnBlack ? (
                              <img 
                                src={customIcons[app.id] || app.customIcon} 
                                alt={app.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon className={`w-7 h-7 ${app.blackOnBlack ? 'text-black' : 'text-white/90'}`} strokeWidth={1.5} />
                            )}
                            {app.premium && (
                              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-500/90 rounded-full flex items-center justify-center">
                                <Crown className="w-2.5 h-2.5 text-black" />
                              </div>
                            )}
                          </div>
                          <span className="text-white/90 text-[9px] font-medium text-center line-clamp-1 w-full px-0.5">
                            {app.name}
                          </span>
                        </motion.div>
                      </Link>
                      <button
                        onClick={() => removeFromGroup(openGroupId, appId)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <Droppable droppableId="apps">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex-1 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3 content-start overflow-y-auto pb-20"
              >
                {filteredApps.map((app, index) => {
                  const Icon = getIconComponent(app.icon);
                  const isAdmin = user && user.role === 'admin';
                  const isLocked = app.premium && !isPremium && !isAdmin;
                  const isHovered = hoverTarget === app.id;

                  return (
                    <Draggable key={app.id} draggableId={app.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={isLocked ? 'opacity-40' : ''}
                          data-app-id={app.id}
                        >
                          {app.isGroup ? (
                            <button
                              onClick={() => setOpenGroupId(app.id)}
                              className="block w-full"
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
                             className="flex flex-col items-center gap-0.5 relative group"
                             style={{
                               cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                             }}
                            >
                             {/* Permanent spotlight beam from bottom */}
                             <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-20 h-32 bg-gradient-to-t from-white/10 via-white/5 to-transparent blur-2xl pointer-events-none" 
                               style={{ 
                                 opacity: 0.3 + (index % 3) * 0.15,
                                 animation: `pulse ${2 + (index % 4)}s ease-in-out infinite`
                               }} 
                             />

                             {/* Enhanced spotlight effect on hover */}
                             <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-24 h-40 bg-gradient-to-t from-cyan-400/40 via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300 pointer-events-none" />

<div className={`w-16 h-16 rounded-2xl ${
app.blackOnBlack 
? 'bg-black border-black'
: `bg-black/60 backdrop-blur-md border border-white/20 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] ${
isHovered ? 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)] scale-110' : ''
}`
} flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
snapshot.isDragging ? 'shadow-2xl border-white/30' : ''
}`}>
{app.isGroup ? (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 grid grid-cols-2 gap-0.5 p-1">
        {groups[app.id]?.apps.slice(0, 4).map((appId, idx) => {
          const groupedApp = loadAllDefaultApps().find(a => a.id === appId);
          if (!groupedApp) return null;
          const GroupIcon = getIconComponent(groupedApp.icon);
          return (
            <div key={idx} className="bg-white/10 rounded flex items-center justify-center">
              {(customIcons[groupedApp.id] || groupedApp.customIcon) ? (
                <img 
                  src={customIcons[groupedApp.id] || groupedApp.customIcon} 
                  alt=""
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <GroupIcon className="w-2.5 h-2.5 text-white/70" strokeWidth={2} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <>
      {(customIcons[app.id] || app.customIcon) && !app.blackOnBlack ? (
        <img 
          src={customIcons[app.id] || app.customIcon} 
          alt={app.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <Icon className={`w-6 h-6 ${app.blackOnBlack ? 'text-black' : 'text-white/90'}`} strokeWidth={1.5} />
      )}
    </>
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
                              </button>
                              ) : (
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
                              className="flex flex-col items-center gap-0.5 relative group"
                              style={{
                                cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                              }}
                              >
                              {/* Permanent spotlight beam from bottom */}
                              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-20 h-32 bg-gradient-to-t from-white/10 via-white/5 to-transparent blur-2xl pointer-events-none" 
                                style={{ 
                                  opacity: 0.3 + (index % 3) * 0.15,
                                  animation: `pulse ${2 + (index % 4)}s ease-in-out infinite`
                                }} 
                              />

                              {/* Enhanced spotlight effect on hover */}
                              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-24 h-40 bg-gradient-to-t from-cyan-400/40 via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300 pointer-events-none" />

                              <div className={`w-16 h-16 rounded-2xl ${
                                app.blackOnBlack 
                                  ? 'bg-black border-black'
                                  : `bg-black/60 backdrop-blur-md border border-white/20 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] ${
                                      isHovered ? 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)] scale-110' : ''
                                    }`
                              } flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                                snapshot.isDragging ? 'shadow-2xl border-white/30' : ''
                              }`}>
                                {(customIcons[app.id] || app.customIcon) && !app.blackOnBlack ? (
                                  <img 
                                    src={customIcons[app.id] || app.customIcon} 
                                    alt={app.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Icon className={`w-8 h-8 ${app.blackOnBlack ? 'text-black' : 'text-white/90'}`} strokeWidth={1.5} />
                                  )}
                                  {app.premium && (
                                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-500/90 rounded-full flex items-center justify-center">
                                    <Crown className="w-2.5 h-2.5 text-black" />
                                  </div>
                                  )}
                                  </div>
                                  <span className="text-white/90 text-[11px] font-medium text-center line-clamp-1 w-full px-0.5 mt-0.5">
                                {app.name}
                              </span>
                              </motion.div>
                              </Link>
                              )}
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