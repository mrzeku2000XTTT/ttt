import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Shield, CheckCircle2, X, Edit3, Loader2, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function TermsModal({ onAccept, onDecline, isOpen }) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    detectMobile();
  }, []);

  const detectMobile = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    setIsMobile(mobile);
  };

  const checkBiometricAvailability = async () => {
    if (!window.PublicKeyCredential) {
      console.log('WebAuthn not supported');
      setBiometricAvailable(false);
      return;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setBiometricAvailable(available);
      console.log('Biometric available:', available);
    } catch (error) {
      console.error('Error checking biometric:', error);
      setBiometricAvailable(false);
    }
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 50;
    if (bottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  const handleSignWithBiometric = async () => {
    setIsSigning(true);
    try {
      // Get challenge from backend
      const challengeResponse = await base44.functions.invoke('biometricAuth', {
        action: 'challenge'
      });

      if (!challengeResponse.data?.challenge) {
        throw new Error('Failed to get authentication challenge');
      }

      const { challenge, userId, username } = challengeResponse.data;

      // Convert base64 to Uint8Array
      const challengeBuffer = Uint8Array.from(atob(challenge), c => c.charCodeAt(0));
      const userIdBuffer = Uint8Array.from(atob(userId), c => c.charCodeAt(0));

      // REGISTRATION: Create new credential with Face ID
      const publicKeyCredentialCreationOptions = {
        challenge: challengeBuffer,
        rp: {
          name: "TTT - The Trifecta Technologies",
          id: window.location.hostname
        },
        user: {
          id: userIdBuffer,
          name: username,
          displayName: username
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",  // Use device biometrics (Face ID/Touch ID)
          userVerification: "required",         // Require biometric verification
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: "none"
      };

      console.log('🔐 Triggering Face ID / Touch ID registration...');
      
      // This will trigger Face ID / Touch ID prompt on iOS for REGISTRATION
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      console.log('✅ Face ID / Touch ID registration successful!');

      // Convert response to base64
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

      // Verify on backend
      const verifyResponse = await base44.functions.invoke('biometricAuth', {
        action: 'verify',
        credentialId
      });

      if (verifyResponse.data?.success) {
        setSignature(verifyResponse.data.signature);
        setAgreed(true);
        onAccept(verifyResponse.data.signature);
      } else {
        throw new Error('Verification failed');
      }

    } catch (err) {
      console.error('Biometric registration failed:', err);
      
      if (err.name === 'NotAllowedError') {
        alert('Face ID / Touch ID was cancelled or denied. Please try again.');
      } else if (err.name === 'InvalidStateError') {
        alert('Face ID is already registered for this device. Please use Kasware instead.');
      } else if (err.name === 'NotSupportedError') {
        alert('Biometric authentication is not supported on this device.');
      } else {
        alert('Registration failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handleSignWithKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      alert('Kasware wallet not detected. Please install Kasware extension.');
      return;
    }

    setIsSigning(true);
    try {
      const accounts = await window.kasware.getAccounts();
      if (accounts.length === 0) {
        await window.kasware.requestAccounts();
      }

      const termsMessage = `I accept the TTT Terms of Service.

By signing this message, I acknowledge:
- TTT is in ALPHA stage with potential bugs
- I am solely responsible for my private keys and funds
- TTT does not custody or control my funds
- TTT Wallet may display 0 balance as a security feature
- I accept all risks associated with cryptocurrency transactions
- Developers are not liable for any financial losses

Timestamp: ${new Date().toISOString()}`;

      const signedMessage = await window.kasware.signMessage(termsMessage, 'bip322-simple');
      
      setSignature(signedMessage);
      setAgreed(true);
      onAccept(signedMessage);
      
    } catch (err) {
      console.error('Kasware signature failed:', err);
      
      if (err.message?.includes('cancel') || err.message?.includes('reject')) {
        alert('Signature cancelled. Please try again.');
      } else {
        alert('Failed to sign with Kasware. Please try again.');
      }
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            <Card className="bg-black border-white/20 flex flex-col max-h-full">
              <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Terms of Service</h2>
                  <p className="text-xs text-gray-500">Please read and accept to continue</p>
                </div>
                <button
                  onClick={onDecline}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <CardContent 
                className="p-4 md:p-6 overflow-y-auto flex-1"
                onScroll={handleScroll}
                style={{ maxHeight: 'calc(90vh - 220px)' }}
              >
                <div className="space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-200 font-semibold mb-1">Alpha Software</p>
                      <p className="text-xs text-yellow-300">
                        This app is in ALPHA. Features may be unstable. Developers are actively working on improvements.
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-200 font-semibold mb-1">Financial Responsibility</p>
                      <p className="text-xs text-red-300 mb-2">
                        We DO NOT hold or control your funds. You are solely responsible for your private keys, transactions, and any financial losses.
                      </p>
                      <p className="text-xs text-red-200 font-semibold mb-1">⚠️ TTT Wallet Security Feature</p>
                      <p className="text-xs text-red-300">
                        TTT Wallet may display 0 balance as a security measure to protect against hackers. Your funds are safe and can be verified using any other Kaspa wallet app with your seed phrase.
                      </p>
                    </div>
                  </div>

                  <div className="text-gray-300 text-sm space-y-3 leading-relaxed">
                    <p className="font-semibold text-white">By accepting, you acknowledge:</p>
                    
                    <ul className="list-disc ml-5 space-y-2 text-xs">
                      <li>The application is in ALPHA and may contain bugs or incomplete features</li>
                      <li>You are solely responsible for securing your private keys and wallet credentials</li>
                      <li>TTT does not custody, control, or have access to your funds</li>
                      <li>TTT Wallet is a "burner wallet" and may display 0 balance as a security feature to protect against hackers</li>
                      <li>Your actual balance can be verified using any Kaspa wallet app with your seed phrase</li>
                      <li>You accept all risks associated with cryptocurrency transactions</li>
                      <li>The platform is provided "AS IS" without warranties</li>
                      <li>Developers are not liable for any financial losses or damages</li>
                      <li>Features may change, be added, or removed without notice</li>
                      <li>You will not use the app for illegal activities</li>
                      <li>You are responsible for compliance with local laws</li>
                      <li>Third-party services (MetaMask, Kasware, etc.) are not our responsibility</li>
                    </ul>

                    <p className="text-xs text-gray-500 mt-4">
                      <Link to={createPageUrl("Terms")} target="_blank" className="text-cyan-400 hover:underline">
                        Read full Terms of Service →
                      </Link>
                    </p>
                  </div>

                  {!hasScrolled && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 animate-pulse">
                        ↓ Scroll to continue ↓
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>

              <div className="p-4 md:p-6 border-t border-white/10 space-y-3 flex-shrink-0">
                {!signature ? (
                  <>
                    {biometricAvailable && isMobile ? (
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-3">
                        <p className="text-xs text-purple-300 flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Face ID / Touch ID detected! Use biometric authentication for instant secure signing
                        </p>
                      </div>
                    ) : (
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-3">
                        <p className="text-xs text-cyan-300 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Sign with Kasware to cryptographically accept these terms
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={onDecline}
                        variant="outline"
                        className="flex-1 border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                        disabled={isSigning}
                      >
                        Decline
                      </Button>
                      
                      {biometricAvailable && isMobile ? (
                        <Button
                          onClick={handleSignWithBiometric}
                          disabled={!hasScrolled || isSigning}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSigning ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Authenticating...
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-4 h-4 mr-2" />
                              Sign with Face ID
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSignWithKasware}
                          disabled={!hasScrolled || isSigning}
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSigning ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Signing...
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Sign with Kasware
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {biometricAvailable && isMobile && (
                      <div className="text-center">
                        <button
                          onClick={handleSignWithKasware}
                          disabled={!hasScrolled || isSigning}
                          className="text-xs text-gray-500 hover:text-gray-300 underline disabled:opacity-50"
                        >
                          Or sign with Kasware instead
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-300 font-semibold">Terms Signed Successfully!</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {biometricAvailable && isMobile ? 'Authenticated with biometrics' : `Signature: ${signature.substring(0, 20)}...`}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}