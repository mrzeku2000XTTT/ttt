import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function EarthPage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-200 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-300/30 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-400/20 rounded-full blur-[150px]"
        />
      </div>

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <Link to={createPageUrl("Gate")}>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* iframe */}
      <iframe
        src="https://free.com"
        className="absolute inset-0 w-full h-full z-10"
        title="Free"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}