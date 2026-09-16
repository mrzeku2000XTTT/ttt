import * as THREE from 'three';
import { subjectTexture } from '@/components/uiangle/angleCutout';
export function makeSubject(item, image) {
  const group = new THREE.Group(); group.userData.id = item.id;
  const material = new THREE.MeshStandardMaterial({ color: '#bcbcbc', roughness: .82 });
  const add = (geometry,x,y,z) => { const mesh=new THREE.Mesh(geometry,material); mesh.position.set(x,y,z); group.add(mesh); return mesh; };
  if (item.display === 'cutout' && image && item.source) {
    const texture=subjectTexture(item,image);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(item.width,item.height), new THREE.MeshBasicMaterial({ map:texture, side:THREE.DoubleSide, transparent:true, alphaTest:.1 }));
    mesh.position.y=item.height/2; group.add(mesh); material.dispose();
  } else if(item.kind === 'character') {
    add(new THREE.SphereGeometry(.13,20,14),0,1.6,0);
    add(new THREE.CapsuleGeometry(.17,.42,6,12),0,1.13,0);
    [-1,1].forEach(sign => { add(new THREE.CapsuleGeometry(.07,.45,4,10),sign*.28,1.04,0).rotation.z=sign*.15; add(new THREE.CapsuleGeometry(.085,.65,4,10),sign*.12,.44,0); });
    group.scale.set(item.width/.7,item.height/1.75,item.depth/.4);
  } else { add(new THREE.BoxGeometry(item.width,item.height,item.depth),0,item.height/2,0); }
  group.scale.multiplyScalar(item.scale); group.position.set(item.x,0,item.z); group.rotation.y=item.rotation*Math.PI/180; return group;
}
export function disposeGroup(group) {
  const materials=new Set(),textures=new Set();
  group.traverse(obj => { obj.geometry?.dispose(); if(obj.material) (Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m => { materials.add(m); if(m.map) textures.add(m.map); }); });
  materials.forEach(m=>m.dispose()); textures.forEach(t=>t.dispose());
}
export function setShotCamera(shot,c) {
  shot.position.set(c.x,c.height,c.z); const yaw=c.yaw*Math.PI/180, tilt=c.tilt*Math.PI/180;
  shot.lookAt(c.x+Math.sin(yaw)*Math.cos(tilt),c.height+Math.sin(tilt),c.z-Math.cos(yaw)*Math.cos(tilt));
  shot.fov=c.fov; shot.updateProjectionMatrix(); shot.updateMatrixWorld();
}