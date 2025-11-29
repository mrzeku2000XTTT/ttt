import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hammer, Trophy, Zap, Users, Github, ExternalLink, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BuildersPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log('User not logged in');
    }
  };

  const builders = [
    {
      name: "Core Team",
      role: "Platform Development",
      description: "Building the TTT ecosystem",
      icon: "🏗️",
      color: "from-cyan-500 to-blue-500",
      projects: ["TTT Platform", "Agent ZK", "Bridge"],
      github: null
    },
    {
      name: "Community Builders",
      role: "Contributors",
      description: "Expanding the ecosystem",
      icon: "🌟",
      color: "from-purple-500 to-pink-500",
      projects: ["Tools", "Integrations", "Content"],
      github: null
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Hammer className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-3">Builders</h1>
            <p className="text-gray-400 text-lg">The minds behind TTT</p>
          </motion.div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { label: "Active Builders", value: "12+", icon: Users, color: "cyan" },
              { label: "Projects Built", value: "50+", icon: Zap, color: "purple" },
              { label: "Community Impact", value: "High", icon: Heart, color: "pink" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all">
                  <CardContent className="p-6 text-center">
                    <stat.icon className={`w-8 h-8 mx-auto mb-3 text-${stat.color}-400`} />
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Builders Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {builders.map((builder, i) => (
              <motion.div
                key={builder.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 backdrop-blur-xl hover:border-white/20 transition-all group">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="text-5xl">{builder.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">{builder.name}</h3>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                          {builder.role}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-400 mb-6">{builder.description}</p>

                    <div className="space-y-3">
                      <div className="text-sm text-gray-500 font-semibold">Projects:</div>
                      <div className="flex flex-wrap gap-2">
                        {builder.projects.map(project => (
                          <Badge key={project} variant="outline" className="bg-white/5 text-white border-white/20">
                            <Trophy className="w-3 h-3 mr-1" />
                            {project}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {builder.github && (
                      <Button
                        onClick={() => window.open(builder.github, '_blank')}
                        variant="outline"
                        className="w-full mt-6 bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        <Github className="w-4 h-4 mr-2" />
                        View GitHub
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30 backdrop-blur-xl">
              <CardContent className="p-8 text-center">
                <Zap className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">Want to Build with Us?</h3>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  Join the TTT ecosystem and contribute to the future of decentralized technology
                </p>
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}