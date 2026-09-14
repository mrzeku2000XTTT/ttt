import * as THREE from 'three';
import { cameraScreenGeometry, cameraShadowTexture } from '@/components/camerastudio/cameraStudioGeometry';
import { loadCameraMedia } from '@/components/camerastudio/cameraStudioMedia';
import { CAMERA_SIZES } from '@/components/camerastudio/cameraStudioDefaults';
import { cameraEase } from '@/components/camerastudio/cameraEasing';
import { layerTransformAt } from '@/components/camerastudio/cameraLayerAnimation';
import { cameraTransformAt } from '@/components/camerastudio/cameraTransformAnimation';
export default async function createCameraRenderer(canvas, assets) {
  const loaded = await Promise.all(assets.map(async asset => ({ asset, media: await loadCameraMedia(asset.file) })));
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); }
  catch (error) { loaded.forEach(item => item.media.dispose()); throw error; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 16 / 9, .1, 100), stage = new THREE.Group();
  camera.position.z = 9; scene.add(stage);
  const layers = loaded.map(({ asset, media }) => {
    const root = new THREE.Group(), texture = media.video ? new THREE.VideoTexture(media.element) : new THREE.Texture(media.element);
    texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, depthWrite: false }), screen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    const shadowTexture = cameraShadowTexture(), shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide }), shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMaterial);
    screen.renderOrder = 2; shadow.renderOrder = 1; shadow.position.set(0, -.08, -.06); root.add(shadow, screen); stage.add(root);
    return { id: asset.id, media, root, texture, material, screen, shadowTexture, shadowMaterial, shadow, shape: '' };
  });
  let lastRatio = '', disposed = false;
  const engine = { canvas, media: loaded[0]?.media, medias: loaded.map(item => item.media), exporting: false, disposed: false, aspects: Object.fromEntries(loaded.map(item => [item.asset.id, item.media.width / item.media.height])),
    draw(settings, time = 0, animate = false, interestPoints = [], assetStates = assets, cameraKeyframes = []) {
      if (disposed) return;
      const [width, height] = CAMERA_SIZES[settings.ratio]; camera.position.set(0, 0, 9); camera.zoom = 1; camera.clearViewOffset();
      if (lastRatio !== settings.ratio) { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); lastRatio = settings.ratio; }
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, viewWidth = viewHeight * camera.aspect;
      layers.forEach((layer, index) => {
        const state = assetStates.find(item => item.id === layer.id) || {}, transform = state.previewing ? state.transform : layerTransformAt(state, time, settings.easing);
        const aspect = layer.media.width / layer.media.height, h = Math.min(4.4, 5 * camera.aspect / aspect), w = h * aspect, key = `${w}:${h}:${settings.radius}`;
        if (layer.shape !== key) { layer.screen.geometry.dispose(); layer.screen.geometry = cameraScreenGeometry(w, h, settings.radius); layer.shadow.scale.set(w * 1.25, h * 1.25, 1); layer.shape = key; }
        layer.root.position.set(transform.x * viewWidth, -transform.y * viewHeight, index * .025); layer.root.scale.set(transform.scale * (transform.scaleX || 1), transform.scale * (transform.scaleY || 1), transform.scale); layer.root.rotation.z = THREE.MathUtils.degToRad(transform.rotation); layer.material.opacity = transform.opacity; layer.root.visible = transform.visible !== false; layer.shadowMaterial.opacity = settings.shadow * transform.opacity;
      });
      const p = Math.max(0, Math.min(1, time / settings.duration)), wave = Math.sin(p * Math.PI * 2), cameraTransform = cameraTransformAt(settings, cameraKeyframes, time, animate);
      let { x, y, z, zoom } = cameraTransform; stage.position.set(0, animate && settings.motion === 'float' ? wave * .14 : 0, 0);
      if (interestPoints.length) {
        const ordered = [...interestPoints].sort((a, b) => a.time - b.time); if (ordered[0].time > 0) ordered.unshift({ time: 0, x: .5, y: .5, width: 1, height: 1 });
        const nextIndex = ordered.findIndex(point => point.time >= time), next = nextIndex < 0 ? ordered.at(-1) : ordered[nextIndex], previous = nextIndex <= 0 ? next : ordered[nextIndex - 1], span = Math.max(.001, next.time - previous.time), mix = next === previous ? 1 : Math.max(0, Math.min(1, (time - previous.time) / span));
        const pw = previous.width || .18, nw = next.width || .18, ph = previous.height || pw * camera.aspect, nh = next.height || nw * camera.aspect, distance = Math.hypot(next.x - previous.x, next.y - previous.y) + Math.abs(nw - pw), eased = cameraEase(mix, settings.easing, distance);
        const focus = { x: previous.x + (next.x - previous.x) * eased, y: previous.y + (next.y - previous.y) * eased, width: pw + (nw - pw) * eased, height: ph + (nh - ph) * eased }, crop = Math.max(.04, Math.min(1, Math.max(focus.width, focus.height))), centerX = Math.max(crop / 2, Math.min(1 - crop / 2, focus.x)), centerY = Math.max(crop / 2, Math.min(1 - crop / 2, focus.y));
        camera.setViewOffset(width, height, (centerX - crop / 2) * width, (centerY - crop / 2) * height, crop * width, crop * height);
      }
      stage.rotation.set(THREE.MathUtils.degToRad(x), THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(z), 'XYZ'); stage.scale.setScalar(zoom); camera.updateProjectionMatrix(); renderer.setClearColor(settings.background, 1); renderer.render(scene, camera);
    },
    dispose() { disposed = true; engine.disposed = true; layers.forEach(layer => { layer.media.dispose(); layer.texture.dispose(); layer.shadowTexture.dispose(); layer.material.dispose(); layer.shadowMaterial.dispose(); layer.screen.geometry.dispose(); layer.shadow.geometry.dispose(); }); renderer.dispose(); }
  };
  return engine;
}