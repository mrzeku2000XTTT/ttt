import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function ApexCTA() {
  return (
    <section className="relative py-32 px-6">
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-orange-400/80 text-[10px] font-bold tracking-[0.3em] uppercase">Ready to Ascend</span>
          <h2
            className="text-white font-black text-4xl sm:text-6xl md:text-7xl mt-4 leading-[0.95] mb-6"
            style={{
              fontFamily: "'Orbitron', system-ui, sans-serif",
              textShadow: "0 0 40px rgba(255, 107, 26, 0.3)",
            }}
          >
            CLIMB TO<br />THE APEX
          </h2>
          <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto mb-10">
            Connect APEX to your NODA workflows in one click. Every success — proven. Every leak — impossible.
          </p>
          <Link
            to="/NODAStudio"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold text-base shadow-2xl shadow-orange-500/40 transition-all hover:scale-105"
          >
            Open NODA Studio
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}