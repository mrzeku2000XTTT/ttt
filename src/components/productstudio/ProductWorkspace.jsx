import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import invokeProtectedOperation from '@/components/integrations/invokeProtectedOperation';
import { Aperture, RotateCcw } from 'lucide-react';
import ProductPrompt from './ProductPrompt';
import AssetRail from './AssetRail';
import ProductCanvas from './ProductCanvas';
import CanvasInspector from './CanvasInspector';
import ProductBrowserPreview from './ProductBrowserPreview';

const key = 'product_studio_project_v1';
export default function ProductWorkspace() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } })();
  const [prompt, setPrompt] = useState(saved.prompt || ''), [assets, setAssets] = useState(saved.assets || []), [layers, setLayers] = useState(saved.layers || []);
  const [selected, setSelected] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [preview, setPreview] = useState(false);
  useEffect(() => localStorage.setItem(key, JSON.stringify({ prompt, assets, layers })), [prompt, assets, layers]);
  const addAssets = (urls, source) => setAssets((old) => [...urls.map((url, i) => ({ id: crypto.randomUUID(), url, source, name: `${source} idea ${i + 1}` })), ...old]);
  const upload = async (files) => { setBusy(true); setError(''); try { const out = await Promise.all(files.map((file) => base44.integrations.Core.UploadPublicFile({ file }))); addAssets(out.map((x) => x.file_url), 'Uploaded'); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const paste = (event) => { const files = [...event.clipboardData.files].filter((x) => x.type.startsWith('image/')); if (files.length) { event.preventDefault(); upload(files); return; } const url = event.clipboardData.getData('text').match(/https?:\/\/\S+\.(?:png|jpe?g|webp)(?:\?\S*)?/i)?.[0]; if (url) addAssets([url], 'Pasted'); };
  const generate = async () => { setBusy(true); setError(''); try { const refs = assets.filter((x) => x.source !== 'Generated').slice(0, 3).map((x) => x.url); const calls = ['clean hero shot', 'editorial angle', 'detail close-up', 'lifestyle composition'].map((direction) => invokeProtectedOperation('generateProductConcept', { brief: prompt, direction, references: refs })); addAssets((await Promise.all(calls)).map((x) => x.url), 'Generated'); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const addLayer = (asset) => { const layer = { ...asset, id: crypto.randomUUID(), x: 80 + layers.length * 12, y: 80 + layers.length * 12, scale: 55, radius: 24, motion: 'none' }; setLayers((x) => [...x, layer]); setSelected(layer.id); };
  const change = (data) => setLayers((x) => x.map((item) => item.id === selected ? { ...item, ...data } : item));
  const [playing, setPlaying] = useState(true), [replay, setReplay] = useState(0);
  const layer = layers.find((x) => x.id === selected);
  return <div className="flex h-screen flex-col overflow-hidden"><header className="flex h-16 items-center justify-between border-b border-border bg-card px-5"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground"><Aperture className="h-4 w-4" /></span><div><strong className="block text-sm">Product Studio</strong><span className="block text-[10px] text-muted-foreground">AI asset canvas</span></div></div><button onClick={() => { setLayers([]); setSelected(null); }} className="flex items-center gap-2 text-xs font-semibold"><RotateCcw className="h-3.5 w-3.5" />Clear canvas</button></header><div className="flex min-h-0 flex-1"><aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card"><ProductPrompt {...{ prompt, setPrompt, onFiles: upload, onPaste: paste, onGenerate: generate, busy }} />{error && <p className="px-4 pt-3 text-xs text-destructive">{error}</p>}<AssetRail assets={assets} onAdd={addLayer} /></aside>{preview ? <ProductBrowserPreview layers={layers} prompt={prompt} selected={selected} onSelect={setSelected} playing={playing} replay={replay} /> : <ProductCanvas playing={playing} replay={replay} layers={layers} selected={selected} onSelect={setSelected} onMove={(id, x, y) => setLayers((old) => old.map((item) => item.id === id ? { ...item, x, y } : item))} />}<CanvasInspector playing={playing} setPlaying={setPlaying} onReplay={() => { setPlaying(true); setReplay((n) => n + 1); }} layer={layer} onChange={(data) => { change(data); if (data.motion) { setPlaying(true); setReplay((n) => n + 1); } }} onDuplicate={() => layer && addLayer(layer)} onDelete={() => { setLayers((x) => x.filter((i) => i.id !== selected)); setSelected(null); }} {...{ preview, setPreview }} /></div></div>;
}