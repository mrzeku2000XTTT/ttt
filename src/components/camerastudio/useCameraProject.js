import { useEffect, useReducer, useState } from 'react';
import { CAMERA_DEFAULTS, emptyCameraProject } from '@/components/camerastudio/cameraStudioDefaults';
import { createTextAsset } from '@/components/camerastudio/cameraTextPresets';
import { readCameraProject, saveCameraProject, listCameraProjects, deleteCameraProject } from '@/components/camerastudio/cameraStudioStore';
function reducer(state, action) {
  if (action.type === 'load') return { project: action.project, past: [], future: [] };
  if (action.type === 'undo') return state.past.length ? { project: state.past.at(-1), past: state.past.slice(0, -1), future: [state.project, ...state.future].slice(0, 30) } : state;
  if (action.type === 'redo') return state.future.length ? { project: state.future[0], past: [...state.past, state.project].slice(-30), future: state.future.slice(1) } : state;
  const p = state.project;
  let next = p;
  if (action.type === 'patch') next = { ...p, ...action.patch };
  if (action.type === 'settings') next = { ...p, settings: { ...p.settings, ...action.patch } };
  if (action.type === 'add') next = { ...p, assets: [...p.assets, ...action.assets], selected: action.assets[0].id };
  if (action.type === 'remove') next = { ...p, assets: p.assets.filter(a => a.id !== action.id), selected: p.selected === action.id ? p.assets.find(a => a.id !== action.id)?.id || null : p.selected };
  return { project: next, past: [...state.past.slice(-29), p], future: [] };
}
export default function useCameraProject() {
  const [state, dispatch] = useReducer(reducer, null, () => ({ project: emptyCameraProject(), past: [], future: [] }));
  const [loaded, setLoaded] = useState(false), [status, setStatus] = useState('Opening project…'), [error, setError] = useState(''), [projects, setProjects] = useState([]);
  const refreshProjects = () => listCameraProjects().then(setProjects).catch(() => setProjects([]));
  useEffect(() => {
    let active = true;
    readCameraProject().then(project => { if (active && project) dispatch({ type: 'load', project: { ...project, id: project.id || crypto.randomUUID(), editorMode: project.editorMode === 'composer' ? 'operator' : (project.editorMode || 'operator'), interestPoints: project.interestPoints || [], scenes: project.scenes?.length ? project.scenes : [{ id: crypto.randomUUID(), name: 'Scene 1', start: 0, end: { ...CAMERA_DEFAULTS, ...project.settings }.duration }], settings: { ...CAMERA_DEFAULTS, ...project.settings } } }); refreshProjects(); }).catch(() => { if (active) setError('Could not restore local storage. Your browser may have disabled it.'); }).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    let active = true; setStatus('Saving locally…');
    const timer = setTimeout(() => saveCameraProject(state.project).then(() => { if (active) { setStatus('Saved on device'); refreshProjects(); } }).catch(() => { if (active) { setStatus('Not saved'); setError('Local storage is full or unavailable. Export your work before leaving.'); } }), 600);
    return () => { active = false; clearTimeout(timer); };
  }, [state.project, loaded]);
  const add = files => {
    const all = Array.from(files || []), valid = all.filter(file => /^(image\/(png|jpeg|webp|avif|gif)|video\/)/.test(file.type) && file.size <= 200 * 1024 * 1024);
    if (valid.length !== all.length) setError('Use PNG, JPG, WEBP, AVIF, GIF or video files up to 200 MB each.');
    if (valid.length) dispatch({ type: 'add', assets: valid.map((file, index) => ({ id: crypto.randomUUID(), name: file.name, file, transform: { x: Math.min(.2, (state.project.assets.length + index) * .035), y: Math.min(.2, (state.project.assets.length + index) * .035), scale: 1, rotation: 0, opacity: 1, visible: true } })) });
  };
  const addTextAsset = preset => dispatch({ type: 'add', assets: [createTextAsset(preset, state.project.settings.duration)] });
  return { ...state, projects, loaded, status, error, setError, add, addTextAsset, update: patch => dispatch({ type: 'settings', patch }), patch: patch => dispatch({ type: 'patch', patch }), remove: id => dispatch({ type: 'remove', id }), undo: () => dispatch({ type: 'undo' }), redo: () => dispatch({ type: 'redo' }), newProject: () => dispatch({ type: 'load', project: emptyCameraProject() }), openProject: project => dispatch({ type: 'load', project }), deleteProject: async id => { await deleteCameraProject(id); if (state.project.id === id) dispatch({ type: 'load', project: emptyCameraProject() }); refreshProjects(); } };
}