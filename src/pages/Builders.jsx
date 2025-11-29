import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code2, Award, Sparkles, Users2, Github, ExternalLink, Heart, TrendingUp, Target } from "lucide-react";
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
      description: "Building the foundation of TTT - architecting scalable infrastructure, developing core features, and ensuring platform reliability",
      color: "cyan",
      projects: ["TTT Platform", "Agent ZK", "Bridge", "Smart Contracts"],
      github: null,
      stats: { contributions: "500+", impact: "High" }
    },
    {
      name: "Community Builders",
      role: "Open Source Contributors",
      description: "Expanding the ecosystem through innovative tools, integrations, and community-driven development",
      color: "purple",
      projects: ["Tools", "Integrations", "Content", "Documentation"],
      github: null,
      stats: { contributions: "200+", impact: "Growing" }
    },
    {
      name: "Design Team",
      role: "UX/UI Design",
      description: "Crafting intuitive user experiences and beautiful interfaces that make blockchain accessible to everyone",
      color: "pink",
      projects: ["UI Components", "Brand Design", "User Research"],
      github: null,
      stats: { contributions: "150+", impact: "High" }
    },
    {
      name: "Infrastructure",
      role: "DevOps & Backend",
      description: "Maintaining robust infrastructure, optimizing performance, and ensuring 99.9% uptime across all services",
      color: "green",
      projects: ["Node Operations", "API Services", "Monitoring"],
      github: null,
      stats: { contributions: "300+", impact: "Critical" }
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
            className="mb-16 text-center"
          >
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 mx-auto mb-8 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Code2 className="w-12 h-12 text-cyan-400" strokeWidth={1.5} />
              </div>
            </motion.div>
            <h1 className="text-6xl font-black text-white mb-4 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                Builders
              </span>
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Meet the talented individuals shaping the future of decentralized technology
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { label: "Active Builders", value: "15+", icon: Users2, color: "cyan" },
              { label: "Total Contributions", value: "1,150+", icon: TrendingUp, color: "purple" },
              { label: "Community Impact", value: "High", icon: Target, color: "pink" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="relative overflow-hidden bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl hover:border-white/20 transition-all group">
                  <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <CardContent className="relative p-8 text-center">
                    <div className={`w-14 h-14 mx-auto mb-4 bg-${stat.color}-500/10 border border-${stat.color}-500/20 rounded-xl flex items-center justify-center`}>
                      <stat.icon className={`w-7 h-7 text-${stat.color}-400`} strokeWidth={1.5} />
                    </div>
                    <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Builders Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {builders.map((builder, i) => (
              <motion.div
                key={builder.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className="relative overflow-hidden bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 backdrop-blur-xl hover:border-white/20 transition-all group h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br from-${builder.color}-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  <CardContent className="relative p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-white mb-3">{builder.name}</h3>
                        <Badge className={`bg-${builder.color}-500/20 text-${builder.color}-300 border-${builder.color}-500/30 font-semibold`}>
                          {builder.role}
                        </Badge>
                      </div>
                      <div className={`w-12 h-12 bg-${builder.color}-500/10 border border-${builder.color}-500/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Code2 className={`w-6 h-6 text-${builder.color}-400`} strokeWidth={1.5} />
                      </div>
                    </div>

                    <p className="text-gray-400 leading-relaxed mb-6">{builder.description}</p>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-black/30 rounded-lg border border-white/5">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Contributions</div>
                        <div className="text-lg font-bold text-white">{builder.stats.contributions}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Impact</div>
                        <div className={`text-lg font-bold text-${builder.color}-400`}>{builder.stats.impact}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-semibold">
                        <Award className="w-4 h-4" strokeWidth={1.5} />
                        Key Projects
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {builder.projects.map(project => (
                          <Badge key={project} variant="outline" className="bg-white/5 text-white border-white/10 hover:border-white/20 transition-colors">
                            {project}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {builder.github && (
                      <Button
                        onClick={() => window.open(builder.github, '_blank')}
                        variant="outline"
                        className="w-full mt-6 bg-white/5 border-white/10 text-white hover:bg-white/10 h-11"
                      >
                        <Github className="w-4 h-4 mr-2" strokeWidth={1.5} />
                        View on GitHub
                        <ExternalLink className="w-4 h-4 ml-2" strokeWidth={1.5} />
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
            transition={{ delay: 0.8 }}
            className="mt-16"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-cyan-500/30 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5" />
              <CardContent className="relative p-12 text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-cyan-400" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-3xl font-black text-white mb-4">Want to Build with Us?</h3>
                <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                  Join the TTT ecosystem and contribute to the future of decentralized technology. We're always looking for talented builders to join our mission.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white h-12 px-8 font-semibold">
                    <Heart className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Join the Team
                  </Button>
                  <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-12 px-8">
                    <Github className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    View on GitHub
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}