// frameMimicHtmlExport.js — merges every frame's full HTML document into ONE
// standalone animated HTML file. Playback is real-time (each captured frame
// holds for its true source interval) and consecutive frames crossfade,
// rendered by the browser at display refresh (~60fps) — so motion looks
// smooth instead of choppy, and the old frame never drops out while the next
// one loads (no white flash). Fully self-contained.

export function buildCombinedHtml(frames, fps, width, height) {
  const docs = frames.map((f) => f.html);
  // Escape "<" so the JSON payload can never break out of the <script> tag.
  const payload = JSON.stringify(docs).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FrameMimic — ${frames.length} frames</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;background:#000}
  body{display:flex;align-items:center;justify-content:center}
  #stage{position:relative;width:100%;max-width:${width}px;aspect-ratio:${width} / ${height};background:#000}
  #stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
  #playerA{opacity:1}
  #playerB{opacity:0}
  #bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.72);color:#fff;padding:8px 14px;border-radius:99px;font:600 12px/1 system-ui;-webkit-user-select:none;user-select:none;cursor:pointer;z-index:9}
</style>
</head>
<body>
<div id="stage">
  <iframe id="playerA"></iframe>
  <iframe id="playerB"></iframe>
</div>
<div id="bar"><span id="pp">❚❚</span><span id="counter"></span></div>
<script>
var DOCS = ${payload};
var FPS = ${fps};
var D = 1000 / FPS; // real-time duration per captured frame
var XF = Math.min(220, Math.round(D * 0.5)); // crossfade length
var a = document.getElementById('playerA');
var b = document.getElementById('playerB');
var front = a, back = b;
var counter = document.getElementById('counter');
var pp = document.getElementById('pp');
var i = 0, timer = null, playing = true, pending = false;

function setCount(){ counter.textContent = (i + 1) + ' / ' + DOCS.length; }

function show(n){
  i = n;
  setCount();
  pending = true;
  var el = back;
  el.style.transition = 'none';
  el.style.opacity = '0';
  el.onload = function(){
    pending = false;
    // fade the new frame over the old one (rendered at ~60fps by the browser)
    el.style.transition = 'opacity ' + XF + 'ms ease';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ el.style.opacity = '1'; });
    });
    setTimeout(function(){
      var t = front; front = back; back = t;
      back.style.transition = 'none';
      back.style.opacity = '0';
    }, XF + 40);
  };
  el.srcdoc = DOCS[n];
  setTimeout(function(){ pending = false; }, 1500); // safety: never stall the loop
}

function tick(){ if (pending) return; show((i + 1) % DOCS.length); }
function play(){ if (timer) return; timer = setInterval(tick, D); pp.textContent = '❚❚'; playing = true; }
function pause(){ clearInterval(timer); timer = null; pp.textContent = '▶'; playing = false; }
document.getElementById('bar').addEventListener('click', function(){ playing ? pause() : play(); });

front.srcdoc = DOCS[0]; // first frame — no fade
setCount();
play();
</script>
</body>
</html>`;
}