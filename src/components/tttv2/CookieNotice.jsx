import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("ttt_cookie_notice_accepted");
    if (!accepted) setVisible(true);
  }, []);

  const acceptNotice = () => {
    localStorage.setItem("ttt_cookie_notice_accepted", "true");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-md z-[9999] rounded-2xl border border-zinc-200 bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/15 p-4"
        >
          <button
            onClick={() => setVisible(false)}
            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 transition-colors"
            aria-label="Close cookie notice"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-3 pr-6">
            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-900">Cookies & local storage</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                TTT uses local storage to remember simple preferences. We do not sell your data. Uploaded files use secure Base44 storage and follow user/account access rules.
              </p>
              <button
                onClick={acceptNotice}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}