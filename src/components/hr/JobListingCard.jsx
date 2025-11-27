import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Clock, Users, Briefcase, MessageSquare, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function JobListingCard({ job, onEdit, onClose, kasPrice }) {
  const navigate = useNavigate();
  const employmentTypeLabels = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    internship: "Internship"
  };

  const kasMin = job.salary_range_min ? Math.round(job.salary_range_min / kasPrice) : 0;
  const kasMax = job.salary_range_max ? Math.round(job.salary_range_max / kasPrice) : 0;

  const handleConnect = () => {
    if (job.posted_by_wallet) {
      navigate(createPageUrl('AgentMessages') + `?targetAddress=${job.posted_by_wallet}`);
    } else {
      alert('Unable to connect - job poster has not set up their wallet');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-purple-500/20 text-purple-300">
                  {job.department}
                </Badge>
                <Badge className="bg-cyan-500/20 text-cyan-300">
                  {employmentTypeLabels[job.employment_type]}
                </Badge>
                {job.is_remote && (
                  <Badge className="bg-green-500/20 text-green-300">
                    Remote
                  </Badge>
                )}
              </div>
            </div>
            <Badge className={`${
              job.status === 'active' ? 'bg-green-500/20 text-green-400' :
              job.status === 'closed' ? 'bg-red-500/20 text-red-400' :
              job.status === 'filled' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {job.status}
            </Badge>
          </div>

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
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {job.applications_count} applicants
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
              <Button
                size="sm"
                onClick={handleConnect}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-xs"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Connect
              </Button>
            </div>
          )}

          <p className="text-gray-300 text-sm mb-4 line-clamp-3">
            {job.description}
          </p>

          {job.responsibilities?.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-white text-sm mb-2">Key Responsibilities:</div>
              <ul className="space-y-1">
                {job.responsibilities.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.skills?.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {job.skills.slice(0, 6).map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-black/40 border border-white/10 rounded text-xs text-gray-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
              onClick={() => onEdit(job)}
            >
              View Details
            </Button>
            {job.status === 'active' && (
              <Button
                size="sm"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                onClick={() => onClose(job.id)}
              >
                Close Listing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}