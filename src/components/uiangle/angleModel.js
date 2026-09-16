export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const toWorld = (v) => (v / 100 - 0.5) * 16;
export const toPercent = (v) => (v / 16 + 0.5) * 100;
export const HUMAN = [[42,0],[58,0],[65,6],[65,15],[59,21],[72,25],[83,48],[76,53],[64,36],[64,56],[70,96],[56,100],[50,64],[44,100],[30,96],[36,56],[36,36],[24,53],[17,48],[28,25],[41,21],[35,15],[35,6]];
export function newSubject(kind = 'character') {
  return { id: crypto.randomUUID(), label: kind === 'character' ? 'Character' : kind === 'building' ? 'Building' : 'Object', kind, x: 0, z: 1, height: kind === 'building' ? 3 : 1.8, width: kind === 'building' ? 2.4 : 0.8, depth: kind === 'building' ? 2 : 0.5, rotation: 0, scale: 1, display: 'dummy', w: kind === 'building' ? 25 : 12, h: 40, outline: kind === 'character' ? HUMAN.map(p => [...p]) : [[0,0],[100,0],[100,100],[0,100]], source: null };
}
export const initialCamera = { x: 0, z: 6, height: 1.6, yaw: 0, tilt: -5, fov: 48 };
export const initialFlatCamera = { x: 50, y: 50, zoom: 1, roll: 0 };
export function aimAt(camera, subject) {
  const dx = subject.x - camera.x, dz = subject.z - camera.z;
  return { yaw: Math.atan2(dx, -dz) * 180 / Math.PI, tilt: Math.atan2(subject.height * subject.scale / 2 - camera.height, Math.hypot(dx, dz)) * 180 / Math.PI };
}
export function motionCamera(camera, motion, t) {
  const r = camera.yaw * Math.PI / 180;
  if (motion === 'Dolly in') return { ...camera, x: camera.x + Math.sin(r) * t * 2, z: camera.z - Math.cos(r) * t * 2 };
  if (motion === 'Dolly out') return { ...camera, x: camera.x - Math.sin(r) * t * 2, z: camera.z + Math.cos(r) * t * 2 };
  if (motion === 'Crane up') return { ...camera, height: camera.height + t * 2 };
  if (motion === 'Pan left' || motion === 'Pan right') return { ...camera, yaw: camera.yaw + t * (motion === 'Pan left' ? -40 : 40) };
  const tx = camera.x + Math.sin(r) * 4, tz = camera.z - Math.cos(r) * 4, a = t * Math.PI / 3;
  const x = tx + (camera.x-tx)*Math.cos(a) - (camera.z-tz)*Math.sin(a), z = tz + (camera.x-tx)*Math.sin(a) + (camera.z-tz)*Math.cos(a);
  return { ...camera, x, z, yaw: Math.atan2(tx-x, -(tz-z)) * 180 / Math.PI };
}
export function scenePrompt(s) {
  return `Generate one finished ${s.mode === '2d' ? '2D animation-style' : '3D cinematic'} image. ${s.prompt}\nThe first attached image is the actual user-positioned camera-view blockout; follow its framing, positions, overlaps, silhouettes and negative space. Any second image is the original reference: use its characters, environment and visual style, not its original framing. Replace dummy figures with the corresponding characters; do not render editor guides or labels.\nCamera: ${JSON.stringify(s.mode === '2d' ? s.flatCamera : s.liveCamera)}. ${s.mode === '4d' ? `Motion study: ${s.motion}, time ${s.time.toFixed(2)} of a six-second move; output a still frame, not video.` : ''}\nSubjects: ${JSON.stringify(s.subjects.map(({label,kind,x,z,height,width,scale,rotation}) => ({label,kind,x,z,height,width,scale,rotation})))}`;
}