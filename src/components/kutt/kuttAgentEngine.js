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
          visual_prompt: { type: "string", description: "Detailed AI image prompt for this scene" },
          voiceover: { type: "string" },
          caption: { type: "string" },
          duration: { type: "number", description: "Seconds, 2-6" },
        },
        required: ["visual_prompt", "voiceover", "duration"],
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
    cuts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clip_index: { type: "number" },
          new_duration: { type: "number" },
          delete: { type: "boolean" },
        },
        required: ["clip_index"],
      },
    },
  },
  required: ["mode", "reply"],
};

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
- "autocut": user wants you to cut/trim/tighten the timeline → fill cuts[] (clip_index refers to the timeline indices above; new_duration in seconds to trim, delete:true to remove) AND explain your edit decisions in reply like a pro editor.
- "chat": anything else → answer in reply.`,
      response_json_schema: DIRECTOR_SCHEMA,
    });
    mode = d.mode;
    topic = d.topic || input;
    onStep({ label: "🧠 Director thinking…", status: "done" });

    if (mode === "chat" || mode === "analyze") return { message: d.reply };
    if (mode === "autocut") {
      onStep({ label: "✂️ Cutting timeline…", status: "running" });
      let next = [...clips];
      const toDelete = new Set();
      (d.cuts || []).forEach((c) => {
        if (c.delete) toDelete.add(c.clip_index);
        else if (next[c.clip_index] && c.new_duration > 0.3) {
          next[c.clip_index] = { ...next[c.clip_index], duration: c.new_duration };
        }
      });
      next = next.filter((_, i) => !toDelete.has(i));
      // Re-pack video track 0 clips back-to-back after cuts
      let cursor = 0;
      next = next.map((c) => {
        if (c.track !== 0) return c;
        const packed = { ...c, start: cursor };
        cursor += c.duration;
        return packed;
      });
      setClips(next);
      onStep({ label: "✂️ Cutting timeline…", status: "done" });
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

Write a DETAILED script: strong 3-second hook, tight pacing, 4-6 scenes (2-6s each), voiceover lines, on-screen captions, and a director's viral analysis. Each scene's visual_prompt must be a rich, cinematic AI image prompt with consistent style across scenes.`,
    response_json_schema: SCRIPT_SCHEMA,
  });
  onStep({ label: "📝 Writing detailed script…", status: "done" });

  // ── STEP 3: GENERATE SCENE MEDIA ──
  const scenes = (script.scenes || []).slice(0, 6);
  onStep({ label: `🎨 Generating ${scenes.length} scene visuals…`, status: "running" });
  const urls = await Promise.all(
    scenes.map((s) =>
      base44.integrations.Core.GenerateImage({ prompt: s.visual_prompt })
        .then((r) => r?.url || null)
        .catch(() => null)
    )
  );
  onStep({ label: `🎨 Generating ${scenes.length} scene visuals…`, status: "done" });

  // ── STEP 4: BUILD THE TIMELINE ──
  onStep({ label: "🎬 Building the timeline…", status: "running" });
  const newAssets = [];
  const newClips = [];
  let cursor = 0;
  scenes.forEach((s, i) => {
    if (!urls[i]) return;
    const asset = { id: uid(), type: "image", url: urls[i], name: `Scene ${i + 1} — ${s.caption || script.title}`.slice(0, 48), duration: s.duration || 4 };
    newAssets.push(asset);
    newClips.push({ id: uid(), assetId: asset.id, track: 0, start: cursor, duration: Math.max(2, Math.min(6, s.duration || 4)), trimIn: 0 });
    cursor += newClips[newClips.length - 1].duration;
  });
  addAssets(newAssets);
  setClips((prev) => [...prev, ...newClips]);
  onStep({ label: "🎬 Building the timeline…", status: "done" });

  // ── STEP 5: DIRECTOR'S VERDICT ──
  const sceneList = scenes.map((s, i) => `**Scene ${i + 1}** (${s.duration}s): ${s.voiceover}${s.caption ? ` · 📺 "${s.caption}"` : ""}`).join("\n");
  return {
    message: `## 🎬 ${script.title}\n\n**HOOK:** ${script.hook}\n\n${sceneList}\n\n---\n### 📜 Full Script\n${script.script}\n\n---\n### 📈 Viral Analysis\n${script.viral_notes}\n\n✅ ${newClips.length} scenes are on your timeline — press play, then Export when ready.`,
    script,
  };
}