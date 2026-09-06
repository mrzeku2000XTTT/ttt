// frameMimicHtmlExport.js — merges every frame's full HTML document into ONE
// standalone animated HTML file that plays the whole sequence at real-time
// fps, looped, with a click-to-pause control. Fully self-contained.

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
  #stage{position:relative;width:100%;max-width:${width}px;aspect-ratio:${width} / ${height}}
  #stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff}
  #bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.72);color:#fff;padding:8px 14px;border-radius:99px;font:600 12px/1 system-ui;-webkit-user-select:none;user-select:none;cursor:pointer;z-index:9}
</style>
</head>
<body>
<div id="stage"><iframe id="player"></iframe></div>
<div id="bar"><span id="pp">❚❚</span><span id="counter"></span></div>
<script>
var DOCS = ${payload};
var FPS = ${fps};
var i = 0, timer = null, playing = true;
var player = document.getElementById('player');
var counter = document.getElementById('counter');
var pp = document.getElementById('pp');
function show(n){ player.srcdoc = DOCS[n]; counter.textContent = (n + 1) + ' / ' + DOCS.length; }
function tick(){ i = (i + 1) % DOCS.length; show(i); }
function play(){ if (timer) return; timer = setInterval(tick, 1000 / FPS); pp.textContent = '❚❚'; playing = true; }
function pause(){ clearInterval(timer); timer = null; pp.textContent = '▶'; playing = false; }
document.getElementById('bar').addEventListener('click', function(){ playing ? pause() : play(); });
show(0);
play();
</script>
</body>
</html>`;
}