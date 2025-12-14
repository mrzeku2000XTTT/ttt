import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TheRealmPage() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="text-center px-4"
      >
        <h1 className="text-4xl md:text-6xl font-black text-white mb-12 tracking-tighter">
          Are you ready to see the truth?
        </h1>
        
        <Link to={createPageUrl("TruthLanding")}>
          <Button 
            className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 rounded-none font-bold tracking-widest uppercase transition-all duration-500 hover:tracking-[0.2em]"
          >
            Enter Realm <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}