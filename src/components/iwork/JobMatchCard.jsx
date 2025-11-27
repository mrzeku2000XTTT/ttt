import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, DollarSign, MapPin, MessageSquare, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function JobMatchCard({ job, matchScore, kasPrice }) {
  const navigate = useNavigate();

  const kasMin = job.salary_range_min ? Math.round(job.salary_range_min / kasPrice) : 0;
  const kasMax = job.salary_range_max ? Math.round(job.salary_range_max / kasPrice) : 0;

  const handleConnect = () => {
    if (job?.posted_by_wallet && job?.posted_by_username) {
      navigate(createPageUrl('AgentZKChat') + `?targetAddress=${encodeURIComponent(job.posted_by_wallet)}&targetName=${encodeURIComponent(job.posted_by_username)}`);
    } else {
      alert('Unable to connect - job poster has not set up their wallet');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all relative overflow-hidden">
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold">
            {matchScore}% Match
          </Badge>
        </div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-purple-500/20 text-purple-300">
                  {job.department || 'General'}
                </Badge>
                {job.is_remote && (
                  <Badge className="bg-green-500/20 text-green-300">
                    Remote
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {job.posted_by_username && (
            <div className="mb-3 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {job.posted_by_username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs text-gray-400">Posted by</div>
                  <div className="text-sm font-semibold text-cyan-400">{job.posted_by_username}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {job.location}
            </div>
            {job.salary_range_min && (
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  ${job.salary_range_min.toLocaleString()} - ${job.salary_range_max.toLocaleString()}
                </div>
                <div className="text-xs text-cyan-400 ml-5">
                  {kasMin.toLocaleString()} - {kasMax.toLocaleString()} KAS
                </div>
              </div>
            )}
          </div>

          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {job.description}
          </p>

          {job.skills?.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {job.skills.slice(0, 4).map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-black/40 border border-white/10 rounded text-xs text-gray-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Connect & Apply
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}