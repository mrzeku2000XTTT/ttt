// Framez kit — the "HyperFrames for everyone" runtime + teacher.
// Films are coded as HTML scenes with a time-driven JS function per scene,
// rendered in a same-origin srcdoc iframe (pixel-crisp real DOM, not AI pixels)
// and exportable frame-by-frame via html2canvas + MediaRecorder.

const c01 = (v) => Math.min(1, Math.max(0, v));

export const stageSize = (aspect) => (aspect === '9:16' ? { W: 720, H: 1280 } : { W: 1280, H: 720 });

// ——— The runtime injected into every film document ———
const RUNTIME = [
  "var stage=document.getElementById('stage');",
  "var scenes=SCENES.map(function(s){var el=document.createElement('div');el.className='scene';el.innerHTML=s.html;stage.appendChild(el);var fn=function(){};try{fn=new Function('t','Fz','root',s.js);}catch(e){}return{el:el,fn:fn,dur:s.dur||1.6};});",
  "var total=0;scenes.forEach(function(s){total+=s.dur;});",
  "var Fz={_root:null,",
  "q:function(sel){return Fz._root?Fz._root.querySelector(sel):null;},",
  "a:function(el,o){if(!el)return;var tr='';if(o.x||o.y)tr+=' translate('+(o.x||0)+'px,'+(o.y||0)+'px)';if(o.s)tr+=' scale('+o.s+')';if(o.r)tr+=' rotate('+o.r+'deg)';el.style.transform=tr;if(o.o!==undefined){el.style.opacity=c01(o.o);}function c01(v){v=+v;if(v<0)v=0;if(v>1)v=1;return v;}},",
  "style:function(el,k,v){if(el)el.style[k]=v;},",
  "clamp01:function(p){p=+p;if(p<0)p=0;if(p>1)p=1;return p;},",
  "win:function(t,a,b){return Fz.clamp01((t-a)/(b-a));},",
  "out:function(p){return 1-Math.pow(1-Fz.clamp01(p),3);},",
  "inout:function(p){p=Fz.clamp01(p);return p<0.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;},",
  "back:function(p){var c1=1.70158,c3=c1+1;p=Fz.clamp01(p);return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2);},",
  "repeat:function(t,per){return(t/per)%1;}};",
  "window.FzTotal=total;",
  "window.FzRender=function(time){var acc=0,idx=scenes.length-1;for(var i=0;i<scenes.length;i++){if(time<acc+scenes[i].dur){idx=i;break;}acc+=scenes[i].dur;}",
  "var sc=scenes[idx];var lt=time-acc;if(lt<0)lt=0;if(lt>sc.dur-0.001)lt=sc.dur-0.001;",
  "for(var j=0;j<scenes.length;j++){scenes[j].el.style.display=(j===idx)?'block':'none';}",
  "var fi=lt/0.3;if(fi>1)fi=1;var fo=(sc.dur-lt)/0.35;if(fo>1)fo=1;var op=fi<fo?fi:fo;",
  "sc.el.style.opacity=op.toFixed(3);Fz._root=sc.el;try{sc.fn(sc.dur>0?lt/sc.dur:0,Fz,sc.el);}catch(e){}};",
  "var t0=performance.now();",
  "function loop(now){if(!window.FzPaused){window.FzRender(((now-t0)/1000)%total);}requestAnimationFrame(loop);}",
  "window.FzReplay=function(){t0=performance.now();window.FzPaused=false;};",
  "window.FzPause=function(){window.FzPaused=true;};",
  "requestAnimationFrame(loop);"
].join('\n');

export const buildFramezDoc = (scenes, meta) => {
  const payload = JSON.stringify(scenes).replace(/<\/script/gi, '<\\/script');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:${meta.bg};}
#stage{position:relative;width:${meta.W}px;height:${meta.H}px;overflow:hidden;background:${meta.bg};color:${meta.ink};font-family:-apple-system,'Segoe UI',Inter,Helvetica,Arial,sans-serif;}
.scene{position:absolute;inset:0;overflow:hidden;opacity:0;}
</style></head><body><div id="stage"></div>
<script>var SCENES=${payload};\n${RUNTIME}<\/script></body></html>`;
};

// ——— Teach it all: the Framez Engine teacher prompt ———
export const FRAMEZ_TEACHER = `You are FRAMEZ ENGINE — the code brain of Framez, a HyperFrames-style coded film studio. You write ONE SHOT (scene) of a premium motion film as real HTML + a time-driven JS function. Because the visuals are real DOM code (not AI imagery), every frame is pixel-perfect.

OUTPUT CONTRACT — return JSON only, exactly:
{"html": "<div>…layers…</div>", "js": "<function body>"}

THE RUNTIME (already on the page — never redefine it, never output <script> or <style> tags):
- Your html is injected into a full-stage root div (position:relative; overflow:hidden). Your js runs EVERY FRAME as: function (t, Fz, root)
  t = shot progress 0→1. It must be STATELESS + IDEMPOTENT: every frame, set every animated style absolutely from t. NEVER use +=, setInterval, requestAnimationFrame, CSS animation/transition, or Date.now().
- Helpers on Fz:
  Fz.q(sel)                  first element in this shot matching the selector
  Fz.a(el, {o, x, y, s, r})   set opacity o(0-1), translate x/y(px), scale s, rotate r(deg)
  Fz.style(el, prop, value)
  Fz.win(t, a, b)            progress 0→1 clamped between t=a and t=b — USE THIS FOR ALL ENTRANCES/EXITS
  Fz.out(p)                  easeOutCubic (entrances)
  Fz.inout(p)                easeInOutCubic (camera moves)
  Fz.back(p)                 easeOutBack with overshoot (pop-ins)
  Fz.repeat(t, per)          0→1 loop for cycles (pulses, sweeps) — pass (t, 0.6) etc.
  Fz.clamp01(p)

STYLE RULES
- Style ONLY with inline style="" attributes. Use class names purely as JS hooks (class="card", then Fz.q('.card')). No <style> blocks.
- Position layers absolutely with px and %; the stage is exactly STAGEXSTAGE px (given below). Layers: background wash → shapes/subject → headline → accent details.
- Build objects (phones, cards, charts, logos) from divs: border-radius, gradients (linear/conic), box-shadow, borders. No external images, no external fonts, no network.
- Type: system font stack (inherited). Huge bold headlines (700-900 weight, tight letter-spacing like letterSpacing:'-0.04em'), very few words. Sublines small, uppercase, wide tracking, dimmed.

MOTION LANGUAGE — every shot needs at least one ENTRANCE + one CONTINUOUS move:
- rise: Fz.a(el,{o:Fz.out(Fz.win(t,0,0.25)), y:60*(1-Fz.out(Fz.win(t,0,0.25)))})
- slide-cut: x from ±40% of stage width via Fz.win window
- pop: scale via Fz.back(Fz.win(t,0,0.2)) from 0.6→1
- mask-wipe: parent overflow:hidden, inner element y:100%→0
- camera: wrap layers in one .cam div, animate it — punch-in (s: 1→1.15 with Fz.inout), orbit pan (x: -60→60), slight rotate for drift
- continuous: breathe (s 1±0.02 with Fz.repeat(t,2)), drift (x: 12*Math.sin(t*6.28)), light sweep (a gradient div x: -W→2W via Fz.repeat(t,2.5)), pulse (o: 0.4+0.3*Math.sin(t*12.56))
- stagger: give each element its own window offset (0, 0.08, 0.16…) — this is what makes films feel expensive.
The runtime fades the whole shot in/out — do NOT animate scene-level exit; only per-element exits if the shot needs one.

QUALITY BAR
- Premium, restrained, Apple-launch-film taste. Dark glass depth (bg layers slightly lighter than the stage bg), one accent color used sparingly.
- js: one statement per line, MAX 45 lines. html: MAX 30 lines. No lorem, no placeholders, no comments.
- Every animated element must exist in your html. Return JSON only.`;

// ——— Prompts ———
export const planFilmPrompt = (userPrompt) => `You are the FRAMEZ DIRECTOR. Turn the user's request into a shot plan for a short coded motion film (total 8-14 seconds, 4-6 shots).
Each shot: a label, a one-line visual summary (what we SEE — concrete shapes/composition, not abstract), a duration (1.2-2.2s), and the motion intent (entrance + continuous move).
Theme: dark premium background hex, high-contrast ink hex, ONE vivid accent hex. Aspect: pick 16:9 for films, 9:16 only if the user asks for vertical/phone/TikTok.
User request: "${userPrompt}"
Return JSON only.`;

export const sceneCodePrompt = (film, shot, i, n) => `${FRAMEZ_TEACHER}

FILM: "${film.title}" — stage ${film.W}x${film.H}px, theme: bg ${film.bg}, ink ${film.ink}, accent ${film.accent}.
SHOT LIST for continuity (do NOT render other shots): ${film.shots.map((s, x) => `${x + 1}. ${s.label}`).join(' | ')}
NOW WRITE SHOT ${i + 1} of ${n}: "${shot.label}" — ${shot.summary}. Motion intent: ${shot.motion || 'your choice, tasteful'}. Duration ${shot.duration}s.
Return JSON only: {"html": "...", "js": "..."}`;

// ——— Fallback so a failed shot never kills the build ———
export const fallbackScene = (shot) => ({
  html: '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div class="card" style="text-align:center"><div class="big" style="font-size:96px;font-weight:900;letter-spacing:-0.04em">' +
    String(shot.label || '').replace(/[<>&]/g, '') +
    '</div></div></div>',
  js: 'var p = Fz.out(Fz.win(t, 0, 0.3));\nFz.a(Fz.q(".card"), { o: p, y: 50 * (1 - p) });'
});