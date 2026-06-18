import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { 
  Monitor, Laptop, Command, LayoutGrid, Search, Settings, 
  User, LogOut, X, Minus, Square, Bell, Wifi, Battery,
  ChevronRight, Folder, FileText, Globe, MessageSquare,
  Play, Pause, SkipForward, Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const OS_APPS = [
  { name: "TTTV", icon: Search, path: "Browser", color: "bg-cyan-500" },
  { name: "Feed", icon: MessageSquare, path: "Feed", color: "bg-blue-500" },
  { name: "Agent ZK", icon: User, path: "AgentZK", color: "bg-purple-500" },
  { name: "Bridge", icon: LayoutGrid, path: "Bridge", color: "bg-green-500" },
  { name: "Marketplace", icon: Folder, path: "Marketplace", color: "bg-orange-500" },
  { name: "Profile", icon: User, path: "Profile", color: "bg-pink-500" },
  { name: "Settings", icon: Settings, path: "Settings", color: "bg-gray-500" },
];

export default function TTTOS() {
  const navigate = useNavigate();
  const [osType, setOsType] = useState(() => localStorage.getItem("ttt_os_type") || "windows");
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openWindows, setOpenWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadUser();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("ttt_os_type", osType);
  }, [osType]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = createPageUrl("Home");
  };

  const openApp = (app) => {
    const windowId = `${app.path}-${Date.now()}`;
    setOpenWindows(prev => [...prev, { ...app, windowId }]);
    setActiveWindow(windowId);
    setStartMenuOpen(false);
  };

  const closeWindow = (windowId) => {
    setOpenWindows(prev => prev.filter(w => w.windowId !== windowId));
    if (activeWindow === windowId) {
      setActiveWindow(openWindows.length > 1 ? openWindows[openWindows.length - 2].windowId : null);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", { 
      hour: osType === "mac" ? "12" : "24",
      minute: "2-digit",
      hour12: osType === "mac"
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const isWindows = osType === "windows";

  return (
    <div className={`h-screen w-screen overflow-hidden ${isWindows ? "bg-gradient-to-br from-blue-900 via-blue-700 to-blue-900" : "bg-gradient-to-br from-pink-200 via-purple-200 to-blue-300"}`}>
      {/* Desktop Area */}
      <div className="absolute inset-0 pb-20 pt-12 px-4">
        {/* Desktop Icons */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-6xl mx-auto">
          {OS_APPS.map((app) => {
            const Icon = app.icon;
            return (
              <motion.button
                key={app.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openApp(app)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                  isWindows 
                    ? "hover:bg-white/10 border border-white/5" 
                    : "hover:bg-white/20 backdrop-blur-sm"
                }`}
              >
                <div className={`w-12 h-12 ${app.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white font-medium text-center drop-shadow-lg">
                  {app.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Windows */}
        <AnimatePresence>
          {openWindows.map((win, index) => {
            const Icon = win.icon;
            const isActive = activeWindow === win.windowId;
            const zIndex = 10 + index;
            
            return (
              <motion.div
                key={win.windowId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => setActiveWindow(win.windowId)}
                className={`absolute top-20 left-1/4 right-1/4 bottom-32 rounded-lg overflow-hidden shadow-2xl ${
                  isWindows 
                    ? "bg-gray-900/95 backdrop-blur-xl border border-white/10" 
                    : "bg-white/90 backdrop-blur-xl border border-white/20"
                }`}
                style={{ zIndex }}
              >
                {/* Window Title Bar */}
                <div className={`h-10 flex items-center justify-between px-4 ${
                  isWindows ? "bg-gray-800/50" : "bg-gray-100/50"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 ${win.color} rounded flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className={`text-sm font-medium ${isWindows ? "text-white" : "text-gray-800"}`}>
                      {win.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className={`w-6 h-6 flex items-center justify-center rounded ${isWindows ? "hover:bg-white/10" : "hover:bg-gray-200"}`}>
                      <Minus className="w-3 h-3" />
                    </button>
                    <button className={`w-6 h-6 flex items-center justify-center rounded ${isWindows ? "hover:bg-white/10" : "hover:bg-gray-200"}`}>
                      <Square className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); closeWindow(win.windowId); }}
                      className={`w-6 h-6 flex items-center justify-center rounded ${isWindows ? "hover:bg-red-500" : "hover:bg-red-400 hover:text-white"}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Window Content */}
                <div className="flex-1 h-[calc(100%-2.5rem)] bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`w-16 h-16 ${win.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white text-lg font-medium mb-2">{win.name}</p>
                    <p className="text-gray-400 text-sm mb-4">Opening app...</p>
                    <Button 
                      onClick={() => navigate(createPageUrl(win.path))}
                      className="bg-cyan-500 hover:bg-cyan-600"
                    >
                      Open Full App
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* OS Type Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <div className={`flex items-center gap-2 p-2 rounded-full ${
          isWindows ? "bg-black/50 backdrop-blur" : "bg-white/30 backdrop-blur"
        }`}>
          <button
            onClick={() => setOsType("windows")}
            className={`p-2 rounded-full transition-all ${
              isWindows ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
            }`}
            title="Windows Style"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOsType("mac")}
            className={`p-2 rounded-full transition-all ${
              !isWindows ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
            title="macOS Style"
          >
            <Laptop className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Windows Taskbar */}
      {isWindows && (
        <div className="fixed bottom-0 left-0 right-0 h-12 bg-gray-900/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-4 z-40">
          {/* Start Button */}
          <div className="relative">
            <button
              onClick={() => setStartMenuOpen(!startMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded hover:bg-white/10 transition-colors"
            >
              <LayoutGrid className="w-5 h-5 text-blue-400" />
              <span className="text-white text-sm font-medium">Start</span>
            </button>
            
            {/* Start Menu */}
            <AnimatePresence>
              {startMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-14 left-0 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden"
                >
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{user?.username || "Guest"}</p>
                        <p className="text-gray-400 text-xs">{user?.email || ""}</p>
                      </div>
                    </div>
                    <Input
                      placeholder="Search apps..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {OS_APPS.filter(app => 
                      app.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((app) => {
                      const Icon = app.icon;
                      return (
                        <button
                          key={app.path}
                          onClick={() => openApp(app)}
                          className="w-full flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors"
                        >
                          <div className={`w-8 h-8 ${app.color} rounded flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-white text-sm">{app.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-2 border-t border-white/10">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 p-2 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Taskbar Apps */}
          <div className="flex items-center gap-2">
            {openWindows.map((win) => {
              const Icon = win.icon;
              const isActive = activeWindow === win.windowId;
              return (
                <button
                  key={win.windowId}
                  onClick={() => setActiveWindow(win.windowId)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
                    isActive 
                      ? "bg-white/20 border-b-2 border-cyan-400" 
                      : "hover:bg-white/10 border-b-2 border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-xs text-white">{win.name}</span>
                </button>
              );
            })}
          </div>

          {/* System Tray */}
          <div className="flex items-center gap-4 text-white/80 text-xs">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <Volume2 className="w-4 h-4" />
              <Battery className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="font-medium">{formatTime(currentTime)}</div>
              <div className="text-gray-400">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>
      )}

      {/* macOS Menu Bar */}
      {!isWindows && (
        <>
          {/* Top Menu Bar */}
          <div className="fixed top-0 left-0 right-0 h-8 bg-white/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-40">
            <div className="flex items-center gap-4">
              <Monitor className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">TTT OS</span>
              <div className="flex items-center gap-3 text-white text-xs">
                <span className="hover:text-gray-200 cursor-pointer">File</span>
                <span className="hover:text-gray-200 cursor-pointer">Edit</span>
                <span className="hover:text-gray-200 cursor-pointer">View</span>
                <span className="hover:text-gray-200 cursor-pointer">Window</span>
                <span className="hover:text-gray-200 cursor-pointer">Help</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white text-xs">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3 h-3" />
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>

          {/* macOS Dock */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-end gap-2 p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
              {OS_APPS.map((app) => {
                const Icon = app.icon;
                const isOpen = openWindows.some(w => w.path === app.path);
                return (
                  <motion.button
                    key={app.path}
                    whileHover={{ scale: 1.2, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openApp(app)}
                    className="relative group"
                  >
                    <div className={`w-12 h-12 ${app.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {isOpen && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                    )}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {app.name}
                    </div>
                  </motion.button>
                );
              })}
              
              {/* Separator */}
              <div className="w-px h-10 bg-white/20 mx-2" />
              
              {/* User Profile */}
              <motion.button
                whileHover={{ scale: 1.2, y: -10 }}
                onClick={handleLogout}
                className="relative group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <LogOut className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Logout
                </div>
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}