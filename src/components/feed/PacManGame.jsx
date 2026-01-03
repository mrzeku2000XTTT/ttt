import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Trophy, Coins } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Box } from "@react-three/drei";
import * as THREE from "three";

function PacMan({ position, rotation, scale }) {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.1;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Sphere ref={meshRef} args={[0.5, 32, 32]}>
        <meshStandardMaterial color="#FFD700" />
      </Sphere>
      <Box position={[0.3, 0.2, 0.4]} args={[0.15, 0.15, 0.1]}>
        <meshStandardMaterial color="#000000" />
      </Box>
    </group>
  );
}

function Pellet({ position, collected, onCollect }) {
  if (collected) return null;
  
  return (
    <Sphere position={position} args={[0.1, 16, 16]} onClick={onCollect}>
      <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
    </Sphere>
  );
}

function PowerPellet({ position, collected, onCollect }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
    }
  });

  if (collected) return null;
  
  return (
    <Sphere ref={meshRef} position={position} args={[0.2, 16, 16]} onClick={onCollect}>
      <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={0.8} />
    </Sphere>
  );
}

function Ghost({ position, color, scared }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.01;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Sphere args={[0.4, 32, 32]}>
        <meshStandardMaterial 
          color={scared ? "#0000FF" : color} 
          transparent 
          opacity={0.8}
        />
      </Sphere>
      <Box position={[0.15, 0.15, 0.35]} args={[0.1, 0.1, 0.05]}>
        <meshStandardMaterial color="#FFFFFF" />
      </Box>
      <Box position={[-0.15, 0.15, 0.35]} args={[0.1, 0.1, 0.05]}>
        <meshStandardMaterial color="#FFFFFF" />
      </Box>
    </group>
  );
}

function GameScene({ 
  pacManPos, 
  pellets, 
  powerPellets, 
  ghosts, 
  onPelletCollect, 
  onPowerPelletCollect, 
  scared 
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00FFFF" />
      
      <PacMan position={pacManPos} rotation={[0, 0, 0]} scale={1} />
      
      {pellets.map((pellet, i) => (
        <Pellet 
          key={`pellet-${i}`} 
          position={pellet.position} 
          collected={pellet.collected}
          onCollect={() => onPelletCollect(i)}
        />
      ))}
      
      {powerPellets.map((pellet, i) => (
        <PowerPellet 
          key={`power-${i}`} 
          position={pellet.position} 
          collected={pellet.collected}
          onCollect={() => onPowerPelletCollect(i)}
        />
      ))}
      
      {ghosts.map((ghost, i) => (
        <Ghost 
          key={`ghost-${i}`} 
          position={ghost.position} 
          color={ghost.color}
          scared={scared}
        />
      ))}
      
      <Box position={[0, -1, 0]} args={[20, 0.2, 20]}>
        <meshStandardMaterial 
          color="#1a1a2e" 
          transparent 
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </Box>
      
      <gridHelper args={[20, 20, '#00FFFF', '#0a0a0a']} position={[0, -0.9, 0]} />
      
      <OrbitControls enableZoom={true} enablePan={true} />
    </>
  );
}

export default function PacManGame({ post, onClose, user }) {
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [scared, setScared] = useState(false);
  const [pacManPos, setPacManPos] = useState([0, 0, 0]);
  const [pellets, setPellets] = useState([]);
  const [powerPellets, setPowerPellets] = useState([]);
  const [ghosts, setGhosts] = useState([
    { position: [2, 0, 2], color: '#FF0000' },
    { position: [-2, 0, 2], color: '#FFC0CB' },
    { position: [2, 0, -2], color: '#00FFFF' },
    { position: [-2, 0, -2], color: '#FFA500' }
  ]);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameStarted && !gameWon) {
      const handleKeyPress = (e) => {
        const speed = 0.5;
        setPacManPos(prev => {
          let [x, y, z] = prev;
          if (e.key === 'ArrowUp' || e.key === 'w') z -= speed;
          if (e.key === 'ArrowDown' || e.key === 's') z += speed;
          if (e.key === 'ArrowLeft' || e.key === 'a') x -= speed;
          if (e.key === 'ArrowRight' || e.key === 'd') x += speed;
          
          x = Math.max(-8, Math.min(8, x));
          z = Math.max(-8, Math.min(8, z));
          
          return [x, y, z];
        });
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [gameStarted, gameWon]);

  useEffect(() => {
    if (gameStarted) {
      checkCollisions();
    }
  }, [pacManPos]);

  const initializeGame = () => {
    const newPellets = [];
    for (let x = -6; x <= 6; x += 2) {
      for (let z = -6; z <= 6; z += 2) {
        newPellets.push({ position: [x, 0, z], collected: false });
      }
    }
    setPellets(newPellets);
    
    setPowerPellets([
      { position: [-6, 0, -6], collected: false },
      { position: [6, 0, -6], collected: false },
      { position: [-6, 0, 6], collected: false },
      { position: [6, 0, 6], collected: false }
    ]);
  };

  const checkCollisions = () => {
    const [px, py, pz] = pacManPos;
    
    pellets.forEach((pellet, i) => {
      if (!pellet.collected) {
        const [pelletX, pelletY, pelletZ] = pellet.position;
        const distance = Math.sqrt(
          Math.pow(px - pelletX, 2) + 
          Math.pow(pz - pelletZ, 2)
        );
        
        if (distance < 0.6) {
          collectPellet(i);
        }
      }
    });
    
    powerPellets.forEach((pellet, i) => {
      if (!pellet.collected) {
        const [pelletX, pelletY, pelletZ] = pellet.position;
        const distance = Math.sqrt(
          Math.pow(px - pelletX, 2) + 
          Math.pow(pz - pelletZ, 2)
        );
        
        if (distance < 0.8) {
          collectPowerPellet(i);
        }
      }
    });
    
    const allCollected = pellets.every(p => p.collected) && 
                        powerPellets.every(p => p.collected);
    if (allCollected && !gameWon) {
      handleWin();
    }
  };

  const collectPellet = (index) => {
    setPellets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], collected: true };
      return updated;
    });
    setScore(prev => prev + 10);
  };

  const collectPowerPellet = (index) => {
    setPowerPellets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], collected: true };
      return updated;
    });
    setScore(prev => prev + 50);
    setScared(true);
    setTimeout(() => setScared(false), 5000);
  };

  const handleWin = async () => {
    setGameWon(true);
    const finalScore = score + 500;
    setScore(finalScore);
    
    try {
      await base44.entities.Post.update(post.id, {
        tips_received: (post.tips_received || 0) + 1
      });
      
      if (user) {
        const existingBadges = await base44.entities.UserBadge.filter({
          user_email: user.email,
          badge_name: 'Pac-Man Champion'
        });
        
        if (existingBadges.length === 0) {
          await base44.entities.UserBadge.create({
            user_email: user.email,
            badge_name: 'Pac-Man Champion',
            badge_emoji: '🏆',
            badge_color: '#FFD700',
            is_active: true
          });
        }
      }
    } catch (err) {
      console.error('Failed to save win:', err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.3)]"
        >
          <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-black/40">
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                alt="Pac-Man"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h3 className="text-white font-black text-2xl">PAC-MAN UNIVERSE</h3>
                <p className="text-cyan-400 text-sm">Use Arrow Keys or WASD to move</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2">
                <div className="text-cyan-400 text-xs">SCORE</div>
                <div className="text-white font-black text-2xl">{score}</div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 relative">
            {!gameStarted ? (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center space-y-6">
                  <h2 className="text-4xl font-black text-white mb-4">
                    Ready to Play?
                  </h2>
                  <p className="text-cyan-400 mb-6">
                    Collect all pellets to win Pac-Man Champion badge!
                  </p>
                  <Button
                    onClick={() => setGameStarted(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-xl font-bold"
                  >
                    START GAME
                  </Button>
                </div>
              </div>
            ) : gameWon ? (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center space-y-6"
                >
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto animate-bounce" />
                  <h2 className="text-5xl font-black text-white mb-4">
                    YOU WIN!
                  </h2>
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-6">
                    <div className="text-cyan-400 text-lg mb-2">Final Score</div>
                    <div className="text-white font-black text-4xl">{score}</div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-yellow-400">
                    <Coins className="w-6 h-6" />
                    <span className="text-lg font-bold">Pac-Man Champion Badge Earned!</span>
                  </div>
                  <Button
                    onClick={onClose}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-4 text-lg font-bold"
                  >
                    Close
                  </Button>
                </motion.div>
              </div>
            ) : null}

            <Canvas
              camera={{ position: [0, 10, 10], fov: 60 }}
              className="w-full h-full"
              style={{ background: 'radial-gradient(circle at center, #0a0a1e 0%, #000000 100%)' }}
            >
              <GameScene
                pacManPos={pacManPos}
                pellets={pellets}
                powerPellets={powerPellets}
                ghosts={ghosts}
                onPelletCollect={collectPellet}
                onPowerPelletCollect={collectPowerPellet}
                scared={scared}
              />
            </Canvas>
          </div>

          <div className="p-4 border-t border-cyan-500/20 bg-black/40">
            <div className="flex items-center justify-between text-sm text-cyan-400">
              <div>Posted by: {post.author_name}</div>
              <div className="flex items-center gap-4">
                <span>🔵 Pellets: {pellets.filter(p => !p.collected).length}</span>
                <span>⚡ Power: {powerPellets.filter(p => !p.collected).length}</span>
                {scared && <span className="text-blue-400 animate-pulse">👻 POWER MODE!</span>}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}