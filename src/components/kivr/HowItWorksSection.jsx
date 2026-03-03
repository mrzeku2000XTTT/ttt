import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Phone, Cpu, Wifi, ShieldCheck } from "lucide-react";

const ORANGE = "#ff5a14";

const steps = [
  {
    icon: <Phone size={18} color={ORANGE} />,
    title: "1. Set Up Presets",
    desc: "Connect your wallet here in KivR. Define the recipient address, amount, and a slot number (1–9). Your private key never leaves your device."
  },
  {
    icon: <Cpu size={18} color={ORANGE} />,
    title: "2. Call the IVR",
    desc: "From any phone — including basic feature phones — call the KivR number. Enter your PIN when prompted."
  },
  {
    icon: <Wifi size={18} color={ORANGE} />,
    title: "3. Press Your Slot",
    desc: "Press the slot key (1–9) matching your preset. The Asterisk IVR server looks up your pre-authorized transaction and broadcasts it to the Kaspa network."
  },
  {
    icon: <ShieldCheck size={18} color={ORANGE} />,
    title: "4. Non-Custodial",
    desc: "The IVR server never holds private keys. It only broadcasts transaction intents you pre-authorized. Full non-custodial sovereignty."
  }
];

export default function HowItWorksSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <span className="text-sm font-semibold text-white">How KivR Works</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3 pt-3"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(255,90,20,0.1)", border: "1px solid rgba(255,90,20,0.2)" }}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold mb-0.5">{s.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}