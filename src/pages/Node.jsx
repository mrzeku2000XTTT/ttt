import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Network, Wifi, WifiOff, Activity, Server, 
  Database, RefreshCw, Play, Square, Settings,
  ArrowUpRight, ArrowDownLeft, Clock, Shield
} from "lucide-react";

export default function NodePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wsUrl, setWsUrl] = useState("wss://neutrino-10.kaspa.stream/kaspa/testnet-10/wrpc/borsh");
  const [customUrl, setCustomUrl] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [nodeInfo, setNodeInfo] = useState(null);
  const [blockCount, setBlockCount] = useState(null);
  const [lastBlockTime, setLastBlockTime] = useState(null);
  const [connectionLog, setConnectionLog] = useState([]);
  const [ws, setWs] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [connectionLog]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLog(prev => [...prev.slice(-99), { timestamp, message, type }]);
  };

  const connectToNode = async () => {
    setIsConnecting(true);
    const url = useCustom ? customUrl : wsUrl;
    
    try {
      addLog(`Connecting to ${url}...`, "info");
      
      const websocket = new WebSocket(url);
      
      websocket.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        addLog("Connected to Kaspa node!", "success");
        setWs(websocket);
        getNodeInfo(websocket);
      };
      
      websocket.onclose = () => {
        setIsConnected(false);
        setWs(null);
        addLog("Disconnected from node", "warning");
      };
      
      websocket.onerror = (error) => {
        setIsConnected(false);
        setIsConnecting(false);
        addLog(`Connection error: ${error.message}`, "error");
      };
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleNodeMessage(data);
        } catch (e) {
          // Binary data or non-JSON
        }
      };
      
    } catch (error) {
      setIsConnecting(false);
      addLog(`Failed to connect: ${error.message}`, "error");
    }
  };

  const disconnectFromNode = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
      addLog("Disconnected manually", "warning");
    }
  };

  const getNodeInfo = (websocket) => {
    // Send RPC request for system info
    const requestId = Date.now();
    const message = {
      jsonrpc: "2.0",
      id: requestId,
      method: "get_info",
      params: {}
    };
    
    try {
      websocket.send(JSON.stringify(message));
      addLog("Requesting node info...", "info");
    } catch (error) {
      addLog(`Failed to send request: ${error.message}`, "error");
    }
  };

  const handleNodeMessage = (data) => {
    if (data.result) {
      setNodeInfo(data.result);
      addLog("Received node info", "success");
      
      if (data.result.blockCount) {
        setBlockCount(data.result.blockCount);
      }
      
      if (data.result.serverVersion) {
        addLog(`Node version: ${data.result.serverVersion}`, "info");
      }
    }
    
    if (data.error) {
      addLog(`Node error: ${data.error.message}`, "error");
    }
  };

  const getBlockDAGStats = () => {
    if (!ws) return;
    
    const message = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "get_block_dag_info",
      params: {}
    };
    
    try {
      ws.send(JSON.stringify(message));
      addLog("Requesting DAG stats...", "info");
    } catch (error) {
      addLog(`Failed to request stats: ${error.message}`, "error");
    }
  };

  const getConnectionColor = () => {
    if (isConnected) return "text-green-400";
    if (isConnecting) return "text-yellow-400";
    return "text-red-400";
  };

  const getConnectionBg = () => {
    if (isConnected) return "from-green-500/10 to-emerald-500/10 border-green-500/30";
    if (isConnecting) return "from-yellow-500/10 to-orange-500/10 border-yellow-500/30";
    return "from-red-500/10 to-rose-500/10 border-red-500/30";
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 backdrop-blur-xl bg-gradient-to-br from-cyan-500 to-blue-500 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Kaspa Node</h1>
                <p className="text-gray-400 text-sm">Connect to Kaspa network nodes</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Panel */}
            <Card className={`backdrop-blur-xl bg-gradient-to-r ${getConnectionBg()} border-white/10`}>
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold text-white">Connection</h2>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    isConnected ? "bg-green-500/20" : isConnecting ? "bg-yellow-500/20" : "bg-red-500/20"
                  }`}>
                    {isConnected ? (
                      <Wifi className={`w-4 h-4 ${getConnectionColor()}`} />
                    ) : isConnecting ? (
                      <RefreshCw className={`w-4 h-4 ${getConnectionColor()} animate-spin`} />
                    ) : (
                      <WifiOff className={`w-4 h-4 ${getConnectionColor()}`} />
                    )}
                    <span className={`text-sm font-medium ${getConnectionColor()}`}>
                      {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Node URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={useCustom ? customUrl : wsUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      disabled={!useCustom || isConnecting || isConnected}
                      className="bg-white/5 border-white/10 text-white flex-1 font-mono text-sm"
                      placeholder="wss://..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={useCustom}
                    onCheckedChange={setUseCustom}
                    disabled={isConnecting || isConnected}
                  />
                  <Label className="text-gray-400 text-sm">Use custom URL</Label>
                </div>

                {!useCustom && (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-xs text-cyan-300">
                      <strong>Default:</strong> Testnet-10 (neutrino-10.kaspa.stream)
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {!isConnected ? (
                    <Button
                      onClick={connectToNode}
                      disabled={isConnecting}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isConnecting ? "Connecting..." : "Connect"}
                    </Button>
                  ) : (
                    <Button
                      onClick={disconnectFromNode}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Node Stats */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white">Node Statistics</h2>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isConnected && nodeInfo ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-cyan-400" />
                        <span className="text-gray-400 text-xs">Block Count</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {blockCount || "N/A"}
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span className="text-gray-400 text-xs">Last Block</span>
                      </div>
                      <div className="text-sm font-mono text-white">
                        {lastBlockTime || "N/A"}
                      </div>
                    </div>

                    {nodeInfo.serverVersion && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10 col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-cyan-400" />
                          <span className="text-gray-400 text-xs">Server Version</span>
                        </div>
                        <div className="text-sm font-mono text-white">
                          {nodeInfo.serverVersion}
                        </div>
                      </div>
                    )}

                    {nodeInfo.network && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10 col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Network className="w-4 h-4 text-cyan-400" />
                          <span className="text-gray-400 text-xs">Network</span>
                        </div>
                        <div className="text-sm font-medium text-white">
                          {nodeInfo.network}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Connect to a node to view statistics</p>
                  </div>
                )}

                {isConnected && (
                  <Button
                    onClick={getBlockDAGStats}
                    variant="outline"
                    className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Stats
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Connection Log */}
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 lg:col-span-2">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white">Connection Log</h2>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div 
                  ref={logRef}
                  className="h-64 bg-black/50 rounded-lg border border-white/10 p-4 overflow-y-auto font-mono text-xs space-y-1"
                >
                  {connectionLog.length === 0 ? (
                    <p className="text-gray-500">No activity yet...</p>
                  ) : (
                    connectionLog.map((log, index) => (
                      <div key={index} className="flex gap-3">
                        <span className="text-gray-500 flex-shrink-0">[{log.timestamp}]</span>
                        <span className={`${
                          log.type === "success" ? "text-green-400" :
                          log.type === "error" ? "text-red-400" :
                          log.type === "warning" ? "text-yellow-400" :
                          "text-gray-300"
                        }`}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  onClick={() => setConnectionLog([])}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-gray-400 hover:text-white"
                >
                  Clear Log
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}