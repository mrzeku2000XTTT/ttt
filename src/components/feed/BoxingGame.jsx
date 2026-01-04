import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sky, Text, Box, Plane, Sphere, Environment } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Trophy, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import * as THREE from "three";

// 3D Player Fighter
function PlayerFighter({ position, health, action }) {
  const meshRef = useRef();
  const targetY = useRef(0);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Bobbing animation
      targetY.current = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.position.y = position[1] + targetY.current;
      
      // Action animations
      if (action === 'punch') {
        meshRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * 30) * 0.5;
      } else if (action === 'block') {
        meshRef.current.scale.x = 0.7;
        meshRef.current.scale.z = 1.3;
      } else {
        meshRef.current.position.z = position[2];
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });
  
  return (
    <group ref={meshRef} position={position}>
      {/* Body */}
      <Box args={[1, 1.5, 0.8]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#FFD700" metalness={0.5} roughness={0.3} />
      </Box>
      {/* Head */}
      <Sphere args={[0.45, 32, 32]} position={[0, 1.1, 0]} castShadow>
        <meshStandardMaterial color="#FFDAB9" metalness={0.2} />
      </Sphere>
      {/* Eyes */}
      <Sphere args={[0.08, 16, 16]} position={[-0.15, 1.2, 0.4]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0.15, 1.2, 0.4]}>
        <meshStandardMaterial color="#000000" />
      </Sphere>
      {/* Boxing Gloves */}
      <Sphere args={[0.25, 16, 16]} position={[-0.8, 0.2, action === 'punch' ? 0.6 : 0]} castShadow>
        <meshStandardMaterial color="#DC2626" metalness={0.4} />
      </Sphere>
      <Sphere args={[0.25, 16, 16]} position={[0.8, 0.2, action === 'punch' ? 0.6 : 0]} castShadow>
        <meshStandardMaterial color="#DC2626" metalness={0.4} />
      </Sphere>
      {/* Legs */}
      <Box args={[0.3, 0.9, 0.3]} position={[-0.3, -1.3, 0]} castShadow>
        <meshStandardMaterial color="#1E3A8A" />
      </Box>
      <Box args={[0.3, 0.9, 0.3]} position={[0.3, -1.3, 0]} castShadow>
        <meshStandardMaterial color="#1E3A8A" />
      </Box>
      {/* Health Text */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.3}
        color="#10B981"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {`HP: ${health}`}
      </Text>
    </group>
  );
}

// 3D Opponent Fighter
function OpponentFighter({ position, health, action }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2.3) * 0.1;
      
      if (action === 'punch') {
        meshRef.current.position.z = position[2] - Math.sin(state.clock.elapsedTime * 30) * 0.5;
      } else {
        meshRef.current.position.z = position[2];
      }
    }
  });
  
  return (
    <group ref={meshRef} position={position}>
      {/* Body */}
      <Box args={[1, 1.5, 0.8]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#DC2626" metalness={0.5} roughness={0.3} />
      </Box>
      {/* Head */}
      <Sphere args={[0.45, 32, 32]} position={[0, 1.1, 0]} castShadow>
        <meshStandardMaterial color="#FFDAB9" metalness={0.2} />
      </Sphere>
      {/* Eyes */}
      <Sphere args={[0.08, 16, 16]} position={[-0.15, 1.2, -0.4]}>
        <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.5} />
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0.15, 1.2, -0.4]}>
        <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.5} />
      </Sphere>
      {/* Boxing Gloves */}
      <Sphere args={[0.25, 16, 16]} position={[-0.8, 0.2, action === 'punch' ? -0.6 : 0]} castShadow>
        <meshStandardMaterial color="#000000" metalness={0.4} />
      </Sphere>
      <Sphere args={[0.25, 16, 16]} position={[0.8, 0.2, action === 'punch' ? -0.6 : 0]} castShadow>
        <meshStandardMaterial color="#000000" metalness={0.4} />
      </Sphere>
      {/* Legs */}
      <Box args={[0.3, 0.9, 0.3]} position={[-0.3, -1.3, 0]} castShadow>
        <meshStandardMaterial color="#111827" />
      </Box>
      <Box args={[0.3, 0.9, 0.3]} position={[0.3, -1.3, 0]} castShadow>
        <meshStandardMaterial color="#111827" />
      </Box>
      {/* Health Text */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.3}
        color="#DC2626"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {`HP: ${health}`}
      </Text>
    </group>
  );
}

// Boxing Arena Environment
function BoxingArena() {
  return (
    <group>
      {/* Main Floor - Large open world ground */}
      <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]} receiveShadow>
        <meshStandardMaterial 
          color="#0f172a" 
          roughness={0.9}
          metalness={0.1}
        />
      </Plane>
      
      {/* Ring Canvas */}
      <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.99, 0]} receiveShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </Plane>
      
      {/* Corner Posts */}
      {[[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].map((pos, i) => (
        <Box key={i} args={[0.4, 4, 0.4]} position={[pos[0], 0, pos[1]]} castShadow>
          <meshStandardMaterial color="#DC2626" metalness={0.6} roughness={0.4} />
        </Box>
      ))}
      
      {/* Ring Ropes */}
      {[0.3, 1.3, 2.3].map((height, i) => (
        <React.Fragment key={i}>
          <Box args={[10, 0.08, 0.08]} position={[0, height - 1, 4.5]} castShadow>
            <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[10, 0.08, 0.08]} position={[0, height - 1, -4.5]} castShadow>
            <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.08, 0.08, 10]} position={[4.5, height - 1, 0]} castShadow>
            <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.08, 0.08, 10]} position={[-4.5, height - 1, 0]} castShadow>
            <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
          </Box>
        </React.Fragment>
      ))}
      
      {/* Stadium Lights */}
      <pointLight position={[0, 10, 0]} intensity={3} color="#ffffff" castShadow />
      <pointLight position={[-8, 6, 8]} intensity={1.5} color="#FFD700" />
      <pointLight position={[8, 6, 8]} intensity={1.5} color="#FFD700" />
      <pointLight position={[-8, 6, -8]} intensity={1.5} color="#DC2626" />
      <pointLight position={[8, 6, -8]} intensity={1.5} color="#DC2626" />
      
      {/* Crowd Stands */}
      <Box args={[3, 6, 25]} position={[-12, 1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </Box>
      <Box args={[3, 6, 25]} position={[12, 1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </Box>
      <Box args={[25, 6, 3]} position={[0, 1, -12]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </Box>
      <Box args={[25, 6, 3]} position={[0, 1, 12]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </Box>
    </group>
  );
}

// Particle Effects for Punches
function PunchEffect({ position, visible }) {
  const particlesRef = useRef();
  
  useFrame((state) => {
    if (particlesRef.current && visible) {
      particlesRef.current.rotation.z += 0.1;
    }
  });
  
  if (!visible) return null;
  
  return (
    <group ref={particlesRef} position={position}>
      {[...Array(8)].map((_, i) => (
        <Sphere key={i} args={[0.1, 8, 8]} position={[
          Math.cos(i * Math.PI / 4) * 0.5,
          Math.sin(i * Math.PI / 4) * 0.5,
          0
        ]}>
          <meshStandardMaterial 
            color="#FF6B00" 
            emissive="#FF6B00" 
            emissiveIntensity={2}
          />
        </Sphere>
      ))}
    </group>
  );
}

export default function BoxingGame({ post, onClose, user }) {
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [playerAction, setPlayerAction] = useState(null);
  const [opponentAction, setOpponentAction] = useState(null);
  const [combo, setCombo] = useState(0);
  const [showPunchEffect, setShowPunchEffect] = useState(false);

  const performAction = (action) => {
    if (gameLost || gameWon) return;

    setPlayerAction(action);
    setTimeout(() => setPlayerAction(null), 300);

    // Opponent AI
    const opponentMoves = ['punch', 'block', 'dodge'];
    const opponentMove = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];
    setOpponentAction(opponentMove);
    setTimeout(() => setOpponentAction(null), 300);

    // Combat logic
    if (action === 'punch' && opponentMove !== 'block' && opponentMove !== 'dodge') {
      const damage = 10 + Math.floor(Math.random() * 10);
      setOpponentHealth(prev => Math.max(0, prev - damage));
      setScore(prev => prev + damage);
      setCombo(prev => prev + 1);
      setShowPunchEffect(true);
      setTimeout(() => setShowPunchEffect(false), 200);
    } else if (action === 'punch' && opponentMove === 'block') {
      setCombo(0);
    }

    if (opponentMove === 'punch' && action !== 'block' && action !== 'dodge') {
      const damage = 8 + Math.floor(Math.random() * 8);
      setHealth(prev => Math.max(0, prev - damage));
      setCombo(0);
    }
  };

  useEffect(() => {
    if (opponentHealth <= 0 && !gameWon) {
      handleWin();
    } else if (health <= 0 && !gameLost) {
      setGameLost(true);
    }
  }, [health, opponentHealth]);

  const handleWin = async () => {
    setGameWon(true);
    const finalScore = score + (health * 2);
    setScore(finalScore);
    
    try {
      await base44.entities.Post.update(post.id, {
        tips_received: (post.tips_received || 0) + 0.5
      });
      
      if (user) {
        const existingBadges = await base44.entities.UserBadge.filter({
          user_email: user.email,
          badge_name: 'Boxing Champion'
        });
        
        if (existingBadges.length === 0) {
          await base44.entities.UserBadge.create({
            user_email: user.email,
            badge_name: 'Boxing Champion',
            badge_emoji: '🥊',
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
          className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border border-red-500/30 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-red-500/20 bg-black/40">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                alt="Boxing"
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
              />
              <div>
                <h3 className="text-white font-black text-xl md:text-2xl">BOXING ARENA 3D</h3>
                <p className="text-red-400 text-xs md:text-sm">Open World Fight!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-2 md:px-4 py-1 md:py-2">
                <div className="text-red-400 text-[10px] md:text-xs">SCORE</div>
                <div className="text-white font-black text-lg md:text-2xl">{score}</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-2 md:px-4 py-1 md:py-2">
                <div className="text-green-400 text-[10px] md:text-xs">COMBO</div>
                <div className="text-white font-black text-lg md:text-2xl">x{combo}</div>
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

          {/* Game Area */}
          <div className="flex-1 relative">
            {!gameStarted ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                <div className="text-center space-y-6 p-6">
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                    Ready to Fight?
                  </h2>
                  <p className="text-red-400 mb-6 text-sm md:text-base">
                    Knock out your opponent in 3D open world arena!
                  </p>
                  <Button
                    onClick={() => setGameStarted(true)}
                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 md:px-8 py-4 md:py-6 text-lg md:text-xl font-bold"
                  >
                    START FIGHT
                  </Button>
                </div>
              </div>
            ) : gameWon ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center space-y-6 p-6"
                >
                  <Trophy className="w-16 h-16 md:w-24 md:h-24 text-yellow-400 mx-auto animate-bounce" />
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                    KNOCKOUT!
                  </h2>
                  <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-4 md:p-6">
                    <div className="text-red-400 text-base md:text-lg mb-2">Final Score</div>
                    <div className="text-white font-black text-3xl md:text-4xl">{score}</div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-yellow-400">
                    <span className="text-3xl md:text-4xl">🥊</span>
                    <span className="text-base md:text-lg font-bold">Boxing Champion Badge!</span>
                  </div>
                  <Button
                    onClick={onClose}
                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-bold"
                  >
                    Close
                  </Button>
                </motion.div>
              </div>
            ) : gameLost ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                <div className="text-center space-y-6 p-6">
                  <h2 className="text-3xl md:text-4xl font-black text-red-400 mb-4">
                    KNOCKED OUT!
                  </h2>
                  <p className="text-white/60">Better luck next time!</p>
                  <Button
                    onClick={() => {
                      setHealth(100);
                      setOpponentHealth(100);
                      setScore(0);
                      setCombo(0);
                      setGameLost(false);
                      setGameStarted(false);
                    }}
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/20 px-6 py-3"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : null}

            {/* 3D Canvas */}
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
              </div>
            }>
              <Canvas
                camera={{ position: [0, 4, 12], fov: 60 }}
                shadows
                className="w-full h-full"
              >
                <color attach="background" args={['#000000']} />
                <fog attach="fog" args={['#0a0a1a', 15, 45]} />
                
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight
                  position={[10, 15, 5]}
                  intensity={1.5}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                  shadow-camera-far={50}
                  shadow-camera-left={-20}
                  shadow-camera-right={20}
                  shadow-camera-top={20}
                  shadow-camera-bottom={-20}
                />
                
                {/* Sky */}
                <Sky sunPosition={[50, 30, 50]} turbidity={8} rayleigh={0.5} />
                
                {/* Arena */}
                <BoxingArena />
                
                {/* Fighters */}
                <PlayerFighter 
                  position={[-3, 0, 0]} 
                  health={health}
                  action={playerAction}
                />
                <OpponentFighter 
                  position={[3, 0, 0]} 
                  health={opponentHealth}
                  action={opponentAction}
                />
                
                {/* Punch Effect */}
                <PunchEffect 
                  position={[0, 1, 0]} 
                  visible={showPunchEffect}
                />
                
                {/* Camera Controls */}
                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  minDistance={6}
                  maxDistance={25}
                  maxPolarAngle={Math.PI / 2.1}
                  target={[0, 1, 0]}
                />
                
                {/* Environment */}
                <Environment preset="night" />
              </Canvas>
            </Suspense>
          </div>

          {/* Controls */}
          {gameStarted && !gameWon && !gameLost && (
            <div className="p-4 md:p-6 border-t border-red-500/20 bg-black/40">
              <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                <Button
                  onClick={() => performAction('punch')}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 md:px-8 py-4 md:py-6 text-sm md:text-lg font-bold"
                >
                  🥊 PUNCH
                </Button>
                <Button
                  onClick={() => performAction('block')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 md:px-8 py-4 md:py-6 text-sm md:text-lg font-bold"
                >
                  🛡️ BLOCK
                </Button>
                <Button
                  onClick={() => performAction('dodge')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 md:px-8 py-4 md:py-6 text-sm md:text-lg font-bold"
                >
                  💨 DODGE
                </Button>
              </div>
              <div className="mt-3 md:mt-4 flex items-center justify-between text-xs md:text-sm text-white/60">
                <div>Your Health: {health}%</div>
                <div>Opponent: {opponentHealth}%</div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}