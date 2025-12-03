import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TestZelcorePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testAddress, setTestAddress] = useState("kaspa:qz7ulu4c25dh6qg0xnqt7gkp93m5t4msgz9e94f8kshez7q80q34ysu8qkz0u");
  const [testAmount, setTestAmount] = useState("1");

  const testAPI = async (action) => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await base44.functions.invoke('zelcoreKaspaAPI', {
        action,
        address: testAddress,
        amount: testAmount
      });
      
      console.log('Zelcore API Response:', response.data);
      setResult(response.data);
    } catch (error) {
      console.error('Zelcore API Error:', error);
      setResult({ error: error.message });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔍 Zelcore API Test</h1>
        
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-cyan-400 mb-2 block">Test Address</label>
                <Input
                  value={testAddress}
                  onChange={(e) => setTestAddress(e.target.value)}
                  className="bg-white/5 border-cyan-500/30 text-white"
                  placeholder="kaspa:..."
                />
              </div>
              
              <div>
                <label className="text-sm text-cyan-400 mb-2 block">Test Amount (KAS)</label>
                <Input
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="bg-white/5 border-cyan-500/30 text-white"
                  placeholder="1.0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => testAPI('getBalance')}
                  disabled={loading}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Balance'}
                </Button>
                
                <Button
                  onClick={() => testAPI('getTransactions')}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Transactions'}
                </Button>
                
                <Button
                  onClick={() => testAPI('verifyPayment')}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Payment'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {result.error ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                <h2 className="text-xl font-bold text-white">
                  {result.error ? 'Error' : 'Success'}
                </h2>
              </div>
              
              <pre className="bg-black/40 rounded-lg p-4 text-cyan-400 text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}