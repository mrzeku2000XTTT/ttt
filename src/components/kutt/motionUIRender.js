/**
 * KUTT Motion UI renderer — real, generated motion graphics.
 * Draws animated Apple-minimalist UI (browser chrome, devices, card stacks,
 * search, widgets, logo builds) around the scene image, on a 2D canvas.
 * Same code path powers the live preview and the video export.
 */

const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
// progress of a sub-animation that runs between a and b of the clip
const seg = (p, a, b) => clamp01((p - a) / Math.max(0.0001, b - a));

function pickAccent(palette) {
  const hex = (palette || "").match(/#([0-9a-f]{6})/i);
  return hex ? hex[0] : "#22d3ee";
}

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function shadow(ctx, blur = 40, y = 18) {
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = y;
}
const noShadow = (ctx) => { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

/** Draw the scene image cover-cropped inside a rounded rect, with optional scroll. */
function screen(ctx, img, x, y, w, h, r, scroll = 0) {
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.fillStyle = "#0f1115";
  ctx.fillRect(x, y, w, h);
  if (img && (img.naturalWidth || img.videoWidth)) {
    const sw = img.naturalWidth || img.videoWidth;
    const sh = img.naturalHeight || img.videoHeight;
    const s = Math.max(w / sw, (h * 1.25) / sh);
    const dw = sw * s, dh = sh * s;
    ctx.drawImage(img, x + (w - dw) / 2, y - scroll * Math.max(0, dh - h), dw, dh);
  }
  ctx.restore();
}

function cameraTransform(camera, p) {
  const e = easeInOut(p);
  switch (camera) {
    case "macro_pan":    return { scale: 1.14, dx: (0.5 - e) * 140, dy: 0 };
    case "parallax_tilt":return { scale: 1.05 + e * 0.04, dx: 0, dy: (0.5 - e) * 60 };
    case "focal_zoom":   return { scale: 1 + e * 0.28, dx: 0, dy: -e * 30 };
    case "crane_scroll": return { scale: 1.08, dx: 0, dy: (0.5 - e) * 120 };
    case "orbit_45":     return { scale: 1.12 + e * 0.06, dx: (0.5 - e) * 80, dy: (0.5 - e) * 40 };
    default:             return { scale: 1 + e * 0.05, dx: 0, dy: 0 }; // locked_off slow push
  }
}

// ─── component painters ───

function browser(ctx, img, W, H, p, accent, opts = {}) {
  const enter = easeOut(seg(p, 0, 0.22));
  const w = W * 0.82, h = H * 0.76;
  const x = (W - w) / 2, y = (H - h) / 2 + (1 - enter) * 40;
  ctx.globalAlpha = enter;
  shadow(ctx);
  ctx.fillStyle = "#1c1f24";
  rr(ctx, x, y, w, h, 16); ctx.fill();
  noShadow(ctx);

  const bar = h * 0.09;
  ctx.fillStyle = "#26292f";
  rr(ctx, x, y, w, bar, 16); ctx.fill();
  ctx.fillRect(x, y + bar - 16, w, 16);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x + 22 + i * 18, y + bar / 2, 5.5, 0, Math.PI * 2); ctx.fill();
  });
  // url pill (types in)
  const pillW = w * 0.42, pillX = x + (w - pillW) / 2;
  ctx.fillStyle = "#15171b";
  rr(ctx, pillX, y + bar * 0.22, pillW, bar * 0.56, bar * 0.28); ctx.fill();
  if (opts.label) {
    const chars = Math.floor(easeOut(seg(p, 0.1, 0.5)) * opts.label.length);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `500 ${Math.round(bar * 0.32)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(opts.label.slice(0, chars), pillX + 14, y + bar / 2);
  }

  const sy = y + bar, sh = h - bar;
  let sx = x, sw = w;
  if (opts.sidebar) {
    const sidebarW = w * 0.06 + easeOut(seg(p, 0.25, 0.6)) * w * 0.16;
    ctx.fillStyle = "#202329";
    ctx.fillRect(x, sy, sidebarW, sh);
    for (let i = 0; i < 5; i++) {
      const rowP = easeOut(seg(p, 0.3 + i * 0.06, 0.55 + i * 0.06));
      ctx.globalAlpha = enter * rowP;
      ctx.fillStyle = i === 1 ? accent : "rgba(255,255,255,0.14)";
      rr(ctx, x + 14, sy + 22 + i * 34, Math.max(10, sidebarW - 28), 12, 6); ctx.fill();
      ctx.globalAlpha = enter;
    }
    sx = x + sidebarW; sw = w - sidebarW;
  }
  screen(ctx, img, sx, sy, sw, sh, 0, opts.scroll ? easeInOut(p) : 0);

  if (opts.search) {
    const openP = easeOut(seg(p, 0.15, 0.45));
    const fw = sw * (0.24 + openP * 0.48), fh = sh * 0.11;
    const fx = sx + (sw - fw) / 2, fy = sy + sh * 0.16;
    ctx.fillStyle = "rgba(10,12,15,0.82)";
    shadow(ctx, 30, 10);
    rr(ctx, fx, fy, fw, fh, fh / 2); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = accent; ctx.globalAlpha = enter * 0.7; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = enter;
    const q = opts.label || "search";
    const chars = Math.floor(easeOut(seg(p, 0.4, 0.75)) * q.length);
    ctx.fillStyle = "#fff";
    ctx.font = `600 ${Math.round(fh * 0.42)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(q.slice(0, chars), fx + fh * 0.6, fy + fh / 2);
    // cascading results
    for (let i = 0; i < 4; i++) {
      const rp = easeOut(seg(p, 0.6 + i * 0.06, 0.8 + i * 0.06));
      if (rp <= 0) continue;
      ctx.globalAlpha = enter * rp;
      ctx.fillStyle = "rgba(255,255,255,0.09)";
      rr(ctx, fx, fy + fh + 14 + i * (fh * 0.8), fw, fh * 0.6, 10); ctx.fill();
      ctx.globalAlpha = enter;
    }
  }
  ctx.globalAlpha = 1;
}

function device(ctx, img, W, H, p, accent, kind) {
  const enter = easeOut(seg(p, 0, 0.25));
  ctx.globalAlpha = enter;
  if (kind === "macbook") {
    const w = W * 0.72, h = w * 0.6;
    const x = (W - w) / 2, y = (H - h) / 2 - H * 0.04 + (1 - enter) * 30;
    shadow(ctx);
    ctx.fillStyle = "#2b2f36"; rr(ctx, x, y, w, h, 14); ctx.fill();
    noShadow(ctx);
    screen(ctx, img, x + w * 0.025, y + h * 0.04, w * 0.95, h * 0.9, 6, 0);
    ctx.fillStyle = "#3a3f47";
    rr(ctx, x - w * 0.06, y + h + 6, w * 1.12, h * 0.045, 6); ctx.fill();
  } else {
    const h = H * 0.86, w = h * 0.47;
    const x = (W - w) / 2, y = (H - h) / 2 + (1 - enter) * 30;
    shadow(ctx);
    ctx.fillStyle = "#1b1e23"; rr(ctx, x, y, w, h, w * 0.12); ctx.fill();
    noShadow(ctx);
    screen(ctx, img, x + w * 0.035, y + h * 0.02, w * 0.93, h * 0.96, w * 0.1, easeInOut(p) * 0.8);
    ctx.fillStyle = "#000";
    rr(ctx, x + w * 0.34, y + h * 0.035, w * 0.32, h * 0.028, h * 0.014); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    rr(ctx, x + w * 0.33, y + h - h * 0.028, w * 0.34, 4, 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function cardStack(ctx, img, W, H, p, accent, variant) {
  const cw = W * 0.42, ch = H * 0.56;
  const cx = (W - cw) / 2, cy = (H - ch) / 2;
  const spread = easeOut(seg(p, 0.1, 0.7));

  for (let i = 2; i >= 0; i--) {
    let ox = 0, oy = 0, sc = 1, rot = 0, alpha = 1;
    if (variant === "card_stack_2") ox = (i - 1) * spread * cw * 0.72;
    else if (variant === "card_stack_3") { oy = (i - 1) * spread * ch * 0.34; ox = (i - 1) * spread * cw * 0.18; rot = (i - 1) * 0.05 * spread; }
    else if (variant === "card_stack_4") { sc = 1 - i * 0.06 * (1 - spread * 0.4); oy = i * 16; }
    else { oy = i * 18 - (i === 0 ? spread * ch * 0.5 : 0); alpha = i === 0 ? 1 - spread * 0.6 : 1; sc = 1 - i * 0.05; }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx + cw / 2 + ox, cy + ch / 2 + oy);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    if (i === 0 && variant === "card_stack_4") {
      const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2);
      ctx.shadowColor = accent; ctx.shadowBlur = 40 + pulse * 50; ctx.shadowOffsetY = 0;
    } else shadow(ctx, 34, 14);
    ctx.fillStyle = "#1a1d22";
    rr(ctx, -cw / 2, -ch / 2, cw, ch, 22); ctx.fill();
    noShadow(ctx);
    if (i === 0) screen(ctx, img, -cw / 2 + 10, -ch / 2 + 10, cw - 20, ch - 20, 16, 0);
    else {
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      rr(ctx, -cw / 2 + 24, -ch / 2 + 28, cw * 0.5, 14, 7); ctx.fill();
    }
    ctx.restore();
  }
}

function widget(ctx, img, W, H, p, accent, label) {
  const enter = easeOut(seg(p, 0, 0.3));
  const drift = Math.sin(p * Math.PI * 2) * 6;
  const w = W * 0.34, h = w * 0.72;
  const x = (W - w) / 2, y = (H - h) / 2 + (1 - enter) * 40 + drift;
  screen(ctx, img, 0, 0, W, H, 0, easeInOut(p) * 0.3);
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = enter;
  shadow(ctx, 50, 22);
  ctx.fillStyle = "rgba(24,27,32,0.86)";
  rr(ctx, x, y, w, h, 26); ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `800 ${Math.round(h * 0.3)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText((label || "").slice(0, 12) || "—", x + 24, y + h * 0.52);
  // sparkline draws itself in
  const drawP = easeOut(seg(p, 0.25, 0.8));
  ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.beginPath();
  const pts = 22;
  for (let i = 0; i <= pts * drawP; i++) {
    const px = x + 24 + (i / pts) * (w - 48);
    const py = y + h * 0.78 - Math.sin(i * 0.6) * h * 0.09 - (i / pts) * h * 0.1;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function logoBuild(ctx, img, W, H, p, accent) {
  const wipe = easeOut(seg(p, 0.05, 0.55));
  const w = W * 0.5, h = H * 0.5;
  const x = (W - w) / 2, y = (H - h) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w * wipe, h);
  ctx.clip();
  screen(ctx, img, x, y, w, h, 20, 0);
  ctx.restore();
  // specular sweep
  const sw = seg(p, 0.55, 0.9);
  if (sw > 0 && sw < 1) {
    const g = ctx.createLinearGradient(x + sw * w - 60, 0, x + sw * w + 60, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.28)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 20); ctx.stroke(); ctx.globalAlpha = 1;
}

function divMorph(ctx, img, W, H, p, accent) {
  const m = easeInOut(seg(p, 0.15, 0.85));
  const w = W * (0.32 + m * 0.5), h = H * (0.68 - m * 0.18);
  const x = (W - w) / 2, y = (H - h) / 2;
  shadow(ctx, 40, 18);
  ctx.fillStyle = "#191c21";
  rr(ctx, x, y, w, h, 30 - m * 16); ctx.fill();
  noShadow(ctx);
  screen(ctx, img, x + 10, y + 10, w - 20, h - 20, 22 - m * 12, 0);
  ctx.strokeStyle = accent; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, h, 30 - m * 16); ctx.stroke(); ctx.globalAlpha = 1;
}

function cursorGlow(ctx, W, H, p, accent) {
  const rowY = H * (0.42 + easeInOut(seg(p, 0.2, 0.8)) * 0.2);
  ctx.globalAlpha = 0.25 + 0.15 * Math.sin(p * Math.PI * 4);
  ctx.fillStyle = accent;
  rr(ctx, W * 0.2, rowY - H * 0.045, W * 0.6, H * 0.09, 12); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(W * 0.56, rowY);
  ctx.lineTo(W * 0.56 + 16, rowY + 22);
  ctx.lineTo(W * 0.56 + 6, rowY + 22);
  ctx.lineTo(W * 0.56, rowY + 32);
  ctx.closePath(); ctx.fill();
}

/**
 * Main entry — draws one motion-UI frame.
 * clip: { motion_component, motion_camera, palette, text }
 */
export function drawMotionUI(ctx, { image, clip, progress, t }, W, H) {
  const p = clamp01(progress);
  const accent = pickAccent(clip?.palette);
  const component = clip?.motion_component || "browser_window";
  const camera = clip?.motion_camera || "locked_off";
  const label = clip?.text || "";

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0a0c0f");
  g.addColorStop(1, "#141820");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const cam = cameraTransform(camera, p);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-W / 2 + cam.dx, -H / 2 + cam.dy);

  switch (component) {
    case "phone_window":
    case "iphone":
      device(ctx, image, W, H, p, accent, "phone"); break;
    case "macbook":
      device(ctx, image, W, H, p, accent, "macbook"); break;
    case "card_stack_1":
    case "card_stack_2":
    case "card_stack_3":
    case "card_stack_4":
      cardStack(ctx, image, W, H, p, accent, component); break;
    case "widget_box":
      widget(ctx, image, W, H, p, accent, label); break;
    case "logo_animation_1":
    case "logo_animation_2":
    case "title_card":
      logoBuild(ctx, image, W, H, p, accent); break;
    case "div_morph":
      divMorph(ctx, image, W, H, p, accent); break;
    case "search_animation_1":
    case "search_animation_2":
      browser(ctx, image, W, H, p, accent, { search: true, label }); break;
    case "sidebar_expand":
    case "ui_animation":
      browser(ctx, image, W, H, p, accent, { sidebar: true, label }); break;
    case "hover_glow":
      browser(ctx, image, W, H, p, accent, { label });
      cursorGlow(ctx, W, H, p, accent);
      break;
    case "videos":
      browser(ctx, image, W, H, p, accent, { scroll: true, label }); break;
    default:
      browser(ctx, image, W, H, p, accent, { label, scroll: true });
  }

  ctx.restore();
}