import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ORB_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/01d6115eb_image.png";

export default function TTTLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9)_1px,transparent_1px),radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.7)_1px,transparent_1px),radial-gradient(circle_at_45%_70%,rgba(255,255,255,0.55)_1px,transparent_1px)] bg-[length:90px_90px,130px_130px,170px_170px] opacity-70" />
      <img
        src={ORB_IMAGE}
        alt="TTT cosmic orb background"
        className="absolute inset-0 h-full w-full scale-90 object-contain object-center opacity-100 [image-rendering:auto] transform-gpu md:scale-[0.78]"
      />
      <img
        src={ORB_IMAGE}
        alt="TTT orb water reflection"
        className="absolute inset-x-0 bottom-0 h-1/3 w-full origin-bottom scale-y-[-1] object-contain object-bottom opacity-22 blur-[1px]"
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/55 to-transparent" />
      <div className="absolute inset-0 bg-black/10" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-8 pt-10 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative h-[min(62vh,620px)] w-full"
        >
          <Link
            to="/TTTGate"
            aria-label="Launch old TTT portal"
            className="absolute inset-0"
          />
        </motion.div>



        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mb-2 text-sm font-medium tracking-[0.45em] text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-base"
        >
          地球到火星交易
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs font-medium tracking-[0.32em] text-white/55 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-sm"
        >
          由 Kaspa 提供支持
        </motion.p>
      </section>
    </main>
  );
}