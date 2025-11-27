import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TestKaspaAPIPage() {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletTest, setWalletTest] = useState(null);
  const [isTestingWallet, setIsTestingWallet] = useState(false);
  const [balanceAddress, setBalanceAddress] = useState('kaspa:qz7ulu4c25dh7fzec9zjyrmlhnkzrg4wmf89q7gzr3gfrsj3uz6xjceef60sd');
  const [balanceResult, setBalanceResult] = useState(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      const { data } = await base44.functions.invoke('testKaspaConnection');
      setTestResults(data);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWalletCreation = async () => {
    setIsTestingWallet(true);
    setWalletTest(null);
    
    try {
      console.log('🔍 Testing wallet creation...');
      const { data } = await base44.functions.invoke('createKaspaWallet', { wordCount: 12 });
      console.log('✅ Response:', data);
      setWalletTest({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('❌ Wallet test failed:', error);
      console.error('❌ Error details:', error.response);
      setWalletTest({
        success: false,
        error: error.message,
        details: error.response?.data || 'No additional details'
      });
    } finally {
      setIsTestingWallet(false);
    }
  };

  const checkBalance = async () => {
    if (!balanceAddress) return;
    
    setIsCheckingBalance(true);
    setBalanceResult(null);
    
    try {
      const { data } = await base44.functions.invoke('getKaspaBalance', { address: balanceAddress });
      setBalanceResult(data);
    } catch (error) {
      console.error('Balance check failed:', error);
      setBalanceResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsCheckingBalance(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Kaspa API Test Suite
            </h1>
            <p className="text-gray-400">
              Test your Replit backend connection and API endpoints
            </p>
          </motion.div>

          {/* Connection Tests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Backend Connection Tests</h2>
              </CardHeader>
              <CardContent className="pt-6">
                <Button
                  onClick={runTests}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 mb-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    'Run Connection Tests'
                  )}
                </Button>

                {testResults && (
                  <div className="space-y-4">
                    {testResults.error ? (
                      <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-300">{testResults.error}</p>
                      </div>
                    ) : (
                      <>
                        {testResults.tests?.map((test, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${
                              test.status === 'PASS'
                                ? 'bg-green-500/20 border-green-500/30'
                                : 'bg-red-500/20 border-red-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {test.status === 'PASS' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-400" />
                                )}
                                <span className={test.status === 'PASS' ? 'text-green-300' : 'text-red-300'}>
                                  {test.name}
                                </span>
                              </div>
                              <Badge className={test.status === 'PASS' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                                {test.status}
                              </Badge>
                            </div>
                            {test.details && (
                              <p className="text-sm text-gray-400 mt-2">{test.details}</p>
                            )}
                            {test.error && (
                              <p className="text-sm text-red-300 mt-2">{test.error}</p>
                            )}
                          </div>
                        ))}

                        {testResults.summary && (
                          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                            <h3 className="text-lg font-bold text-white mb-2">Summary</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-white">{testResults.summary.total}</div>
                                <div className="text-sm text-gray-400">Total</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-green-400">{testResults.summary.passed}</div>
                                <div className="text-sm text-gray-400">Passed</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-red-400">{testResults.summary.failed}</div>
                                <div className="text-sm text-gray-400">Failed</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Wallet Creation Test */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Wallet Creation Test</h2>
              </CardHeader>
              <CardContent className="pt-6">
                <Button
                  onClick={testWalletCreation}
                  disabled={isTestingWallet}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 mb-6"
                >
                  {isTestingWallet ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Testing Wallet Creation...
                    </>
                  ) : (
                    'Test Wallet Creation'
                  )}
                </Button>

                {walletTest && (
                  <div className={`p-4 rounded-lg border ${
                    walletTest.success
                      ? 'bg-green-500/20 border-green-500/30'
                      : 'bg-red-500/20 border-red-500/30'
                  }`}>
                    {walletTest.success ? (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-green-300 font-bold">Wallet Created Successfully!</span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm text-gray-400">Mnemonic:</div>
                            <div className="text-white font-mono text-sm bg-black/20 p-3 rounded mt-1">
                              {walletTest.data.mnemonic}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Word Count:</div>
                            <div className="text-white">{walletTest.data.wordCount}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Network:</div>
                            <div className="text-white">{walletTest.data.network}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="text-red-300 font-bold">Wallet Creation Failed</span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm text-gray-400">Error:</div>
                            <div className="text-red-300 text-sm">{walletTest.error}</div>
                          </div>
                          {walletTest.details && (
                            <div>
                              <div className="text-sm text-gray-400">Details:</div>
                              <div className="text-red-300 text-sm font-mono bg-black/20 p-3 rounded mt-1">
                                {JSON.stringify(walletTest.details, null, 2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Balance Check */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Check Address Balance</h2>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-3 mb-6">
                  <Input
                    value={balanceAddress}
                    onChange={(e) => setBalanceAddress(e.target.value)}
                    placeholder="kaspa:qqq..."
                    className="flex-1 bg-white/5 border-white/10 text-white"
                  />
                  <Button
                    onClick={checkBalance}
                    disabled={isCheckingBalance || !balanceAddress}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    {isCheckingBalance ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Check Balance'
                    )}
                  </Button>
                </div>

                {balanceResult && (
                  <div className={`p-4 rounded-lg border ${
                    balanceResult.success
                      ? 'bg-green-500/20 border-green-500/30'
                      : 'bg-red-500/20 border-red-500/30'
                  }`}>
                    {balanceResult.success ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-green-300 font-bold">Balance Retrieved</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Balance:</div>
                          <div className="text-2xl font-bold text-white">{balanceResult.balanceKAS} KAS</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Source:</div>
                          <div className="text-white text-sm">{balanceResult.source}</div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="text-red-300 font-bold">Balance Check Failed</span>
                        </div>
                        <div className="text-red-300 text-sm">{balanceResult.error}</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}