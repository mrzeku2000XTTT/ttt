import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Cpu, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function MachinePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add your submission logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <Link to={createPageUrl("Gate")}>
          <Button variant="ghost" className="mb-8 text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gate
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
            <Cpu className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-black text-white mb-3 tracking-tight">
            MACHINE
          </h1>
          <p className="text-white/50 text-lg">AI-Powered System Control</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Cpu, title: "Neural Core", desc: "AI Processing Hub", color: "blue" },
            { icon: Zap, title: "Power Systems", desc: "Energy Management", color: "blue" },
            { icon: Activity, title: "Analytics", desc: "System Monitoring", color: "purple" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 bg-${item.color}-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-6 h-6 text-${item.color}-400`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Template Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Get Started</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm text-white/70 mb-2 block">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter your email"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-2 block">Message</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Tell us about your project"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[120px]"
              />
            </div>
            <Button 
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
            >
              Submit
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}