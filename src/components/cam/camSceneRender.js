import * as THREE from 'three';
import { moveAt, moveById } from '@/components/cam/camMoves';

// Project the same layered planes and camera used in the 3D rig onto the 2D output.
export default function renderCamScene(canvas, scene, media, framing = 1) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const c = scene.camera, move = moveAt(moveById(c.moveId), scene.progress, c.intensity);
  const camera = new THREE.PerspectiveCamera(c.fov || 48, W / H, 0.05, 100);
  camera.position.set(move.x * 3.4, -move.y * 1.9, (c.distance || 4.2) / Math.max(0.55, move.zoom));
  camera.lookAt(0, 0, 0); camera.rotateZ((move.rot + (c.roll || 0)) * Math.PI / 180); camera.updateMatrixWorld();
  const assets = scene.assets.map((a) => { const source = media.find((m) => m.id === a.id); return { ...a, img: source?.img, aspect: source?.aspect || a.aspect }; }).filter((a) => a.img);
  assets.sort((a, b) => new THREE.Vector3(b.x, b.y, b.z).distanceToSquared(camera.position) - new THREE.Vector3(a.x, a.y, a.z).distanceToSquared(camera.position));
  for (const a of assets) {
    ctx.globalAlpha = a.opacity ?? 1; ctx.filter = `${a.blur ? `blur(${a.blur}px)` : ''} ${a.glow ? `drop-shadow(0 0 ${a.glow}px #00ff9d)` : ''}`.trim() || 'none';
    const h = 1.9 * a.scale, w = (a.id === 'primary' ? 3.4 : 1.9 * (a.aspect || 1)) * a.scale, angle = (a.rotation || 0) * Math.PI / 180;
    const project = (u, v) => { const lx=(u-.5)*w, ly=(.5-v)*h, p = new THREE.Vector3(a.x + lx*Math.cos(angle)-ly*Math.sin(angle), a.y + lx*Math.sin(angle)+ly*Math.cos(angle), a.z).project(camera); return { x: W / 2 + p.x * W / 2 * framing, y: H / 2 - p.y * H / 2 * framing, z: p.z, u: u * a.img.naturalWidth, v: v * a.img.naturalHeight }; };
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const p = [project(x / 8, y / 8), project((x + 1) / 8, y / 8), project((x + 1) / 8, (y + 1) / 8), project(x / 8, (y + 1) / 8)];
      for (const indices of [[0, 1, 2], [0, 2, 3]]) {
        const [A, B, C] = indices.map((i) => p[i]);
        if ([A, B, C].some((v) => v.z < -1 || v.z > 1)) continue;
        const det = (B.u - A.u) * (C.v - A.v) - (C.u - A.u) * (B.v - A.v);
        const aa = ((B.x - A.x) * (C.v - A.v) - (C.x - A.x) * (B.v - A.v)) / det;
        const bb = ((B.y - A.y) * (C.v - A.v) - (C.y - A.y) * (B.v - A.v)) / det;
        const cc = ((C.x - A.x) * (B.u - A.u) - (B.x - A.x) * (C.u - A.u)) / det;
        const dd = ((C.y - A.y) * (B.u - A.u) - (B.y - A.y) * (C.u - A.u)) / det;
        ctx.save(); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.closePath(); ctx.clip();
        ctx.setTransform(aa, bb, cc, dd, A.x - aa * A.u - cc * A.v, A.y - bb * A.u - dd * A.v); ctx.drawImage(a.img, 0, 0); ctx.restore();
      }
    }
    ctx.globalAlpha = 1; ctx.filter = 'none';
  }
}