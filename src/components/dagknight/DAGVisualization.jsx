import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, Circle, GitBranch, Maximize2, Minimize2 } from "lucide-react";

export default function DAGVisualization({ verifications, wallets }) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    if (verifications.length > 0) {
      generateDAGNodes();
    }
  }, [verifications]);

  useEffect(() => {
    if (nodes.length > 0 && canvasRef.current) {
      drawDAG();
    }
  }, [nodes, selectedNode]);

  const generateDAGNodes = () => {
    const generatedNodes = verifications.map((v, index) => ({
      id: v.verification_id,
      walletType: v.wallet_type,
      walletAddress: v.wallet_address,
      blueScore: v.blue_score || 0,
      depth: v.dag_depth || 0,
      parents: v.parent_verifications || [],
      verifiedBy: v.verified_by || [],
      isGenesis: v.is_genesis,
      timestamp: v.timestamp,
      x: 0,
      y: 0
    }));

    // Position nodes in layers based on depth
    const maxDepth = Math.max(...generatedNodes.map(n => n.depth), 0);
    const layers = {};
    
    generatedNodes.forEach(node => {
      if (!layers[node.depth]) layers[node.depth] = [];
      layers[node.depth].push(node);
    });

    // Calculate positions
    Object.keys(layers).forEach(depth => {
      const nodesInLayer = layers[depth];
      const layerWidth = 800;
      const spacing = layerWidth / (nodesInLayer.length + 1);
      
      nodesInLayer.forEach((node, index) => {
        node.x = spacing * (index + 1);
        node.y = 100 + (parseInt(depth) * 150);
      });
    });

    setNodes(generatedNodes);
  };

  const drawDAG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections (edges)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    nodes.forEach(node => {
      node.parents.forEach(parentId => {
        const parent = nodes.find(n => n.id === parentId);
        if (parent) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(parent.x, parent.y);
          ctx.stroke();
        }
      });

      // Draw cross-verification connections
      if (node.verifiedBy.length > 0) {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        
        node.verifiedBy.forEach(verifier => {
          const verifierNode = nodes.find(n => 
            n.wallet_address === verifier.wallet_address
          );
          if (verifierNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(verifierNode.x, verifierNode.y);
            ctx.stroke();
          }
        });
        
        ctx.setLineDash([]);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = selectedNode?.id === node.id;
      const radius = isSelected ? 25 : 20;

      // Node glow
      if (isSelected) {
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius + 10);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      const colors = {
        kasware_l1: '#f97316',
        ttt_wallet: '#a855f7',
        metamask_l2: '#06b6d4'
      };
      
      ctx.fillStyle = colors[node.walletType] || '#71717a';
      ctx.strokeStyle = isSelected ? '#06b6d4' : '#27272a';
      ctx.lineWidth = isSelected ? 3 : 2;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Genesis marker
      if (node.isGenesis) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(node.x + 12, node.y - 12, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Blue score indicator
      if (node.blueScore > 0) {
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.blueScore, node.x, node.y + 4);
      }
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is on a node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance <= 20;
    });

    setSelectedNode(clickedNode || null);
  };

  const getWalletTypeLabel = (type) => {
    const labels = {
      kasware_l1: 'Kasware L1',
      ttt_wallet: 'TTT Wallet',
      metamask_l2: 'MetaMask L2'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black border-zinc-800 overflow-hidden">
        <CardHeader className="border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">DAG Network Visualization</h2>
                <p className="text-sm text-gray-500">Interactive verification graph</p>
              </div>
            </div>
            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-400">Kasware L1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <span className="text-xs text-gray-400">TTT Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-500" />
              <span className="text-xs text-gray-400">MetaMask L2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500" />
              <span className="text-xs text-gray-400">Parent Link</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-pink-500" style={{ borderTop: '2px dashed' }} />
              <span className="text-xs text-gray-400">Cross-Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-xs text-gray-400">Genesis</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={isFullscreen ? 800 : 600}
              onClick={handleCanvasClick}
              className="cursor-pointer w-full"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Network className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">No verifications yet</p>
                  <p className="text-xs text-gray-600 mt-2">Create genesis verifications to see the DAG</p>
                </div>
              </div>
            )}
          </div>

          {/* Selected Node Details */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6 p-4 bg-zinc-950 rounded-lg border border-cyan-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Node Details</h3>
                  <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {getWalletTypeLabel(selectedNode.walletType)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
                    <div className="text-sm text-white font-mono break-all">
                      {selectedNode.walletAddress.substring(0, 20)}...
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Blue Score</div>
                    <div className="text-sm text-cyan-400 font-bold">{selectedNode.blueScore}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">DAG Depth</div>
                    <div className="text-sm text-purple-400 font-bold">{selectedNode.depth}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Cross-Verifications</div>
                    <div className="text-sm text-pink-400 font-bold">{selectedNode.verifiedBy.length}</div>
                  </div>

                  {selectedNode.isGenesis && (
                    <div className="col-span-2">
                      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        🏆 Genesis Block
                      </Badge>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}