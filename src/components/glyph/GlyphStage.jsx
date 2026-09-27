import React, { useEffect, useRef, useState } from 'react';
import { Film, ImagePlus, Maximize2, Minimize2, Move, MoveDiagonal2, Pause, Play, Upload, X } from 'lucide-react';
import GlyphTimeline from './GlyphTimeline';
import GlyphThinking from './GlyphThinking';
import GlyphAxisControls from './GlyphAxisControls';
import GlyphPoseTimeline from './GlyphPoseTimeline';
import { addKey, HOME_ANGLE, HOME_POSE, poseAt, randomTrack, TRACK_SECONDS } from './glyphPoseTrack';

// The three ways to look at a render. Split is the default, so the source is
// always visible next to what GLYPH made of it.
const VIEWS = [
  { label: 'Original', value: 1 },
  { label: 'Split', value: 0.5 },
  { label: 'Result', value: 0 },
];

// The pose the artwork is seen from in 3D. It matches what the plane used to be
// fixed at, so the view opens exactly as it always did and every axis is then
// the user's to dial. It is the timeline's home pose, so a move starts and ends
// exactly where the artwork already sits.
const DEFAULT_ANGLE = HOME_ANGLE;

/**
 * The live canvas: the artwork dominates, with a draggable before/after
 * slider over it. Dropping or pasting an image or a video anywhere here
 * transforms it. In 3D the artwork leans back on a plane whose angle, position
 * and size are all dialled from the pose panel — the pointer surface stays flat
 * so the slider keeps exact math. Fullscreen only restyles this element; the
 * canvas node is never moved, so it keeps its pixels.
 */
export default function GlyphStage({
  srcUrl,
  videoUrl,
  videoRef,
  playing,
  onTogglePlay,
  view3d,
  fullscreen,
  onToggleFullscreen,
  canvasRef,
  source,
  compare,
  setCompare,
  onFile,
  busy,
  reveal = true,
  maxHeight,
  styleLabelText,
  motionLabel,
  onStopMotion,
  poseCue,
  overlay,
}) {
  const frameRef = useRef(null);
  const dragging = useRef(false);
  const [dragOver, setDragOver] = useState(false);

  // 3D only: the artwork can be dragged around, placed on each axis and scaled,
  // so the card can be posed however the user wants it. The transform sits on
  // the frame, leaving the plane free to keep its sway.
  const [pose, setPose] = useState({ x: 0, y: 0, z: 0 });
  // The angle the card is seen from. It starts on the pose the artwork ships
  // with, so nothing shifts until it is actually dialled.
  const [angle, setAngle] = useState(DEFAULT_ANGLE);
  const [zoom, setZoom] = useState(1);
  const poseStart = useRef(null);
  const zoomStart = useRef(null);

  // The 3D move: keyframes of the pose, played on the card. The agent writes a
  // random one, so it can direct the camera instead of only describing it.
  const [track, setTrack] = useState([]);
  const [trackPlaying, setTrackPlaying] = useState(false);
  const [trackTime, setTrackTime] = useState(0);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const timeRef = useRef(0);

  // Playback: the pose is read off the track every frame, so the card travels
  // and the axis panel shows where it is while it goes.
  useEffect(() => {
    if (!trackPlaying || !track.length) return undefined;
    let raf = 0;
    let last = performance.now();
    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      const dt = (now - last) / 1000;
      last = now;
      const t = (timeRef.current + dt) % TRACK_SECONDS;
      timeRef.current = t;
      const p = poseAt(track, t);
      setPose(p.position);
      setAngle(p.angle);
      setTrackTime(t);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [trackPlaying, track]);

  // A cue from the agent: write a whole random move and play it, or end the one
  // running and put the artwork back where it started.
  useEffect(() => {
    if (!poseCue?.n) return;
    if (poseCue.action === 'stop') {
      setTrackPlaying(false);
      setTrack([]);
      timeRef.current = 0;
      setTrackTime(0);
      setPose({ ...HOME_POSE });
      setAngle({ ...HOME_ANGLE });
      return;
    }
    setTrack(randomTrack());
    timeRef.current = 0;
    setTrackTime(0);
    setTimelineOpen(true);
    setTrackPlaying(true);
  }, [poseCue]);

  useEffect(() => {
    setPose({ x: 0, y: 0, z: 0 });
    setAngle(DEFAULT_ANGLE);
    setZoom(1);
  }, [srcUrl, videoUrl]);

  // Taking the wheel back from the timeline, so a reset or a dialled axis is not
  // immediately overwritten by the move that was playing.
  const reset3d = () => {
    setTrackPlaying(false);
    setPose({ x: 0, y: 0, z: 0 });
    setAngle(DEFAULT_ANGLE);
    setZoom(1);
  };

  const toggleTimeline = () => {
    setTimelineOpen((open) => {
      const next = !open;
      if (!next) setTrackPlaying(false);
      else if (!track.length) {
        // Open on something playable: a random move waiting at its first frame.
        setTrack(randomTrack());
        timeRef.current = 0;
        setTrackTime(0);
      }
      return next;
    });
  };

  const scrubTimeline = (t) => {
    timeRef.current = t;
    setTrackTime(t);
    const p = poseAt(track, t);
    setPose(p.position);
    setAngle(p.angle);
  };

  const captureKey = () => setTrack((keys) => addKey(keys, timeRef.current, pose, angle));

  const startPan = (e) => {
    e.stopPropagation();
    poseStart.current = { x: e.clientX, y: e.clientY, ox: pose.x, oy: pose.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const movePan = (e) => {
    const s = poseStart.current;
    if (!s) return;
    setPose((p) => ({ ...p, x: s.ox + (e.clientX - s.x), y: s.oy + (e.clientY - s.y) }));
  };
  const endPan = () => {
    poseStart.current = null;
  };

  const startZoom = (e) => {
    e.stopPropagation();
    zoomStart.current = { x: e.clientX, s: zoom };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const moveZoom = (e) => {
    const s = zoomStart.current;
    if (!s) return;
    setZoom(Math.max(0.6, Math.min(1.9, s.s + (e.clientX - s.x) / 220)));
  };
  const endZoom = () => {
    zoomStart.current = null;
  };

  const loaded = !!(srcUrl || videoUrl);

  // In the studio shell the artwork is capped to the space actually left over,
  // so the page never has to scroll. Fullscreen keeps its own viewport rule.
  // The 3D pose panel sits under the artwork, so it takes its own share of the
  // space instead of pushing the artwork out of the card.
  const cap =
    !fullscreen && maxHeight
      ? Math.max(
          120,
          maxHeight - (videoUrl ? 122 : 78) - (view3d ? 136 : 0) - (view3d && timelineOpen ? 118 : 0),
        )
      : 0;

  const moveTo = (clientX) => {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    setCompare(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  };

  const onDown = (e) => {
    // A press on a control belongs to that control.
    if (e.target?.closest?.('button, a, input, textarea, select, label')) return;
    // Stopping the default is what keeps the press from becoming a native
    // text/element selection that paints the blue highlight over the divider.
    e.preventDefault();
    dragging.current = true;
    // Move first: if the browser refuses the pointer capture, the press still
    // lands instead of leaving the slider dead.
    moveTo(e.clientX);
    try {
      frameRef.current?.setPointerCapture?.(e.pointerId);
    } catch (err) {
      /* capture is a nicety — the window listeners below carry the drag */
    }
  };
  const onMove = (e) => {
    if (dragging.current) moveTo(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  // The drag is followed on the window, so it keeps up when the pointer leaves
  // the artwork and the slider can never be left stuck mid-drag.
  useEffect(() => {
    const move = (e) => {
      if (dragging.current) moveTo(e.clientX);
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const drop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  };

  // The stage always claims the space that is genuinely free — loaded or not — so
  // the workspace never collapses into a strip with a void beneath it.
  return (
    <div
      className={
        fullscreen
          ? 'glyph-stage-full fixed inset-0 z-[100] flex flex-col justify-center overflow-auto bg-[#05080d]/95 p-3 backdrop-blur-md sm:p-6'
          : 'relative min-h-0 flex flex-col'
      }
      style={!fullscreen && maxHeight ? { height: `${maxHeight}px` } : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={drop}
    >
      {!loaded ? (
        <label
          className={`glyph-drop flex h-full min-h-0 flex-col items-center justify-center overflow-hidden text-center cursor-pointer px-6 py-6 ${dragOver ? 'glyph-drop-active' : ''}`}
        >
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(100deg,#6BCAFF,#4A90E2)' }}>
            <ImagePlus className="w-6 h-6 text-white" />
          </div>
          <p className="glyph-word text-[13px] mb-2">Drop an image or video</p>
          <p className="glyph-muted text-[13px] mb-1">or click to upload</p>
          <p className="glyph-muted text-[11px] mt-3 max-w-xs">
            Turn any image or video into visual code. It transforms the moment it lands — everything runs locally in your browser.
          </p>
        </label>
      ) : (
        <div
          className={`relative flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl p-3 sm:p-4 ${dragOver ? 'glyph-drop-active' : ''} glyph-card`}
          style={view3d ? { perspective: '1600px' } : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={drop}
        >
          <div
            ref={frameRef}
            className={`glyph-frame ${view3d ? 'glyph-frame-3d' : ''} ${fullscreen ? 'glyph-frame-full' : ''}`}
            style={view3d ? { transform: `translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) scale(${zoom})` } : undefined}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div
              className={`glyph-plane ${view3d ? 'glyph-plane-3d glyph-plane-live' : ''}`}
              style={
                view3d
                  ? { '--g-rx': `${angle.x}deg`, '--g-ry': `${angle.y}deg`, '--g-rz': `${angle.z}deg` }
                  : undefined
              }
            >
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="glyph-under"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img src={srcUrl} alt="Original" className="glyph-under" draggable={false} />
              )}
              <div className="glyph-art">
                <canvas
                  ref={canvasRef}
                  className="relative"
                  style={{
                    clipPath: `inset(0 0 0 ${compare * 100}%)`,
                    opacity: reveal ? 1 : 0,
                    transition: 'opacity 650ms ease',
                    maxHeight: cap ? `${cap}px` : undefined,
                  }}
                />
                {overlay}
              </div>
              {compare > 0.001 && <div className="glyph-handle" style={{ left: `${compare * 100}%` }} />}
            </div>
            {view3d && (
              <button
                type="button"
                className="glyph-resize"
                onPointerDown={startZoom}
                onPointerMove={moveZoom}
                onPointerUp={endZoom}
                onPointerCancel={endZoom}
                onDoubleClick={reset3d}
                title="Drag to resize · double-click to reset"
              >
                <MoveDiagonal2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {view3d && (
            <button
              type="button"
              className="glyph-grab"
              onPointerDown={startPan}
              onPointerMove={movePan}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              onDoubleClick={reset3d}
              title="Drag to move · double-click to reset"
            >
              <Move className="w-3 h-3" />
              <span className="hidden sm:inline">drag to move</span>
              {Math.round(zoom * 100) !== 100 && (
                <span className="glyph-mono">{Math.round(zoom * 100)}%</span>
              )}
            </button>
          )}

          <div className="absolute left-5 top-5 flex items-center gap-1.5">
            <span className="glyph-glass rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold">
              {styleLabelText}
            </span>
            {motionLabel && (
              <button
                onClick={onStopMotion}
                className="glyph-glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold"
                title="Stop the motion"
              >
                <Move className="w-3 h-3" />
                {motionLabel}
                <X className="w-3 h-3 opacity-60" />
              </button>
            )}
            {videoUrl && (
              <button
                onClick={onTogglePlay}
                className="glyph-glass flex h-7 w-7 items-center justify-center rounded-full"
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            )}
          </div>

          <div className="absolute right-5 top-5 flex items-center gap-1.5">
            {VIEWS.map((v) => (
              <button
                key={v.label}
                onClick={() => setCompare(v.value)}
                className={`glyph-glass rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold ${
                  Math.abs(compare - v.value) < 0.26 ? 'opacity-100' : 'opacity-60'
                }`}
              >
                {v.label}
              </button>
            ))}
            <button
              onClick={onToggleFullscreen}
              className="glyph-glass flex h-7 w-7 items-center justify-center rounded-full"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>

          {videoUrl && <GlyphTimeline videoRef={videoRef} playing={playing} onTogglePlay={onTogglePlay} />}

          <p className="glyph-muted mt-2 text-center text-[10px] tracking-wide">
            {view3d
              ? 'drag the bar to move the card · X Y Z move and angle it · the timeline plays a move · the corner grip resizes it'
              : videoUrl
                ? 'drag the slider to compare · the video keeps playing underneath'
                : 'drag the slider to compare · drop or paste a new image to transform it'}
          </p>
        </div>
      )}

      {/* The pose panel is a sibling of the card, so it can only ever sit under
          the artwork — never on top of the thing it is posing. */}
      {loaded && view3d && (
        <div className="mt-1 flex flex-col items-center gap-1 px-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTimeline}
              className={`glyph-btn ${timelineOpen ? 'glyph-btn-primary' : 'glyph-btn-ghost'}`}
              title="Keyframes of the 3D pose, played on the card"
            >
              <Film className="w-3.5 h-3.5" />
              Timeline
            </button>
            {track.length > 0 && !timelineOpen && (
              <button
                type="button"
                onClick={() => setTrackPlaying((v) => !v)}
                className="glyph-btn glyph-btn-ghost h-7 w-7 p-0"
                title={trackPlaying ? 'Pause the move' : 'Play the move'}
              >
                {trackPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            )}
          </div>

          {timelineOpen && (
            <GlyphPoseTimeline
              keys={track}
              time={trackTime}
              playing={trackPlaying}
              onTogglePlay={() => setTrackPlaying((v) => !v)}
              onScrub={scrubTimeline}
              onKey={captureKey}
              onRandom={() => {
                setTrack(randomTrack());
                timeRef.current = 0;
                setTrackTime(0);
                setTrackPlaying(true);
              }}
              onClear={() => {
                setTrackPlaying(false);
                setTrack([]);
                timeRef.current = 0;
                setTrackTime(0);
              }}
            />
          )}

          <GlyphAxisControls
            position={pose}
            angle={angle}
            onPosition={(patch) => {
              setTrackPlaying(false);
              setPose((p) => ({ ...p, ...patch }));
            }}
            onAngle={(patch) => {
              setTrackPlaying(false);
              setAngle((a) => ({ ...a, ...patch }));
            }}
            onReset={reset3d}
          />
        </div>
      )}

      {busy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#070b12]/70 backdrop-blur-sm">
          <GlyphThinking size={132} isThinking showLabel thinkingLabel="working…" />
        </div>
      )}

      {!loaded && (
        <div className="mt-3 flex items-center justify-center gap-2 glyph-muted text-[11px]">
          <Upload className="w-3 h-3" />
          <span>JPG · PNG · WEBP · GIF · MP4 · WEBM — nothing is uploaded to a server</span>
        </div>
      )}
      {source && (
        <p className="glyph-muted text-center text-[10px] mt-2 tracking-wide">
          working resolution {source.width}×{source.height}
          {videoUrl ? ' · sampled live' : ''}
        </p>
      )}
    </div>
  );
}