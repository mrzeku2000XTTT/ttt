import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function TruthLandingPage() {
  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* TTT Logo Top Left */}
      <div className="absolute top-6 left-6 z-50">
        <Link to={createPageUrl("Home")}>
          <h1 className="text-3xl font-black text-white/90 tracking-tighter hover:text-white transition-colors">
            TTT
          </h1>
        </Link>
      </div>

      <div className="w-full h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="text-white/20 font-black text-9xl tracking-tighter select-none"
        >
          TRUTH
        </motion.div>
      </div>
    </div>
  );
}