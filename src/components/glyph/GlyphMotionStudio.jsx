import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GlyphMotionControls from './GlyphMotionControls';
import GlyphMotionPreview from './GlyphMotionPreview';
import { createSampleButterflyCanvas, fileToCanvas, generateSpriteMotion } from './spriteMotionEngine';

const DEFAULTS = {
  preset: 'wing_flap',
  frameCount: 12,
  fps: 12,
  frameSize: 256,
  loop: true,
  intensity: 1,
  cameraPreset: 'front',
  yaw: 0,
  pitch: 0,
  // Off by default: on a photograph a black key eats every dark pixel of the
  // subject, which is what made uploaded images come out patchy.
  chromaEnabled: false,
  chromaColor: '#000000',
  chromaTolerance: 18,
  treatment: 'none',
  treatmentIntensity: 1,
  treatmentColor: '#1ff2e1',
  glyphStyle: 'characters',
  background: 'gradient',
  gradientId: 'nova',
};

export default function GlyphMotionStudio() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [sourceCanvas, setSourceCanvas] = useState(null);
  const [sourceName, setSourceName] = useState('Glow Butterfly');
  const [sourceThumb, setSourceThumb] = useState(null);
  const [result, setResult] = useState(null);
  const [sheetUrl, setSheetUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [playing, setPlaying] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);
  const [error, setError] = useState('');

  const patch = (partial) => setCfg((current) => ({ ...current, ...partial }));

  // Start from the built-in reference sprite so the studio is never empty.
  useEffect(() => {
    const sample = createSampleButterflyCanvas(512);
    setSourceCanvas(sample);
    setSourceThumb(sample.toDataURL('image/png'));
  }, []);

  const runGenerate = async (source = sourceCanvas, config = cfg, name = sourceName) => {
    if (!source) return;
    setGenerating(true);
    setError('');
    setProgress({ done: 0, total: config.frameCount });
    try {
      const slug = (name || 'sprite').toLowerCase().replace(/\s+/g, '_');
      const generated = await generateSpriteMotion(source, config, slug, (done, total) =>
        setProgress({ done, total })
      );
      setResult(generated);
      setSheetUrl(generated.spriteSheetCanvas.toDataURL('image/png'));
      setFrameIndex(0);
      setPlaying(true);
    } catch (err) {
      setError(err?.message || 'Could not render that motion');
    } finally {
      setGenerating(false);
    }
  };

  // First paint: render the sample once with the defaults.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current || !sourceCanvas) return;
    booted.current = true;
    runGenerate(sourceCanvas, cfg, 'Glow Butterfly');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceCanvas]);

  const applySource = (canvas, name) => {
    setSourceCanvas(canvas);
    setSourceThumb(canvas.toDataURL('image/png'));
    setSourceName(name);
    setResult(null);
    setSheetUrl(null);
  };

  const handleUpload = async (file) => {
    try {
      const canvas = await fileToCanvas(file);
      applySource(canvas, file.name.replace(/\.[^/.]+$/, ''));
      await runGenerate(canvas, cfg, file.name.replace(/\.[^/.]+$/, ''));
    } catch (err) {
      setError(err?.message || 'That file could not be read as an image');
    }
  };

  const handleSample = async () => {
    const canvas = createSampleButterflyCanvas(512);
    applySource(canvas, 'Glow Butterfly');
    await runGenerate(canvas, { ...cfg, preset: 'wing_flap' }, 'Glow Butterfly');
    patch({ preset: 'wing_flap' });
  };

  // Playback clock.
  useEffect(() => {
    if (!playing || !result || !result.frames.length) return undefined;
    const timer = setInterval(() => {
      setFrameIndex((current) => {
        const next = current + 1;
        if (next >= result.frames.length) return cfg.loop ? 0 : current;
        return next;
      });
    }, 1000 / Math.max(1, cfg.fps));
    return () => clearInterval(timer);
  }, [playing, result, cfg.fps, cfg.loop]);

  return (
    <div className="glyph-page">
      <div className="gm-shell">
        <header className="glyph-glass flex items-center justify-between gap-3 px-4 h-16 shrink-0" style={{ borderBottom: '1px solid var(--g-line)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/Glyph" className="glyph-pill rounded-full h-9 w-9 inline-flex items-center justify-center" title="Back to GLYPH">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <div className="min-w-0">
              <p className="glyph-word text-[13px] leading-none">Glyph Motion</p>
              <p className="glyph-muted text-[10px] mt-1 truncate">
                any image → articulated motion → sprite sheet
              </p>
            </div>
          </div>
          <p className="glyph-muted text-[10px] gm-mono hidden sm:block">
            {result ? `${result.frames.length} frames · ${result.metadata.columns}×${result.metadata.rows} sheet` : 'ready'}
          </p>
        </header>

        {error && (
          <p className="px-4 py-2 text-[11px]" style={{ color: '#ff9d7a' }}>
            {error}
          </p>
        )}

        <div className="gm-body">
          <GlyphMotionControls
            cfg={cfg}
            patch={patch}
            sourceName={sourceName}
            sourceThumb={sourceThumb}
            onUpload={handleUpload}
            onSample={handleSample}
            onGenerate={() => runGenerate()}
            generating={generating}
            progress={progress}
          />
          <GlyphMotionPreview
            result={result}
            sheetUrl={sheetUrl}
            generating={generating}
            playing={playing}
            setPlaying={setPlaying}
            frameIndex={frameIndex}
            setFrameIndex={setFrameIndex}
            transparent={cfg.background !== 'gradient'}
          />
        </div>
      </div>
    </div>
  );
}