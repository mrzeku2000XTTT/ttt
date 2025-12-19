import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useBox, usePlane, useSphere } from '@react-three/cannon';
import { PointerLockControls, Stars, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, Crosshair, MousePointer2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

// --- Physics Components ---

function Ground() {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, -2, 0],
    material: { friction: 1 }
  }));

  return (
    <mesh ref={ref} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1000, 1000, 100, 100]} />
      <meshStandardMaterial 
        color="#000000" 
        wireframe 
        emissive="#06b6d4" 
        emissiveIntensity={0.2} 
        transparent 
        opacity={0.3} 
      />
    </mesh>
  );
}

function FloatingBlock({ id, position, onClick, onHover, color = "#00ff00" }) {
  const [ref, api] = useBox(() => ({ mass: 1, position, args: [1, 1, 1] }));
  
  return (
    <mesh 
      ref={ref} 
      castShadow 
      receiveShadow 
      onClick={onClick}
      onPointerOver={(e) => { 
        e.stopPropagation(); 
        document.body.style.cursor = 'pointer';
        onHover(id);
      }}
      onPointerOut={() => { 
        document.body.style.cursor = 'auto'; 
        onHover(null);
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

function Player({ onMine }) {
  const { camera } = useThree();
  const [ref, api] = useSphere(() => ({ mass: 1, type: "Dynamic", position: [0, 2, 0], args: [1] }));
  const velocity = useRef([0, 0, 0]);
  const position = useRef([0, 0, 0]);
  
  useEffect(() => {
    const unsubVel = api.velocity.subscribe((v) => (velocity.current = v));
    const unsubPos = api.position.subscribe((p) => (position.current = p));
    return () => { unsubVel(); unsubPos(); };
  }, [api.velocity, api.position]);

  useFrame(() => {
    camera.position.copy(new THREE.Vector3(position.current[0], position.current[1] + 1.5, position.current[2]));
  });

  return (
    <mesh ref={ref} />
  );
}

// --- Tool/Hand Component ---
function MiningTool({ isMining }) {
  const group = useRef();
  const { camera } = useThree();

  useFrame((state) => {
    if (group.current) {
        // Simple swaying/bobbing or mining animation
        if (isMining) {
            group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -0.5, 0.2);
            group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, -0.5, 0.2);
            group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, -0.3, 0.2);
        } else {
            group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
            group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1);
            group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, -0.5, 0.1);
        }
    }
  });

  return (
    <group ref={group} position={[0.5, -0.5, -0.5]}>
        <mesh rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.2, 0.2, 0.8]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
             <coneGeometry args={[0.15, 0.4, 8]} />
             <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.5} />
        </mesh>
        <group position={[0,0,0]}>
            {/* Attach to camera effectively by being child of camera in scene graph? No, useFrame updates/Portals usually needed. 
                For simple FPS, we can just put it in the scene and update position in useFrame relative to camera, 
                OR create a rig. Let's try putting it as a child of the camera object if possible in R3F.
                Actually R3F 'createPortal' is good for HUDs, but for 3D tool attached to camera:
            */}
        </group>
    </group>
  );
}

// Rig to hold the camera and the tool
function PlayerRig({ children }) {
    const { camera } = useThree();
    return <group>{children}</group>
}
// We will manually position a "Hand" mesh in useFrame to follow camera

function Hand({ isMining }) {
    const ref = useRef();
    const { camera } = useThree();
    
    useFrame(() => {
        if (ref.current) {
            ref.current.position.copy(camera.position);
            ref.current.quaternion.copy(camera.quaternion);
            ref.current.translateZ(-0.6);
            ref.current.translateY(-0.3);
            ref.current.translateX(0.4);
            
            if (isMining) {
                 ref.current.rotateX(-0.5);
                 ref.current.translateZ(0.2);
            }
        }
    });
    
    return (
        <group ref={ref}>
            <mesh rotation={[0.2, -0.2, 0]}>
                <boxGeometry args={[0.15, 0.15, 0.6]} />
                <meshStandardMaterial color="#444" />
            </mesh>
             <mesh position={[0, 0, -0.35]} rotation={[Math.PI/2, 0, 0]}>
                <boxGeometry args={[0.3, 0.1, 0.05]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
            </mesh>
        </group>
    )
}

// --- Main World Component ---

export default function BlockWorld() {
  const [blocks, setBlocks] = useState([]);
  const [isMining, setIsMining] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  
  // Initial blocks
  useEffect(() => {
    const initialBlocks = [];
    for (let i = 0; i < 20; i++) {
        initialBlocks.push({
            id: i,
            position: [
                (Math.random() - 0.5) * 20,
                5 + Math.random() * 20,
                (Math.random() - 0.5) * 20
            ],
            color: Math.random() > 0.5 ? "#00ff00" : "#00ffcc"
        });
    }
    setBlocks(initialBlocks);
  }, []);

  const handleMine = (id) => {
    setIsMining(true);
    setTimeout(() => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        setIsMining(false);
        
        // Add new block to keep the fun going
        setTimeout(() => {
             setBlocks(prev => [...prev, {
                id: Date.now(),
                position: [
                    (Math.random() - 0.5) * 20,
                    20,
                    (Math.random() - 0.5) * 20
                ],
                color: "#00ff00"
            }]);
        }, 2000);
    }, 200);
  };

  const handleInteract = () => {
      setIsMining(true);
      setTimeout(() => setIsMining(false), 200);
      
      if (hoveredBlockId !== null) {
          handleMine(hoveredBlockId);
      }
  };

  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.code === 'KeyE') {
              handleInteract();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hoveredBlockId, blocks]);

  return (
    <div className="w-full h-full relative bg-black cursor-none">
       {/* UI Overlay */}
       <div className="absolute top-0 left-0 p-4 z-50 pointer-events-none">
           <div className="flex items-center gap-2">
               <div className="w-8 h-8 border-2 border-green-500 rounded flex items-center justify-center bg-black/50">
                   <div className="w-4 h-4 bg-green-500 rounded-sm animate-pulse" />
               </div>
               <div>
                   <h1 className="text-white font-bold font-mono text-lg tracking-wider">AGENTZK WORLD</h1>
                   <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
                       <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                       ONLINE
                       <span className="text-white/50 ml-2">15 AGENTS</span>
                   </div>
               </div>
           </div>
       </div>

       {/* Crosshair */}
       {locked && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
               <Crosshair className="w-6 h-6 text-white/50" strokeWidth={1} />
           </div>
       )}
       
       {/* Instructions */}
       {!locked && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center pointer-events-none">
               <div className="bg-black/80 border border-green-500/50 p-6 rounded-xl backdrop-blur-md">
                   <MousePointer2 className="w-8 h-8 text-green-400 mx-auto mb-2 animate-bounce" />
                   <h2 className="text-white font-bold text-xl mb-2">Click to Enter World</h2>
                   <p className="text-green-300/80 text-sm font-mono">WASD to Move • Click/E to Mine Blocks</p>
               </div>
           </div>
       )}

      <Canvas shadows camera={{ fov: 75 }}>
        <Sky sunPosition={[100, 20, 100]} inclination={0} azimuth={0.25} turbidity={10} rayleigh={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} castShadow intensity={0.8} />
        
        <Physics gravity={[0, -9.8, 0]}>
            <Player />
            <Ground />
            {blocks.map(block => (
                <FloatingBlock 
                    key={block.id} 
                    position={block.position} 
                    color={block.color}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (locked) handleMine(block.id);
                    }} 
                />
            ))}
        </Physics>
        
        <Hand isMining={isMining} />
        <PointerLockControls onLock={() => setLocked(true)} onUnlock={() => setLocked(false)} />
      </Canvas>
    </div>
  );
}