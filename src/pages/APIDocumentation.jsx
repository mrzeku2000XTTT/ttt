import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Copy, CheckCircle2, FileText, Server, Lock, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function APIDocumentationPage() {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-950 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Admin Access Only</h2>
            <p className="text-gray-400 mb-6">This page is restricted to administrators.</p>
            <Button
              onClick={() => window.history.back()}
              className="bg-cyan-500 text-white"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      title: "1. Create Wallet",
      method: "POST",
      path: "/api/wallet/create",
      auth: "Required",
      description: "Creates a new Kaspa wallet with mnemonic seed phrase",
      request: {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "kaspa-YOUR-API-KEY-HERE",
          "Accept": "application/json"
        },
        body: {
          wordCount: 12
        }
      },
      expectedResponse: {
        success: true,
        mnemonic: "abandon ability able about above absent absorb abstract absurd abuse access accident",
        wordCount: 12,
        network: "mainnet"
      },
      notes: [
        "wordCount can be 12 or 24 (optional, defaults to 12)",
        "Mnemonic should be BIP39 compatible",
        "Should work for both mainnet and testnet"
      ]
    },
    {
      title: "2. Get Balance",
      method: "GET",
      path: "/balance/:address",
      auth: "Required",
      description: "Retrieves balance for a Kaspa address",
      request: {
        headers: {
          "X-API-Key": "kaspa-YOUR-API-KEY-HERE",
          "Accept": "application/json"
        },
        params: {
          address: "kaspa:qz7ulu4c25dh7fzec9zjyrmlhnkzrg4wmf89q7gzr3gfrsj3uz6xjceef60sd"
        }
      },
      expectedResponse: {
        success: true,
        address: "kaspa:qz7ulu4c25dh7fzec9zjyrmlhnkzrg4wmf89q7gzr3gfrsj3uz6xjceef60sd",
        balance: 123456789,
        balanceKAS: 1.23456789
      },
      notes: [
        "balance is in sompi (1 KAS = 100,000,000 sompi)",
        "balanceKAS is the human-readable amount",
        "Address must start with 'kaspa:'"
      ]
    },
    {
      title: "3. Get UTXOs",
      method: "POST",
      path: "/api/utxos",
      auth: "Required",
      description: "Retrieves unspent transaction outputs for an address",
      request: {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "kaspa-YOUR-API-KEY-HERE",
          "Accept": "application/json"
        },
        body: {
          address: "kaspa:qz7ulu4c25dh7fzec9zjyrmlhnkzrg4wmf89q7gzr3gfrsj3uz6xjceef60sd"
        }
      },
      expectedResponse: {
        success: true,
        utxos: [
          {
            txId: "abc123...",
            outputIndex: 0,
            amount: 100000000,
            scriptPublicKey: "..."
          }
        ],
        total: 1
      },
      notes: [
        "UTXOs are needed for creating transactions",
        "Each UTXO contains txId, outputIndex, amount, and scriptPublicKey",
        "amount is in sompi"
      ]
    },
    {
      title: "4. Broadcast Transaction",
      method: "POST",
      path: "/api/broadcast",
      auth: "Required",
      description: "Broadcasts a signed transaction to the Kaspa network",
      request: {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "kaspa-YOUR-API-KEY-HERE",
          "Accept": "application/json"
        },
        body: {
          transaction: {
            version: 0,
            inputs: [],
            outputs: [],
            lockTime: 0
          }
        }
      },
      expectedResponse: {
        success: true,
        transactionId: "abc123def456..."
      },
      notes: [
        "Transaction must be fully signed before broadcasting",
        "Returns the transaction ID on success",
        "Transaction format must match Kaspa protocol"
      ]
    },
    {
      title: "5. Get KAS Price",
      method: "GET",
      path: "/kas-price",
      auth: "Public",
      description: "Gets current KAS price in USD",
      request: {
        headers: {
          "Accept": "application/json"
        }
      },
      expectedResponse: {
        success: true,
        price: 0.123456,
        currency: "USD",
        source: "CoinGecko",
        timestamp: "2025-01-21T10:00:00Z"
      },
      notes: [
        "Public endpoint - no API key needed",
        "Price is in USD",
        "Updated from CoinGecko API"
      ]
    },
    {
      title: "6. Get Transaction Details",
      method: "GET",
      path: "/transaction/:txId",
      auth: "Required",
      description: "Gets details of a specific transaction",
      request: {
        headers: {
          "X-API-Key": "kaspa-YOUR-API-KEY-HERE",
          "Accept": "application/json"
        },
        params: {
          txId: "abc123def456..."
        }
      },
      expectedResponse: {
        success: true,
        transaction: {
          txId: "abc123def456...",
          blockHash: "def789...",
          confirmations: 10,
          timestamp: "2025-01-21T10:00:00Z",
          inputs: [],
          outputs: []
        }
      },
      notes: [
        "Returns full transaction details",
        "Includes confirmations count",
        "Shows all inputs and outputs"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Kaspa Backend API Documentation</h1>
                <p className="text-gray-400 text-sm">What Base44 expects from Replit backend</p>
              </div>
            </div>
          </motion.div>

          {/* API Base Info */}
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 mb-6">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Base Configuration</h2>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Base URL</div>
                  <div className="text-white font-mono text-sm">https://nodejs-TTT.replit.app</div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Authentication Header</div>
                  <div className="text-white font-mono text-sm">X-API-Key: kaspa-{'{YOUR-KEY}'}</div>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-yellow-200 text-sm">
                  <p className="font-semibold mb-2">⚠️ Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-300 ml-2">
                    <li>All responses must include <code className="bg-black/30 px-1 rounded">success: true</code> flag</li>
                    <li>Error responses should have <code className="bg-black/30 px-1 rounded">success: false</code> with error message</li>
                    <li>All numeric values (balances, amounts) must be numbers, not strings</li>
                    <li>Timestamps should be ISO 8601 format</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints */}
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={`${
                          endpoint.method === 'GET' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-white font-mono text-sm">{endpoint.path}</code>
                      </div>
                      <Badge variant="outline" className={`${
                        endpoint.auth === 'Required' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        'bg-green-500/20 text-green-300 border-green-500/30'
                      }`}>
                        {endpoint.auth === 'Required' ? '🔒 Auth Required' : '🔓 Public'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-3">{endpoint.title}</h3>
                    <p className="text-gray-400 text-sm">{endpoint.description}</p>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Request */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold text-sm">Request Format</h4>
                        <Button
                          onClick={() => handleCopy(JSON.stringify(endpoint.request, null, 2), `req-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white h-6"
                        >
                          {copiedIndex === `req-${index}` ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Copied!</>
                          ) : (
                            <><Copy className="w-3 h-3 mr-1" /> Copy</>
                          )}
                        </Button>
                      </div>
                      <div className="bg-black/50 p-4 rounded-lg border border-white/10 overflow-x-auto">
                        <pre className="text-xs text-gray-300 font-mono">
                          {JSON.stringify(endpoint.request, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Expected Response */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold text-sm">Expected Response</h4>
                        <Button
                          onClick={() => handleCopy(JSON.stringify(endpoint.expectedResponse, null, 2), `res-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white h-6"
                        >
                          {copiedIndex === `res-${index}` ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Copied!</>
                          ) : (
                            <><Copy className="w-3 h-3 mr-1" /> Copy</>
                          )}
                        </Button>
                      </div>
                      <div className="bg-black/50 p-4 rounded-lg border border-green-500/30 overflow-x-auto">
                        <pre className="text-xs text-green-300 font-mono">
                          {JSON.stringify(endpoint.expectedResponse, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Notes */}
                    {endpoint.notes && endpoint.notes.length > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <h4 className="text-blue-200 font-semibold text-sm mb-2">📝 Important Notes:</h4>
                        <ul className="list-disc list-inside space-y-1 text-blue-300 text-xs ml-2">
                          {endpoint.notes.map((note, i) => (
                            <li key={i}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Error Response Format */}
          <Card className="backdrop-blur-xl bg-red-500/10 border-red-500/30 mt-8">
            <CardHeader className="border-b border-red-500/20">
              <h2 className="text-xl font-bold text-red-300">Error Response Format</h2>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-red-200 mb-4">All error responses should follow this format:</p>
              <div className="bg-black/50 p-4 rounded-lg border border-red-500/30">
                <pre className="text-xs text-red-300 font-mono">
{`{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE", // Optional
  "details": {} // Optional additional details
}`}
                </pre>
              </div>
              <div className="mt-4 text-red-200 text-sm">
                <p className="font-semibold mb-2">Common HTTP Status Codes:</p>
                <ul className="list-disc list-inside space-y-1 text-red-300 ml-2">
                  <li><code>200</code> - Success</li>
                  <li><code>400</code> - Bad Request (invalid parameters)</li>
                  <li><code>401</code> - Unauthorized (invalid/missing API key)</li>
                  <li><code>404</code> - Not Found (resource doesn't exist)</li>
                  <li><code>500</code> - Internal Server Error</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}