import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { 
  Monitor, Laptop, LayoutGrid, Search, Settings, 
  User, LogOut, X, Minus, Square, Wifi, WifiOff, Volume2, Battery,
  MessageSquare, Play, Columns2, Grid2x2, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GodZK from "@/components/tttos/GodZK";
import TTTOSResizeHandle, { HANDLES } from "@/components/tttos/TTTOSResizeHandle";

// Custom TTT-branded SVG logos for each app
const TTTLogos = {
  Node: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4"/>
          <stop offset="100%" stopColor="#0891b2"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#nodeGrad)"/>
      <circle cx="50" cy="50" r="25" stroke="white" strokeWidth="6" fill="none"/>
      <circle cx="50" cy="50" r="8" fill="white"/>
      <path d="M50 25 L50 35 M50 65 L50 75 M25 50 L35 50 M65 50 L75 50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    </svg>
  ),
  TTTV: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="tttvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#tttvGrad)"/>
      <text x="50" y="68" textAnchor="middle" fill="white" fontSize="50" fontWeight="900" fontFamily="system-ui">TV</text>
    </svg>
  ),
  Feed: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="feedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#feedGrad)"/>
      <path d="M30 35h40M30 50h40M30 65h25" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  ),
  AgentZK: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="zkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#zkGrad)"/>
      <circle cx="50" cy="45" r="20" fill="white"/>
      <path d="M25 80 Q50 60 75 80" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  ),
  Bridge: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="bridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#16a34a"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#bridgeGrad)"/>
      <path d="M20 65 L35 45 L50 65 L65 45 L80 65" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  Marketplace: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="marketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316"/>
          <stop offset="100%" stopColor="#ea580c"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#marketGrad)"/>
      <path d="M30 40 L50 25 L70 40 L70 75 L30 75 Z" stroke="white" strokeWidth="6" fill="none"/>
      <circle cx="50" cy="55" r="8" fill="white"/>
    </svg>
  ),
  Profile: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899"/>
          <stop offset="100%" stopColor="#db2777"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#profileGrad)"/>
      <circle cx="50" cy="40" r="18" fill="white"/>
      <path d="M30 80 Q50 60 70 80" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="settingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7280"/>
          <stop offset="100%" stopColor="#4b5563"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#settingsGrad)"/>
      <circle cx="50" cy="50" r="15" stroke="white" strokeWidth="8" fill="none"/>
      <path d="M50 25 L50 35 M50 65 L50 75 M25 50 L35 50 M65 50 L75 50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    </svg>
  ),
};

const OS_APPS = [
  { name: "NODE", logo: TTTLogos.Node, path: "Node", color: "from-cyan-500 to-teal-500" },
  { name: "TTTV", logo: TTTLogos.TTTV, path: "Browser", color: "from-cyan-500 to-blue-500" },
  { name: "Feed", logo: TTTLogos.Feed, path: "Feed", color: "from-blue-500 to-indigo-500" },
  { name: "Agent ZK", logo: TTTLogos.AgentZK, path: "AgentZK", color: "from-purple-500 to-violet-500" },
  { name: "Bridge", logo: TTTLogos.Bridge, path: "Bridge", color: "from-green-500 to-emerald-500" },
  { name: "Marketplace", logo: TTTLogos.Marketplace, path: "Marketplace", color: "from-orange-500 to-red-500" },
  { name: "Profile", logo: TTTLogos.Profile, path: "Profile", color: "from-pink-500 to-rose-500" },
  { name: "Settings", logo: TTTLogos.Settings, path: "Settings", color: "from-gray-500 to-slate-500" },
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
  const [windowPositions, setWindowPositions] = useState({});
  const [windowSizes, setWindowSizes] = useState({});
  const [iframeWindows, setIframeWindows] = useState([]);
  const [activeIframeWindow, setActiveIframeWindow] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [splitMode, setSplitMode] = useState(null); // null | "2" | "4"
  const zCounterRef = useRef(200);
  const resizeRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    const offset = openWindows.length * 30;
    setOpenWindows(prev => [...prev, { ...app, windowId }]);
    setWindowPositions(prev => ({
      ...prev,
      [windowId]: { x: 100 + offset, y: 80 + offset }
    }));
    setActiveWindow(windowId);
    setStartMenuOpen(false);
  };

  const openAppInWindow = (app) => {
    const windowId = `iframe-${app.path}-${Date.now()}`;
    const offset = iframeWindows.length * 30;
    // Use absolute URL — relative URLs break on published domains
    const appUrl = window.location.origin + createPageUrl(app.path);
    
    zCounterRef.current += 1;
    setIframeWindows(prev => [...prev, { 
      ...app, 
      windowId,
      url: appUrl,
      isLoading: true,
      loadFailed: false,
      z: zCounterRef.current,
      minimized: false,
      maximized: false
    }]);
    setWindowPositions(prev => ({
      ...prev,
      [windowId]: { x: 50 + offset, y: 50 + offset }
    }));
    setActiveIframeWindow(windowId);
    setStartMenuOpen(false);
  };

  const handleIframeError = (windowId, app) => {
    // If iframe fails to load (X-Frame-Options block), mark as failed
    setIframeWindows(prev => prev.map(w => 
      w.windowId === windowId ? { ...w, loadFailed: true, isLoading: false } : w
    ));
  };

  const openInNewTab = (app) => {
    const appUrl = window.location.origin + createPageUrl(app.path);
    window.open(appUrl, '_blank', 'noopener,noreferrer');
  };

  const closeIframeWindow = (windowId, e) => {
    e?.stopPropagation();
    setIframeWindows(prev => prev.filter(w => w.windowId !== windowId));
    setWindowPositions(prev => {
      const newPos = { ...prev };
      delete newPos[windowId];
      return newPos;
    });
    if (activeIframeWindow === windowId) {
      const remaining = iframeWindows.filter(w => w.windowId !== windowId);
      setActiveIframeWindow(remaining.length > 0 ? remaining[remaining.length - 1].windowId : null);
    }
  };

  // Windows 11 behavior: clicking a window brings it to front (fresh z-index) and un-minimizes
  const focusIframeWindow = (windowId) => {
    zCounterRef.current += 1;
    setIframeWindows(prev => prev.map(w =>
      w.windowId === windowId ? { ...w, z: zCounterRef.current, minimized: false } : w
    ));
    setActiveIframeWindow(windowId);
  };

  const minimizeIframeWindow = (windowId, e) => {
    e?.stopPropagation();
    setIframeWindows(prev => prev.map(w =>
      w.windowId === windowId ? { ...w, minimized: true } : w
    ));
    if (activeIframeWindow === windowId) {
      const others = iframeWindows.filter(w => w.windowId !== windowId && !w.minimized);
      const top = [...others].sort((a, b) => (b.z || 0) - (a.z || 0))[0];
      setActiveIframeWindow(top ? top.windowId : null);
    }
  };

  const toggleMaximizeIframeWindow = (windowId, e) => {
    e?.stopPropagation();
    zCounterRef.current += 1;
    setIframeWindows(prev => prev.map(w =>
      w.windowId === windowId ? { ...w, maximized: !w.maximized, minimized: false, z: zCounterRef.current } : w
    ));
    setActiveIframeWindow(windowId);
  };

  // Taskbar: click active window → minimize; click inactive/minimized → restore & focus
  const handleTaskbarClick = (win) => {
    if (activeIframeWindow === win.windowId && !win.minimized) {
      minimizeIframeWindow(win.windowId);
    } else {
      focusIframeWindow(win.windowId);
    }
  };

  const handleIframeDragEnd = (windowId, info) => {
    setWindowPositions(prev => ({
      ...prev,
      [windowId]: {
        x: (prev[windowId]?.x || 0) + info.offset.x,
        y: (prev[windowId]?.y || 0) + info.offset.y
      }
    }));
  };

  // ── Resize logic ──
  const startResize = useCallback((windowId, dir, e) => {
    e.preventDefault();
    e.stopPropagation();
    const startPos = { ...windowPositions[windowId] };
    const startSize = { ...windowSizes[windowId] };
    if (!startSize.width) startSize.width = 900;
    if (!startSize.height) startSize.height = 600;
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let newW = startSize.width;
      let newH = startSize.height;
      let newX = startPos.x;
      let newY = startPos.y;

      if (dir.includes("e")) newW = Math.max(300, startSize.width + dx);
      if (dir.includes("s")) newH = Math.max(200, startSize.height + dy);
      if (dir.includes("w")) { newW = Math.max(300, startSize.width - dx); newX = startPos.x + (startSize.width - newW); }
      if (dir.includes("n")) { newH = Math.max(200, startSize.height - dy); newY = startPos.y + (startSize.height - newH); }

      setWindowSizes((prev) => ({ ...prev, [windowId]: { width: newW, height: newH } }));
      setWindowPositions((prev) => ({ ...prev, [windowId]: { x: newX, y: newY } }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [windowPositions, windowSizes]);

  // ── Split screen logic ──
  const applySplit = (mode) => {
    const wins = iframeWindows.filter((w) => !w.minimized);
    if (wins.length === 0) return;
    setSplitMode(mode);
    zCounterRef.current += 1;

    if (mode === "2") {
      const visible = wins.slice(0, 2);
      visible.forEach((w, i) => {
        setWindowPositions((prev) => ({ ...prev, [w.windowId]: { x: i * (window.innerWidth / 2), y: 0 } }));
        setWindowSizes((prev) => ({ ...prev, [w.windowId]: { width: window.innerWidth / 2, height: window.innerHeight - 80 } }));
      });
      setIframeWindows((prev) => prev.map((w) => visible.find((v) => v.windowId === w.windowId)
        ? { ...w, maximized: false, minimized: false, z: zCounterRef.current } : w));
    } else if (mode === "4") {
      const visible = wins.slice(0, 4);
      const halfW = window.innerWidth / 2;
      const halfH = (window.innerHeight - 80) / 2;
      visible.forEach((w, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        setWindowPositions((prev) => ({ ...prev, [w.windowId]: { x: col * halfW, y: row * halfH } }));
        setWindowSizes((prev) => ({ ...prev, [w.windowId]: { width: halfW, height: halfH } }));
      });
      setIframeWindows((prev) => prev.map((w) => visible.find((v) => v.windowId === w.windowId)
        ? { ...w, maximized: false, minimized: false, z: zCounterRef.current } : w));
    }
  };

  const exitSplit = () => {
    setSplitMode(null);
    iframeWindows.forEach((w) => {
      if (!w.maximized) {
        setWindowSizes((prev) => { const n = { ...prev }; delete n[w.windowId]; return n; });
      }
    });
  };

  const handleIframeLoad = (windowId) => {
    setIframeWindows(prev => prev.map(w => 
      w.windowId === windowId ? { ...w, isLoading: false } : w
    ));
  };

  const closeWindow = (windowId, e) => {
    e?.stopPropagation();
    setOpenWindows(prev => prev.filter(w => w.windowId !== windowId));
    setWindowPositions(prev => {
      const newPos = { ...prev };
      delete newPos[windowId];
      return newPos;
    });
    if (activeWindow === windowId) {
      const remaining = openWindows.filter(w => w.windowId !== windowId);
      setActiveWindow(remaining.length > 0 ? remaining[remaining.length - 1].windowId : null);
    }
  };

  const handleDragEnd = (windowId, info) => {
    setWindowPositions(prev => ({
      ...prev,
      [windowId]: {
        x: (prev[windowId]?.x || 0) + info.offset.x,
        y: (prev[windowId]?.y || 0) + info.offset.y
      }
    }));
  };

  const formatTime = (date) => {
    if (osType === "mac") {
      return date.toLocaleTimeString("en-US", { 
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    }
    return date.toLocaleTimeString("en-GB", { 
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
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
            const Logo = app.logo;
            return (
              <motion.button
                key={app.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openAppInWindow(app)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                  isWindows 
                    ? "hover:bg-white/10 border border-white/5" 
                    : "hover:bg-white/20 backdrop-blur-sm"
                }`}
              >
                <div className="w-12 h-12 rounded-xl shadow-lg overflow-hidden">
                  <Logo />
                </div>
                <span className="text-xs text-white font-medium text-center drop-shadow-lg">
                  {app.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Embedded Browser Windows — Mobile: full-screen fixed cards; Desktop: floating resizable */}
        {isMobile ? (
          iframeWindows.filter((w) => !w.minimized).length > 0 && (
          <div className="absolute inset-0 pb-16 pt-12">
            <AnimatePresence>
              {iframeWindows.filter((w) => !w.minimized).map((win) => {
                const Logo = win.logo;
                const isActive = activeIframeWindow === win.windowId;
                return (
                  <motion.div
                    key={win.windowId}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className={`absolute inset-0 overflow-hidden ${isWindows ? "bg-gray-900/95" : "bg-white/95"} ${isActive ? "z-30" : "z-20"}`}
                  >
                    <div className={`h-11 flex items-center justify-between px-3 ${isWindows ? "bg-gray-800/80" : "bg-gray-100"}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded overflow-hidden"><Logo /></div>
                        <span className={`text-sm font-bold ${isWindows ? "text-white" : "text-gray-800"}`}>{win.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => minimizeIframeWindow(win.windowId, e)} className={`w-8 h-8 flex items-center justify-center rounded ${isWindows ? "hover:bg-white/10 text-white" : "hover:bg-gray-200"}`}><Minus className="w-4 h-4" /></button>
                        <button onClick={(e) => closeIframeWindow(win.windowId, e)} className={`w-8 h-8 flex items-center justify-center rounded ${isWindows ? "hover:bg-red-500 text-white" : "hover:bg-red-400 hover:text-white"}`}><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="relative h-[calc(100%-2.75rem)] bg-white">
                      {win.isLoading && <div className={`absolute inset-0 flex items-center justify-center ${isWindows ? "bg-gray-900" : "bg-gray-100"}`}><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>}
                      {win.loadFailed ? (
                        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${isWindows ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
                          <WifiOff className="w-8 h-8 text-red-400" />
                          <p className="text-sm font-bold">Cannot embed in window</p>
                          <Button onClick={() => openInNewTab(win)} className="bg-cyan-500 text-white">Open in New Tab</Button>
                        </div>
                      ) : (
                        <iframe src={win.url} className="w-full h-full border-0" onLoad={() => handleIframeLoad(win.windowId)} title={win.name} sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          )
        ) : (
        <AnimatePresence>
          {iframeWindows.map((win, index) => {
            const Logo = win.logo;
            const isActive = activeIframeWindow === win.windowId;
            const zIndex = win.z || 100 + index;
            const pos = win.maximized ? { x: 0, y: 0 } : (windowPositions[win.windowId] || { x: 50 + index * 30, y: 50 + index * 30 });
            const size = windowSizes[win.windowId] || {};
            const wStyle = win.maximized
              ? { left: 0, top: 0, width: "calc(100vw - 2rem)", height: "calc(100vh - 8rem)" }
              : { width: size.width || "90vw", maxWidth: size.width ? undefined : "1200px", height: size.height || "75vh", maxHeight: size.height ? undefined : "700px" };

            return (
              <motion.div
                key={win.windowId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: pos.x, y: pos.y }}
                exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
                drag={!win.maximized && !splitMode}
                dragMomentum={false}
                onDragEnd={(e, info) => handleIframeDragEnd(win.windowId, info)}
                onMouseDown={() => { if (!isActive) focusIframeWindow(win.windowId); }}
                className={`absolute overflow-hidden ${win.maximized ? "rounded-none" : "rounded-lg"} ${isActive ? "shadow-2xl ring-1 ring-cyan-400/30" : "shadow-lg"} ${isWindows ? "bg-gray-900/95 backdrop-blur-xl border border-white/10" : "bg-white/90 backdrop-blur-xl border border-white/20"}`}
                style={{ zIndex, display: win.minimized ? "none" : undefined, ...wStyle }}
              >
                {/* Resize handles — desktop, not maximized, not in split mode */}
                {!win.maximized && !splitMode && HANDLES.map((h) => (
                  <TTTOSResizeHandle key={h.dir} dir={h.dir} className={h.className} onResizeStart={(dir, e) => startResize(win.windowId, dir, e)} />
                ))}
                {/* Browser Title Bar */}
                <div 
                  className={`h-10 flex items-center justify-between px-4 cursor-move ${
                    isWindows ? "bg-gray-800/50" : "bg-gray-100/50"
                  }`}
                  onDoubleClick={() => toggleMaximizeIframeWindow(win.windowId)}
                >
                  {/* macOS-style traffic light controls on left */}
                  {!isWindows && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={(e) => closeIframeWindow(win.windowId, e)}
                        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center group"
                        title="Close"
                      >
                        <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100" />
                      </button>
                      <button 
                        onClick={(e) => minimizeIframeWindow(win.windowId, e)}
                        className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center group" title="Minimize">
                        <Minus className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100" />
                      </button>
                      <button 
                        onClick={(e) => toggleMaximizeIframeWindow(win.windowId, e)}
                        className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center group" title="Maximize">
                        <Square className="w-1.5 h-1.5 text-green-900 opacity-0 group-hover:opacity-100" />
                      </button>
                    </div>
                  )}
                  
                  {/* Center - App name with icon */}
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0">
                      <Logo />
                    </div>
                    <span className={`text-sm font-medium ${isWindows ? "text-white" : "text-gray-800"}`}>
                      {win.name}
                    </span>
                  </div>
                  
                  {/* Windows-style controls on right */}
                  {isWindows && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={(e) => minimizeIframeWindow(win.windowId, e)}
                        className={`w-7 h-7 flex items-center justify-center rounded text-white ${isWindows ? "hover:bg-white/10" : "hover:bg-gray-200"}`}
                        title="Minimize"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => toggleMaximizeIframeWindow(win.windowId, e)}
                        className={`w-7 h-7 flex items-center justify-center rounded text-white ${isWindows ? "hover:bg-white/10" : "hover:bg-gray-200"}`}
                        title={win.maximized ? "Restore Down" : "Maximize"}
                      >
                        <Square className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => closeIframeWindow(win.windowId, e)}
                        className={`w-7 h-7 flex items-center justify-center rounded ${isWindows ? "hover:bg-red-500" : "hover:bg-red-400 hover:text-white"}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Browser Content - Iframe */}
                <div className="relative h-[calc(100%-2.5rem)] bg-white">
                  {win.isLoading && (
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      isWindows ? "bg-gray-900" : "bg-gray-100"
                    }`}>
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className={`${isWindows ? "text-white" : "text-gray-800"} font-medium`}>Loading {win.name}...</p>
                      </div>
                    </div>
                  )}
                  {win.loadFailed && (
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      isWindows ? "bg-gray-900" : "bg-gray-100"
                    }`}>
                      <div className="text-center p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <WifiOff className="w-8 h-8 text-red-400" />
                        </div>
                        <p className={`${isWindows ? "text-white" : "text-gray-800"} font-bold mb-2`}>
                          Cannot load in window
                        </p>
                        <p className={`${isWindows ? "text-gray-400" : "text-gray-600"} text-sm mb-6`}>
                          This app cannot be embedded in an iframe due to security restrictions.
                        </p>
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={() => openInNewTab(win)}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white"
                          >
                            Open in New Tab
                          </Button>
                          <Button
                            onClick={(e) => closeIframeWindow(win.windowId, e)}
                            variant="outline"
                            className={isWindows ? "border-white/20 text-white hover:bg-white/10" : "border-gray-300 hover:bg-gray-100"}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={win.url}
                    className="w-full h-full border-0"
                    onLoad={() => handleIframeLoad(win.windowId)}
                    onError={() => handleIframeError(win.windowId, win)}
                    title={win.name}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                  />
                  {/* Click-catcher: clicking anywhere on an inactive window brings it to front (iframe clicks don't bubble) */}
                  {!isActive && (
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onMouseDown={() => focusIframeWindow(win.windowId)}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        )}
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
      {isWindows && !isMobile && (
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
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Search apps..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 flex-1"
                      />
                      <Button
                        onClick={() => {
                          const filtered = OS_APPS.filter(app => 
                            app.name.toLowerCase().includes(searchQuery.toLowerCase())
                          );
                          if (filtered.length > 0) {
                            openAppInWindow(filtered[0]);
                          }
                        }}
                        className="bg-cyan-500 hover:bg-cyan-600"
                        size="sm"
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {OS_APPS.filter(app => 
                      app.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((app) => {
                      const Logo = app.logo;
                      return (
                        <button
                          key={app.path}
                          onClick={() => openAppInWindow(app)}
                          className="w-full flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors"
                        >
                          <div className="w-8 h-8 rounded overflow-hidden">
                            <Logo />
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

          {/* Split screen buttons */}
          {iframeWindows.length >= 2 && !isMobile && (
            <div className="flex items-center gap-1 mr-2 pr-2 border-r border-white/10">
              <button
                onClick={() => splitMode === "2" ? exitSplit() : applySplit("2")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${splitMode === "2" ? "bg-cyan-500 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                title="Split screen — 2 windows side by side"
              >
                <Columns2 className="w-3.5 h-3.5" /> Split 2
              </button>
              <button
                onClick={() => splitMode === "4" ? exitSplit() : applySplit("4")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${splitMode === "4" ? "bg-cyan-500 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                title="Split screen — 4 windows in a 2×2 grid"
              >
                <Grid2x2 className="w-3.5 h-3.5" /> Split 4
              </button>
            </div>
          )}

          {/* Taskbar Apps */}
          <div className="flex items-center gap-2">
            {iframeWindows.map((win) => {
              const Logo = win.logo;
              const isActive = activeIframeWindow === win.windowId && !win.minimized;
              return (
                <button
                  key={win.windowId}
                  onClick={() => handleTaskbarClick(win)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
                    isActive 
                      ? "bg-white/20 border-b-2 border-cyan-400" 
                      : win.minimized
                        ? "opacity-60 hover:opacity-100 hover:bg-white/10 border-b-2 border-white/30"
                        : "hover:bg-white/10 border-b-2 border-transparent"
                  }`}
                >
                  <div className="w-5 h-5 rounded overflow-hidden">
                    <Logo />
                  </div>
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
      {!isWindows && !isMobile && (
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
                const Logo = app.logo;
                const isOpen = iframeWindows.some(w => w.path === app.path);
                return (
                  <motion.button
                    key={app.path}
                    whileHover={{ scale: 1.2, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openAppInWindow(app)}
                    className="relative group"
                  >
                    <div className="w-12 h-12 rounded-xl shadow-lg overflow-hidden">
                      <Logo />
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

      {/* Mobile bottom tab bar for open windows */}
      {isMobile && iframeWindows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setIframeWindows((prev) => prev.map((w) => ({ ...w, minimized: true })))}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/60 flex-shrink-0"
            title="Show desktop"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          {iframeWindows.map((win) => {
            const Logo = win.logo;
            const isActive = activeIframeWindow === win.windowId && !win.minimized;
            return (
              <button
                key={win.windowId}
                onClick={() => handleTaskbarClick(win)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all ${
                  isActive ? "bg-cyan-500/20 border border-cyan-500/40" : "bg-white/5 border border-transparent"
                }`}
              >
                <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0"><Logo /></div>
                <span className="text-white/80 text-[10px] font-bold max-w-[60px] truncate">{win.name}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); closeIframeWindow(win.windowId, e); }}
                  className="ml-0.5 w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/30 text-white/40"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* GodZK — OS navigator assistant */}
      <GodZK apps={OS_APPS} onOpenApp={openAppInWindow} />
    </div>
  );
}