import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function KWSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-gradient-to-br from-green-900/20 to-cyan-900/20 border border-green-500/30 rounded-2xl p-8 backdrop-blur-xl text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-400" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-3">Wallet Created!</h1>
        <p className="text-gray-400 mb-8">
          Your KASIA wallet has been successfully created.
        </p>

        <Button
          onClick={() => navigate(createPageUrl("KW"))}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white h-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to KASIA Wallet
        </Button>
      </motion.div>
    </div>
  );
}