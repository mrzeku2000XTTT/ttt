import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BackToStore from '@/components/BackToStore';
import { planConversation, buildTimeline, buildSoundEvents } from '@/components/dez/messagesEngine';
import { drawFrame, W, H } from '@/components/dez/messagesCanvas';
import { getAudioCtx, playSend, playReceive, playTick } from '@/components/dez/messagesAudio';
import { exportMessagesMp4 } from '@/components/dez/messagesExport';
import { Loader2, Play, Download, ArrowLeft, ArrowRight, Trash2, Plus, Sparkles, ChevronLeft } from 'lucide-react';

const PLAYERS = { send: playSend, receive: playReceive, tick: playTick };
const EXAMPLES = [
  'left on read after a first date',
  'best friend wants me to do their half of the project, I say no',
  'mom finds out about the secret tattoo'
];

export default function DezMessages() {
  const [title, setTitle] = useState('');
  const [messages, setMessages] = useState([]);
  const [brief, setBrief] = useState('');
  const [planBusy, setPlanBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [exportPct, setExportPct] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoExt, setVideoExt] = useState('mp4');

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({});

  const timeline = useMemo(() => buildTimeline(messages), [messages]);
  const sounds = useMemo(() => buildSoundEvents(timeline), [timeline]);
  stateRef.current = { timeline, sounds };

  // idle frame = the finished conversation
  useEffect(() => {
    const cv = canvasRef.current;
    if (cv) drawFrame(cv.getContext('2d'), timeline, timeline.total);
  }, [timeline]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const plan = async () => {
    if (!brief.trim() || planBusy) return;
    setPlanBusy(true);
    try {
      const p = await planConversation(brief);
      setTitle(p.title);
      setMessages(p.messages);
      setVideo(null);
    } catch (e) {
      setTitle(e?.message || 'Could not plan that — try again.');
    } finally {
      setPlanBusy(false);
    }
  };

  const play = () => {
    const { timeline: tl, sounds: ss } = stateRef.current;
    if (!tl.items.length) return;
    cancelAnimationFrame(rafRef.current);
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    const actx = getAudioCtx();
    const base = actx.currentTime + 0.05;
    ss.forEach((s) => PLAYERS[s.type]?.(actx, actx.destination, base + s.t));
    setPlaying(true);
    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      drawFrame(ctx, tl, Math.min(t, tl.total));
      if (t >= tl.total) {
        setPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const doExport = async () => {
    if (!timeline.items.length || exportPct !== null) return;
    setExportPct(0.001);
    try {
      const { blob, ext } = await exportMessagesMp4({
        timeline,
        sounds,
        onProgress: (p) => setExportPct(Math.max(0.001, p))
      });
      setVideoExt(ext);
      setVideo(URL.createObjectURL(blob));
      setExportPct(null);
    } catch (e) {
      setExportPct(null);
      setTitle(e?.message || 'Export failed.');
    }
  };

  const addMessage = () => {
    setMessages((m) => [...m, { id: 'm' + Date.now().toString(36), side: 'outgoing', text: '', pause: 0.7 }]);
  };
  const updateMessage = (id, patch) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const deleteMessage = (id) => setMessages((m) => m.filter((x) => x.id !== id));
  const toggleSide = (id, side) => updateMessage(id, { side: side === 'incoming' ? 'outgoing' : 'incoming' });

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white flex flex-col">
      <BackToStore />
      <div className="flex-1 min-h-0 flex flex-col px-4 pt-4 pb-3">
        <div className="shrink-0 flex items-center justify-between gap-3 pr-28">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/Dez" className="text-zinc-600 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">DEZ · MESSAGES</h1>
            </div>
            <p className="text-zinc-500 text-[11px] sm:text-xs mt-1">Plan a chat with AI · realistic typing · iOS sounds · MP4 out</p>
          </div>
        </div>

        <div className="mt-4 flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
          {/* Preview */}
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            <div className="flex-1 min-h-0 flex items-center justify-center">
              {/* 3D phone — dark titanium bezel, side buttons, rounded screen */}
              <div
                className="relative h-full max-h-full rounded-[52px] p-[11px]"
                style={{
                  aspectRatio: `${W}/${H}`,
                  background: 'linear-gradient(160deg, #4a4a4e 0%, #2a2a2e 30%, #101012 65%, #000 100%)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 2px 3px rgba(255,255,255,0.1)'
                }}
              >
                <div className="relative h-full w-full rounded-[41px] overflow-hidden bg-white">
                  <canvas ref={canvasRef} width={W} height={H} className="w-full h-full block" />
                  {!messages.length && (
                    <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
                      <p className="text-zinc-400 text-sm">Plan a conversation with AI — it plays out here, typing like a real phone.</p>
                    </div>
                  )}
                </div>
                <div className="absolute -right-[2px] top-[16%] w-[3px] h-14 rounded-r-sm bg-gradient-to-b from-zinc-600 to-zinc-800" />
                <div className="absolute -right-[2px] top-[30%] w-[3px] h-24 rounded-r-sm bg-gradient-to-b from-zinc-600 to-zinc-800" />
                <div className="absolute -left-[2px] top-[22%] w-[3px] h-10 rounded-l-sm bg-gradient-to-b from-zinc-600 to-zinc-800" />
                <div className="absolute -left-[2px] top-[34%] w-[3px] h-16 rounded-l-sm bg-gradient-to-b from-zinc-600 to-zinc-800" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={play}
                disabled={!messages.length}
                className="flex items-center gap-2 bg-white text-black text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-30"
              >
                <Play className="w-4 h-4" /> {playing ? 'Restart' : 'Play'}
              </button>
              <button
                onClick={doExport}
                disabled={!messages.length || exportPct !== null}
                className="flex items-center gap-2 border border-zinc-700 text-sm font-semibold rounded-lg px-4 py-2 hover:border-zinc-400 disabled:opacity-30 transition-colors"
              >
                {exportPct !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exportPct !== null ? `Recording ${Math.round(exportPct * 100)}%` : 'Export MP4'}
              </button>
              {timeline.items.length > 0 && (
                <span className="text-xs text-zinc-500">
                  {timeline.total.toFixed(1)}s · {timeline.items.length} messages {playing ? '· playing' : ''}
                </span>
              )}
            </div>

            {video && (
              <div className="shrink-0 flex items-center gap-3">
                <video src={video} controls loop className="h-28 w-auto rounded-xl border border-zinc-800" />
                <a
                  href={video}
                  download={`dez-messages.${videoExt}`}
                  className="flex items-center gap-1.5 border border-zinc-700 text-xs font-semibold rounded-lg px-3 py-2 hover:border-zinc-400 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Save
                </a>
              </div>
            )}
          </div>

          {/* Planner */}
          <div className="h-52 lg:h-auto lg:w-[380px] shrink-0 min-h-0 flex flex-col gap-3">
            <div className="shrink-0 border border-zinc-800 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Plan with AI</p>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe the conversation — who's texting, the story, the ending…"
                rows={3}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-zinc-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setBrief(ex)}
                    className="text-[10px] text-zinc-500 border border-zinc-800 rounded-full px-2.5 py-1 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <button
                onClick={plan}
                disabled={!brief.trim() || planBusy}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-30"
              >
                {planBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {planBusy ? 'Planning…' : 'Write the chat'}
              </button>
              {title && <p className="text-xs text-zinc-500 mt-2 truncate">{title}</p>}
            </div>

            <div className="flex-1 min-h-0 border border-zinc-800 rounded-xl flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Script · edit anything</p>
                <button onClick={addMessage} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
                {messages.length === 0 && (
                  <p className="text-xs text-zinc-600 text-center py-6">No messages yet — plan one above or add manually.</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSide(m.id, m.side)}
                      title={m.side === 'incoming' ? 'Incoming (gray, left)' : 'Outgoing (blue, right — typed live)'}
                      className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
                      style={{ background: m.side === 'incoming' ? '#E9E9EB' : '#007AFF', color: m.side === 'incoming' ? '#000' : '#fff' }}
                    >
                      {m.side === 'incoming' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                    <input
                      value={m.text}
                      onChange={(e) => updateMessage(m.id, { text: e.target.value })}
                      placeholder="text…"
                      className="flex-1 min-w-0 bg-black border border-zinc-800 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-zinc-500"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={m.pause ?? 0.7}
                      onChange={(e) => updateMessage(m.id, { pause: Math.max(0, Number(e.target.value) || 0) })}
                      title="Pause before this message (seconds)"
                      className="w-12 shrink-0 bg-black border border-zinc-800 rounded-lg px-1.5 py-2 text-xs text-zinc-400 focus:outline-none focus:border-zinc-500"
                    />
                    <button
                      onClick={() => deleteMessage(m.id)}
                      className="w-7 h-7 shrink-0 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}