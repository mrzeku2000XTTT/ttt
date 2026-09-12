import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function useCamAxisDrag({ axis, value, onChange, onSelect, dragging }) {
  const { camera, gl, controls } = useThree();
  const cleanup = useRef(null);
  useEffect(() => () => cleanup.current?.(), []);
  return (event) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    cleanup.current?.();
    onSelect();
    const parent = event.object.parent;
    parent.updateWorldMatrix(true, false);
    const inverse = parent.matrixWorld.clone().invert();
    const origin = parent.getWorldPosition(new THREE.Vector3());
    const direction = new THREE.Vector3(); direction[axis] = 1;
    direction.transformDirection(parent.matrixWorld);
    const normal = camera.getWorldDirection(new THREE.Vector3());
    normal.addScaledVector(direction, -normal.dot(direction));
    if (normal.lengthSq() < 0.00001) return;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal.normalize(), origin);
    const initial = event.ray.intersectPlane(plane, new THREE.Vector3());
    if (!initial) return;
    initial.applyMatrix4(inverse);
    const pointerId = event.pointerId, wasEnabled = controls?.enabled;
    dragging.current = true;
    if (controls) controls.enabled = false;
    const raycaster = new THREE.Raycaster();
    const move = (e) => {
      if (e.pointerId !== pointerId) return;
      const r = gl.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2), camera);
      const hit = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
      if (hit) onChange(value + hit.applyMatrix4(inverse)[axis] - initial[axis]);
    };
    const end = (e) => { if (e && e.pointerId !== undefined && e.pointerId !== pointerId) return; cleanup.current?.(); };
    cleanup.current = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); window.removeEventListener('blur', end);
      if (gl.domElement.hasPointerCapture(pointerId)) gl.domElement.releasePointerCapture(pointerId);
      if (controls) controls.enabled = wasEnabled;
      dragging.current = false; cleanup.current = null;
    };
    gl.domElement.setPointerCapture(pointerId);
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end); window.addEventListener('blur', end);
  };
}