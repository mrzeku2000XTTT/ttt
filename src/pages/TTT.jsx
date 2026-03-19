import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Generate some random DAG data to simulate the TTT network
const generateDAG = (numNodes) => {
  const nodes = [];
  const edges = [];
  
  for (let i = 0; i < numNodes; i++) {
    // Blocks move forward in time (X axis)
    const x = (i * 0.4) - (numNodes * 0.2);
    const y = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 6;
    
    // 10% chance it's a block, 90% chance it's a transaction
    const isBlock = Math.random() > 0.9;
    const color = isBlock ? '#06b6d4' : '#10b981'; // Cyan for blocks, Emerald for txs
    const size = isBlock ? 0.25 : 0.08;

    nodes.push({ id: i, position: [x, y, z], color, size, isBlock });
    
    // Connect to 1-3 previous nodes to form a DAG
    if (i > 0) {
      const numParents = Math.floor(Math.random() * 3) + 1;
      for (let p = 0; p < numParents; p++) {
        const parentId = Math.max(0, i - Math.floor(Math.random() * 8) - 1);
        if (!edges.some(e => e.source === parentId && e.target === i)) {
          edges.push({ source: parentId, target: i });
        }
      }
    }
  }
  return { nodes, edges };
};

const Node = ({ position, color, size, id }) => {
  const mesh = useRef();
  
  useFrame((state) => {
    // Gentle floating animation
    mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + id) * 0.1;
    mesh.current.rotation.x += 0.01;
    mesh.current.rotation.y += 0.01;
  });

  return (
    <Sphere ref={mesh} args={[size, 16, 16]} position={position}>
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={1.5}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
};

const Edge = ({ start, end, isBlockConnection }) => {
  return (
    <Line
      points={[start, end]}
      color={isBlockConnection ? "#06b6d4" : "#10b981"}
      opacity={isBlockConnection ? 0.3 : 0.1}
      transparent
      lineWidth={isBlockConnection ? 2 : 1}
    />
  );
};

const NetworkDAG = () => {
  const { nodes, edges } = useMemo(() => generateDAG(250), []);
  const group = useRef();

  useFrame((state, delta) => {
    // Move network to the left to simulate time moving forward
    group.current.position.x -= delta * 2; 
    
    // Loop the DAG seamlessly
    if (group.current.position.x < -30) {
      group.current.position.x = 30;
    }
  });

  return (
    <group ref={group}>
      {edges.map((edge, i) => {
        const startNode = nodes[edge.source];
        const endNode = nodes[edge.target];
        return (
          <Edge 
            key={i} 
            start={startNode.position} 
            end={endNode.position} 
            isBlockConnection={startNode.isBlock || endNode.isBlock}
          />
        );
      })}
      {nodes.map((node) => (
        <Node key={node.id} {...node} />
      ))}
      
      {/* Add a duplicate trailing network for seamless looping */}
      <group position={[100, 0, 0]}>
        {edges.map((edge, i) => {
          const startNode = nodes[edge.source];
          const endNode = nodes[edge.target];
          return (
            <Edge 
              key={`trail-edge-${i}`} 
              start={startNode.position} 
              end={endNode.position} 
              isBlockConnection={startNode.isBlock || endNode.isBlock}
            />
          );
        })}
        {nodes.map((node) => (
          <Node key={`trail-${node.id}`} {...node} />
        ))}
      </group>
    </group>
  );
};

export default function TTTPage() {
  const [stats, setStats] = useState({ bps: 1.0, tps: 245, supply: '24.5B' });

  useEffect(() => {
    // Simulate real-time network metrics changing
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        tps: Math.floor(200 + Math.random() * 150),
        bps: 1.0 + (Math.random() * 0.1 - 0.05)
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen bg-black text-white relative overflow-hidden" style={{ paddingTop: 'var(--sat, 0px)' }}>
      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pointer-events-none mt-16 md:mt-24">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-2 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-widest text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
              TTT
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-400 uppercase">Live</span>
            </div>
          </div>
          <p className="text-sm text-cyan-500/70 uppercase tracking-widest font-mono">Network Visualizer</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-6 text-right bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 font-mono pointer-events-auto"
        >
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wider mb-1">BPS</div>
            <div className="text-2xl font-bold text-cyan-400">{stats.bps.toFixed(2)}</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wider mb-1">TPS</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.tps}</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Supply</div>
            <div className="text-2xl font-bold text-purple-400">{stats.supply}</div>
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-24 md:bottom-8 left-6 z-10 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 text-xs font-mono bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
            <span className="text-white/80 uppercase tracking-wider">Block</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <span className="text-white/80 uppercase tracking-wider">Transaction</span>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-24 md:bottom-8 right-6 z-10 pointer-events-none max-w-xs text-right hidden md:block">
         <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/40 text-xs font-mono leading-relaxed"
        >
          Drag to rotate. Scroll to zoom.<br/>
          Visualizing the Directed Acyclic Graph (DAG) in real-time.
        </motion.p>
      </div>

      {/* WebGL Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 3, 15], fov: 60 }}>
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#06b6d4" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#10b981" />
          
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <NetworkDAG />
          </Suspense>

          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            autoRotate
            autoRotateSpeed={0.5}
            maxDistance={30}
            minDistance={3}
          />
        </Canvas>
      </div>
    </div>
  );
}