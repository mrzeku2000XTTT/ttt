import React, { useState } from 'react';
import { Camera, Loader2, Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SYSTEM = `You are the CAM AI Agent inside a DaVinci Fusion-style node editor for a 3D virtual camera studio. Available node types: MediaIn (image source), Transform (move / scale / rotate), Camera3D (camera move: Pan, Tilt, Roll, Dolly, Zoom, Dolly Zoom, Truck, Pedestal, Orbit, Crane), Renderer3D (perspective render), MediaOut (final output). Given the user's natural-language request, return an ordered chain of nodes that implements it. Set attach_to to an EXISTING node type (like "MediaIn" or "Camera3D") only when the chain should plug into the existing graph; omit it to build a standalone chain. Keep chains short and purposeful.`;

// CAM AI Agent floater — natural language in, real node chains out.
// Collapses to a small white camera dot; expands to a mini chat console.
export default function CamAIAgent({ onGraph }) {
  const [open, setOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const send = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    setBusy(true); setNote('');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM}\n\nUser request: ${text}`,
        response_json_schema: {
          type: 'object',
          properties: {
            explanation: { type: 'string' },
            nodes: { type: 'array', items: { type: 'object', properties: { type: { type: 'string', enum: ['MediaIn', 'Transform', 'Camera3D', 'Renderer3D', 'MediaOut'] }, attach_to: { type: 'string' } }, required: ['type'] } },
          },
          required: ['explanation', 'nodes'],
        },
      });
      const { added } = onGraph(res.nodes || []);
      if (added) { setNote(res.explanation || `Built ${added} node${added > 1 ? 's' : ''}.`); setPrompt(''); }
      else setNote('No valid node types found in that request — try naming a camera move or render.');
    } catch {
      setNote('The agent could not build that. Try rephrasing.');
    }
    setBusy(false);
  };

  if (!open) return <button className="cm-ai-dot" onClick={() => setOpen(true)} title="CAM AI Agent"><Camera /></button>;
  return (
    <div className="cm-ai-floater">
      <div className="cm-ai-head"><Camera /><strong>CAM AI Agent</strong><button onClick={() => setOpen(false)} title="Hide"><X /></button></div>
      <p className="cm-ai-note">{busy ? 'Designing the node chain…' : note || 'Describe the shot — the agent builds the node chain for you.'}</p>
      <div className="cm-ai-row">
        <label className="cm-ai-input-wrap">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="e.g. dolly into the image, then orbit around it" />
        </label>
        <button onClick={send} disabled={busy} title="Build nodes">{busy ? <Loader2 className="animate-spin" /> : <Send />}</button>
      </div>
    </div>
  );
}