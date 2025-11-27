import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, Briefcase, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ListJobModal({ isOpen, onClose, onAdd }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [generatedJob, setGeneratedJob] = useState(null);

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      alert("Please describe the job you want to post");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert HR manager. Create a comprehensive, professional job listing based on this input:

"${userInput}"

Generate a complete job posting with:
- Professional job title
- Engaging job description
- 5-7 key responsibilities
- 5-7 requirements/qualifications
- 5-7 benefits and perks
- Required skills (as tags)
- Salary range estimate
- Department
- Location (or "Remote")
- Employment type

Make it compelling and professional. Include modern tech/crypto benefits if relevant.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            department: { type: "string" },
            location: { type: "string" },
            employment_type: { 
              type: "string",
              enum: ["full_time", "part_time", "contract", "internship"]
            },
            salary_range_min: { type: "number" },
            salary_range_max: { type: "number" },
            description: { type: "string" },
            responsibilities: {
              type: "array",
              items: { type: "string" }
            },
            requirements: {
              type: "array",
              items: { type: "string" }
            },
            benefits: {
              type: "array",
              items: { type: "string" }
            },
            skills: {
              type: "array",
              items: { type: "string" }
            },
            is_remote: { type: "boolean" }
          }
        }
      });

      setGeneratedJob(result);
      setStep(2);
    } catch (err) {
      console.error("Failed to generate job:", err);
      alert("Failed to generate job listing");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onAdd({
        ...generatedJob,
        salary_range_min: parseFloat(generatedJob.salary_range_min) || 0,
        salary_range_max: parseFloat(generatedJob.salary_range_max) || 0
      });
      onClose();
      setUserInput("");
      setGeneratedJob(null);
      setStep(1);
    } catch (err) {
      console.error("Failed to post job:", err);
      alert("Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-900 border border-white/20 rounded-2xl p-4 md:p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto mx-4"
          >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-purple-400" />
              List New Job
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  Describe the job you want to post
                </label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Example: Senior Blockchain Engineer for DeFi platform. Remote, $150k-200k, need Solidity experience..."
                  className="bg-black border-white/20 text-white min-h-32"
                  rows={6}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Job Listing with AI
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-2">{generatedJob.title}</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="text-gray-300">{generatedJob.department}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-300">{generatedJob.location}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-green-400">
                    ${generatedJob.salary_range_min?.toLocaleString()} - ${generatedJob.salary_range_max?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Description</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{generatedJob.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3">Responsibilities</h4>
                  <ul className="space-y-2">
                    {generatedJob.responsibilities?.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3">Requirements</h4>
                  <ul className="space-y-2">
                    {generatedJob.requirements?.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-cyan-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3">Benefits</h4>
                  <ul className="space-y-2">
                    {generatedJob.benefits?.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {generatedJob.skills?.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Regenerate
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Briefcase className="w-4 h-4 mr-2" />
                      Post Job
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}