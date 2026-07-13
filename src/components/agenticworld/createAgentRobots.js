import * as THREE from "three";

// Procedural humanoid robot agents — built from primitives (zero asset cost).
// Each robot wanders the open world with articulated walking limbs.
const BODY_MAT = new THREE.MeshBasicMaterial({ color: 0x06222e });
const EDGE_MAT = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9 });
const VISOR_MAT = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
const CORE_MAT = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

function part(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, BODY_MAT);
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), EDGE_MAT));
  return mesh;
}

function buildRobot() {
  const robot = new THREE.Group();

  const torso = part(1.1, 1.5, 0.6);
  torso.position.y = 2.6;
  robot.add(torso);

  // Glowing chest core
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), CORE_MAT);
  core.position.set(0, 2.75, 0.32);
  robot.add(core);

  const head = part(0.6, 0.55, 0.55);
  head.position.y = 3.75;
  robot.add(head);

  // Visor
  const visor = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.12), VISOR_MAT);
  visor.position.set(0, 3.78, 0.29);
  robot.add(visor);

  // Limbs pivot at their top so they swing like joints
  const limb = (w, len) => {
    const pivot = new THREE.Group();
    const seg = part(w, len, w);
    seg.position.y = -len / 2;
    pivot.add(seg);
    return pivot;
  };

  const armL = limb(0.28, 1.3); armL.position.set(-0.78, 3.2, 0); robot.add(armL);
  const armR = limb(0.28, 1.3); armR.position.set(0.78, 3.2, 0); robot.add(armR);
  const legL = limb(0.36, 1.85); legL.position.set(-0.32, 1.85, 0); robot.add(legL);
  const legR = limb(0.36, 1.85); legR.position.set(0.32, 1.85, 0); robot.add(legR);

  robot.userData.limbs = { armL, armR, legL, legR, torso, head };
  return robot;
}

export function createAgentRobots(scene, count = 10) {
  const robots = [];
  for (let i = 0; i < count; i++) {
    const robot = buildRobot();
    const angle = (i / count) * Math.PI * 2;
    const radius = 8 + Math.random() * 26;
    robot.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius - 10);
    robot.userData.speed = 2.2 + Math.random() * 1.6;
    robot.userData.phase = Math.random() * Math.PI * 2;
    robot.userData.target = new THREE.Vector3();
    pickTarget(robot);
    scene.add(robot);
    robots.push(robot);
  }

  function pickTarget(robot) {
    const a = Math.random() * Math.PI * 2;
    const r = 6 + Math.random() * 34;
    robot.userData.target.set(Math.cos(a) * r, 0, Math.sin(a) * r - 10);
  }

  const dir = new THREE.Vector3();
  function update(t, dt) {
    for (const robot of robots) {
      const { limbs, speed, phase, target } = robot.userData;
      dir.subVectors(target, robot.position); dir.y = 0;
      const dist = dir.length();
      if (dist < 1.5) { pickTarget(robot); continue; }
      dir.normalize();

      // Smoothly face heading
      const desired = Math.atan2(dir.x, dir.z);
      let delta = desired - robot.rotation.y;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      robot.rotation.y += delta * Math.min(1, dt * 3);

      // Walk forward
      robot.position.addScaledVector(dir, speed * dt);

      // Articulated walk cycle
      const s = t * speed * 2.4 + phase;
      limbs.legL.rotation.x = Math.sin(s) * 0.55;
      limbs.legR.rotation.x = Math.sin(s + Math.PI) * 0.55;
      limbs.armL.rotation.x = Math.sin(s + Math.PI) * 0.45;
      limbs.armR.rotation.x = Math.sin(s) * 0.45;
      robot.position.y = Math.abs(Math.sin(s)) * 0.12;
      limbs.torso.rotation.y = Math.sin(s) * 0.06;
      limbs.head.rotation.y = Math.sin(t * 0.7 + phase) * 0.3;
    }
  }

  function dispose() {
    for (const robot of robots) {
      scene.remove(robot);
      robot.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    }
  }

  return { update, dispose };
}