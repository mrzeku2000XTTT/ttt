import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── Real camera-language detection ─────────────────────────────────────────
// Deterministic parser: guarantees any spoken camera angle maps to a real move
// id, even if the LLM misses it. Runs before every request and backs up the
// model's plan.
const MOVE_PATTERNS = [
  ['dollyzoom', /dolly[\s-]*zoom|vertigo|hitchcock/i],
  ['zoom', /zoom|lens[\s-]*(in|tight)|close[\s-]*up|macro/i],
  ['dolly', /\bdolly\b|push[\s-]*in|move\s+(in|closer)|creep(ing)?\s+(in|closer)/i],
  ['pan', /\bpan\b|whip|swipe|scan/i],
  ['tilt', /\btilt\b|reveal\b|look\s+(up|down)|booms?\s+(up|down)/i],
  ['roll', /\broll\b|dutch|canted|askew/i],
  ['truck', /\btruck\b|track(ing)?\s+shot|sideways|lateral/i],
  ['pedestal', /pedestal|rise\b|descend|elevator|lifts?\s+(up|down)/i],
  ['orbit', /orbit|circle\s*around|revolve|arc(ing)?\s*around|360/i],
  ['crane', /\bcrane\b|\bjib\b|aerial|sweeping/i],
];
const detectCamera = (text) => {
  const hits = [];
  MOVE_PATTERNS.forEach(([id, re]) => { const m = re.exec(text); if (m) hits.push({ id, at: m.index }); });
  hits.sort((a, b) => a.at - b.at);
  let moves = hits.map((h) => h.id);
  if (moves.includes('dollyzoom')) moves = moves.filter((m) => m !== 'dolly' && m !== 'zoom'); // vertigo wins over its parts
  let intensity = null;
  if (/\b(subtle|gentle|slight|soft|light|barely|slow burn)\b/i.test(text)) intensity = 0.3;
  else if (/\b(extreme|crazy|wild|max|insane|heavy|all the way)\b/i.test(text)) intensity = 1;
  else if (/\b(strong|bold|dramatic|intense|fast|aggressive|hard)\b/i.test(text)) intensity = 0.85;
  const dur = /(\d+(?:\.\d+)?)\s*(s\b|sec|second)/i.exec(text);
  const wantsPlay = /\b(play|preview|animate|run it|roll it|show me)\b/i.test(text);
  return { moves, intensity, duration: dur ? +dur[1] : null, wantsPlay };
};

const SYSTEM = `You are the CAM AI Agent, the built-in copilot of CAM — a DaVinci Fusion-style 3D virtual camera studio. You fully operate the studio for the user via tool calls and can invent any camera angle they describe.

CAMERA MOVES (ids): pan, tilt, roll, dolly, zoom, dollyzoom, truck, pedestal, orbit, crane. If the user asks for an angle or shot not on the list (e.g. "hero shot", "drop from above"), translate it into the closest move id plus tuned intensity/duration — say how you translated it.

TOOLS you can call (emit them in "actions", they run in order):
- set_move: pick the camera move (move id)
- set_intensity: 0.05-1 (value)
- set_duration: seconds (value)
- add_shot: append a shot to the sequence (optionally move, intensity 0-1, duration seconds). When the user describes multiple moves ("dolly in then orbit"), add one shot per move in the order spoken, then call play_sequence.
- play / pause · play_sequence: run or stop
- open_rig: fullscreen the 3D camera rig · open_nodes: fullscreen the node graph · restore_view: back to split view
- fusion_on / fusion_off: enter / leave the Fusion 3D layer workspace
- decompose: explode the loaded image into individual 3D asset layers
- move_layer: move a Fusion layer in 3D (layer = index, or -1 for the currently selected layer; axis x/y/z; value = world units, small ranges like -3 to 3)
- set_image: load the user's attached image as the studio media source
- add_nodes: build node chains in the graph (nodes = ordered list of MediaIn / Transform / Camera3D / Renderer3D / MediaOut; attach_to = an existing node type to link the chain into the graph)

PROMPTO PASS — for EVERY request you also write director_prompt: a long, precise, 90-150 word cinematography brief that names the exact moves, speed ramps, easing, framing, focus feel, composition and emotional intent, written so any camera operator could execute it shot-for-shot. Never write a generic description — encode the concrete camera language you selected in the actions.

A deterministic parser pre-detects the camera language in the user's message under "DETECTED CAMERA LANGUAGE". Trust it when present — use those move ids, intensity and duration.

If the user attached an image you can see it — analyze it and let its composition drive the brief. Reply in one or two short sentences like a seasoned dolly grip. Always emit at least one action when the user asks for a change.`;

const SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    director_prompt: { type: 'string' },
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
  required: ['reply', 'director_prompt', 'actions'],
};

// CAM AI Agent floater — full studio copilot with real camera-move detection,
// a Prompto-style director brief on every request, pasted-image vision, and
// per-user chat history that survives refresh.
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
    const det = detectCamera(msg);
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
        prompt: `${SYSTEM}\n\nSTUDIO STATE: move=${context.move} intensity=${context.intensity} duration=${context.duration}s mode=${context.mode} image=${context.hasImage ? 'loaded' : 'none'} shots=${context.shotCount} fusion=${context.fusionOn ? 'on' : 'off'} layers=${context.layerCount}\n\nDETECTED CAMERA LANGUAGE: moves=[${det.moves.join(', ') || 'none'}] intensity=${det.intensity ?? 'unspecified'} duration=${det.duration ?? 'unspecified'} playback=${det.wantsPlay}\n\nUSER: ${msg}`,
        ...(fileUrls ? { file_urls: [fileUrls] } : {}),
        response_json_schema: SCHEMA,
      });
      const acts = (res.actions || []).filter(Boolean);
      // Detector guarantee — if the model skipped spoken camera language, run it anyway
      const hasMoveAct = acts.some((a) => a.tool === 'set_move' || a.tool === 'add_shot');
      if (det.moves.length && !hasMoveAct) {
        if (det.moves.length > 1) det.moves.forEach((mv) => acts.push({ tool: 'add_shot', move: mv }));
        else acts.push({ tool: 'set_move', move: det.moves[0] });
      }
      if (det.intensity != null && !acts.some((a) => a.tool === 'set_intensity')) acts.push({ tool: 'set_intensity', value: det.intensity });
      if (det.duration && !acts.some((a) => a.tool === 'set_duration')) acts.push({ tool: 'set_duration', value: det.duration });
      if (det.wantsPlay && !acts.some((a) => a.tool === 'play' || a.tool === 'play_sequence')) acts.push(acts.some((a) => a.tool === 'add_shot') ? { tool: 'play_sequence' } : { tool: 'play' });
      acts.forEach((a) => {
        if (!a?.tool) return;
        if (a.tool === 'add_nodes') onGraph(a.nodes || []);
        else if (a.tool === 'set_image') onAction({ ...a, file });
        else onAction(a);
      });
      const next = [...messages, { r: 'u', t: msg, img: !!file }];
      if (res.director_prompt) next.push({ r: 'd', t: res.director_prompt });
      next.push({ r: 'a', t: res.reply || 'Done.' });
      setMessages(next);
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
        {messages.map((m, i) => m.r === 'd' ? (
          <div key={i} className="cm-ai-msg d"><b>DIRECTOR&apos;S PROMPT</b>{m.t}</div>
        ) : (
          <div key={i} className={`cm-ai-msg ${m.r === 'u' ? 'u' : 'a'}`}>{m.img ? '[image] ' : ''}{m.t}</div>
        ))}
        {!messages.length && <div className="cm-ai-msg a">I run this whole studio and can invent any camera angle you describe — dolly, vertigo, orbit, crane, anything. Paste an image to analyze it, or just call the shot.</div>}
        {busy && <div className="cm-ai-msg a">Writing the director&apos;s prompt and working the rig…</div>}
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
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onPaste={onPaste} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Paste an image or call the shot…" />
        </label>
        <button onClick={send} disabled={busy} title="Run it">{busy ? <Loader2 className="animate-spin" /> : <Send />}</button>
      </div>
    </div>
  );
}