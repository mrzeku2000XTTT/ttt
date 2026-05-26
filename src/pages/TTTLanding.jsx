import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import FloatingLandingBar from "../components/landing/FloatingLandingBar";

const ORB_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e4a5d18e1_cropped_circle_image3.png";

export default function TTTLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <img
        src={ORB_IMAGE}
        alt="TTT cosmic orb background"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-95"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/5 to-black/62" />

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



        <FloatingLandingBar />
      </section>
    </main>
  );
}