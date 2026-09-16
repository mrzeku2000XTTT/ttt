import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeSubject, disposeGroup, setShotCamera } from '@/components/uiangle/angleGeometry';
import { bindAngleDrag } from '@/components/uiangle/angleScenePointer';
export function createAngleScene(host, preview, callbacks) {
  const renderer=new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); host.appendChild(renderer.domElement);
  renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none';
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#151515');
  scene.add(new THREE.HemisphereLight('#ffffff','#484848',2)); const light=new THREE.DirectionalLight('#ffffff',3); light.position.set(4,8,5); scene.add(light);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:'#232323',roughness:1})); floor.rotation.x=-Math.PI/2; floor.position.y=-.015; scene.add(floor);
  const grid=new THREE.GridHelper(24,24,'#545454','#303030'); scene.add(grid); grid.visible=!preview;
  const orbit=new THREE.PerspectiveCamera(42,1,.1,150); orbit.position.set(10,9,12);
  const shot=new THREE.PerspectiveCamera(48,16/9,.1,100); scene.add(shot);
  const controls=preview ? null : new OrbitControls(orbit,renderer.domElement); if(controls){controls.target.set(0,1,0);controls.maxPolarAngle=Math.PI*.49;controls.minDistance=3;controls.maxDistance=35;controls.update();}
  const subjects=new THREE.Group(); scene.add(subjects);
  const rig=new THREE.Mesh(new THREE.BoxGeometry(.45,.3,.55),new THREE.MeshBasicMaterial({color:'#f5f5f5',wireframe:true})); rig.userData.id='camera'; scene.add(rig); rig.visible=!preview;
  const helper=new THREE.CameraHelper(shot); scene.add(helper); helper.visible=!preview;
  const selection=new THREE.BoxHelper(new THREE.Object3D(),'#ffffff'); scene.add(selection); selection.visible=false;
  let current, previousSubjects, previousImage;
  const render=()=>{renderer.setScissorTest(false);renderer.setViewport(0,0,host.clientWidth,host.clientHeight);renderer.render(scene,preview?shot:orbit);};
  const resize=()=>{const w=host.clientWidth||1,h=host.clientHeight||1;renderer.setSize(w,h,false);orbit.aspect=w/h;orbit.updateProjectionMatrix();render();};
  const observer=new ResizeObserver(resize); observer.observe(host); controls?.addEventListener('change',render);
  const unbind=preview?()=>{}:bindAngleDrag(renderer.domElement,orbit,subjects,rig,controls,callbacks);
  const update=(state,image)=>{
    current=state;
    if(previousSubjects!==state.subjects || previousImage!==image){while(subjects.children.length){const child=subjects.children[0];subjects.remove(child);disposeGroup(child);} state.subjects.forEach(s=>subjects.add(makeSubject(s,image)));previousSubjects=state.subjects;previousImage=image;}
    setShotCamera(shot,state.liveCamera);rig.position.copy(shot.position);rig.quaternion.copy(shot.quaternion);helper.update();
    const selected=subjects.children.find(o=>o.userData.id===state.selected);selection.visible=!!selected&&!preview;if(selected)selection.setFromObject(selected);
    scene.updateMatrixWorld(true); render();
  };
  resize();
  return {update, capture:()=>new Promise(resolve=>{render();renderer.domElement.toBlob(resolve,'image/png');}), reset:()=>{orbit.position.set(10,9,12);controls?.target.set(0,1,0);controls?.update();render();}, dispose:()=>{observer.disconnect();unbind();controls?.dispose();disposeGroup(scene);renderer.dispose();renderer.domElement.remove();}};
}