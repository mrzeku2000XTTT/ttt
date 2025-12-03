import React, { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import TipModal from "@/components/TipModal";

export default function SendTipPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-gradient-to-r from-purple-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30"
          >
            <Wallet className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
            Send Kaspa Tip
          </h1>
          <p className="text-white/60 text-lg">
            Create QR payment requests on the Kaspa blockchain
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Easy QR Codes</h3>
            <p className="text-white/60 text-sm">
              Generate instant QR codes for quick and secure payments
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Real-time Tracking</h3>
            <p className="text-white/60 text-sm">
              Monitor payment status in real-time with automatic confirmation
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Add Messages</h3>
            <p className="text-white/60 text-sm">
              Send personalized thank you messages with your tips
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-white/10 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Ready to send a tip?</h2>
          <p className="text-white/60 mb-6 max-w-2xl mx-auto">
            Create a payment request with a QR code that expires in 30 minutes. 
            Track the payment status in real-time and get instant confirmation when received.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-500 to-teal-500 hover:from-purple-600 hover:to-teal-600 text-white px-8 h-14 rounded-xl font-bold text-lg shadow-2xl shadow-purple-500/30"
          >
            💸 Create Tip Request
          </Button>
        </motion.div>

        <div className="mt-12 bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">How it works</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-[#4fd1c5] rounded-full flex items-center justify-center flex-shrink-0 font-bold text-black">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Enter Details</h4>
                <p className="text-white/60 text-sm">
                  Add recipient address, amount (optional), your name, and a message
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-[#4fd1c5] rounded-full flex items-center justify-center flex-shrink-0 font-bold text-black">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Share QR Code</h4>
                <p className="text-white/60 text-sm">
                  Show the generated QR code or share the recipient address
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-[#4fd1c5] rounded-full flex items-center justify-center flex-shrink-0 font-bold text-black">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Automatic Verification</h4>
                <p className="text-white/60 text-sm">
                  Payment is verified on-chain and confirmed automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TipModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}