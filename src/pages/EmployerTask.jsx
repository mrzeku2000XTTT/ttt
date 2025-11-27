
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Shield, ExternalLink, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EmployerTaskPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [validationDetails, setValidationDetails] = useState(null);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const urlParams = new URLSearchParams(window.location.search);
      const taskId = urlParams.get('id');

      if (!taskId) {
        alert('No task ID provided');
        navigate(createPageUrl("MarketX"));
        return;
      }

      const tasks = await base44.entities.PeraTask.filter({ id: taskId });
      if (tasks.length === 0) {
        alert('Task not found');
        navigate(createPageUrl("MarketX"));
        return;
      }

      const taskData = tasks[0];
      
      if (taskData.employer_id !== currentUser.email) {
        alert('You are not the employer of this task');
        navigate(createPageUrl("MarketX"));
        return;
      }

      setTask(taskData);

      // Parse validation details if available
      if (taskData.proof_validation_details) {
        try {
          const details = JSON.parse(taskData.proof_validation_details);
          setValidationDetails(details);
        } catch (err) {
          console.error('Failed to parse validation details:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm(`Approve this task and grant ${task.tip_amount} KAS to worker?`)) {
      return;
    }

    setIsApproving(true);
    try {
      const response = await base44.functions.invoke('approveTask', {
        taskId: task.id
      });

      if (response.data.success) {
        alert(`✅ ${response.data.message}\n\nMZKey: ${response.data.mzkey}\n\nThe worker can now claim their funds using this key.`);
        navigate(createPageUrl("MarketX"));
      } else {
        alert(response.data.error || 'Failed to approve task');
      }
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Failed to approve task. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Why are you rejecting this proof?');
    if (!reason) return;

    setIsRejecting(true);
    try {
      await base44.entities.PeraTask.update(task.id, {
        status: 'in_progress',
        proof_photos: [],
        proof_links: [],
        proof_description: `REJECTED: ${reason}`
      });

      alert('❌ Proof rejected. Worker has been notified to resubmit.');
      navigate(createPageUrl("MarketX"));
    } catch (err) {
      console.error('Rejection failed:', err);
      alert('Failed to reject proof. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate(createPageUrl("MarketX"))}
          variant="outline"
          className="mb-6 bg-zinc-900 border-zinc-800 text-white"
        >
          ← Back to Market X
        </Button>

        {/* Task Info */}
        <Card className="bg-zinc-950 border-zinc-800 mb-6">
          <CardHeader className="border-b border-zinc-800">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{task.task_name}</h1>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  AWAITING YOUR APPROVAL
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-cyan-400">{task.tip_amount} KAS</div>
                <div className="text-sm text-gray-500">Your Budget</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-1">Original Task Description:</div>
              <p className="text-gray-300">{task.description}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">Funds:</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {task.balance_verified ? 'Secured by MZK Bot' : 'Verifying...'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">AI Score:</span>
                <span className={`font-bold ${task.proof_score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                  {task.proof_score}/100
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Validation Summary - NEW SECTION */}
        {validationDetails && (
          <Card className="bg-gradient-to-br from-purple-950/30 to-black border-purple-500/30 mb-6">
            <CardHeader className="border-b border-purple-500/30">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-400" />
                AI Validation Report
              </h2>
              <p className="text-sm text-gray-400">Advanced multi-modal analysis by MZK Bot</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Overall Score & Recommendation */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/50 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Overall Score</div>
                  <div className="flex items-end gap-2">
                    <div className={`text-4xl font-bold ${
                      validationDetails.overallScore >= 85 ? 'text-green-400' :
                      validationDetails.overallScore >= 70 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {validationDetails.overallScore}
                    </div>
                    <div className="text-2xl text-gray-500 mb-1">/100</div>
                  </div>
                  <div className="mt-2">
                    <Badge className={
                      validationDetails.confidence === 'high' 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : validationDetails.confidence === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }>
                      {validationDetails.confidence.toUpperCase()} CONFIDENCE
                    </Badge>
                  </div>
                </div>

                <div className="bg-black/50 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">AI Recommendation</div>
                  <p className="text-white text-sm leading-relaxed">
                    {validationDetails.recommendation}
                  </p>
                </div>
              </div>

              {/* Key Strengths */}
              {validationDetails.keyStrengths && validationDetails.keyStrengths.length > 0 && (
                <div>
                  <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Key Strengths
                  </h3>
                  <ul className="space-y-2">
                    {validationDetails.keyStrengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Concerns */}
              {validationDetails.keyConcerns && validationDetails.keyConcerns.length > 0 && (
                <div>
                  <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Concerns Identified
                  </h3>
                  <ul className="space-y-2">
                    {validationDetails.keyConcerns.map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-yellow-400 mt-1">⚠</span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Analysis by Category */}
              {validationDetails.detailedAnalysis && (
                <div>
                  <h3 className="text-purple-400 font-semibold mb-3">Detailed Analysis</h3>
                  <div className="space-y-3">
                    {validationDetails.detailedAnalysis.map((analysis, idx) => (
                      <div key={idx} className="bg-black/30 border border-purple-500/20 rounded-lg p-3">
                        <div className="font-semibold text-purple-300 mb-2">{analysis.category}</div>
                        <p className="text-gray-400 text-sm">{analysis.feedback}</p>
                        
                        {analysis.requirementsMet && analysis.requirementsMet.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-green-400 font-semibold mb-1">Requirements Met:</div>
                            <div className="flex flex-wrap gap-1">
                              {analysis.requirementsMet.map((req, i) => (
                                <Badge key={i} className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.requirementsMissing && analysis.requirementsMissing.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-red-400 font-semibold mb-1">Missing Requirements:</div>
                            <div className="flex flex-wrap gap-1">
                              {analysis.requirementsMissing.map((req, i) => (
                                <Badge key={i} className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Proof Review */}
        <Card className="bg-zinc-950 border-zinc-800 mb-6">
          <CardHeader className="border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">Worker's Proof of Work</h2>
            <p className="text-sm text-gray-400">Review the proof and decide whether to approve</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-white font-semibold mb-2">Work Description:</h3>
              <div className="bg-black border border-zinc-700 rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-wrap">{task.proof_description || 'No description provided'}</p>
              </div>
            </div>

            {/* Photos */}
            {task.proof_photos && task.proof_photos.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Proof Photos ({task.proof_photos.length}):
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {task.proof_photos.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="group">
                      <img 
                        src={url} 
                        alt={`Proof ${idx + 1}`} 
                        className="w-full h-48 object-cover rounded-lg border border-zinc-700 group-hover:border-cyan-500 transition-colors"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {task.proof_links && task.proof_links.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Proof Links ({task.proof_links.length}):
                </h3>
                <div className="space-y-2">
                  {task.proof_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* AI Validation Score */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-purple-400 font-semibold mb-2">AI Validation Score:</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-300">Overall Score</span>
                <span className={`text-3xl font-bold ${task.proof_score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                  {task.proof_score}/100
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {task.proof_score >= 70 
                  ? '✅ AI has validated this proof as meeting minimum requirements'
                  : '❌ AI score is below 70/100 threshold, but you can still approve if you trust the work'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={handleReject}
            disabled={isRejecting || isApproving}
            className="h-16 bg-red-500/20 border-2 border-red-500/30 text-red-400 hover:bg-red-500/30 font-semibold text-lg"
          >
            {isRejecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 mr-2" />
                Reject Proof
              </>
            )}
          </Button>

          <Button
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            className="h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-lg shadow-lg shadow-green-500/50"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Approve & Release Funds
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-300 text-sm">
            ⚠️ <strong>Warning:</strong> Once you approve, the worker will receive an MZKey that allows them to claim the funds. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}
