
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Link as LinkIcon, FileText, CheckCircle2, AlertCircle, Shield, Copy, Eye, EyeOff, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WorkerTaskPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Proof submission
  const [proofPhotos, setProofPhotos] = useState([]);
  const [proofLinks, setProofLinks] = useState("");
  const [proofDescription, setProofDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState(null); // NEW: State for validation feedback

  // Claiming
  const [mzkey, setMzkey] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [showSeed, setShowSeed] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);

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
      
      if (taskData.worker_id !== currentUser.email) {
        alert('You are not assigned to this task');
        navigate(createPageUrl("MarketX"));
        return;
      }

      setTask(taskData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setProofPhotos([...proofPhotos, ...uploadedUrls]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofDescription.trim()) {
      alert('Please provide a description of your work');
      return;
    }

    setIsSubmitting(true);
    setValidationFeedback(null); // NEW: Reset feedback on new submission
    
    try {
      const links = proofLinks.split('\n').filter(l => l.trim());
      
      const response = await base44.functions.invoke('validateProof', {
        taskId: task.id,
        photos: proofPhotos,
        links: links,
        description: proofDescription
      });

      if (response.data.success) {
        setValidationFeedback(response.data); // NEW: Store validation feedback
        
        if (response.data.passed) {
          alert('✅ ' + response.data.message);
          setTimeout(() => { // NEW: Delay navigation for user to see alert
            navigate(createPageUrl("MarketX"));
          }, 2000);
        } else {
          alert('⚠️ ' + response.data.message + '\n\nPlease review the detailed feedback below and improve your submission.');
          // Reload to show updated score
          loadData();
        }
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimFunds = async () => {
    if (!mzkey.trim()) {
      alert('Please enter your MZKey');
      return;
    }

    setIsClaiming(true);
    try {
      const response = await base44.functions.invoke('claimPeraFunds', {
        taskId: task.id,
        mzkey: mzkey
      });

      if (response.data.success) {
        setClaimResult(response.data);
        setMzkey("");
      } else {
        alert(response.data.error || 'Failed to claim funds');
      }
    } catch (err) {
      console.error('Claim failed:', err);
      alert('Failed to claim funds. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const copySeed = async () => {
    try {
      await navigator.clipboard.writeText(claimResult.seedPhrase);
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    } catch (err) {
      console.error('Copy failed');
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
                <Badge className={
                  task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  task.status === 'awaiting_approval' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  task.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }>
                  {task.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-cyan-400">{task.tip_amount} KAS</div>
                <div className="text-sm text-gray-500">Reward</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-300 mb-4">{task.description}</p>
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4 text-green-400" />
              <span>MZK Bot monitoring:</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {task.balance_verified ? 'Funds Secured' : 'Checking...'}
              </Badge>
            </div>

            {task.proof_score && (
              <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-semibold">Current Proof Score:</span>
                  <span className="text-2xl font-bold text-purple-400">{task.proof_score}/100</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {task.proof_score >= 70 ? '✅ Your proof has been submitted for approval!' : '❌ Score too low. Please improve and resubmit.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Feedback - NEW SECTION */}
        {validationFeedback && !validationFeedback.passed && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
            <CardHeader className="border-b border-yellow-500/30">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                Validation Feedback - Score: {validationFeedback.score}/100
              </h2>
              <p className="text-sm text-yellow-300">Your proof needs improvement to meet the 70/100 threshold</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Checks Breakdown */}
              <div className="space-y-3">
                {validationFeedback.checks.map((check, idx) => (
                  <div key={idx} className="bg-black/30 border border-yellow-500/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{check.check}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          check.passed ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {check.points}/{check.maxPoints || check.points}
                        </span>
                        {check.passed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    </div>
                    {check.feedback && (
                      <p className="text-sm text-gray-400 mb-2">{check.feedback}</p>
                    )}
                    {check.breakdown && (
                      <div className="text-xs text-gray-500 space-y-1">
                        {Object.entries(check.breakdown).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span>{key.replace(/_/g, ' ')}:</span>
                            <span className="font-mono">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Employer Summary */}
              {validationFeedback.employerSummary && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-purple-400 font-semibold mb-3">What Employers Will See:</h3>
                  <p className="text-sm text-gray-300 mb-3">{validationFeedback.employerSummary.recommendation}</p>
                  
                  {validationFeedback.employerSummary.keyConcerns?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-red-400 font-semibold mb-2">Main Concerns:</div>
                      <ul className="space-y-1">
                        {validationFeedback.employerSummary.keyConcerns.map((concern, idx) => (
                          <li key={idx} className="text-sm text-red-300 flex items-start gap-2">
                            <span>•</span>
                            <span>{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-cyan-400">
                    💡 Tip: Address these concerns to improve your score and get approved faster!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Proof Submission (only if in_progress) */}
        {task.status === 'in_progress' && (
          <Card className="bg-zinc-950 border-zinc-800 mb-6">
            <CardHeader className="border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">Submit Proof of Work</h2>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Photo Upload */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block font-semibold">
                  Upload Photos (Screenshots, Images)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={isUploading}
                />
                <label htmlFor="photo-upload">
                  <Button
                    as="span"
                    variant="outline"
                    className="w-full bg-black border-zinc-700 text-white hover:bg-zinc-900"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photos
                      </>
                    )}
                  </Button>
                </label>
                
                {proofPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {proofPhotos.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-24 object-cover rounded border border-zinc-700" />
                        <button
                          onClick={() => setProofPhotos(proofPhotos.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block font-semibold">
                  Proof Links (one per line)
                </label>
                <Textarea
                  value={proofLinks}
                  onChange={(e) => setProofLinks(e.target.value)}
                  placeholder="https://twitter.com/...\nhttps://example.com/..."
                  className="bg-black border-zinc-700 text-white h-24 font-mono text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block font-semibold">
                  Work Description *
                </label>
                <Textarea
                  value={proofDescription}
                  onChange={(e) => setProofDescription(e.target.value)}
                  placeholder="Describe what you did, how you completed the task, and provide context for your proof..."
                  className="bg-black border-zinc-700 text-white h-32"
                />
              </div>

              <Button
                onClick={handleSubmitProof}
                disabled={isSubmitting || !proofDescription.trim()}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Validating Proof...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Submit Proof
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Claim Funds (only if completed and not claimed) */}
        {task.status === 'completed' && !task.funds_claimed && !claimResult && (
          <Card className="bg-gradient-to-br from-green-950/30 to-black border-green-500/30">
            <CardHeader className="border-b border-green-500/30">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                Task Approved! Claim Your Funds
              </h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-300">
                Your work has been approved! Enter your MZKey to unlock the wallet seed phrase and claim your {task.tip_amount} KAS.
              </p>

              <div>
                <label className="text-sm text-gray-400 mb-2 block font-semibold">
                  MZKey (check your Agent ZK secrets or email)
                </label>
                <Input
                  value={mzkey}
                  onChange={(e) => setMzkey(e.target.value)}
                  placeholder="mzkey_..."
                  className="bg-black border-zinc-700 text-white font-mono"
                />
              </div>

              <Button
                onClick={handleClaimFunds}
                disabled={isClaiming || !mzkey.trim()}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Claim Funds
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Claim Result */}
        {claimResult && (
          <Card className="bg-gradient-to-br from-green-950/30 to-black border-green-500/30">
            <CardHeader className="border-b border-green-500/30">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                Funds Unlocked! 🎉
              </h2>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 font-semibold mb-2">
                  ✅ {claimResult.message}
                </p>
                <p className="text-sm text-gray-400">
                  Wallet Address: <span className="font-mono text-green-400">{claimResult.walletAddress}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Amount: <span className="font-bold text-green-400">{claimResult.amount} KAS</span>
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-300 font-semibold mb-2">⚠️ {claimResult.warning}</p>
                <div className="text-xs text-gray-400 space-y-1">
                  {claimResult.instructions.map((instruction, idx) => (
                    <p key={idx}>{instruction}</p>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400 font-semibold">Seed Phrase:</label>
                  <div className="flex gap-2">
                    <Button
                      onClick={copySeed}
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                    >
                      {copiedSeed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowSeed(!showSeed)}
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                    >
                      {showSeed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                {showSeed ? (
                  <div className="bg-black border border-zinc-700 rounded-lg p-4">
                    <p className="text-white font-mono text-sm break-all">{claimResult.seedPhrase}</p>
                  </div>
                ) : (
                  <div className="bg-black border border-zinc-700 rounded-lg p-4 text-center">
                    <EyeOff className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Click eye icon to reveal</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
