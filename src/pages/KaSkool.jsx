import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, BookOpen, GraduationCap, Award, Users, TrendingUp, Play, CheckCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KaSkoolPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("courses");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const courses = [
    {
      id: 1,
      title: "Kaspa Fundamentals",
      description: "Learn the basics of Kaspa blockchain technology",
      progress: 60,
      lessons: 12,
      duration: "4 hours",
      level: "Beginner",
      enrolled: true
    },
    {
      id: 2,
      title: "Smart Contract Development",
      description: "Build and deploy smart contracts on Kaspa",
      progress: 0,
      lessons: 18,
      duration: "8 hours",
      level: "Advanced",
      enrolled: false
    },
    {
      id: 3,
      title: "Blockchain Security",
      description: "Master security best practices for blockchain",
      progress: 100,
      lessons: 10,
      duration: "5 hours",
      level: "Intermediate",
      enrolled: true
    },
    {
      id: 4,
      title: "DeFi Essentials",
      description: "Understanding decentralized finance protocols",
      progress: 25,
      lessons: 15,
      duration: "6 hours",
      level: "Intermediate",
      enrolled: true
    }
  ];

  const achievements = [
    { name: "First Steps", description: "Complete your first lesson", unlocked: true },
    { name: "Quick Learner", description: "Complete a course in under 24 hours", unlocked: true },
    { name: "Master Scholar", description: "Complete 5 courses", unlocked: false },
    { name: "Blockchain Expert", description: "Score 100% on all advanced courses", unlocked: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 text-gray-900">
      {/* Header */}
      <div className="border-b border-teal-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("AppStore")}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-teal-400 flex items-center justify-center">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/82eb2ecee_image.png"
                    alt="KaSkool Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">KaSkool</h1>
                  <p className="text-sm text-gray-600">Innovate. Educate. Monetize.</p>
                </div>
              </div>
            </div>

            {!user && (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Login to Learn
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {user && (
        <div className="bg-gradient-to-r from-teal-100 to-cyan-100 border-b border-teal-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">3</p>
                <p className="text-xs text-gray-600">Courses Enrolled</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">62%</p>
                <p className="text-xs text-gray-600">Avg Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">2</p>
                <p className="text-xs text-gray-600">Achievements</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-700">24h</p>
                <p className="text-xs text-gray-600">Learning Time</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "courses"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4 inline-block mr-2" />
              Courses
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "achievements"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Award className="w-4 h-4 inline-block mr-2" />
              Achievements
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "community"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Community
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "courses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Learning Path</h2>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Play className="w-4 h-4 mr-2" />
                Continue Learning
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white border-teal-200 hover:border-teal-400 transition-all shadow-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-gray-900">{course.title}</CardTitle>
                        {course.enrolled ? (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                            Enrolled
                          </span>
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{course.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {course.enrolled && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{course.lessons} lessons</span>
                        <span>{course.duration}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          course.level === "Beginner" ? "bg-green-500/20 text-green-400" :
                          course.level === "Intermediate" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {course.level}
                        </span>
                      </div>

                      <Button
                        className={`w-full ${
                          course.enrolled
                            ? "bg-cyan-500 hover:bg-cyan-600"
                            : "bg-white/10 hover:bg-white/20 border border-white/20"
                        }`}
                      >
                        {course.enrolled ? (
                          course.progress === 100 ? "Review" : "Continue"
                        ) : "Enroll Now"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Your Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, idx) => (
                <Card
                  key={idx}
                  className={`${
                    achievement.unlocked
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      achievement.unlocked
                        ? "bg-teal-200"
                        : "bg-gray-100"
                    }`}>
                      {achievement.unlocked ? (
                        <CheckCircle className="w-8 h-8 text-teal-600" />
                      ) : (
                        <Lock className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold mb-1 ${
                        achievement.unlocked ? "text-gray-900" : "text-gray-400"
                      }`}>
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "community" && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Community Coming Soon</h2>
            <p className="text-gray-400">
              Connect with fellow learners, share knowledge, and collaborate on projects.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}