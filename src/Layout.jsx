import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowUpDown, TrendingUp, Activity, LogOut, AlertCircle, Crown, User as UserIcon, Menu, X, Clock, Bot, Search, Users, Gamepad2, BarChart3, AlertTriangle, Settings, Bell, Briefcase, ShoppingBag, Brain, Shield, Wallet, Network, Key, MoreHorizontal, FileText, History, Download, ShoppingCart, Trophy, MessageSquare, LayoutGrid, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/SearchBar";
import { motion, AnimatePresence } from "framer-motion";
import MiniPlayer from "@/components/MiniPlayer";
import { VideoPlayerProvider } from "@/components/VideoPlayerContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showBackButton, setShowBackButton] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  useEffect(() => {
    loadUser();
    checkSubscription();
    checkNotificationPermission();
    loadPendingConnections();
    loadUnreadMessages();
    checkIfFromCategories();
    
    const interval = setInterval(checkSubscription, 10000);
    const connectionsInterval = setInterval(loadPendingConnections, 5000);
    const messagesInterval = setInterval(loadUnreadMessages, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(connectionsInterval);
      clearInterval(messagesInterval);
    };
  }, [currentPageName]);

  const checkIfFromCategories = () => {
    const cameFromCategories = localStorage.getItem('came_from_categories');
    if (cameFromCategories === 'true' && currentPageName !== 'Categories') {
      setShowBackButton(true);
    } else {
      setShowBackButton(false);
    }
  };

  const handleBackToCategories = () => {
    localStorage.removeItem('came_from_categories');
    navigate(createPageUrl('Categories'));
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        new Notification('TTT Notifications Enabled! 🎉', {
          body: 'You\'ll now receive updates about news, reactions, and more.',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const checkSubscription = () => {
    const saved = localStorage.getItem('subscription');
    if (saved) {
      const data = JSON.parse(saved);
      
      if (data.isActive && data.expiresAt < Date.now()) {
        data.isActive = false;
      }
      
      setSubscription(data);
    }
  };

  const loadPendingConnections = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.created_wallet_address) {
        const incoming = await base44.entities.AgentZKConnection.filter({
          target_address: currentUser.created_wallet_address,
          status: 'pending'
        });
        setPendingConnectionsCount(incoming.length);
      }
    } catch (err) {
      console.error('Failed to load pending connections:', err);
      setPendingConnectionsCount(0);
    }
  };

  const loadUnreadMessages = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.email) {
        const unread = await base44.entities.AgentMessage.filter({
          recipient_email: currentUser.email,
          is_read: false
        });
        setUnreadMessagesCount(unread.length);
      }
    } catch (err) {
      console.error('Failed to load unread messages:', err);
      setUnreadMessagesCount(0);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      setUser(null);
      window.location.href = createPageUrl("Home");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const formatTimeRemaining = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const isHomePage = currentPageName === "Home";
  const isCategoriesPage = currentPageName === "Categories";

  if (isHomePage || isCategoriesPage) {
    return (
      <VideoPlayerProvider>
        {children}
      </VideoPlayerProvider>
    );
  }

  const isAdmin = user && user.role === 'admin';

  const mainNavItems = [
    { name: "TTTV", icon: Search, path: "Browser", isTTTV: true },
    { name: "Send KAS", icon: ArrowUpDown, path: "Bridge" },
    { name: "Agent ZK", icon: Bot, path: "AgentZK", premium: true },
    { name: "Zeku AI", icon: Bot, path: "ZekuAI", premium: true },
  ];

  const morePages = [
    { name: "App Store", icon: LayoutGrid, path: "AppStore" },
    { name: "Docs", icon: FileText, path: "Docs" },
    { name: "Agent FYE", icon: TrendingUp, path: "AgentFYE" },
    { name: "Hercules", icon: Brain, path: "Hercules", premium: true },
    { name: "Balance Viewer", icon: Wallet, path: "KaspaBalanceViewer" },
    { name: "Kaspa Node", icon: Network, path: "KaspaNode" },
    { name: "Shop", icon: ShoppingCart, path: "Shop" },
    { name: "Marketplace", icon: ShoppingBag, path: "Marketplace" },
    { name: "Market X", icon: Briefcase, path: "MarketX" },
    { name: "TTT ID", icon: Shield, path: "RegisterTTTID" },
    { name: "DAGKnight", icon: Network, path: "DAGKnightWallet", premium: true },
    { name: "Agent Directory", icon: Users, path: "AgentZKDirectory", premium: true },
    { name: "Countdown", icon: Clock, path: "Countdown" },
    { name: "Careers", icon: Briefcase, path: "Career" },
    { name: "Wallet", icon: Wallet, path: "Wallet" },
    { name: "Receive", icon: Download, path: "Receive" },
    { name: "History", icon: History, path: "History" },
    { name: "TTT Feed", icon: Users, path: "Feed" },
    { name: "Global History", icon: Clock, path: "GlobalHistory" },
    { name: "Global War", icon: AlertTriangle, path: "GlobalWar" },
    { name: "Arcade", icon: Gamepad2, path: "Arcade" },
    { name: "Analytics", icon: TrendingUp, path: "Analytics" },
    { name: "Subscription", icon: Crown, path: "Subscription" },
    { name: "Profile", icon: UserIcon, path: "Profile" },
    { name: "🧪 Test", icon: Activity, path: "ReplitTest" },
    { name: "Sealed Wallets", icon: Shield, path: "SealedWalletDetails" },
    { name: "VP Import", icon: Download, path: "VPImport" },
    { name: "ZK Wallet", icon: Bot, path: "ZKWallet" },
    { name: "NFT Mint", icon: Trophy, path: "NFTMint" },
    { name: "Settings", icon: Settings, path: "Settings" },
    { name: "Notifications", icon: Bell, path: "Settings" },
    ...(isAdmin ? [
      { name: "Hub", icon: Activity, path: "Hub" },
      { name: "AI Analytics", icon: Brain, path: "AIAnalytics" },
      { name: "SSH Manager", icon: Settings, path: "SSHManager" },
      { name: "API Docs", icon: FileText, path: "APIDocumentation" }
    ] : [])
  ];

  const subNavItems = [
    { name: "TTT", label: "Encrypted Feed", icon: Users, path: "Feed" },
    { name: "NFT", label: "Mint NFTs", icon: Trophy, path: "NFTMint" },
    { name: "Global War", label: "War Monitor", icon: AlertTriangle, path: "GlobalWar" },
    { name: "Arcade", icon: Gamepad2, path: "Arcade" },
    { name: "Analytics", icon: TrendingUp, path: "Analytics" },
    { name: "Wallet", icon: Wallet, path: "Wallet" },
    { name: "Global History", icon: Clock, path: "GlobalHistory" },
    { name: "Subscription", icon: Crown, path: "Subscription" },
    { name: "Profile", icon: UserIcon, path: "Profile" },
  ];

  const allSubNavItems = isAdmin 
    ? [...subNavItems, 
       { name: "Hub", icon: Activity, path: "Hub" }, 
       { name: "AI Analytics", icon: Brain, path: "AIAnalytics" }
      ]
    : subNavItems;

  return (
    <VideoPlayerProvider>
      <div className="min-h-screen bg-black">
        {/* Compact Desktop Sidebar */}
        <motion.div
          initial={false}
          animate={{ width: sidebarCollapsed ? '3rem' : '3rem' }}
          className="hidden lg:flex fixed left-0 z-[60] flex-col bg-black/80 backdrop-blur-xl border-r border-white/10"
          style={{ 
            top: 'calc(var(--sat, 0px) + 7.5rem)',
            bottom: 0
          }}
        >
          <button
            onClick={handleBackToCategories}
            className="w-full h-10 flex items-center justify-center text-white/60 hover:text-cyan-400 hover:bg-white/5 transition-all border-b border-white/10"
            title="Back to Categories"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
            {[...mainNavItems, { name: "Categories", icon: LayoutGrid, path: "Categories" }].map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              
              return (
                <Link key={item.name} to={createPageUrl(item.path)}>
                  <div
                    className={`relative w-full h-10 flex items-center justify-center transition-all ${
                      isActive
                        ? 'text-cyan-400 bg-cyan-500/10 border-l-2 border-cyan-400'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                    title={item.name}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.badge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                    {item.premium && (
                      <Crown className="w-2 h-2 text-yellow-400 absolute bottom-1 right-1" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        <div className="flex-1 lg:ml-12">
        <style jsx global>{`
          :root {
            --sat: env(safe-area-inset-top);
            --sar: env(safe-area-inset-right);
            --sab: env(safe-area-inset-bottom);
            --sal: env(safe-area-inset-left);
          }
          
          input, select, textarea {
            font-size: 16px !important;
          }
          
          body {
            overscroll-behavior-y: none;
            -webkit-overflow-scrolling: touch;
          }
          
          * {
            -webkit-tap-highlight-color: rgba(6, 182, 212, 0.1);
          }

          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          /* Custom scrollbar for dropdown */
          .dropdown-scrollable {
            overflow-y: auto;
            overflow-x: hidden;
            max-height: 500px;
          }
          
          .dropdown-scrollable::-webkit-scrollbar {
            width: 6px;
          }
          
          .dropdown-scrollable::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
          }
          
          .dropdown-scrollable::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
          }
          
          .dropdown-scrollable::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        `}</style>

        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'var(--sat, 0px)' }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <Link 
                to={createPageUrl("Home")}
                className="flex items-center gap-2 group flex-shrink-0"
              >
                <span className="text-white font-black text-2xl sm:text-3xl tracking-tight">TTT</span>
              </Link>

              <div className="hidden lg:flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 min-w-max">
                  {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPageName === item.name || currentPageName === item.path; 
                    
                    return (
                      <Link key={item.name} to={createPageUrl(item.path)} className={`relative flex items-center gap-2 px-4 py-3 rounded-lg transition-colors whitespace-nowrap min-h-[44px] ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}>
                        {item.isTTTV ? (
                          <div className="bg-cyan-500 rounded px-2 py-1 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                            <span className="text-black font-black text-sm tracking-tight">TV</span>
                          </div>
                        ) : (
                          <>
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.premium && (
                              <Crown className="w-3 h-3 text-yellow-400" />
                            )}
                            {item.badge > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                {/* X Button */}
                <Link to={createPageUrl("X")}>
                  <button
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors border ${
                      currentPageName === "X"
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                        : "text-gray-400 hover:text-white hover:bg-white/5 border-white/10"
                    }`}
                    title="Agent ZK Verification"
                  >
                    <span className="font-black text-lg">X</span>
                  </button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-white/5 whitespace-nowrap border border-white/10">
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="text-sm font-medium">More</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="bg-zinc-900 border-zinc-700 w-56 dropdown-scrollable"
                    style={{ maxHeight: '500px', overflowY: 'auto' }}
                  >
                    <DropdownMenuLabel className="text-gray-300 font-semibold">All Pages</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-700" />
                    {!user && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => base44.auth.redirectToLogin()}
                          className="cursor-pointer text-cyan-400 hover:bg-cyan-500/10 border-b border-zinc-700"
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          <span className="font-semibold">Login</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-700" />
                      </>
                    )}
                    {morePages.map((page) => {
                      const Icon = page.icon;
                      const isActive = currentPageName === page.path;
                      
                      return (
                        <Link key={page.name} to={createPageUrl(page.path)}>
                          <DropdownMenuItem className={`cursor-pointer text-white hover:bg-white/10 ${isActive ? 'bg-white/10 text-cyan-400' : ''}`}>
                            <Icon className="w-4 h-4 mr-2" />
                            <span>{page.name}</span>
                            {page.premium && (
                              <Crown className="w-3 h-3 ml-auto text-yellow-400" />
                            )}
                            {page.badge > 0 && (
                              <span className="ml-auto w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
                                {page.badge}
                              </span>
                            )}
                          </DropdownMenuItem>
                        </Link>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {subscription?.isActive && !subscription?.isAdmin && (
                  <div className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg flex items-center gap-2 whitespace-nowrap">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-white font-semibold">
                      {formatTimeRemaining(subscription.expiresAt - Date.now())}
                    </span>
                  </div>
                )}

                {user && !user.username && (
                  <Link to={createPageUrl("ConnectWallet")}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 whitespace-nowrap"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Setup Profile
                    </Button>
                  </Link>
                )}

                {user ? (
                  <>
                    {user.username && (
                      <Link to={createPageUrl("Profile")}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white hover:bg-white/5 whitespace-nowrap"
                        >
                          <div className="w-6 h-6 border border-cyan-500/30 rounded-full flex items-center justify-center text-xs font-bold text-white bg-white/5 mr-2">
                            {user.username[0].toUpperCase()}
                          </div>
                          {user.username}
                          {isAdmin && (
                            <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                              ADMIN
                            </span>
                          )}
                        </Button>
                      </Link>
                    )}

                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white hover:bg-white/5 whitespace-nowrap"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : null}
              </div>

              <div className="lg:hidden flex items-center gap-1.5">
                <Link to={createPageUrl("Countdown")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-9 p-0 ${
                      currentPageName === "Countdown"
                        ? "bg-white/10 text-white"
                        : "text-gray-400"
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </Button>
                </Link>

                <Link to={createPageUrl("X")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-9 p-0 ${
                      currentPageName === "X"
                        ? "bg-purple-500/20 text-purple-400"
                        : "text-gray-400"
                    }`}
                  >
                    <span className="font-black text-lg">X</span>
                  </Button>
                </Link>

                <Link to={createPageUrl("ZekuAI")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-9 w-9 p-0"
                  >
                    <Bot className="w-5 h-5" />
                    <Crown className="w-3 h-3 text-yellow-400 absolute -top-0.5 -right-0.5" />
                  </Button>
                </Link>
                
                <Link to={createPageUrl("Marketplace")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-9 p-0 ${
                      currentPageName === "Marketplace"
                        ? "bg-white/10 text-white"
                        : "text-gray-400"
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </Button>
                </Link>



                <Button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  variant="ghost"
                  size="sm"
                  className="text-white h-9 w-9 p-0"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {mobileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    style={{ top: 'var(--sat, 0px)' }}
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 z-50 max-h-[70vh] overflow-y-auto"
                  >
                    <div className="p-4 space-y-2">
                      {!user && (
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            base44.auth.redirectToLogin();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 mb-2"
                        >
                          <UserIcon className="w-5 h-5" />
                          <span className="font-bold text-sm">Login</span>
                        </button>
                      )}

                      {[...mainNavItems, ...morePages].map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPageName === item.name || currentPageName === item.path;
                        
                        return (
                          <Link 
                            key={item.name} 
                            to={createPageUrl(item.path)}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <button
                              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                  ? "bg-white/10 text-white"
                                  : "text-gray-400 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              <span className="font-medium text-sm">{item.name}</span>
                              {item.premium && (
                                <Crown className="w-4 h-4 text-yellow-400 ml-auto" />
                              )}
                              {item.badge > 0 && (
                                <span className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          </Link>
                        );
                      })}

                      {subscription?.isActive && (
                        <div className="px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg mt-4">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-white font-semibold">
                              Premium: {formatTimeRemaining(subscription.expiresAt - Date.now())}
                            </span>
                          </div>
                        </div>
                      )}

                      {!user && (
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            base44.auth.redirectToLogin();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 mt-4"
                        >
                          <UserIcon className="w-5 h-5" />
                          <span className="font-medium text-sm">Login</span>
                        </button>
                      )}

                      {user && (
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 mt-4"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium text-sm">Logout</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="hidden lg:flex items-center gap-1">
                  {allSubNavItems.slice(0, 5).map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPageName === item.name || 
                                     (item.name === "TTT" && currentPageName === "Feed") ||
                                     (item.name === "NFT" && currentPageName === "NFTMint") ||
                                     (item.name === "🧪 Test" && currentPageName === "ReplitTest");
                    
                    return (
                      <Link key={item.name} to={createPageUrl(item.path)}>
                        <button
                          title={item.label || item.name}
                          className={`relative flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all group ${
                            isActive
                              ? "bg-white/10 text-white"
                              : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label && (
                            <span className="text-[8px] text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.label}
                            </span>
                          )}
                        </button>
                      </Link>
                    );
                  })}
                </div>

                <div className="flex-1 max-w-md mx-auto">
                  <SearchBar />
                </div>

                <div className="hidden lg:flex items-center gap-1">
                  {allSubNavItems.slice(5).map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPageName === item.name || currentPageName === item.path;
                    
                    return (
                      <Link key={item.name} to={createPageUrl(item.path)}>
                        <button
                          title={item.label || item.name}
                          className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                            isActive
                              ? "bg-white/10 text-white"
                              : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-28 sm:pt-32" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}>
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] bg-black/95 backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-around px-2 py-1.5">
            <Link to={createPageUrl("Categories")}>
              <button className={`flex flex-col items-center gap-0.5 py-1 ${currentPageName === 'Categories' ? 'text-cyan-400' : 'text-white/60'}`}>
                <LayoutGrid className="w-4 h-4" />
                <span className="text-[8px]">Apps</span>
              </button>
            </Link>
            <Link to={createPageUrl("Browser")}>
              <button className={`flex flex-col items-center gap-0.5 py-1 ${currentPageName === 'Browser' ? 'text-cyan-400' : 'text-white/60'}`}>
                <Search className="w-4 h-4" />
                <span className="text-[8px]">TTTV</span>
              </button>
            </Link>
            <Link to={createPageUrl("Feed")}>
              <button className={`flex flex-col items-center gap-0.5 py-1 ${currentPageName === 'Feed' ? 'text-cyan-400' : 'text-white/60'}`}>
                <Users className="w-4 h-4" />
                <span className="text-[8px]">Feed</span>
              </button>
            </Link>
            <Link to={createPageUrl("AgentZK")}>
              <button className={`relative flex flex-col items-center gap-0.5 py-1 ${currentPageName === 'AgentZK' ? 'text-cyan-400' : 'text-white/60'}`}>
                <Bot className="w-4 h-4" />
                <Crown className="w-2 h-2 text-yellow-400 absolute -top-0.5 -right-0.5" />
                <span className="text-[8px]">ZK</span>
              </button>
            </Link>
            <Link to={createPageUrl("Profile")}>
              <button className={`flex flex-col items-center gap-0.5 py-1 ${currentPageName === 'Profile' ? 'text-cyan-400' : 'text-white/60'}`}>
                <UserIcon className="w-4 h-4" />
                <span className="text-[8px]">Profile</span>
              </button>
            </Link>
          </div>
        </div>
        </div>
      </div>
      <MiniPlayer currentPage={currentPageName} />
    </VideoPlayerProvider>
  );
}