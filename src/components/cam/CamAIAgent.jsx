import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SYSTEM = `You are the CAM AI Agent, the built-in copilot of CAM — a DaVinci Fusion-style 3D virtual camera studio. You fully operate the studio for the user via tool calls.

CAMERA MOVES (ids): pan, tilt, roll, dolly, zoom, dollyzoom, truck, pedestal, orbit, crane.

TOOLS you can call (emit them in "actions", they run in order):
- set_move: pick the camera move (move id)
- set_intensity: 0.05-1 (value)
- set_duration: seconds (value)
- add_shot: append a shot to the sequence (optionally move, intensity 0-1, duration seconds)
- play / pause: run or stop the current move
- play_sequence: play the shot sequence
- open_rig: fullscreen the 3D camera rig · open_nodes: fullscreen the node graph · restore_view: back to split view
- fusion_on / fusion_off: enter / leave the Fusion 3D layer workspace
- decompose: explode the loaded image into individual 3D asset layers
- move_layer: move a Fusion layer in 3D (layer = index, or -1 for the currently selected layer; axis x/y/z; value = world units, small ranges like -3 to 3)
- set_image: load the user's attached image as the studio media source
- add_nodes: build node chains in the graph (nodes = ordered list of MediaIn / Transform / Camera3D / Renderer3D / MediaOut; attach_to = an existing node type to link the chain into the graph)

If the user attached an image you can see it — analyze it and act accordingly (e.g. set_image to use it, then propose a camera move that fits its composition). Reply in one or two short sentences like a seasoned dolly grip who knows this studio inside out. Always emit at least one action when the user asks for a change.`;

const SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    actions: { type: 'array', items: { type: 'object', properties: {
      tool: { type: 'string', enum: ['set_move', 'set_intensity', 'set_duration', 'add_shot', 'play', 'pause', 'play_sequence', 'open_rig', 'open_nodes', 'restore_view', 'fusion_on', 'fusion_off', 'decompose', 'move_layer', 'set_image', 'add_nodes'] },
      move: { type: 'string', enum: ['pan', 'tilt', 'roll', 'dolly', 'zoom', 'dollyzoom', 'truck', 'pedestal', 'orbit', 'crane'] },
      value: { type: 'number' },
      intensity: { type: 'number' },
      duration: { type: 'number' },
      axis: { type: 'string', enum: ['x', 'y', 'z'] },
      layer: { type: 'number' },
      nodes: { type: 'array', items: { type: 'object', properties: { type: { type: 'string', enum: ['MediaIn', 'Transform', 'Camera3D', 'Renderer3D', 'MediaOut'] }, attach_to: { type: 'string' } }, required: ['type'] } },
    } } },
  },
  required: ['reply', 'actions'],
};

// CAM AI Agent floater — full studio copilot. Accepts pasted images for
// analysis, runs every studio control via tool calls, builds node chains,
// and keeps per-user chat history that survives refresh.
export default function CamAIAgent({ address, context, onAction, onGraph }) {
  const [open, setOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [attach, setAttach] = useState(null); // { file, url }
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`cam_ai_chat_${address}`)) || []; } catch { return []; }
  });
  const chatEl = useRef(null);

  useEffect(() => { try { localStorage.setItem(`cam_ai_chat_${address}`, JSON.stringify(messages.slice(-40))); } catch {} }, [messages, address]);
  useEffect(() => { chatEl.current?.scrollTo({ top: 1e6 }); }, [messages, busy]);

  const attachImage = (file) => {
    if (!file?.type?.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAttach({ file, url: ev.target.result });
    reader.readAsDataURL(file);
  };
  const onPaste = (e) => {
    const items = e.clipboardData?.items || [];
    for (const it of items) if (it.type.startsWith('image/')) { e.preventDefault(); attachImage(it.getAsFile()); return; }
  };

  const send = async () => {
    const text = prompt.trim();
    const msg = text || (attach ? 'Analyze this image.' : '');
    if (!msg || busy) return;
    const file = attach?.file;
    setMessages((m) => [...m, { r: 'u', t: msg, img: !!attach }]);
    setPrompt(''); setAttach(null); setBusy(true);
    try {
      let fileUrls;
      if (file) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 3600 });
        fileUrls = signed_url;
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM}\n\nSTUDIO STATE: move=${context.move} intensity=${context.intensity} duration=${context.duration}s mode=${context.mode} image=${context.hasImage ? 'loaded' : 'none'} shots=${context.shotCount} fusion=${context.fusionOn ? 'on' : 'off'} layers=${context.layerCount}\n\nUSER: ${msg}`,
        ...(fileUrls ? { file_urls: [fileUrls] } : {}),
        response_json_schema: SCHEMA,
      });
      (res.actions || []).forEach((a) => {
        if (!a?.tool) return;
        if (a.tool === 'add_nodes') onGraph(a.nodes || []);
        else if (a.tool === 'set_image') onAction({ ...a, file });
        else onAction(a);
      });
      setMessages((m) => [...m, { r: 'a', t: res.reply || 'Done.' }]);
    } catch {
      setMessages((m) => [...m, { r: 'a', t: 'Something went wrong — try again.' }]);
    }
    setBusy(false);
  };

  if (!open) return <button className="cm-ai-dot" onClick={() => setOpen(true)} title="CAM AI Agent"><Camera /></button>;
  return (
    <div className="cm-ai-floater">
      <div className="cm-ai-head"><Camera /><strong>CAM AI Agent</strong><button onClick={() => setOpen(false)} title="Hide"><X /></button></div>
      <div ref={chatEl} className="cm-ai-chat">
        {messages.map((m, i) => (
          <div key={i} className={`cm-ai-msg ${m.r}`}>{m.img ? '[image] ' : ''}{m.t}</div>
        ))}
        {!messages.length && <div className="cm-ai-msg a">I run this whole studio — camera moves, sequences, nodes, the 3D rig, Fusion layers. Paste an image to analyze it, or just tell me the shot.</div>}
        {busy && <div className="cm-ai-msg a">Working the rig…</div>}
      </div>
      {attach && (
        <div className="cm-ai-chip">
          <img src={attach.url} alt="attached" />
          <span>Image attached — I can see and analyze it.</span>
          <button onClick={() => setAttach(null)} title="Remove"><X /></button>
        </div>
      )}
      <div className="cm-ai-row">
        <label className="cm-ai-input-wrap">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onPaste={onPaste} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Paste an image or describe the shot…" />
        </label>
        <button onClick={send} disabled={busy} title="Run it">{busy ? <Loader2 className="animate-spin" /> : <Send />}</button>
      </div>
    </div>
  );
}