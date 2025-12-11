import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Flame, X, ArrowLeft, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";
import ProofOfBullishReels from "@/components/ProofOfBullishReels";

export default function ProofOfBullishPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [proofs, setProofs] = useState([]);
  const [kaswareAddress, setKaswareAddress] = useState(null);
  const [showKaswareModal, setShowKaswareModal] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showZkVerification, setShowZkVerification] = useState(false);
  const [zkAmount, setZkAmount] = useState('');
  const [zkVerifying, setZkVerifying] = useState(false);
  const [zkWalletBalance, setZkWalletBalance] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedReelIndex, setSelectedReelIndex] = useState(null);
  const [showReels, setShowReels] = useState(false);

  useEffect(() => {
    loadProofs();
    checkKasware();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser?.created_wallet_address) {
        loadZkWalletBalance(currentUser.created_wallet_address);
      }
    } catch (err) {
      console.log('User not logged in');
    }
  };

  const loadZkWalletBalance = async (address) => {
    try {
      const response = await base44.functions.invoke('getKaspaBalance', { address });
      if (response.data?.balance) {
        setZkWalletBalance(response.data.balance);
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const checkKasware = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          setKaswareAddress(accounts[0]);
        }
      } catch (err) {
        console.error('Kasware check failed:', err);
      }
    }
  };

  const loadProofs = async () => {
    try {
      const data = await base44.entities.ProofOfBullish.list('-created_date', 200);
      setProofs(data);
    } catch (err) {
      console.error('Failed to load proofs:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('File too large. Max 50MB.');
      return;
    }

    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.floor(video.duration);
        setVideoDuration(duration);
        
        if (duration > 60) {
          alert('Please trim your video to 60 seconds or less');
          return;
        }
      };
      video.src = URL.createObjectURL(file);
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;
    
    if (!selectedFile.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }

    if (videoDuration > 60) {
      alert('Please trim your video to 60 seconds or less');
      return;
    }
    
    setIsUploading(true);
    try {
      const uploadResponse = await base44.integrations.Core.UploadFile({ 
        file: selectedFile 
      });
      
      if (!uploadResponse?.file_url) {
        throw new Error('Upload failed');
      }
      
      setUploadedFileUrl(uploadResponse.file_url);
      setShowKaswareModal(true);
      
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      alert('Kasware wallet not detected. Please install Kasware extension.');
      return;
    }

    try {
      const accounts = await window.kasware.requestAccounts();
      if (accounts.length > 0) {
        setKaswareAddress(accounts[0]);
      }
    } catch (err) {
      console.error('Kasware connection failed:', err);
      alert('Failed to connect Kasware');
    }
  };

  const sendKASTransaction = async () => {
    if (!kaswareAddress) {
      alert('Please connect Kasware first');
      return;
    }

    try {
      const txResponse = await window.kasware.sendKaspa(kaswareAddress, 100000000);
      
      let txid;
      if (typeof txResponse === 'string') {
        try {
          const parsed = JSON.parse(txResponse);
          txid = parsed.id;
        } catch {
          txid = txResponse;
        }
      } else if (txResponse && typeof txResponse === 'object') {
        txid = txResponse.id;
      }
      
      if (!txid || !/^[a-f0-9]{64}$/i.test(txid)) {
        console.error('Invalid transaction ID format:', txid);
        alert('Failed to get valid transaction ID');
        return;
      }
      
      setTxHash(txid);
      
      setTimeout(() => {
        handleFinalSubmit(txid);
      }, 2000);
      
    } catch (err) {
      console.error('Transaction failed:', err);
      alert('Transaction failed. Please try again.');
    }
  };

  const handleFinalSubmit = async (transactionHash) => {
    const cleanTxHash = typeof transactionHash === 'string' ? transactionHash : transactionHash?.id || '';
    
    if (!uploadedFileUrl || !selectedFile || !cleanTxHash) {
      alert('Error: Missing required data. Please try again.');
      return;
    }
    
    try {
      const proofData = {
        media_url: uploadedFileUrl,
        media_type: 'video',
        message: message || 'Bullish AF 🚀',
        proof_link: proofLink || '',
        transaction_hash: cleanTxHash,
        kasware_address: kaswareAddress || user?.created_wallet_address || 'ZK_VERIFIED',
        video_duration: videoDuration || 0
      };

      await base44.entities.ProofOfBullish.create(proofData);

      setSelectedFile(null);
      setMessage("");
      setProofLink("");
      setUploadedFileUrl(null);
      setTxHash(null);
      setShowKaswareModal(false);
      setShowZkVerification(false);
      setZkVerifying(false);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-[200] bg-black border border-white/20 text-white px-4 py-3 rounded-lg shadow-lg';
      notification.textContent = 'Proof submitted successfully! 🚀';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
      await loadProofs();
      
    } catch (err) {
      console.error('Submit error:', err);
      alert(`Failed to submit proof: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleZkVerification = async () => {
    if (!user?.created_wallet_address) {
      alert('Please connect your TTT wallet first');
      return;
    }

    if (!zkAmount || parseFloat(zkAmount) <= 0) {
      alert('Please enter a valid KAS amount');
      return;
    }

    const timestamp = Date.now();
    setZkVerifying(true);

    try {
      const targetAmount = parseFloat(zkAmount);
      let attempts = 0;
      const maxAttempts = 200;

      const checkTransaction = async () => {
        attempts++;

        try {
          const response = await base44.functions.invoke('verifyKaspaSelfTransaction', {
            address: user.created_wallet_address,
            expectedAmount: targetAmount,
            timestamp: timestamp
          });

          if (response.data?.verified && response.data?.transaction) {
            setTxHash(response.data.transaction.id);
            setZkVerifying(false);
            
            setTimeout(() => {
              handleFinalSubmit(response.data.transaction.id);
            }, 500);

            return true;
          }

          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            alert('Verification timeout. Transaction not detected within 10 minutes.');
          }
        } catch (err) {
          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            alert('Failed to verify transaction after multiple attempts.');
          }
        }
      };

      checkTransaction();
    } catch (err) {
      setZkVerifying(false);
      alert('Verification failed to start. Please try again.');
    }
  };

  const videoProofs = proofs.filter(p => p.media_type === 'video');

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          onClick={() => navigate(createPageUrl('Singularity'))}
          variant="ghost"
          className="text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Singularity
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 border border-orange-500/30 rounded-2xl mb-4">
            <Flame className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">
            Bull Reels
          </h1>
          <p className="text-white/50 text-lg">Show your conviction 🚀</p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/60 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 mb-8"
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="proof-upload"
          />

          {selectedFile ? (
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-white/40 text-xs">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    {videoDuration > 0 && ` • ${videoDuration}s`}
                    {videoDuration > 60 && (
                      <span className="text-red-400 ml-2">⚠️ Trim to 60s</span>
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    setVideoDuration(0);
                  }}
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why are you bullish? 🚀"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 resize-none"
                rows={2}
              />

              <Input
                value={proofLink}
                onChange={(e) => setProofLink(e.target.value)}
                placeholder="Proof link (optional)"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 text-sm"
              />

              <Button
                onClick={handleUpload}
                disabled={isUploading || (videoDuration > 60)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-10 font-semibold disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 mr-2" />
                    Submit Proof
                  </>
                )}
              </Button>
            </div>
          ) : (
            <label htmlFor="proof-upload" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/10 rounded-xl hover:border-orange-500/50 transition-colors">
                <Upload className="w-12 h-12 text-orange-400 mb-4" />
                <p className="text-white font-semibold mb-2">Upload Your Bull Reel</p>
                <p className="text-white/40 text-sm">Click to select a video (max 60s, 50MB)</p>
              </div>
            </label>
          )}
        </motion.div>

        {/* Reels Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videoProofs.map((proof, index) => (
            <motion.div
              key={proof.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                setSelectedReelIndex(index);
                setShowReels(true);
              }}
              className="relative aspect-[9/16] bg-black/40 rounded-xl overflow-hidden cursor-pointer group"
            >
              <video
                src={proof.media_url}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium line-clamp-2">{proof.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {videoProofs.length === 0 && (
          <div className="text-center py-12">
            <Flame className="w-16 h-16 text-orange-400/30 mx-auto mb-4" />
            <p className="text-white/40">No reels yet. Be the first to share your conviction!</p>
          </div>
        )}

        {/* Kasware Modal */}
        {showKaswareModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold text-white mb-4">Prove Your Conviction</h3>
              <p className="text-white/60 mb-6">Send 1 KAS to yourself to verify</p>

              {!kaswareAddress ? (
                <div className="space-y-3">
                  <Button
                    onClick={connectKasware}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 font-semibold"
                  >
                    Connect Kasware
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-black/90 px-2 text-white/40">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setShowKaswareModal(false);
                      setShowZkVerification(true);
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white h-12 font-semibold"
                  >
                    Use ZK Verification
                  </Button>
                </div>
              ) : !txHash ? (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1">Your Address</p>
                    <p className="text-white text-sm font-mono break-all">{kaswareAddress}</p>
                  </div>
                  <Button
                    onClick={sendKASTransaction}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 font-semibold"
                  >
                    Send 1 KAS
                  </Button>
                  <Button
                    onClick={() => setShowKaswareModal(false)}
                    variant="outline"
                    className="w-full border-white/10 text-white/60"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Flame className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-green-400 font-semibold mb-2">Transaction Confirmed!</p>
                  <p className="text-white/40 text-sm mb-4">Submitting your proof...</p>
                  <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ZK Verification Modal */}
        {showZkVerification && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold text-white mb-2">ZK Verification</h3>
              <p className="text-white/60 text-sm mb-6">Send KAS to yourself in Kaspium</p>

              {!zkVerifying ? (
                <div className="space-y-4">
                  {zkWalletBalance !== null && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-white/40 text-xs mb-1">Current Balance</p>
                      <p className="text-white text-lg font-bold">{zkWalletBalance.toFixed(2)} KAS</p>
                    </div>
                  )}

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white/40 text-xs mb-1">Your TTT Wallet</p>
                    <p className="text-white text-sm font-mono break-all">
                      {user?.created_wallet_address}
                    </p>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Amount to send yourself</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={zkAmount}
                      onChange={(e) => setZkAmount(e.target.value)}
                      placeholder="1.00"
                      className="bg-white/5 border-white/10 text-white placeholder-white/30"
                    />
                  </div>

                  <Button
                    onClick={handleZkVerification}
                    disabled={!zkAmount || parseFloat(zkAmount) <= 0}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white h-12 font-semibold disabled:opacity-50"
                  >
                    Start Verification
                  </Button>

                  <Button
                    onClick={() => {
                      setShowZkVerification(false);
                      setZkAmount('');
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white/60"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-cyan-400 font-semibold mb-2">Waiting for Transaction...</p>
                  <p className="text-white/60 text-sm mb-4">Send {zkAmount} KAS to yourself</p>
                  <Button
                    onClick={() => {
                      setZkVerifying(false);
                      setShowZkVerification(false);
                      setZkAmount('');
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white/60 mt-4"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reels Viewer */}
        {showReels && selectedReelIndex !== null && (
          <ProofOfBullishReels
            videos={videoProofs}
            initialIndex={selectedReelIndex}
            onClose={() => {
              setShowReels(false);
              setSelectedReelIndex(null);
            }}
          />
        )}
      </div>
    </div>
  );
}