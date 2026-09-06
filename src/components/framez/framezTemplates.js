// Framez template catalog + hook script.
// Studied from:
//  - HeyGen HyperFrames blocks: clip-path inset reveals, SVG bar/line draw, staggered labels.
//  - kinetic-typography / text-animation repos: staggered word reveal (SplitText-style),
//    mask-wipe via clip-path, animated gradient text (background-clip:text + moving position),
//    typewriter, glitch RGB-split.
//  - CSS shader backgrounds: animated conic/linear gradients, layered blurred radial blobs
//    (WebGL shaders aren't reliably capturable frame-by-frame, so we use CSS-only "shaders").
//  - Right-to-left motion: clip-path inset(0 100% 0 0)→0 wipes, translateX(+W)→0 panel slides.

// The hook script — always prepended to Framez plan + codegen so every film opens with a hook.
export const FRAMEZ_HOOK_SCRIPT = `FRAMEZ HOOK LAW — non-negotiable:
1. EVERY film opens with a HOOK shot (first ~1.5s). It must stop the scroll. State the value or curiosity in ≤6 words. No warm-up, no logo-first. Hook → content → CTA.
2. The hook uses a KINETIC TEXT pattern: word-punch, mask-wipe, gradient-text, glitch, typewriter, or scroll-snap (see TEMPLATES). Pick the one that fits the topic's energy.
3. PREMIUM ONLY. Dark glass depth, one vivid accent, huge bold type (weight 800-900, letterSpacing -0.04em), tiny uppercase tracked sublines. Restraint over noise. No clipart, no rainbow, no cheap bounce.
4. STAGGER every entrance (Fz.stagger) so elements arrive one-after-another — this is the single biggest "expensive" signal.
5. Every shot: one ENTRANCE (windowed ease) + one CONTINUOUS move (wave/drift/breathe). Never static.
6. Right-to-left motion = premium wipes: clip-path inset(0 X% 0 0)→0, or panels translateX(+stageW)→0.
7. Shaders = CSS-only animated gradients (conic rotate, layered blurred radial blobs drifting). Never WebGL (not frame-capturable).
8. Image carousels = a horizontal <img> track sliding R→L with parallax. Browser UI = a fake chrome window with content loading in.
9. Adapt the topic, X post, or URL into the hook verbatim — don't paraphrase the punch. For X posts, lead with the post's strongest line.`;

// Template catalog — patterns the director picks from and the coder reuses.
// ACCENT / INK / URL are placeholders; the coder substitutes the film's theme colors + image URLs.
export const FRAMEZ_TEMPLATE_CATALOG = `HOOK TEMPLATES (openers — shot 1):
— hook-wordpunch: words slam in staggered, scale+blur, accent on the key word.
  html: <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="display:flex;gap:0.04em;font-size:120px;font-weight:900;letter-spacing:-0.04em"><span class="w0">YOU</span><span class="w1" style="color:ACCENT">NEED</span><span class="w2">THIS</span></div></div>
  js: for(var i=0;i<3;i++){var w=Fz.win(t,0.05+Fz.stagger(i,0.09),0.05+Fz.stagger(i,0.09)+0.3);var p=Fz.back(w);Fz.a(Fz.q('.w'+i),{o:Fz.out(w),s:0.4+0.6*p,y:40*(1-p)});}
— hook-maskwipe: headline revealed by a left-to-right clip-path wipe.
  html: <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div class="line" style="font-size:140px;font-weight:900;letter-spacing:-0.04em">THE HOOK LINE</div></div>
  js: var w=Fz.win(t,0.1,0.6);Fz.style(Fz.q('.line'),'clipPath','inset(0 '+(1-Fz.out(w))*100+'% 0 0)');
— hook-gradient: animated gradient text (background-clip:text) scaling in.
  html: <div class="g" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:140px;font-weight:900;background:linear-gradient(90deg,ACCENT,INK,ACCENT);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent">HOOK</div>
  js: var w=Fz.win(t,0,0.4);Fz.a(Fz.q('.g'),{o:Fz.out(w),s:0.9+0.1*Fz.out(w)});Fz.style(Fz.q('.g'),'backgroundPosition',(Fz.repeat(t,3)*300)+'% 0');
— hook-glitch: RGB-split text with a shake impact (for shock/secret hooks).
  html: <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div class="glitch" style="position:relative;font-size:130px;font-weight:900">NOBODY TELLS YOU</div></div>
  js: var w=Fz.win(t,0,0.3);var imp=Fz.win(t,0.3,0.45);var sh=Fz.shake(imp,8,30);Fz.a(Fz.q('.glitch'),{o:Fz.out(w),x:sh,textShadow:sh?sh+'px 0 ACCENT,'+(-sh)+'px 0 INK':'none'});
— hook-typewriter: characters appear with a blinking caret (for how-to/guide hooks).
  html: <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font-size:110px;font-weight:800;font-family:monospace"><span class="txt"></span><span class="cur" style="border-left:6px solid ACCENT;animation:none">​</span></div></div>
  js: var msg="BUILD THIS IN 60S";var n=Math.floor(Fz.win(t,0.1,0.8)*msg.length);Fz.q('.txt').textContent=msg.slice(0,n);Fz.a(Fz.q('.cur'),{o:Fz.wave(t,4)>0.5?1:0});
— hook-scrollsnap: words scroll fast R→L then snap to the hook line.
  html: <div style="position:absolute;inset:0;overflow:hidden;display:flex;align-items:center"><div class="track" style="display:flex;gap:60px;white-space:nowrap;font-size:100px;font-weight:900;padding-left:1280px"><span>wait</span><span>stop</span><span>listen</span><span class="snap" style="color:ACCENT">THE REAL HOOK</span></div></div>
  js: var s=Fz.expo(Fz.win(t,0,0.7),'out');Fz.a(Fz.q('.track'),{x:(1-s)*-1500});var p=Fz.win(t,0.7,0.9);Fz.a(Fz.q('.snap'),{s:1+0.12*Fz.back(p)});

CONTENT TEMPLATES (shots 2..n-1):
— carousel-images: R→L horizontal carousel of generated images with parallax + captions.
  html: <div style="position:absolute;inset:0;overflow:hidden"><div class="track" style="display:flex;gap:24px;position:absolute;top:50%;left:0;transform:translateY(-50%)"><img src="URL1" style="width:520px;height:300px;border-radius:16px;object-fit:cover"><img src="URL2" style="width:520px;height:300px;border-radius:16px;object-fit:cover"><img src="URL3" style="width:520px;height:300px;border-radius:16px;object-fit:cover"></div></div>
  js: var s=Fz.inout(t);Fz.a(Fz.q('.track'),{x:(1-s)*-900});
— shader-aurora: layered blurred radial blobs drifting (CSS-only "shader" background).
  html: <div style="position:absolute;inset:0;overflow:hidden;background:#050507"><div class="b1" style="position:absolute;width:80%;height:80%;left:-10%;top:-10%;border-radius:50%;background:radial-gradient(circle,ACCENT,transparent 70%);filter:blur(70px);opacity:0.5"></div><div class="b2" style="position:absolute;width:70%;height:70%;right:-10%;bottom:-10%;border-radius:50%;background:radial-gradient(circle,INK,transparent 70%);filter:blur(70px);opacity:0.4"></div></div>
  js: Fz.a(Fz.q('.b1'),{x:Fz.wave(t,0.6)*200-100,y:Fz.wave(t,0.4,0.5)*120-60});Fz.a(Fz.q('.b2'),{x:Fz.wave(t,0.5,0.5)*-200+100,y:Fz.wave(t,0.7)*120-60});
— shader-mesh: rotating conic gradient + grain (premium tech backdrop).
  html: <div class="m" style="position:absolute;inset:-50%;background:conic-gradient(from 0deg,ACCENT,INK,ACCENT,INK,ACCENT);filter:blur(90px);opacity:0.35"></div>
  js: Fz.style(Fz.q('.m'),'transform','rotate('+(Fz.repeat(t,4)*360)+'deg) scale(1.2)');
— browser-ui: fake browser window with chrome bar + content loading in (product/SaaS).
  html: <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0a0a0c"><div class="win" style="width:84%;height:72%;border-radius:14px;overflow:hidden;background:#111114;border:1px solid #ffffff14;box-shadow:0 30px 80px #000"><div style="height:36px;background:#1a1a1f;display:flex;align-items:center;gap:8px;padding:0 14px"><span style="width:10px;height:10px;border-radius:50%;background:#ff5f57"></span><span style="width:10px;height:10px;border-radius:50%;background:#febc2e"></span><span style="width:10px;height:10px;border-radius:50%;background:#28c840"></span><div class="addr" style="margin-left:16px;flex:1;height:22px;border-radius:6px;background:#0d0d10;font-size:12px;color:#666;display:flex;align-items:center;padding:0 10px">app.example.com</div></div><div style="padding:40px;display:flex;flex-direction:column;gap:16px"><div class="h" style="height:28px;width:60%;border-radius:6px;background:#ffffff14"></div><div class="p" style="height:14px;width:80%;border-radius:6px;background:#ffffff0a"></div><div class="btn" style="margin-top:20px;height:40px;width:160px;border-radius:8px;background:ACCENT"></div></div></div></div>
  js: var w=Fz.win(t,0.1,0.5);Fz.a(Fz.q('.win'),{o:Fz.out(w),s:0.92+0.08*Fz.out(w),y:40*(1-Fz.out(w))});var h=Fz.win(t,0.4,0.7);Fz.style(Fz.q('.h'),'width',(60*h)+'%');var b=Fz.win(t,0.6,0.85);Fz.a(Fz.q('.btn'),{o:Fz.out(b),s:0.8+0.2*Fz.back(b)});
— data-bars: bars grow + count-up labels (stats/revenue).
  html: <div style="position:absolute;inset:0;padding:80px"><div class="title" style="font-size:48px;font-weight:800;margin-bottom:40px">Revenue</div><div style="display:flex;gap:24px;align-items:flex-end;height:55%"><div class="bar0" style="width:90px;background:ACCENT;border-radius:6px 6px 0 0"></div><div class="bar1" style="width:90px;background:ACCENT;border-radius:6px 6px 0 0"></div><div class="bar2" style="width:90px;background:ACCENT;border-radius:6px 6px 0 0"></div></div><div class="num" style="font-size:64px;font-weight:900;margin-top:24px"></div></div>
  js: var vals=[40,70,100];for(var i=0;i<3;i++){var h=Fz.out(Fz.win(t,0.2+Fz.stagger(i,0.15),0.2+Fz.stagger(i,0.15)+0.4));Fz.style(Fz.q('.bar'+i),'height',(vals[i]*h)+'%');}Fz.q('.num').textContent='$'+Fz.count(Fz.win(t,0.3,0.9),0,1284);
— rtl-panels: full-screen panels slide R→L in sequence (chapter advance).
  html: <div style="position:absolute;inset:0;overflow:hidden"><div class="p0" style="position:absolute;inset:0;background:#0a0a0c;display:flex;align-items:center;justify-content:center"><div style="font-size:120px;font-weight:900">ONE</div></div><div class="p1" style="position:absolute;inset:0;background:#111114;display:flex;align-items:center;justify-content:center;transform:translateX(100%)"><div style="font-size:120px;font-weight:900">TWO</div></div></div>
  js: var s1=Fz.win(t,0.35,0.65);Fz.a(Fz.q('.p1'),{x:(1-Fz.expo(s1,'out'))*1280});
— feature-card: glass card with icon + bullet, mask-wipe text.
  html: <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div class="card" style="width:560px;padding:40px;border-radius:20px;background:#ffffff08;border:1px solid #ffffff14;backdrop-filter:blur(20px)"><div class="ic" style="width:56px;height:56px;border-radius:14px;background:ACCENT;margin-bottom:24px"></div><div class="t" style="font-size:36px;font-weight:800;margin-bottom:12px">Feature title</div><div class="d" style="font-size:18px;color:#ffffff99">Short supporting line.</div></div></div>
  js: var w=Fz.win(t,0.1,0.5);Fz.a(Fz.q('.card'),{o:Fz.out(w),y:50*(1-Fz.out(w))});var tw=Fz.win(t,0.35,0.7);Fz.style(Fz.q('.t'),'clipPath','inset(0 '+(1-Fz.out(tw))*100+'% 0 0)');

CTA TEMPLATE (closer — last shot):
— cta-sting: logo + button with an expanding accent ring pulse.
  html: <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px"><div class="logo" style="font-size:80px;font-weight:900;letter-spacing:-0.04em">BRAND</div><div class="btn" style="padding:16px 40px;border-radius:999px;background:ACCENT;font-weight:700;color:#000">Get started</div><div class="ring" style="position:absolute;width:300px;height:300px;border-radius:50%;border:2px solid ACCENT;opacity:0"></div></div>
  js: var w=Fz.win(t,0,0.4);Fz.a(Fz.q('.logo'),{o:Fz.out(w),y:30*(1-Fz.out(w))});var b=Fz.win(t,0.3,0.6);Fz.a(Fz.q('.btn'),{o:Fz.out(b),s:0.8+0.2*Fz.elastic(b)});var r=Fz.win(t,0.5,1);Fz.a(Fz.q('.ring'),{s:0.5+1.5*Fz.out(r),o:0.5*(1-Fz.out(r))});`;

// Pick a hook template by topic vibe.
export const pickHook = (topic = '') => {
  const t = String(topic).toLowerCase();
  if (/shock|secret|nobody|warning|stop|wait|danger|exposed/.test(t)) return 'hook-glitch';
  if (/money|price|revenue|growth|stat|number|\$|kas|crypto|earn/.test(t)) return 'hook-gradient';
  if (/how to|guide|tutorial|step|build|make|create/.test(t)) return 'hook-typewriter';
  if (/news|update|breaking|just|alert|live/.test(t)) return 'hook-scrollsnap';
  return 'hook-wordpunch';
};