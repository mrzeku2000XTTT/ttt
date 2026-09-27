// The 3D pose over time — keyframes of where the card sits and how it is angled,
// played back on the artwork. It is a camera move: the card is the subject and
// the timeline is the shot. The stage owns the playback; this is only the model.
export const TRACK_SECONDS = 6;

// Home is the pose the artwork opens on, so a move always starts and ends where
// the picture already is and can be replayed without a jump.
export const HOME_POSE = { x: 0, y: 0, z: 0 };
export const HOME_ANGLE = { x: 26, y: -16, z: 0 };

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => min + Math.random() * (max - min);
// Eased, so the move settles into a keyframe instead of hitting it like a wall.
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function makeKey(t, position, angle) {
  return { t, position: { ...position }, angle: { ...angle } };
}

// The pose at a moment: the two keys either side of it, eased between them.
export function poseAt(keys, t) {
  if (!keys?.length) return { position: { ...HOME_POSE }, angle: { ...HOME_ANGLE } };
  const time = clamp(t, 0, TRACK_SECONDS);
  if (time <= keys[0].t) return { position: { ...keys[0].position }, angle: { ...keys[0].angle } };
  const last = keys[keys.length - 1];
  if (time >= last.t) return { position: { ...last.position }, angle: { ...last.angle } };
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i];
    const b = keys[i + 1];
    if (time >= a.t && time <= b.t) {
      const span = b.t - a.t || 1;
      const k = ease((time - a.t) / span);
      return {
        position: {
          x: lerp(a.position.x, b.position.x, k),
          y: lerp(a.position.y, b.position.y, k),
          z: lerp(a.position.z, b.position.z, k),
        },
        angle: {
          x: lerp(a.angle.x, b.angle.x, k),
          y: lerp(a.angle.y, b.angle.y, k),
          z: lerp(a.angle.z, b.angle.z, k),
        },
      };
    }
  }
  return { position: { ...HOME_POSE }, angle: { ...HOME_ANGLE } };
}

// A whole random move, written in one go: it opens and closes at home, and the
// keys between travel, tilt and drop through depth. This is what the agent
// hands over when it is asked to move the artwork itself.
export function randomTrack() {
  const count = 3 + Math.floor(Math.random() * 3);
  const step = TRACK_SECONDS / (count + 1);
  const keys = [makeKey(0, HOME_POSE, HOME_ANGLE)];
  for (let i = 1; i <= count; i += 1) {
    const t = clamp(step * i + rand(-step * 0.22, step * 0.22), 0.2, TRACK_SECONDS - 0.2);
    keys.push(
      makeKey(
        +t.toFixed(2),
        { x: rand(-130, 130), y: rand(-80, 80), z: rand(-160, 170) },
        {
          x: clamp(HOME_ANGLE.x + rand(-34, 34), -60, 70),
          y: clamp(HOME_ANGLE.y + rand(-46, 46), -70, 70),
          z: rand(-22, 22),
        },
      ),
    );
  }
  keys.push(makeKey(TRACK_SECONDS, HOME_POSE, HOME_ANGLE));
  return keys.sort((a, b) => a.t - b.t);
}

// Keep a pose at a moment. A key already sitting on that moment is replaced, so
// pressing Key twice does not stack two of them on the same frame.
export function addKey(keys, t, position, angle) {
  const at = clamp(t, 0, TRACK_SECONDS);
  const next = [...(keys || []).filter((k) => Math.abs(k.t - at) > 0.06), makeKey(at, position, angle)];
  return next.sort((a, b) => a.t - b.t);
}