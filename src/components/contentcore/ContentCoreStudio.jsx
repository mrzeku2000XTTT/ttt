import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { MATERIALS, ENVIRONMENTS, BACKDROPS, TYPEFACES, SHAPES, QUICK_START_TOOLS } from './contentCoreData';

// Build extruded 3D text geometry
function buildTextGeometry(text, font, depth = 0.3) {
  if (!text) return null;
  try {
    const shapes = font.generateShapes(text, 1);
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    geo.center();
    return geo;
  } catch (e) {
    return null;
  }
}

// Build shape geometry from preset
function buildShapeGeometry(shapeId) {
  switch (shapeId) {
    case 'star': {
      const s = new THREE.Shape();
      const spikes = 5, outer = 0.8, inner = 0.35;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.05, bevelSegments: 2 });
    }
    case 'heart': {
      const s = new THREE.Shape();
      s.moveTo(0, 0.3);
      s.bezierCurveTo(0, 0.6, -0.5, 0.8, -0.8, 0.3);
      s.bezierCurveTo(-1.2, -0.3, -0.4, -0.7, 0, -1.0);
      s.bezierCurveTo(0.4, -0.7, 1.2, -0.3, 0.8, 0.3);
      s.bezierCurveTo(0.5, 0.8, 0, 0.6, 0, 0.3);
      return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.05, bevelSegments: 2 });
    }
    case 'hex': {
      const s = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        if (i === 0) s.moveTo(Math.cos(a) * 0.8, Math.sin(a) * 0.8);
        else s.lineTo(Math.cos(a) * 0.8, Math.sin(a) * 0.8);
      }
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.05, bevelSegments: 2 });
    }
    case 'circle':
      return new THREE.CylinderGeometry(0.8, 0.8, 0.3, 64);
    case 'square':
      return new THREE.BoxGeometry(1.2, 1.2, 0.3);
    case 'triangle': {
      const s = new THREE.Shape();
      s.moveTo(0, 0.8);
      s.lineTo(-0.7, -0.5);
      s.lineTo(0.7, -0.5);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.05, bevelSegments: 2 });
    }
    case 'diamond': {
      const s = new THREE.Shape();
      s.moveTo(0, 0.9);
      s.lineTo(0.6, 0);
      s.lineTo(0, -0.9);
      s.lineTo(-0.6, 0);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.05, bevelSegments: 2 });
    }
    case 'ring': {
      const s = new THREE.Shape();
      s.absarc(0, 0, 0.8, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, 0.4, 0, Math.PI * 2, true);
      s.holes.push(hole);
      return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.05, bevelSegments: 2 });
    }
    case 'petals': {
      const group = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const petal = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 16, 16),
          new THREE.MeshStandardMaterial()
        );
        const a = (i / 6) * Math.PI * 2;
        petal.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0);
        petal.scale.set(1, 0.5, 0.3);
        group.add(petal);
      }
      return group;
    }
    default:
      return null;
  }
}

export default function ContentCoreStudio({ onClose }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const objectRef = useRef(null);
  const backdropRef = useRef(null);
  const keyLightRef = useRef(null);
  const fillLightRef = useRef(null);
  const rimLightRef = useRef(null);

  const [activeTool, setActiveTool] = useState('text');
  const [textContent, setTextContent] = useState('TTT');
  const [typeface, setTypeface] = useState(TYPEFACES[4]); // Inter Black
  const [material, setMaterial] = useState(MATERIALS[0]); // Metal
  const [environment, setEnvironment] = useState(ENVIRONMENTS[0]); // Studio
  const [backdrop, setBackdrop] = useState(BACKDROPS[1]); // Gradient
  const [shape, setShape] = useState(SHAPES[0]); // none
  const [uploadedImage, setUploadedImage] = useState(null);

  // Camera state
  const [tilt, setTilt] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [zoom, setZoom] = useState(24);
  const [fov, setFov] = useState(40);
  const [exposure, setExposure] = useState(1.5);

  // Light state
  const [lightX, setLightX] = useState(5);
  const [lightY, setLightY] = useState(8);
  const [lightDist, setLightDist] = useState(10);
  const [shadows, setShadows] = useState(true);

  // Object transform
  const [objSize, setObjSize] = useState(6);
  const [objTilt, setObjTilt] = useState(0);
  const [objPitch, setObjPitch] = useState(0);
  const [objRoll, setObjRoll] = useState(0);

  // Material adjust
  const [roughness, setRoughness] = useState(0.15);
  const [metalness, setMetalness] = useState(1.0);
  const [surfaceDetail, setSurfaceDetail] = useState(0);

  // Font
  const [font, setFont] = useState(null);
  const [showSidebar, setShowSidebar] = useState('materials');

  // Load default font (use helvetiker bundled with three)
  useEffect(() => {
    const loader = new FontLoader();
    // Use built-in helvetiker font
    loader.load('https://unpkg.com/three@0.171.0/examples/fonts/helvetiker_bold.typeface.json', (f) => {
      setFont(f);
    }, undefined, () => {
      // Fallback: try local
      import('three/examples/fonts/helvetiker_bold.typeface.json').then((f) => setFont(f.default || f)).catch(() => {});
    });
  }, []);

  // Init three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(fov, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, zoom);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(lightX, lightY, lightDist);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 50;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    scene.add(key);
    keyLightRef.current = key;

    const fill = new THREE.DirectionalLight(0x8888ff, 0.4);
    fill.position.set(-5, 3, 5);
    scene.add(fill);
    fillLightRef.current = fill;

    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(0, -3, -8);
    scene.add(rim);
    rimLightRef.current = rim;

    // Ambient
    scene.add(new THREE.AmbientLight(0x404040, 0.5));

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    // Animation loop
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update camera position from controls
  useEffect(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const dist = zoom;
    const rad = (pitch * Math.PI) / 180;
    const tiltRad = (tilt * Math.PI) / 180;
    cam.position.x = dist * Math.sin(tiltRad) * Math.cos(rad);
    cam.position.y = dist * Math.sin(rad);
    cam.position.z = dist * Math.cos(tiltRad) * Math.cos(rad);
    cam.lookAt(0, 0, 0);
  }, [tilt, pitch, zoom]);

  // Update FOV
  useEffect(() => {
    if (!cameraRef.current) return;
    cameraRef.current.fov = fov;
    cameraRef.current.updateProjectionMatrix();
  }, [fov]);

  // Update exposure
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.toneMappingExposure = exposure;
  }, [exposure]);

  // Update lights
  useEffect(() => {
    if (!keyLightRef.current) return;
    keyLightRef.current.position.set(lightX, lightY, lightDist);
    keyLightRef.current.castShadow = shadows;
    keyLightRef.current.intensity = environment.intensity;
  }, [lightX, lightY, lightDist, shadows, environment]);

  useEffect(() => {
    if (fillLightRef.current) fillLightRef.current.color.setHex(environment.light);
  }, [environment]);

  // Update environment background
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.background = null; // Use CSS backdrop instead
  }, [environment]);

  // Rebuild 3D object when text/material/shape/font changes
  useEffect(() => {
    if (!sceneRef.current || !font) return;

    // Remove old object
    if (objectRef.current) {
      sceneRef.current.remove(objectRef.current);
      objectRef.current.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      objectRef.current = null;
    }

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(material.color),
      metalness: metalness,
      roughness: roughness,
    });

    let obj = null;

    if (activeTool === 'text' && textContent) {
      const geo = buildTextGeometry(textContent, font, 0.3);
      if (geo) {
        obj = new THREE.Mesh(geo, mat);
      }
    } else if (activeTool === 'shapes' && shape.id !== 'none') {
      const g = buildShapeGeometry(shape.id);
      if (g) {
        if (g.isGroup) {
          g.traverse((c) => { if (c.material) { c.material.color.set(material.color); c.material.metalness = metalness; c.material.roughness = roughness; } });
          obj = g;
        } else {
          obj = new THREE.Mesh(g, mat);
        }
      }
    } else if (activeTool === 'mockups' && uploadedImage) {
      const loader = new THREE.TextureLoader();
      loader.load(uploadedImage, (tex) => {
        const planeGeo = new THREE.PlaneGeometry(2, 2 * (tex.image.height / tex.image.width));
        const planeMat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.4 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.position.z = 0.5;
        sceneRef.current.add(plane);
        objectRef.current = plane;
        applyTransform();
      });
      return;
    } else {
      // Default: show a text placeholder
      const geo = buildTextGeometry('TTT', font, 0.3);
      if (geo) obj = new THREE.Mesh(geo, mat);
    }

    if (obj) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      sceneRef.current.add(obj);
      objectRef.current = obj;
      applyTransform();
    }
  }, [textContent, material, shape, font, activeTool, uploadedImage, metalness, roughness]);

  // Apply object transform
  const applyTransform = () => {
    if (!objectRef.current) return;
    const s = objSize / 6;
    objectRef.current.scale.set(s, s, s);
    objectRef.current.rotation.x = (objTilt * Math.PI) / 180;
    objectRef.current.rotation.y = (objPitch * Math.PI) / 180;
    objectRef.current.rotation.z = (objRoll * Math.PI) / 180;
  };

  useEffect(() => { applyTransform(); }, [objSize, objTilt, objPitch, objRoll]);

  // Export as PNG
  const exportImage = () => {
    if (!rendererRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `contentcore-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  // Handle image upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Backdrop CSS
  const backdropStyle = useMemo(() => {
    if (backdrop.type === 'transparent') return { background: 'transparent' };
    if (backdrop.type === 'gradient')
      return { background: `linear-gradient(180deg, ${backdrop.color1} 0%, ${backdrop.color2} 100%)` };
    if (backdrop.type === 'radial')
      return { background: `radial-gradient(circle at 50% 50%, ${backdrop.color1} 0%, ${backdrop.color2} 70%)` };
    if (backdrop.type === 'spotlight')
      return { background: `radial-gradient(circle at 50% 40%, #3a3a3a 0%, #0a0a0a 60%)` };
    if (backdrop.type === 'beam')
      return { background: `linear-gradient(90deg, transparent 30%, ${backdrop.color1} 48%, ${backdrop.color1} 52%, transparent 70%), ${backdrop.color2}` };
    if (backdrop.type === 'platform')
      return { background: `linear-gradient(180deg, #0a0a0a 0%, ${backdrop.color} 60%, ${backdrop.color} 100%)` };
    return { background: '#1a1a1a' };
  }, [backdrop]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col">
      {/* Traffic light controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition" title="Close" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-white/80 text-sm font-medium">ContentCore®</span>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={exportImage} className="px-4 py-1.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition">
            Export PNG
          </button>
        </div>
      </div>

      {/* Quick start toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
        {QUICK_START_TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${
              activeTool === t.id ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{t.icon}</span>
            <span className="font-medium">{t.name}</span>
          </button>
        ))}
      </div>

      {/* Main area: canvas + sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative" style={backdropStyle}>
          <div ref={mountRef} className="w-full h-full" />
          {activeTool === 'mockups' && (
            <label className="absolute bottom-4 left-4 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg text-sm cursor-pointer hover:bg-white/20 transition border border-white/20">
              📁 Upload Image
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-80 bg-[#111] border-l border-white/10 overflow-y-auto flex flex-col">
          {/* Tab selector */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'materials', label: 'Material' },
              { id: 'environment', label: 'Scene' },
              { id: 'camera', label: 'Camera' },
              { id: 'text', label: 'Text' },
              { id: 'transform', label: 'Transform' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setShowSidebar(tab.id)}
                className={`flex-1 px-2 py-2.5 text-xs font-medium transition ${
                  showSidebar === tab.id ? 'text-white border-b-2 border-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* MATERIAL PANEL */}
            {showSidebar === 'materials' && (
              <>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Material</label>
                  <div className="grid grid-cols-3 gap-2">
                    {MATERIALS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setMaterial(m); setRoughness(m.roughness); setMetalness(m.metalness); }}
                        className={`p-2 rounded-lg border text-left transition ${
                          material.id === m.id ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="w-full h-8 rounded mb-1" style={{ background: m.color }} />
                        <span className="text-[10px] text-white/60">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Slider label="Roughness" value={roughness} min={0} max={1} step={0.01} onChange={setRoughness} />
                <Slider label="Metalness" value={metalness} min={0} max={1} step={0.01} onChange={setMetalness} />
                <Slider label="Surface Detail" value={surfaceDetail} min={0} max={1} step={0.01} onChange={setSurfaceDetail} />
              </>
            )}

            {/* ENVIRONMENT PANEL */}
            {showSidebar === 'environment' && (
              <>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Environment</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ENVIRONMENTS.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setEnvironment(e)}
                        className={`p-2 rounded-lg border text-left transition ${
                          environment.id === e.id ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="w-full h-10 rounded mb-1" style={{ background: e.bg }} />
                        <span className="text-[10px] text-white/60">{e.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Backdrop</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BACKDROPS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBackdrop(b)}
                        className={`p-1.5 rounded-lg border text-center transition ${
                          backdrop.id === b.id ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span className="text-[9px] text-white/60 block">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* CAMERA PANEL */}
            {showSidebar === 'camera' && (
              <>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Camera Position</div>
                <Slider label="Tilt" value={tilt} min={-90} max={90} step={0.5} onChange={setTilt} />
                <Slider label="Pitch" value={pitch} min={-90} max={90} step={0.5} onChange={setPitch} />
                <Slider label="Zoom" value={zoom} min={5} max={50} step={0.5} onChange={setZoom} />
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1 mt-3">Camera Settings</div>
                <Slider label="Field of View" value={fov} min={10} max={80} step={0.5} onChange={setFov} />
                <Slider label="Exposure" value={exposure} min={0} max={4} step={0.05} onChange={setExposure} />
              </>
            )}

            {/* TEXT PANEL */}
            {showSidebar === 'text' && (
              <>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Text Content</label>
                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30"
                    placeholder="Enter text..."
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Typeface</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPEFACES.map((tf) => (
                      <button
                        key={tf.id}
                        onClick={() => setTypeface(tf)}
                        className={`p-2 rounded-lg border text-left transition ${
                          typeface.id === tf.id ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span className="text-white/80 text-xs" style={{ fontFamily: tf.family, fontWeight: tf.weight }}>
                          {tf.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Shapes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SHAPES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setShape(s); if (s.id !== 'none') setActiveTool('shapes'); }}
                        className={`p-1.5 rounded-lg border text-center transition ${
                          shape.id === s.id ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span className="text-[9px] text-white/60 block">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TRANSFORM PANEL */}
            {showSidebar === 'transform' && (
              <>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Scale & Position</div>
                <Slider label="Size" value={objSize} min={1} max={15} step={0.1} onChange={setObjSize} />
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1 mt-3">Rotation</div>
                <Slider label="Tilt" value={objTilt} min={-180} max={180} step={1} onChange={setObjTilt} />
                <Slider label="Pitch" value={objPitch} min={-180} max={180} step={1} onChange={setObjPitch} />
                <Slider label="Roll" value={objRoll} min={-180} max={180} step={1} onChange={setObjRoll} />
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1 mt-3">Light</div>
                <Slider label="Light X" value={lightX} min={-15} max={15} step={0.5} onChange={setLightX} />
                <Slider label="Light Y" value={lightY} min={-15} max={15} step={0.5} onChange={setLightY} />
                <Slider label="Light Distance" value={lightDist} min={2} max={30} step={0.5} onChange={setLightDist} />
                <label className="flex items-center gap-2 mt-2 text-white/70 text-sm cursor-pointer">
                  <input type="checkbox" checked={shadows} onChange={(e) => setShadows(e.target.checked)} className="accent-white" />
                  Shadows
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-white/50 text-xs">{label}</label>
        <span className="text-white/70 text-xs font-mono">{Number(value).toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-white"
      />
    </div>
  );
}