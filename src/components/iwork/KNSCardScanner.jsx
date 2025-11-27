import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2, CheckCircle2, Scan, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function KNSCardScanner({ onScanComplete }) {
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [knsData, setKnsData] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // Upload file
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;

      // Extract data using LLM vision
      const extractResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all information from this KNS card image. Return structured data including name, wallet address, skills, certifications, and any other relevant information.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            wallet_address: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            certifications: { type: "array", items: { type: "string" } },
            experience_years: { type: "number" },
            verified: { type: "boolean" }
          }
        }
      });

      setKnsData(extractResponse);
      setScanned(true);
      
      if (onScanComplete) {
        onScanComplete(extractResponse);
      }
    } catch (err) {
      console.error("Failed to scan KNS card:", err);
      alert("Failed to scan KNS card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="text-center">
          {!scanned ? (
            <>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4"
              >
                <Scan className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Import Your KNS Card</h3>
              <p className="text-gray-300 mb-6">Upload your KNS card to verify your credentials</p>
              
              <input
                type="file"
                id="kns-upload"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
              <label htmlFor="kns-upload">
                <Button
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 cursor-pointer"
                  asChild
                >
                  <span>
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 mr-2" />
                        Scan KNS Card
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">KNS Card Verified! ✓</h3>
              <div className="text-left mt-6 p-4 bg-black/40 rounded-lg border border-white/10">
                <div className="text-sm text-gray-300 space-y-2">
                  <div><span className="text-gray-400">Name:</span> <span className="font-semibold text-white">{knsData.full_name}</span></div>
                  <div><span className="text-gray-400">Wallet:</span> <span className="font-mono text-xs text-cyan-400">{knsData.wallet_address}</span></div>
                  {knsData.skills?.length > 0 && (
                    <div>
                      <span className="text-gray-400">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {knsData.skills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}