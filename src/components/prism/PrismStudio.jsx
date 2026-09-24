import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown, History, Home, Loader2, Paperclip, Sparkles, Store, X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PrismMeasurements from './PrismMeasurements';
import PrismReport from './PrismReport';
import PrismSource from './PrismSource';
import PrismExportMenu from './PrismExportMenu';
import { clearProjects, listProjects, loadProject, saveProject } from './prismProjects';
import {
  analyseSeries, contactSheet, dataUrlToFile, estimateFps, fileSize, loadVideo,
  pickVisionTimes, sampleSeries, seekTo, timecode,
} from './prismFrames';

const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1fe645919_generated_image.png';

const STEPS = ['Container', 'Frames', 'Measurement', 'Thumbnails'];

const when = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Date(iso).toLocaleDateString();
};

const friendly = (e) => {
  const m = e?.message || '';
  if (/taint|SecurityError|insecure|cors/i.test(m)) {
    return 'That link blocks this browser from reading its pixels, so the frames cannot be measured. Download the file and drop it in instead — a local file always works.';
  }
  return m || 'Something went wrong reading this file.';
};

export default function PrismStudio({ onHome, initialFile }) {
  const [src, setSrc] = useState('');
  const [source, setSource] = useState(null);
  const [stage, setStage] = useState('idle');
  const [step, setStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [facts, setFacts] = useState(null);
  const [result, setResult] = useState(null);
  const [sheet, setSheet] = useState([]);
  const [report, setReport] = useState(null);
  const [readTimes, setReadTimes] = useState([]);
  const [reading, setReading] = useState(false);
  const [activeTime, setActiveTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [projects, setProjects] = useState([]);

  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const objectUrl = useRef(null);
  const jobRef = useRef(0);
  const skipRun = useRef(false);
  const restored = useRef(false);

  useEffect(() => {
    if (stage !== 'working') return;
    setElapsed(0);
    const iv = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [stage]);

  /* ------------------------------------------------------- surviving a refresh */
  useEffect(() => {
    const recent = listProjects();
    setProjects(recent);
    if (recent.length) {
      const p = loadProject(recent[0].id);
      if (p && p.result) {
        restored.current = true;
        if (p.kind === 'link' && p.src) skipRun.current = true;
        setSource({ name: p.name, bytes: p.bytes, kind: p.kind });
        setFacts(p.facts || null);
        setResult(p.result || null);
        setSheet(p.sheet || []);
        setReport(p.report || null);
        setReadTimes(p.readTimes || []);
        setStage('done');
        setProgress(1);
        if (p.kind === 'link' && p.src) setSrc(p.src);
      }
    }
  }, []);

  // A file handed over from the landing page's drop zone.
  useEffect(() => {
    if (initialFile) startFile(initialFile);
  }, [initialFile]);

  const persist = (over = {}) => {
    if (!source) return;
    saveProject({
      name: source.name,
      kind: source.kind,
      bytes: source.bytes || 0,
      src: source.kind === 'link' ? src : '',
      facts: over.facts ?? facts,
      result: over.result ?? result,
      sheet: over.sheet ?? sheet,
      report: over.report ?? report,
      readTimes: over.readTimes ?? readTimes,
    });
    setProjects(listProjects());
  };

  const openProject = (id) => {
    const p = loadProject(id);
    if (!p) return;
    jobRef.current += 1;
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
    restored.current = true;
    skipRun.current = p.kind === 'link' && !!p.src;
    setError('');
    setReport(p.report || null);
    setReadTimes(p.readTimes || []);
    setSheet(p.sheet || []);
    setResult(p.result || null);
    setFacts(p.facts || null);
    setSource({ name: p.name, bytes: p.bytes, kind: p.kind });
    setStage(p.result ? 'done' : 'idle');
    setProgress(p.result ? 1 : 0);
    setSrc(p.kind === 'link' && p.src ? p.src : '');
  };

  /* ------------------------------------------------------------------ the pass */
  useEffect(() => {
    if (!src) return;
    if (skipRun.current) {
      skipRun.current = false;
      return;
    }
    const job = jobRef.current + 1;
    jobRef.current = job;
    const alive = () => jobRef.current === job;

    (async () => {
      try {
        setStage('working');
        setError('');
        setResult(null);
        setSheet([]);
        setReport(null);
        setReadTimes([]);
        setProgress(0);
        setStep('Reading the container');

        const v = await loadVideo(videoRef.current);
        if (!alive()) return;
        const fps = await estimateFps(v);
        if (!alive()) return;
        await seekTo(v, 0);
        if (!alive()) return;

        const fileFacts = {
          duration: v.duration,
          width: v.videoWidth,
          height: v.videoHeight,
          fps,
          bytes: source?.bytes || 0,
        };
        setFacts(fileFacts);
        setProgress(0.05);

        const { frames } = await sampleSeries(v, (p, label) => {
          if (!alive()) return;
          setProgress(0.05 + p * 0.6);
          setStep(label);
        });
        if (!alive()) return;

        setStep('Measuring motion and cuts');
        const analysis = analyseSeries(frames, v.duration);
        if (!alive()) return;
        setResult(analysis);
        setProgress(0.72);

        setStep('Rendering thumbnails');
        const times = pickVisionTimes(frames, analysis.motion, v.duration, 14);
        const thumbs = await contactSheet(v, times, (p, label) => {
          if (!alive()) return;
          setProgress(0.72 + p * 0.26);
          setStep(label);
        });
        if (!alive()) return;

        setSheet(thumbs);
        setProgress(1);
        setStep('');
        setStage('done');
        persist({ facts: fileFacts, result: analysis, sheet: thumbs, report: null, readTimes: [] });
      } catch (e) {
        if (!alive()) return;
        setError(friendly(e));
        setStage('error');
      }
    })();
  }, [src, source]);

  /* ------------------------------------------------------------------ sources */
  const startFile = (file) => {
    if (!file) return;
    const isVideo = /^video\//.test(file.type) || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
    if (!isVideo) {
      setError('That is not a video file. MP4 or WebM work best.');
      setStage('error');
      return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    restored.current = false;
    setSource({ name: file.name, bytes: file.size, kind: 'file' });
    setSrc(objectUrl.current);
  };

  const startLink = (raw) => {
    const url = (raw || '').trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setError('Paste a full https link to the video file.');
      setStage('error');
      return;
    }
    restored.current = false;
    setSource({ name: url.split('/').pop()?.split('?')[0] || 'Remote video', bytes: 0, kind: 'link' });
    setSrc(url);
  };

  const reset = () => {
    jobRef.current += 1;
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
    restored.current = false;
    setSrc('');
    setSource(null);
    setStage('idle');
    setStep('');
    setProgress(0);
    setError('');
    setFacts(null);
    setResult(null);
    setSheet([]);
    setReport(null);
    setReadTimes([]);
  };

  const seek = (t) => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = t;
      setActiveTime(t);
    } catch {
      // some sources refuse a seek while still buffering
    }
  };

  /* -------------------------------------------------------------- the visual read */
  const readDesign = async () => {
    if (!sheet.length) return;
    setReading(true);
    setError('');
    try {
      const picks = sheet.slice(0, 8);
      const urls = [];
      for (const f of picks) {
        const file = dataUrlToFile(f.url, `prism-${Math.round(f.t * 100)}.jpg`);
        const up = await base44.integrations.Core.UploadPublicFile({ file });
        if (up?.file_url) urls.push(up.file_url);
      }
      if (!urls.length) throw new Error('Could not prepare the sampled frames for the read.');

      // Kept compact: the function caps the measurements at 6000 characters, and a
      // fast-cut video produces a lot of shots and samples.
      const r1 = (n) => Math.round(Number(n) * 10) / 10;
      const thin = (arr) => arr.filter((_, i) => i % 2 === 0).map(r1);
      const meta = {
        duration: facts?.duration,
        width: facts?.width,
        height: facts?.height,
        fps: facts?.fps,
        summary: result.summary,
        palette: result.palette,
        cuts_sample: result.cuts.slice(0, 60).map(r1),
        shots_sample: result.shots.slice(0, 40).map((s) => ({
          start: r1(s.start),
          end: r1(s.end),
          length: r1(s.length),
          motion: s.motion,
        })),
        motion_series: thin(result.motion),
        brightness_series: thin(result.brightness),
        white_series: thin(result.white),
      };

      const res = await base44.functions.invoke('prismAnalyze', {
        frames: urls,
        meta,
        times: picks.map((p) => p.t),
      });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      if (!data?.report) throw new Error('The read came back empty — try again.');
      const times = picks.map((p) => p.t);
      setReport(data.report);
      setReadTimes(times);
      persist({ report: data.report, readTimes: times });
    } catch (e) {
      setError(e?.message || 'The visual read failed.');
    } finally {
      setReading(false);
    }
  };

  const payload = () => ({ source, facts, result, sheet, report });

  const hasResult = !!result;

  return (
    <div className="min-h-screen bg-white text-[#121212]">
      <header className="sticky top-0 z-20 border-b border-[#ececec] bg-white/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center gap-2">
          <button onClick={onHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Back to landing">
            <img src={LOGO} alt="PRISM" className="w-6 h-6 rounded-md object-cover" />
            <span className="text-[11px] font-bold tracking-[0.25em]">PRISM</span>
          </button>
          {source && (
            <span className="hidden sm:inline text-[10px] text-[#a3a3a3] truncate max-w-[200px]">{source.name}</span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {projects.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-[#e6e6e6] text-[10px] text-[#6b6b6b] hover:text-[#121212] hover:border-[#c9c9c9] transition-colors">
                    <History className="w-3 h-3" />
                    <span className="hidden sm:inline">Saved</span>
                    <span className="text-[#a3a3a3]">{projects.length}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Saved in this browser
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {projects.map((p) => (
                    <DropdownMenuItem key={p.id} onSelect={() => openProject(p.id)} className="flex flex-col items-start gap-0.5">
                      <span className="text-[11px] truncate w-full">{p.name}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {when(p.savedAt)} · {p.duration ? `${p.duration.toFixed(1)}s` : '—'}
                        {p.hasRead ? ' · read' : ''}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      clearProjects();
                      setProjects([]);
                    }}
                    className="text-[11px] text-red-500"
                  >
                    Clear saved projects
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {(src || hasResult) && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-[#e6e6e6] text-[10px] text-[#6b6b6b] hover:text-[#121212] hover:border-[#c9c9c9] transition-colors"
              >
                <X className="w-3 h-3" />
                New file
              </button>
            )}
            <button onClick={onHome} className="p-2 text-[#8a8a8a] hover:text-[#121212] transition-colors" title="Home">
              <Home className="w-4 h-4" />
            </button>
            <Link
              to="/AppStoreV2"
              className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-[#e6e6e6] text-[10px] text-[#6b6b6b] hover:text-[#121212] hover:border-[#c9c9c9] transition-colors"
            >
              <Store className="w-3 h-3" />
              <span className="hidden sm:inline">Exit to Store</span>
            </Link>
          </div>
        </div>
        <div className="prism-hairline" />
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = '';
          startFile(picked);
        }}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {!src && !hasResult ? (
          <PrismSource onPick={() => fileRef.current?.click()} onFile={startFile} onLink={startLink} error={error} />
        ) : (
          <div className="space-y-2.5">
            {/* The file itself, mounted so it can be scrubbed */}
            {src ? (
              <div className="rounded-2xl border border-[#ececec] bg-white p-2 prism-frame">
                <video
                  ref={videoRef}
                  src={src}
                  crossOrigin="anonymous"
                  muted
                  playsInline
                  controls
                  onTimeUpdate={(e) => setActiveTime(e.currentTarget.currentTime)}
                  className="w-full rounded-xl bg-black max-h-[46vh]"
                />
              </div>
            ) : (
              source?.kind === 'file' && (
                <div className="rounded-2xl border border-dashed border-[#e6e6e6] bg-[#fafafa] px-4 py-3 flex flex-wrap items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5 text-[#8a8a8a]" />
                  <span className="text-[11px] text-[#6f6f6f]">
                    This is a saved analysis of <span className="font-semibold">{source.name}</span>. A refresh can’t
                    re-open a local file, so drop it again to scrub the video — the measurements are all still here.
                  </span>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="ml-auto rounded-full border border-[#e6e6e6] px-3 py-1.5 text-[10px] text-[#6b6b6b] hover:text-[#121212] hover:border-[#c9c9c9] transition-colors"
                  >
                    Re-attach file
                  </button>
                </div>
              )
            )}

            {/* File facts */}
            <div className="rounded-2xl border border-[#ececec] bg-white px-4 py-3 prism-frame">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {[
                  ['Length', facts ? `${facts.duration.toFixed(2)}s` : '—'],
                  ['Resolution', facts ? `${facts.width}×${facts.height}` : '—'],
                  ['Aspect', facts ? `${(facts.width / facts.height).toFixed(2)}:1` : '—'],
                  ['Frame rate', facts?.fps ? `~${facts.fps} fps` : 'not exposed'],
                  ['Size', facts?.bytes ? fileSize(facts.bytes) : source?.kind === 'link' ? 'remote' : '—'],
                  ['Sampled', result ? `every ${result.summary.sampleInterval}s` : '—'],
                ].map(([k, v]) => (
                  <span key={k} className="flex items-baseline gap-1.5">
                    <span className="text-[9px] uppercase tracking-[0.14em] text-[#a3a3a3]">{k}</span>
                    <span className="text-[11px] tabular-nums text-[#2e2e2e]">{v}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Progress */}
            {stage === 'working' && (
              <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9775fa]" />
                  <span className="text-[11px] text-[#4a4a4a]">{step || 'Working…'}</span>
                  <span className="ml-auto text-[10px] tabular-nums text-[#a3a3a3]">{elapsed}s</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-[#ededed] overflow-hidden">
                  <div className="h-full bg-[#121212] transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {STEPS.map((s, i) => (
                    <span
                      key={s}
                      className={`text-[9px] uppercase tracking-[0.14em] ${progress >= [0.05, 0.65, 0.72, 1][i] ? 'text-[#121212]' : 'text-[#c4c4c4]'}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {stage === 'error' && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[11px] text-red-700 leading-relaxed">{error}</p>
                <button onClick={reset} className="mt-2 text-[10px] font-bold text-red-700 underline">
                  Try another file
                </button>
              </div>
            )}

            {/* Action bar */}
            {hasResult && stage !== 'working' && (
              <div className="rounded-2xl border border-[#121212] bg-white px-4 py-3 prism-frame flex flex-wrap items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#9775fa]" />
                <span className="text-[11px] text-[#4a4a4a]">
                  {report ? 'Read complete.' : 'Measured. Ask for the visual read to get typography, motion and the rebuild recipe.'}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={readDesign}
                    disabled={reading}
                    className="flex items-center gap-1.5 rounded-full bg-[#121212] text-white text-[11px] font-bold px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {reading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {reading ? 'Reading…' : report ? 'Read again' : 'Read the design'}
                  </button>

                  <PrismExportMenu payload={payload()} />
                </div>
              </div>
            )}

            {reading && !report && (
              <p className="text-[10px] text-[#a3a3a3]">
                Uploading {Math.min(8, sheet.length)} sampled frames and reading them — this takes a moment.
              </p>
            )}

            {error && stage === 'done' && <p className="text-[11px] text-red-500">{error}</p>}

            {/* Measurements — every card wants the full width */}
            <PrismMeasurements result={result} sheet={sheet} onSeek={seek} activeTime={activeTime} />

            {/* The read — two balanced columns so the page fills as you scroll */}
            {report ? (
              <PrismReport report={report} times={readTimes} />
            ) : (
              hasResult && (
                <div className="rounded-2xl border border-dashed border-[#e6e6e6] p-6 text-center">
                  <Sparkles className="w-4 h-4 mx-auto text-[#c4c4c4]" />
                  <p className="mt-2 text-[11px] text-[#6f6f6f] max-w-lg mx-auto leading-relaxed">
                    The measurements above are fact. The read adds interpretation: type treatment,
                    motion on each element, and a keyframe recipe to rebuild it.
                  </p>
                  <button
                    onClick={readDesign}
                    disabled={reading}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#121212] text-white text-[11px] font-bold px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {reading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {reading ? 'Reading…' : 'Read the design'}
                  </button>
                </div>
              )
            )}

            {hasResult && (
              <p className="text-[9px] text-[#b0b0b0] text-center pt-1">
                {timecode(activeTime)} · everything measured in this tab by PRISM · saved automatically so a refresh won’t lose it
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}