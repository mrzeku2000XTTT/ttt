import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, AlertCircle, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CIVIC_CLIENT_ID = import.meta.env.VITE_CIVIC_CLIENT_ID || "YOUR_CIVIC_CLIENT_ID";

export default function CivicVerifyPage() {
  const [user, setUser] = useState(null);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const civicRef = useRef(null);

  useEffect(() => {
    loadUser();
    checkVerification();
    loadCivicScript();
  }, []);

  const loadCivicScript = () => {
    // Check if already loaded
    if (window.civic) {
      initializeCivic();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://hosted-sip.civic.com/js/civic.sip.min.js';
    script.async = true;
    script.onload = () => {
      setTimeout(initializeCivic, 100); // Small delay to ensure civic is ready
    };
    script.onerror = () => {
      setError('Failed to load Civic SDK. Please refresh the page.');
    };
    document.body.appendChild(script);
  };

  const initializeCivic = () => {
    if (window.civic && CIVIC_CLIENT_ID && CIVIC_CLIENT_ID !== 'YOUR_CIVIC_CLIENT_ID') {
      try {
        civicRef.current = new window.civic.sip({
          appId: CIVIC_CLIENT_ID,
          onSuccess: handleCivicSuccess,
          onError: handleCivicError
        });
        setError(null);
      } catch (err) {
        console.error('Civic initialization error:', err);
        setError('Civic SDK initialization failed: ' + err.message);
      }
    } else {
      setError('Civic SDK not loaded. Please refresh the page.');
    }
  };

  const handleCivicSuccess = async (response) => {
    setVerifying(true);
    try {
      // Verify the Civic token server-side
      const result = await base44.functions.invoke('verifyCivicToken', {
        token: response.token
      });

      if (result.data.verified && result.data.age >= 18) {
        localStorage.setItem('civic_verified', 'true');
        localStorage.setItem('civic_token', response.token);
        setVerified(true);
        setError(null);
        
        setTimeout(() => {
          navigate(createPageUrl('KasFans'));
        }, 1000);
      } else {
        setError('Age verification failed. You must be 18 or older.');
      }
    } catch (err) {
      console.error('Civic verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCivicError = (error) => {
    console.error('Civic error:', error);
    setError('Verification was cancelled or failed.');
    setVerifying(false);
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const checkVerification = async () => {
    const isVerified = localStorage.getItem('civic_verified') === 'true';
    const token = localStorage.getItem('civic_token');
    
    // If they claim to be verified, validate the token is still valid
    if (isVerified && token) {
      try {
        const result = await base44.functions.invoke('verifyCivicToken', { token });
        if (!result.data.verified) {
          // Token is invalid, clear verification
          localStorage.removeItem('civic_verified');
          localStorage.removeItem('civic_token');
          setVerified(false);
          return;
        }
      } catch (err) {
        // If verification fails, clear it
        localStorage.removeItem('civic_verified');
        localStorage.removeItem('civic_token');
        setVerified(false);
        return;
      }
    }
    
    setVerified(isVerified);
  };

  const handleVerify = async () => {
    if (civicRef.current) {
      setVerifying(true);
      civicRef.current.signup();
    } else {
      setError('Civic SDK not loaded. Please refresh the page.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950/30 via-black to-purple-900/25 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl mb-4">
            <Shield className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 text-white">
            Age Verification
          </h1>
          <p className="text-white/50 text-lg">Civic Identity Verification</p>
        </motion.div>

        <Card className="bg-black/40 backdrop-blur-xl border-indigo-500/30">
          <CardContent className="p-8">
            {verified ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verified</h2>
                <p className="text-white/60 mb-6">
                  You've successfully verified your age
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-2 text-white/60">
                    <User className="w-4 h-4" />
                    <span className="text-sm">18+ Verified</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verification Required</h2>
                <p className="text-white/60 mb-6">
                  Verify your age to access KAS Fans
                </p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 text-left">
                  <h3 className="text-white font-semibold mb-3">What you'll need:</h3>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span>Valid government-issued ID</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span>Proof you're 18 years or older</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span>Privacy-protected verification</span>
                    </li>
                  </ul>
                </div>

                <div id="civic-button-container" className="mb-4" />

                <Button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold h-12"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Verify with Civic
                    </>
                  )}
                </Button>

                <p className="text-white/40 text-xs mt-4">
                  Your data is encrypted and never shared
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-white/40 text-sm">
            Powered by Civic Identity Verification
          </p>
        </motion.div>
      </div>
    </div>
  );
}