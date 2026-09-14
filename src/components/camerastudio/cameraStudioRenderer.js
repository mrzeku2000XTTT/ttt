import * as THREE from 'three';
import { cameraScreenGeometry, cameraShadowTexture } from '@/components/camerastudio/cameraStudioGeometry';
import { loadCameraMedia } from '@/components/camerastudio/cameraStudioMedia';
import { CAMERA_SIZES } from '@/components/camerastudio/cameraStudioDefaults';
export default async function createCameraRenderer(canvas, file) {
  const media = await loadCameraMedia(file);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); }
  catch (error) { media.dispose(); throw error; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100), group = new THREE.Group();
  camera.position.z = 9; scene.add(group);
  const texture = media.video ? new THREE.VideoTexture(media.element) : new THREE.Texture(media.element);
  texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, depthWrite: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material); screen.renderOrder = 2; group.add(screen);
  const shadowTexture = cameraShadowTexture(), shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: .24, depthWrite: false, side: THREE.DoubleSide });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMaterial); shadow.position.set(0, -.08, -.06); shadow.renderOrder = 1; group.add(shadow);
  let lastShape = '', lastRatio = '', disposed = false, planeWidth = 1, planeHeight = 1;
  const engine = { canvas, media, exporting: false, disposed: false,
    draw(settings, time = 0, animate = false, interestPoints = []) {
      if (disposed) return;
      const [width, height] = CAMERA_SIZES[settings.ratio];
      if (lastRatio !== settings.ratio) { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); lastRatio = settings.ratio; }
      const key = `${settings.ratio}:${settings.radius}`;
      if (lastShape !== key) {
        const aspect = media.width / media.height, h = Math.min(4.4, 5 * camera.aspect / aspect), w = h * aspect;
        planeWidth = w; planeHeight = h;
        screen.geometry.dispose(); screen.geometry = cameraScreenGeometry(w, h, settings.radius);
        shadow.scale.set(w * 1.25, h * 1.25, 1); lastShape = key;
      }
      const p = Math.max(0, Math.min(1, time / settings.duration)), ease = p * p * (3 - 2 * p), wave = Math.sin(p * Math.PI * 2);
      let x = settings.x, y = settings.y, z = settings.z, zoom = settings.zoom;
      group.position.set(0, 0, 0);
      if (animate) {
        if (settings.motion === 'push') zoom *= 1 + .12 * Math.sin(Math.PI * ease) ** 2;
        if (settings.motion === 'orbit') { y += wave * 12; x += Math.sin(p * Math.PI) * 5; }
        if (settings.motion === 'float') { group.position.y = wave * .14; z += wave * 2; }
      }
      let focus = null;
      if (interestPoints.length) {
        const ordered = [...interestPoints].sort((a, b) => a.time - b.time);
        if (ordered[0].time > 0) ordered.unshift({ time: 0, x: .5, y: .5 });
        const nextIndex = ordered.findIndex(point => point.time >= time);
        const next = nextIndex < 0 ? ordered.at(-1) : ordered[nextIndex];
        const previous = nextIndex <= 0 ? next : ordered[nextIndex - 1];
        const span = Math.max(.001, next.time - previous.time);
        const mix = next === previous ? 1 : Math.max(0, Math.min(1, (time - previous.time) / span));
        const smooth = mix * mix * (3 - 2 * mix);
        focus = { x: previous.x + (next.x - previous.x) * smooth, y: previous.y + (next.y - previous.y) * smooth };
      }
      const rotation = new THREE.Euler(THREE.MathUtils.degToRad(x), THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(z), 'XYZ');
      group.rotation.copy(rotation); group.scale.setScalar(zoom);
      if (focus) {
        const target = new THREE.Vector3((focus.x - .5) * planeWidth, (.5 - focus.y) * planeHeight, 0).multiplyScalar(zoom).applyEuler(rotation);
        group.position.x = -target.x; group.position.y = -target.y;
      }
      shadowMaterial.opacity = settings.shadow; renderer.setClearColor(settings.background, 1); renderer.render(scene, camera);
    },
    dispose() { disposed = true; engine.disposed = true; media.dispose(); texture.dispose(); shadowTexture.dispose(); material.dispose(); shadowMaterial.dispose(); screen.geometry.dispose(); shadow.geometry.dispose(); renderer.dispose(); }
  };
  return engine;
}