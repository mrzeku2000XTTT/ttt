import React, { useState, Suspense, lazy } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import WhiteWaves from "@/components/sector6/WhiteWaves";
import Sector6Room from "@/components/sector6/Sector6Room";

// All sectors merged inside Sector 6 — lazy-loaded so we don't pull every
// heavy page component up front.
const SectorVIPage = lazy(() => import("@/pages/SectorVI"));
const AWAPage = lazy(() => import("@/pages/AWA"));
const AWASignerPage = lazy(() => import("@/pages/AWASigner"));
const IgraHorizonPage = lazy(() => import("@/pages/IgraHorizon"));
const IgraAgentPage = lazy(() => import("@/pages/IgraAgent"));
const AporiaDEXPage = lazy(() => import("@/pages/AporiaDEX"));
const KlipzPage = lazy(() => import("@/pages/Klipz"));
const KCCNftPage = lazy(() => import("@/pages/KCCNft"));
const KaspaCommandPage = lazy(() => import("@/pages/KaspaCommand"));
const KascovPage = lazy(() => import("@/pages/Kascov"));
const KasSignerPage = lazy(() => import("@/pages/KasSigner"));

const SECTORS = [
  { name: "SECTOR VI", Component: SectorVIPage },
  { name: "AWA", Component: AWAPage },
  { name: "AWA SIGNER", Component: AWASignerPage },
  { name: "IGRA HORIZON", Component: IgraHorizonPage },
  { name: "IGRA AGENT", Component: IgraAgentPage },
  { name: "APORIA DEX", Component: AporiaDEXPage },
  { name: "KLIPZ", Component: KlipzPage },
  { name: "KCC NFT", Component: KCCNftPage },
  { name: "KAS COMMAND", Component: KaspaCommandPage },
  { name: "KASCOV", Component: KascovPage },
  { name: "KAS SIGNER", Component: KasSignerPage },
];

export default function Sector6Page() {
  const [showRoom, setShowRoom] = useState(false);
  // -1 = native Sector 6 hero. 0..N-1 = which merged sector is shown inline.
  const [activeIdx, setActiveIdx] = useState(-1);
  const navigate = useNavigate();

  const ActiveSector = activeIdx >= 0 ? SECTORS[activeIdx] : null;
  const isNative = activeIdx < 0;

  return (
    <div className="min-h-screen bg-white text-gray-800 relative overflow-hidden" style={{ fontFamily: "'Rajdhani', system-ui, sans-serif" }}>
      {/* Wavy line decorations — shown on native hero */}
      {isNative && (
        <>
          <WhiteWaves className="absolute -top-24 -left-32 w-[480px] h-[480px] pointer-events-none" />
          <WhiteWaves className="absolute -top-10 right-0 w-[560px] h-[560px] pointer-events-none" flip />
          <WhiteWaves className="absolute bottom-[-140px] right-24 w-[520px] h-[520px] pointer-events-none" />
        </>
      )}

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-8">
        <div className="flex items-center gap-4">
          {isNative ? (
            <button
              onClick={() => navigate("/?world=5")}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-900 text-[10px] tracking-[0.25em] font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> BACK
            </button>
          ) : (
            <button
              onClick={() => setActiveIdx(-1)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 text-gray-500 hover:text-gray-900 hover:border-gray-900 text-[10px] tracking-[0.25em] font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> BACK TO SECTOR 6
            </button>
          )}
          <div className="font-black tracking-[0.2em] text-gray-900 text-lg">
            {isNative ? "SECTOR 6" : `SECTOR 6 · ${ActiveSector.name}`}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] tracking-[0.25em] text-gray-500">
          <span className="cursor-default">HOME</span>
          <span className="px-4 py-1.5 rounded-full bg-gray-800 text-white cursor-default">ROOM</span>
          <span className="cursor-default">ABOUT</span>
          <span className="cursor-default">CONTACT</span>
        </div>
      </nav>

      {/* Merged-sector chips — show on native hero */}
      {isNative && (
        <div className="relative z-10 px-8 md:px-16 pb-2 flex flex-wrap gap-2">
          {SECTORS.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setActiveIdx(i)}
              className="px-3 py-1.5 rounded-full border border-gray-200 text-[10px] tracking-[0.25em] font-bold text-gray-500 hover:text-gray-900 hover:border-gray-900 transition-colors"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Native hero */}
      {isNative && (
        <div className="relative z-10 px-8 md:px-16 pt-16 md:pt-24 pb-24 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-[0.08em] text-gray-800"
          >
            SECTOR 6
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-lg md:text-xl tracking-[0.5em] text-gray-400 font-light"
          >
            THEN, AT THAT TIME...
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-sm leading-relaxed text-gray-400 max-w-md"
          >
            A pure white space with four corners. Step inside the real 3D room —
            orbit, zoom, and explore Sector 6. All neighboring sectors are
            merged inside this hub: pick one above to enter it.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowRoom(true)}
            className="mt-10 px-10 py-3 rounded-full bg-gray-600 hover:bg-gray-800 text-white text-[11px] font-bold tracking-[0.3em] transition-colors"
          >
            SHOW 3D ROOM
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => navigate("/SectorVI")}
            className="mt-4 flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white text-[11px] font-bold tracking-[0.3em] transition-colors hover:bg-gray-900"
          >
            ENTER THE REAL SECTORS <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* Inline merged sector */}
      {!isNative && (
        <div className="relative z-10 px-4 md:px-8 pb-10">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-32 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            }
          >
            <ActiveSector.Component />
          </Suspense>
        </div>
      )}

      {/* Floating Back button — portaled to body so it sits above every sector's own fixed/sticky UI */}
      {!isNative && createPortal(
        <button
          onClick={() => { setActiveIdx(-1); window.scrollTo(0, 0); }}
          className="fixed top-4 left-4 z-[2147483647] flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-gray-900 text-[11px] font-bold tracking-[0.2em] shadow-2xl border border-gray-300 hover:bg-gray-100 transition-colors"
          style={{ touchAction: "manipulation" }}
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO SECTOR 6
        </button>,
        document.body
      )}

      {/* Fullscreen 3D Room */}
      <AnimatePresence>
        {showRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <Sector6Room />
            <div className="absolute top-6 left-8 pointer-events-none">
              <div className="font-black tracking-[0.2em] text-gray-800 text-sm">SECTOR 6 — 3D ROOM</div>
              <div className="text-[10px] tracking-[0.25em] text-gray-400 mt-1">DRAG TO ORBIT · SCROLL TO ZOOM</div>
            </div>
            <button
              onClick={() => setShowRoom(false)}
              className="absolute top-6 right-8 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}