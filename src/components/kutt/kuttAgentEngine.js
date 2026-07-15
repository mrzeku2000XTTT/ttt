import { base44 } from "@/api/base44Client";

const uid = () => `k_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const SCRIPT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    hook: { type: "string", description: "First-3-seconds hook line" },
    script: { type: "string", description: "Full detailed script, markdown, with timestamps per scene" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          visual_prompt: { type: "string", description: "Detailed AI media prompt for this scene" },
          media: { type: "string", enum: ["video", "image"], description: "video = real AI-generated motion video, image = still" },
          voiceover: { type: "string" },
          caption: { type: "string" },
          duration: { type: "number", description: "Seconds, 2-6 (video scenes: 4, 6 or 8)" },
        },
        required: ["visual_prompt", "media", "voiceover", "duration"],
      },
    },
    viral_notes: { type: "string", description: "Director's viral-growth analysis: pacing, hook strength, CTA, platform fit" },
  },
  required: ["title", "hook", "script", "scenes", "viral_notes"],
};

const DIRECTOR_SCHEMA = {
  type: "object",
  properties: {
    mode: { type: "string", enum: ["chat", "script", "analyze", "autocut"] },
    reply: { type: "string" },
    topic: { type: "string" },
    edits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          op: { type: "string", enum: ["trim", "delete", "split", "move"] },
          clip_index: { type: "number" },
          new_duration: { type: "number" },
          split_at: { type: "number", description: "Timeline second where the split happens (must be inside the clip)" },
          new_start: { type: "number" },
          new_track: { type: "number", description: "0=V1 main, 1=V2 overlay layer, 2=A1 audio" },
        },
        required: ["op", "clip_index"],
      },
    },
    ripple: { type: "boolean", description: "true = re-pack V1 clips back-to-back after edits (no gaps)" },
  },
  required: ["mode", "reply"],
};

// Apply CapCut-style edit ops sequentially. Split appends the right half at the
// END of the list; delete nulls the slot so later indices stay stable.
function applyEdits(clips, edits, ripple) {
  const uid2 = () => `k_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const next = clips.map((c) => ({ ...c }));
  (edits || []).forEach((e) => {
    const clip = next[e.clip_index];
    if (!clip) return;
    if (e.op === "delete") { next[e.clip_index] = null; return; }
    if (e.op === "trim" && e.new_duration > 0.3) { clip.duration = e.new_duration; return; }
    if (e.op === "move") {
      if (typeof e.new_start === "number") clip.start = Math.max(0, e.new_start);
      if (typeof e.new_track === "number") clip.track = Math.max(0, Math.min(2, e.new_track));
      return;
    }
    if (e.op === "split" && typeof e.split_at === "number") {
      const offset = e.split_at - clip.start;
      if (offset <= 0.2 || offset >= clip.duration - 0.2) return;
      next.push({ ...clip, id: uid2(), start: e.split_at, duration: clip.duration - offset, trimIn: (clip.trimIn || 0) + offset });
      clip.duration = offset;
    }
  });
  let result = next.filter(Boolean);
  if (ripple) {
    let cursor = 0;
    result = result
      .sort((a, b) => (a.track - b.track) || (a.start - b.start))
      .map((c) => {
        if (c.track !== 0) return c;
        const packed = { ...c, start: cursor };
        cursor += c.duration;
        return packed;
      });
  }
  return result;
}

/**
 * KUTT Soul — multi-step media director pipeline.
 * URL/topic → live research → detailed script → generated scene media →
 * timeline auto-build → viral analysis. Also: analyze / autocut / chat.
 */
export async function runKuttSoul({ input, assets, clips, onStep, addAssets, setClips }) {
  const url = (input.match(/https?:\/\/[^\s]+/) || [])[0];

  // ── DIRECTOR DECISION (no URL → figure out what the user wants) ──
  let mode = url ? "script" : null;
  let topic = url || input;
  if (!url) {
    onStep({ label: "🧠 Director thinking…", status: "running" });
    const timelineJson = JSON.stringify(clips.map((c, i) => ({
      index: i, track: c.track, start: c.start, duration: c.duration,
      asset: assets.find((a) => a.id === c.assetId)?.name || "?",
      type: assets.find((a) => a.id === c.assetId)?.type || "?",
    })));
    const d = await base44.integrations.Core.InvokeLLM({
      prompt: `You are KUTT's AI media director, editor and viral-growth analyzer inside a professional video editor.

USER SAID: """${input}"""

CURRENT TIMELINE (${clips.length} clips): ${timelineJson || "(empty)"}

Pick ONE mode:
- "script": user wants a video/script made from a topic → set topic to the exact subject.
- "analyze": user wants feedback/analysis of the current timeline for viral growth → write the full professional analysis in reply (pacing, hook, retention, platform fit, concrete fixes).
- "autocut": user wants you to cut / trim / tighten / split / re-layer / auto-edit the timeline. You are CapCut's AutoCut on steroids — you edit AUTONOMOUSLY, multi-layer, with real splits:
   · SCENE DETECTION & PACING: viral pacing = 2-4s per clip. SPLIT clips longer than ~5s at their key beats (op "split" with split_at = timeline second inside the clip), then TRIM or DELETE the weak halves (dead air, slow intros, filler).
   · HOOK FIRST: the first 3 seconds must be the strongest moment — MOVE the best clip to start=0 on track 0.
   · MULTI-LAYER: use op "move" with new_track=1 to place B-roll/overlay clips on the V2 layer above the main V1 story (give them a new_start that overlaps the V1 clip they support).
   · Ops apply IN ORDER against the listing above; a split's new right-half clip is appended at the END of the list (so its index = current list length).
   · Set ripple=true to re-pack V1 back-to-back with no gaps (like CapCut's ripple delete).
   Fill edits[] AND explain every cut decision in reply like a pro editor.
- "chat": anything else → answer in reply.`,
      response_json_schema: DIRECTOR_SCHEMA,
    });
    mode = d.mode;
    topic = d.topic || input;
    onStep({ label: "🧠 Director thinking…", status: "done" });

    if (mode === "chat" || mode === "analyze") return { message: d.reply };
    if (mode === "autocut") {
      onStep({ label: "✂️ AutoCut — splitting, trimming & layering…", status: "running" });
      setClips(applyEdits(clips, d.edits, d.ripple !== false));
      onStep({ label: "✂️ AutoCut — splitting, trimming & layering…", status: "done" });
      return { message: d.reply };
    }
  }

  // ── STEP 1: LIVE SOURCE ANALYSIS ──
  onStep({ label: url ? "🔎 Reading the URL live…" : "🔎 Researching topic…", status: "running" });
  const research = await base44.integrations.Core.InvokeLLM({
    model: "gemini_3_flash",
    add_context_from_internet: true,
    prompt: `You are a viral-content analyst. ${url ? `Browse this URL LIVE right now: ${url}` : `Research this topic on the live web: "${topic}"`}
Extract: what it's about, the single most gripping angle, key facts/quotes/numbers, the target audience, and 3 viral hook ideas. Be concrete and detailed.`,
  });
  onStep({ label: url ? "🔎 Reading the URL live…" : "🔎 Researching topic…", status: "done" });

  // ── STEP 2: DETAILED SCRIPT ──
  onStep({ label: "📝 Writing detailed script…", status: "running" });
  const script = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a professional media director writing a short-form viral video script.

SOURCE RESEARCH:
${typeof research === "string" ? research : JSON.stringify(research)}

USER REQUEST: """${input}"""

Write a DETAILED script: strong 3-second hook, tight pacing, 4-6 scenes (2-6s each), voiceover lines, on-screen captions, and a director's viral analysis. Each scene's visual_prompt must be a rich, cinematic AI prompt with consistent style across scenes.
MEDIA CHOICE: set media="video" for the 1-2 scenes that NEED real motion (the hook and the climax) — these become real AI-generated videos (duration 4, 6 or 8). Use media="image" for the rest. If the user explicitly asked for real/AI videos, make more scenes video.`,
    response_json_schema: SCRIPT_SCHEMA,
  });
  onStep({ label: "📝 Writing detailed script…", status: "done" });

  // ── STEP 3: GENERATE SCENE MEDIA (real videos + images) ──
  const scenes = (script.scenes || []).slice(0, 6);
  const videoCount = scenes.filter((s) => s.media === "video").length;
  const genLabel = `🎨 Generating ${scenes.length} scenes (${videoCount} real video${videoCount === 1 ? "" : "s"})…`;
  onStep({ label: genLabel, status: "running" });
  const generated = await Promise.all(
    scenes.map(async (s) => {
      // Video first; if the video model fails, fall back to a still image instead of dropping the scene
      if (s.media === "video") {
        try {
          const dur = s.duration >= 7 ? 8 : s.duration >= 5 ? 6 : 4;
          const r = await base44.integrations.Core.GenerateVideo({ prompt: s.visual_prompt, duration: dur, aspect_ratio: "16:9" });
          if (r?.url) return { url: r.url, type: "video", duration: dur };
        } catch { /* fall through to image */ }
      }
      try {
        const r = await base44.integrations.Core.GenerateImage({ prompt: s.visual_prompt });
        return r?.url ? { url: r.url, type: "image", duration: s.duration || 4 } : { error: "empty image result" };
      } catch (e) {
        return { error: e?.response?.data?.error || e?.message || "generation failed" };
      }
    })
  );
  onStep({ label: genLabel, status: "done" });

  const failures = generated.filter((g) => g?.error);
  if (failures.length === scenes.length) {
    throw new Error(`Media generation failed for every scene — ${failures[0].error}`);
  }

  // ── STEP 4: BUILD THE TIMELINE ──
  onStep({ label: "🎬 Building the timeline…", status: "running" });
  const newAssets = [];
  const newClips = [];
  let cursor = 0;
  scenes.forEach((s, i) => {
    const g = generated[i];
    if (!g || g.error) return;
    const asset = { id: uid(), type: g.type, url: g.url, name: `Scene ${i + 1} — ${s.caption || script.title}`.slice(0, 48), duration: g.duration };
    newAssets.push(asset);
    newClips.push({ id: uid(), assetId: asset.id, track: 0, start: cursor, duration: Math.max(2, Math.min(8, g.duration)), trimIn: 0 });
    cursor += newClips[newClips.length - 1].duration;
  });
  addAssets(newAssets);
  setClips((prev) => [...prev, ...newClips]);
  onStep({ label: "🎬 Building the timeline…", status: "done" });

  // ── STEP 5: DIRECTOR'S VERDICT ──
  const sceneList = scenes.map((s, i) => `**Scene ${i + 1}** (${s.duration}s): ${s.voiceover}${s.caption ? ` · 📺 "${s.caption}"` : ""}`).join("\n");
  return {
    message: `## 🎬 ${script.title}\n\n**HOOK:** ${script.hook}\n\n${sceneList}\n\n---\n### 📜 Full Script\n${script.script}\n\n---\n### 📈 Viral Analysis\n${script.viral_notes}\n\n✅ ${newClips.length} scenes are on your timeline${failures.length ? ` (⚠️ ${failures.length} scene${failures.length === 1 ? "" : "s"} failed: ${failures[0].error})` : ""} — press play, then Export when ready.`,
    script,
  };
}