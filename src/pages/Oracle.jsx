import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Brain, Zap } from "lucide-react";

export default function OraclePage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10" />
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to={createPageUrl("BridgeMind")}>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Eye className="w-8 h-8 text-purple-400" />
                Oracle
              </h1>
              <p className="text-white/60">Seek wisdom and insights</p>
            </div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Welcome to Oracle</h2>
                  <p className="text-white/60">Your gateway to wisdom</p>
                </div>
              </div>

              <p className="text-white/70 leading-relaxed mb-6">
                The Oracle is a powerful tool for seeking insights, making decisions, and exploring the unknown. 
                Ask your questions and receive guidance powered by advanced AI.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <Zap className="w-6 h-6 text-purple-400 mb-2" />
                  <h3 className="text-white font-semibold mb-1">Instant Answers</h3>
                  <p className="text-white/60 text-sm">Get immediate responses to your queries</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <Brain className="w-6 h-6 text-blue-400 mb-2" />
                  <h3 className="text-white font-semibold mb-1">Deep Insights</h3>
                  <p className="text-white/60 text-sm">Receive thoughtful analysis</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <Eye className="w-6 h-6 text-cyan-400 mb-2" />
                  <h3 className="text-white font-semibold mb-1">Clear Vision</h3>
                  <p className="text-white/60 text-sm">See beyond the obvious</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}