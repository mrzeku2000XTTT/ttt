import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function TestJobAPIPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testAPI = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('🧪 Testing getJobListings API...');
      const response = await base44.functions.invoke('getJobListings', {});
      console.log('✅ Response:', response);
      
      setResult(response.data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Test Job API</h1>
        
        <Button
          onClick={testAPI}
          disabled={isLoading}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 mb-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test getJobListings API'
          )}
        </Button>

        {error && (
          <Card className="bg-red-500/10 border-red-500/30 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-red-400 font-semibold mb-1">Error</div>
                  <div className="text-gray-300 text-sm">{error}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="bg-green-500/10 border-green-500/30 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-green-400 font-semibold mb-1">Success</div>
                  <div className="text-gray-300 text-sm">
                    Found {result.total || 0} jobs
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-lg p-4 overflow-auto">
                <pre className="text-xs text-gray-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {result?.jobs && result.jobs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Job Listings</h2>
            {result.jobs.map((job) => (
              <Card key={job.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <h3 className="text-white font-bold mb-2">{job.title}</h3>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>📍 {job.location}</div>
                    <div>💰 ${job.salary_range_min?.toLocaleString()} - ${job.salary_range_max?.toLocaleString()}</div>
                    <div>👤 Posted by: {job.posted_by_username}</div>
                    {job.poster_profile && (
                      <div className="mt-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded">
                        <div className="text-cyan-400 font-semibold">
                          Profile: {job.poster_profile.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          {job.poster_profile.agent_zk_id}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}