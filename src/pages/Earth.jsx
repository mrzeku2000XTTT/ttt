import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function EarthPage() {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black to-blue-900/20" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]"
        />
      </div>

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <Link to={createPageUrl("Gate")}>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}