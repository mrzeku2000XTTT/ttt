// Framez kit — the "HyperFrames for everyone" runtime + teacher.
// Films are coded as HTML scenes with a time-driven JS function per scene,
// rendered in a same-origin srcdoc iframe (pixel-crisp real DOM, not AI pixels)
// and exportable frame-by-frame via html2canvas + MediaRecorder.
// Tuned after studying HeyGen's open-source HyperFrames: GSAP-style eases,
// blur crossfades, kinetic type, data-viz, and generated media as <img> layers.

export const stageSize = (aspect) => (aspect === '9:16' ? { W: 720, H: 1280 } : { W: 1280, H: 720 });

// ——— The runtime injected into every film document ———
// Stateless per-frame: every animated style is set absolutely from t each tick.
const RUNTIME = `
var stage=document.getElementById('stage');
var scenes=SCENES.map(function(s){var el=document.createElement('div');el.className='scene';el.innerHTML=s.html;stage.appendChild(el);var fn=function(){};try{fn=new Function('t','Fz','root',s.js);}catch(e){}return{el:el,fn:fn,dur:s.dur||1.8};});
var total=0;scenes.forEach(function(s){total+=s.dur;});
function c01(v){v=+v;if(v<0)v=0;if(v>1)v=1;return v;}
var Fz={
_root:null,
q:function(sel){return Fz._root?Fz._root.querySelector(sel):null;},
a:function(el,o){if(!el)return;var tr='';if(o.x||o.y)tr+=' translate('+(o.x||0)+'px,'+(o.y||0)+'px)';if(o.s)tr+=' scale('+o.s+')';if(o.r)tr+=' rotate('+o.r+'deg)';el.style.transform=tr;if(o.blur!==undefined||o.bright!==undefined){var f='';if(o.blur)f+=' blur('+o.blur+'px)';if(o.bright)f+=' brightness('+o.bright+')';el.style.filter=f;}if(o.o!==undefined)el.style.opacity=c01(o.o);},
style:function(el,k,v){if(el)el.style[k]=v;},
clamp01:function(p){return c01(p);},
win:function(t,a,b){return c01((t-a)/(b-a));},
out:function(p){return 1-Math.pow(1-c01(p),3);},
inout:function(p){p=c01(p);return p<0.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;},
back:function(p){var c1=1.70158,c3=c1+1;p=c01(p);return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2);},
power:function(n,dir,p){p=c01(p);var b=Math.pow(p,n);if(dir==='in')return b;if(dir==='out')return 1-Math.pow(1-p,n);return p<0.5?2*b:1-Math.pow(-2*p+2,n)/2;},
expo:function(p,dir){p=c01(p);if(dir==='in')return p===0?0:Math.pow(2,10*(p-1));if(dir==='out')return p===1?1:1-Math.pow(2,-10*p);return p<0.5?Math.pow(2,20*p-10)/2:(2-Math.pow(2,-20*p+10))/2;},
bounce:function(p){p=c01(p);var n=7.5625,d=2.75;if(p<1/d)return n*p*p;if(p<2/d)return n*(p-=1.5/d)*p+0.75;if(p<2.5/d)return n*(p-=2.25/d)*p+0.9375;return n*(p-=2.625/d)*p+0.984375;},
elastic:function(p){p=c01(p);if(p===0||p===1)return p;return Math.pow(2,-10*p)*Math.sin((p*10-0.75)*2.09439)+1;},
spring:function(p,amp){amp=amp||0.18;p=c01(p);return 1-(amp*Math.exp(-6*p)*Math.cos(12*p));},
wave:function(t,freq,phase){phase=phase||0;return(Math.sin(t*freq*6.28318+phase*6.28318)+1)/2;},
shake:function(t,amp,freq){return Math.sin(t*freq*6.28318)*amp;},
stagger:function(i,gap){return i*(gap||0.08);},
count:function(t,from,to,dec){dec=dec||0;var v=from+(to-from)*Fz.inout(t);return Number(v).toFixed(dec);},
repeat:function(t,per){return(t/per)%1;}
};
window.FzTotal=total;
window.FzRender=function(time){var acc=0,idx=scenes.length-1;for(var i=0;i<scenes.length;i++){if(time<acc+scenes[i].dur){idx=i;break;}acc+=scenes[i].dur;}
var sc=scenes[idx];var lt=time-acc;if(lt<0)lt=0;if(lt>sc.dur-0.001)lt=sc.dur-0.001;
for(var j=0;j<scenes.length;j++){scenes[j].el.style.display=(j===idx)?'block':'none';}
var fi=lt/0.3;if(fi>1)fi=1;var fo=(sc.dur-lt)/0.4;if(fo>1)fo=1;var op=fi<fo?fi:fo;
sc.el.style.opacity=op.toFixed(3);Fz._root=sc.el;try{sc.fn(sc.dur>0?lt/sc.dur:0,Fz,sc.el);}catch(e){}};
var t0=performance.now();
function loop(now){if(!window.FzPaused){window.FzRender(((now-t0)/1000)%total);}requestAnimationFrame(loop);}
window.FzReplay=function(){t0=performance.now();window.FzPaused=false;};
window.FzPause=function(){window.FzPaused=true;};
requestAnimationFrame(loop);
`;

export const buildFramezDoc = (scenes, meta) => {
  const payload = JSON.stringify(scenes).replace(/<\/script/gi, '<\\/script');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:${meta.bg};}
#stage{position:relative;width:${meta.W}px;height:${meta.H}px;overflow:hidden;background:${meta.bg};color:${meta.ink};font-family:-apple-system,'Segoe UI',Inter,Helvetica,Arial,sans-serif;}
.scene{position:absolute;inset:0;overflow:hidden;opacity:0;}
img{display:block;}
</style></head><body><div id="stage"></div>
<script>var SCENES=${payload};\n${RUNTIME}<\/script></body></html>`;
};

// ——— Teach it all: the Framez Engine teacher (tuned on HyperFrames craft) ———
export const FRAMEZ_TEACHER = `You are FRAMEZ ENGINE — the code brain of Framez, a HyperFrames-style coded film studio. You write ONE SHOT (scene) of a premium motion film as real HTML + a time-driven JS function. Because the visuals are real DOM code (not AI imagery), every frame is pixel-perfect.

OUTPUT CONTRACT — return JSON only, exactly:
{"html": "<div>…layers…</div>", "js": "<function body>"}

THE RUNTIME (already on the page — never redefine it, never output <script> or <style> tags):
- Your html is injected into a full-stage root div (position:relative; overflow:hidden). Your js runs EVERY FRAME as: function (t, Fz, root)
  t = shot progress 0→1. It must be STATELESS + IDEMPOTENT: every frame, set every animated style absolutely from t. NEVER use +=, setInterval, requestAnimationFrame, CSS animation/transition, or Date.now().
- Helpers on Fz:
  Fz.q(sel)                    first element in this shot matching the selector
  Fz.a(el, {o, x, y, s, r, blur, bright})  opacity o(0-1), translate x/y(px), scale s, rotate r(deg), blur(px), brightness(1=normal)
  Fz.style(el, prop, value)
  Fz.win(t, a, b)              progress 0→1 clamped between t=a and t=b — USE FOR ALL ENTRANCES/EXITS
  Fz.clamp01(p)
  EASING (all take 0→1, return eased 0→1):
   Fz.out(p)        easeOutCubic — entrances
   Fz.inout(p)      easeInOutCubic — camera moves, holds
   Fz.back(p)       easeOutBack overshoot — pop-ins
   Fz.power(n,dir,p) GSAP-style: n=2..4, dir 'in'|'out'|'inOut' — e.g. Fz.power(3,'out',w)
   Fz.expo(p,dir)   expo in/out/inOut — snappy, premium
   Fz.bounce(p)     bounce landing
   Fz.elastic(p)    elastic snap
   Fz.spring(p,amp) damped spring settle (amp ~0.15-0.25) — natural stops
  MOTION MATH:
   Fz.wave(t, freq, phase)     0→1 sine (breathing, drift, pulses). freq ~1-3.
   Fz.shake(t, amp, freq)      signed shake value (amp px). Use for impact.
   Fz.stagger(i, gap)          i*gap — offset each element's window (gap ~0.06-0.1)
   Fz.count(t, from, to, dec)  animated number string via inout — for stats/counters
   Fz.repeat(t, per)           0→1 loop for cycles

STYLE RULES
- Style ONLY with inline style="" attributes. Use class names purely as JS hooks (class="card", then Fz.q('.card')). No <style> blocks.
- Position layers absolutely with px and %; the stage is exactly STAGEXSTAGE px (given below). Layers: background wash → shapes/subject → headline → accent details.
- Build objects (phones, cards, charts, logos) from divs: border-radius, gradients (linear/conic), box-shadow, borders. Optional <img src="URL"> for generated hero visuals (URL given when available) — position absolute, object-fit:cover, animate it.
- Type: system font stack (inherited). Huge bold headlines (700-900 weight, letterSpacing:'-0.04em'), very few words. Sublines small, uppercase, wide tracking (letterSpacing:'0.2em'), dimmed.

MOTION LANGUAGE — every shot needs at least one ENTRANCE + one CONTINUOUS move. Stagger entrances (Fz.stagger) so elements arrive one after another — this is what makes films feel expensive.
ENTRANCES (use a window w = Fz.win(t, start, end), then an ease):
- rise:     Fz.a(el,{o:Fz.out(w), y:60*(1-Fz.out(w))})
- slide-cut: x from ±40% of stage: Fz.a(el,{o:Fz.out(w), x:(1-Fz.out(w))*-500})
- pop:      var p=Fz.back(w); Fz.a(el,{o:p, s:0.6+0.4*p})
- mask-wipe: parent overflow:hidden, inner y:100%→0: Fz.style(inner,'transform','translateY('+(1-Fz.out(w))*100+'%)')
- blur-in:  Fz.a(el,{o:Fz.out(w), blur:(1-Fz.out(w))*12})   — premium focus pull
- elastic:  var p=Fz.elastic(w); Fz.a(el,{o:1, s:0.8+0.2*p})
CONTINUOUS:
- breathe:  Fz.a(el,{s:1+0.03*Math.sin(t*6.28)})
- drift:    Fz.a(el,{x:12*Math.sin(t*6.28), y:6*Math.cos(t*6.28)})
- sweep:    a gradient bar x:-W→2W via Fz.repeat(t,2.5)
- pulse:    Fz.a(el,{o:0.4+0.3*Math.sin(t*12.56)})
- shake:    Fz.a(el,{x:Fz.shake(t,3,18)})  — on impact windows only
- float:    Fz.a(el,{y:Fz.wave(t,1)*-10})
CAMERA (wrap layers in one .cam div, animate it):
- punch-in:  Fz.a(cam,{s:1+0.15*Fz.inout(t)})
- orbit pan: Fz.a(cam,{x:-60+120*Fz.inout(t)})
- drift:     Fz.a(cam,{r:1.5*Math.sin(t*3)})
KINETIC TYPE (per-word stagger — split headline into <span class="w0">..</span> words):
- for each word i: var w=Fz.win(t, 0.05+Fz.stagger(i,0.07), 0.05+Fz.stagger(i,0.07)+0.3); Fz.a(Fz.q('.w'+i),{o:Fz.out(w), y:30*(1-Fz.out(w))})
DATA VIZ:
- bar grow:  var h=Fz.out(Fz.win(t,0.2,0.7)); Fz.style(bar,'height',(h*100)+'%')
- count-up:  el.textContent = Fz.count(Fz.win(t,0.2,0.8), 0, 1284)  — append $ or % in html
- donut:     conic-gradient background, animate the stop via Fz.out(Fz.win(t,0.2,0.9))
- line draw: an SVG path with stroke-dasharray, animate strokeDashoffset via Fz.out(Fz.win(t,0.2,0.9))
GENERATED IMAGES (when a URL is provided): use <img src="URL" style="position:absolute;...;object-fit:cover">. Animate: parallax (x drift), scale-in via Fz.back, or mask-wipe with an overflow:hidden parent. Never stretch — object-fit:cover.
The runtime fades the whole shot in/out — do NOT animate scene-level exit; only per-element exits if the shot needs one.

QUALITY BAR
- Premium, restrained, Apple-launch-film taste. Dark glass depth (bg layers slightly lighter than the stage bg), one accent color used sparingly. Match the film's theme colors exactly.
- js: one statement per line, MAX 50 lines. html: MAX 34 lines. No lorem, no placeholders, no comments.
- Every animated element must exist in your html. Return JSON only.`;

// ——— Prompts ———
export const planFilmPrompt = (userPrompt) => `You are the FRAMEZ DIRECTOR. Turn the user's request into a shot plan for a short coded motion film (total 10-18 seconds, 4-9 shots).
Each shot needs:
- label: short shot name
- summary: one concrete visual line — what we SEE (real composition, shapes, layout), not abstract
- duration: 1.4-2.4s
- motion: the entrance + continuous move (e.g. "blur-in title, parallax product, count-up stat")
- beat: one of title | feature | data | quote | cta | transition
- image: OPTIONAL — a short prompt for a generated hero visual (a real product render, logo, character, or cinematic backdrop) ONLY for shots that need a real image. Leave empty/"") for pure-typography or CSS-shape shots. At most 3 shots should request an image.
Theme: dark premium background hex, high-contrast ink hex, ONE vivid accent hex. Aspect: 16:9 for films, 9:16 only if the user asks for vertical/phone/TikTok.
User request: "${userPrompt}"
Return JSON only.`;

export const sceneCodePrompt = (film, shot, i, n, imageUrl) => `${FRAMEZ_TEACHER}

FILM: "${film.title}" — stage ${film.W}x${film.H}px, theme: bg ${film.bg}, ink ${film.ink}, accent ${film.accent}.
SHOT LIST for continuity (do NOT render other shots): ${film.shots.map((s, x) => `${x + 1}. ${s.label}`).join(' | ')}
NOW WRITE SHOT ${i + 1} of ${n}: "${shot.label}" — ${shot.summary}. Motion intent: ${shot.motion || 'your choice, tasteful'}. Duration ${shot.duration}s.${imageUrl ? `\nA generated hero image is available at: ${imageUrl}\nUse it as <img src="${imageUrl}" style="position:absolute;...;object-fit:cover"> for this shot's key visual. Animate it (parallax drift, scale-in via Fz.back, or a mask-wipe). If it genuinely doesn't fit, omit it.` : ''}
Return JSON only: {"html": "...", "js": "..."}`;

// ——— Fallback so a failed shot never kills the build ———
export const fallbackScene = (shot) => ({
  html: '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div class="card" style="text-align:center"><div class="big" style="font-size:96px;font-weight:900;letter-spacing:-0.04em">' +
    String(shot.label || '').replace(/[<>&]/g, '') +
    '</div></div></div>',
  js: 'var p = Fz.out(Fz.win(t, 0, 0.3));\nFz.a(Fz.q(".card"), { o: p, y: 50 * (1 - p) });'
});