import * as THREE from 'three';
import { clamp } from '@/components/uiangle/angleModel';
export function bindAngleDrag(element, camera, subjects, rig, controls, callbacks) {
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),point=new THREE.Vector3(); let drag=null;
  const cast=e=>{const r=element.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);};
  const down=e=>{
    if(e.button!==0)return;cast(e);const hit=ray.intersectObjects([...subjects.children,rig],true)[0];if(!hit)return;
    let node=hit.object;while(node&&!node.userData.id)node=node.parent;if(!node)return;
    if(!ray.ray.intersectPlane(plane,point))return;
    callbacks.select(node.userData.id);drag={id:node.userData.id,dx:node.position.x-point.x,dz:node.position.z-point.z};controls.enabled=false;element.setPointerCapture(e.pointerId);e.preventDefault();e.stopImmediatePropagation();
  };
  const move=e=>{if(!drag)return;cast(e);if(ray.ray.intersectPlane(plane,point))callbacks.move(drag.id,clamp(point.x+drag.dx,-7.5,7.5),clamp(point.z+drag.dz,-7.5,7.5));e.preventDefault();e.stopImmediatePropagation();};
  const end=e=>{if(!drag)return;drag=null;controls.enabled=true;if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);e.stopImmediatePropagation();};
  element.addEventListener('pointerdown',down,true);element.addEventListener('pointermove',move,true);element.addEventListener('pointerup',end,true);element.addEventListener('pointercancel',end,true);element.addEventListener('lostpointercapture',end,true);
  return()=>{element.removeEventListener('pointerdown',down,true);element.removeEventListener('pointermove',move,true);element.removeEventListener('pointerup',end,true);element.removeEventListener('pointercancel',end,true);element.removeEventListener('lostpointercapture',end,true);};
}