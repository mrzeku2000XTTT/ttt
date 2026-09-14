import { useEffect, useReducer, useState } from 'react';
import { CAMERA_DEFAULTS, emptyCameraProject } from '@/components/camerastudio/cameraStudioDefaults';
import { readCameraProject, saveCameraProject } from '@/components/camerastudio/cameraStudioStore';
function reducer(state, action) {
  if (action.type === 'load') return { project: action.project, past: [] };
  if (action.type === 'undo') return state.past.length ? { project: state.past.at(-1), past: state.past.slice(0, -1) } : state;
  const p = state.project;
  let next = p;
  if (action.type === 'patch') next = { ...p, ...action.patch };
  if (action.type === 'settings') next = { ...p, settings: { ...p.settings, ...action.patch } };
  if (action.type === 'add') next = { ...p, assets: [...p.assets, ...action.assets], selected: action.assets[0].id };
  if (action.type === 'remove') next = { ...p, assets: p.assets.filter(a => a.id !== action.id), selected: p.selected === action.id ? p.assets.find(a => a.id !== action.id)?.id || null : p.selected };
  return { project: next, past: [...state.past.slice(-29), p] };
}
export default function useCameraProject() {
  const [state, dispatch] = useReducer(reducer, null, () => ({ project: emptyCameraProject(), past: [] }));
  const [loaded, setLoaded] = useState(false), [status, setStatus] = useState('Opening project…'), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    readCameraProject().then(project => { if (active && project) dispatch({ type: 'load', project: { ...project, editorMode: project.editorMode || 'operator', interestPoints: project.interestPoints || [], settings: { ...CAMERA_DEFAULTS, ...project.settings } } }); }).catch(() => { if (active) setError('Could not restore local storage. Your browser may have disabled it.'); }).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    let active = true; setStatus('Saving locally…');
    const timer = setTimeout(() => saveCameraProject(state.project).then(() => { if (active) setStatus('Saved on device'); }).catch(() => { if (active) { setStatus('Not saved'); setError('Local storage is full or unavailable. Export your work before leaving.'); } }), 600);
    return () => { active = false; clearTimeout(timer); };
  }, [state.project, loaded]);
  const add = files => {
    const all = Array.from(files || []), valid = all.filter(file => /^(image\/(png|jpeg|webp|avif|gif)|video\/)/.test(file.type) && file.size <= 200 * 1024 * 1024);
    if (valid.length !== all.length) setError('Use PNG, JPG, WEBP, AVIF, GIF or video files up to 200 MB each.');
    if (valid.length) dispatch({ type: 'add', assets: valid.map(file => ({ id: crypto.randomUUID(), name: file.name, file })) });
  };
  return { ...state, loaded, status, error, setError, add, update: patch => dispatch({ type: 'settings', patch }), patch: patch => dispatch({ type: 'patch', patch }), remove: id => dispatch({ type: 'remove', id }), undo: () => dispatch({ type: 'undo' }) };
}