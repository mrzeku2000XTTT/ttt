import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Globe, Users, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function EarthPage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-y-auto">
      {/* Back Button */}
      <div className="absolute top-8 left-8 z-50">
        <Link to={createPageUrl("Gate")}>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-700 hover:text-black hover:bg-slate-200/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-32"
        >
          <h1 className="text-8xl font-light text-slate-900 mb-6 tracking-tight">
            EARTH
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
            Where innovation meets simplicity. Experience the future of digital connection.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-sm p-12 rounded-2xl border border-slate-200/50 hover:border-slate-300 transition-all"
          >
            <Globe className="w-12 h-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-light text-slate-900 mb-4">Global Reach</h3>
            <p className="text-slate-600 leading-relaxed">
              Connect with millions of users worldwide through our seamless platform built for the modern age.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white/60 backdrop-blur-sm p-12 rounded-2xl border border-slate-200/50 hover:border-slate-300 transition-all"
          >
            <Zap className="w-12 h-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-light text-slate-900 mb-4">Lightning Fast</h3>
            <p className="text-slate-600 leading-relaxed">
              Experience unparalleled speed and performance with our cutting-edge technology infrastructure.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/60 backdrop-blur-sm p-12 rounded-2xl border border-slate-200/50 hover:border-slate-300 transition-all"
          >
            <Shield className="w-12 h-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-light text-slate-900 mb-4">Secure by Default</h3>
            <p className="text-slate-600 leading-relaxed">
              Your privacy and security are our top priorities with enterprise-grade encryption.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/60 backdrop-blur-sm p-12 rounded-2xl border border-slate-200/50 hover:border-slate-300 transition-all"
          >
            <Users className="w-12 h-12 text-slate-700 mb-6" />
            <h3 className="text-2xl font-light text-slate-900 mb-4">Community Driven</h3>
            <p className="text-slate-600 leading-relaxed">
              Join a thriving community of innovators, creators, and visionaries shaping the future.
            </p>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <Button
            size="lg"
            className="bg-slate-900 text-white hover:bg-slate-800 px-12 py-6 text-lg rounded-full font-light"
          >
            Get Started
          </Button>
        </motion.div>
      </div>
    </div>
  );
}