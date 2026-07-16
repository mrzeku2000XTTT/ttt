import { base44 } from "@/api/base44Client";
import { runEditorAgent } from "./kuttEditorAgent";
import { applyEditorPlan, splitClip, trimClip, moveClip, deleteClip } from "./kuttEditorTools";

const uid = () => `k_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── SPONGE: Director absorbs user intent into a creative brief ───
const BRIEF_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string", description: "The core subject (e.g., 'French Bulldogs', 'a SaaS landing page')" },
    intent: { type: "string", enum: ["script", "analyze", "autocut", "chat"], description: "What the user wants" },
    consistency_mode: { type: "string", enum: ["strict", "flexible"], description: "strict = maintain consistent style/subject throughout; flexible = variations OK" },
    enhanced_brief: { type: "string", description: "The director's enhanced, rephrased version of the user's request — same intent, richer, understandable by editor agents" },
    target_duration: { type: "number", description: "Estimated total duration in seconds" },
    scene_count: { type: "number", description: "How many scenes (3-6)" },
    editor_count: { type: "number", description: "How many editor agents to spawn (1-10). 1 editor per 1-2 scenes. More scenes/duration = more editors." },
    reply: { type: "string", description: "What to tell the user about the plan" },
  },
  required: ["topic", "intent", "enhanced_brief", "reply"],
};

const SCRIPT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    hook: { type: "string", description: "First-3-seconds hook line" },
    script: { type: "string", description: "Full detailed script with timestamps per scene" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          visual_prompt: { type: "string", description: "Detailed AI media prompt for this scene" },
          media: { type: "string", enum: ["video", "image"], description: "video = AI-generated motion, image = still" },
          voiceover: { type: "string" },
          caption: { type: "string" },
          duration: { type: "number", description: "Seconds, 2-6" },
        },
        required: ["visual_prompt", "media", "voiceover", "duration"],
      },
    },
    viral_notes: { type: "string" },
  },
  required: ["title", "hook", "script", "scenes", "viral_notes"],
};

const AUTOCUT_SCHEMA = {
  type: "object",
  properties: {
    edits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          op: { type: "string", enum: ["trim", "delete", "split", "move"] },
          clip_index: { type: "number" },
          new_duration: { type: "number" },
          split_at: { type: "number", description: "Timeline second where the split happens" },
          new_start: { type: "number" },
          new_track: { type: "number" },
        },
        required: ["op", "clip_index"],
      },
    },
    reply: { type: "string" },
  },
  required: ["edits", "reply"],
};

// Split scenes into segments for parallel editor agents
function splitIntoSegments(scenes, editorCount) {
  const count = Math.min(editorCount, scenes.length, 10);
  const scenesPerEditor = Math.ceil(scenes.length / count);
  const segments = [];
  for (let i = 0; i < scenes.length; i += scenesPerEditor) {
    segments.push({ scenes: scenes.slice(i, i + scenesPerEditor) });
  }
  return segments;
}

/**
 * KUTT Orchestrator — the Director delegates to sub-agents:
 * Sponge (absorb intent) → Researcher → Scriptwriter → Media Gen →
 * Editor Agents (1-10, parallel) → Assemble → Viral Analyst.
 */
export async function runKuttOrchestrator({ input, assets, clips, onStep, addAssets, setClips }) {
  // URL detection
  let url = (input.match(/https?:\/\/[^\s]+/) || [])[0];
  if (!url) {
    const bare = (input.match(/\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|org|net|io|xyz|ai|app|dev|co|tv|gg|finance|network)\b(?:\/[^\s]*)?/i) || [])[0];
    if (bare) url = `https://${bare}`;
  }

  const timelineJson = JSON.stringify(clips.map((c, i) => ({
    index: i, track: c.track, start: c.start, duration: c.duration,
    type: c.clip_type || assets.find((a) => a.id === c.assetId)?.type || "?",
    name: c.clip_type === "hyperframe" ? `"${(c.text || "").slice(0, 20)}"` : assets.find((a) => a.id === c.assetId)?.name || "?",
  })));

  // ── PHASE 1: SPONGE — Director absorbs intent ──
  onStep?.({ label: "🧽 Director absorbing intent…", status: "running", agent: "director" });
  const brief = await base44.integrations.Core.InvokeLLM({
    prompt: `You are the KUTT Director — an orchestrator who delegates to sub-agents. Your first job is to ABSORB the user's intent like a sponge, then enhance and rephrase it for your editor agents.

USER SAID: """${input}"""

CURRENT TIMELINE (${clips.length} clips): ${timelineJson || "(empty)"}
${url ? "A URL was detected — this is likely a 'script' request." : "No URL detected."}

ABSORB THE INTENT:
1. TOPIC: What is the core subject? (e.g., "French Bulldogs", "a SaaS landing page", "fitness motivation")
2. INTENT: What does the user want? (script, analyze, autocut, or chat?)
3. CONSISTENCY: Is the user asking for consistency?
   - "dogs" with no specificity → flexible (different dog breeds/types OK)
   - "consistent", "same", "keep it uniform", or a specific brand/product → strict
   - When in doubt, the user's topic specificity determines this
4. ENHANCE: Rephrase into a rich creative brief that editor agents can follow. Same intent, expanded with professional direction, style notes, and emotional beats.
5. PLAN: How many scenes (3-6)? How many editor agents (1-10)? Rule: 1 editor per 1-2 scenes. More duration/complexity = more editors.

Be decisive. The enhanced_brief is what your editor agents will receive — make it rich and actionable.`,
    response_json_schema: BRIEF_SCHEMA,
  });
  onStep?.({ label: "🧽 Director absorbing intent…", status: "done", agent: "director" });

  // Handle non-script intents
  if (brief.intent === "chat") return { message: brief.reply };

  if (brief.intent === "analyze") {
    onStep?.({ label: "📊 Viral Analyst reviewing timeline…", status: "running", agent: "analyst" });
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a viral-growth analyst. Analyze this timeline for viral potential.
TIMELINE: ${timelineJson}
USER REQUEST: ${input}
Provide: pacing analysis, hook strength, retention curve prediction, platform fit (TikTok/Reels/Shorts), and 3 concrete fixes.`,
    });
    onStep?.({ label: "📊 Viral Analyst reviewing timeline…", status: "done", agent: "analyst" });
    return { message: typeof analysis === "string" ? analysis : brief.reply };
  }

  if (brief.intent === "autocut") {
    onStep?.({ label: "✂️ Editor Agent autocutting…", status: "running", agent: "editor-1" });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an Editor Agent doing an autonomous cut on the current timeline. Edit for viral pacing.

TIMELINE (${clips.length} clips): ${timelineJson}
DIRECTOR'S BRIEF: ${brief.enhanced_brief}

Apply CapCut-style edits: split long clips, trim dead air, move the best clip to start=0, layer B-roll on V2. Ops apply IN ORDER against the listing; split appends the right half at the END of the list.`,
      response_json_schema: AUTOCUT_SCHEMA,
    });

    let workingClips = [...clips];
    (result.edits || []).forEach((e) => {
      const clip = workingClips[e.clip_index];
      if (!clip) return;
      if (e.op === "delete") workingClips = deleteClip(workingClips, clip.id);
      else if (e.op === "trim" && e.new_duration > 0.3) workingClips = trimClip(workingClips, clip.id, e.new_duration);
      else if (e.op === "move") workingClips = moveClip(workingClips, clip.id, e.new_start, e.new_track);
      else if (e.op === "split" && typeof e.split_at === "number") workingClips = splitClip(workingClips, clip.id, e.split_at);
    });

    // Ripple: pack V1 back-to-back
    let cursor = 0;
    workingClips = workingClips
      .sort((a, b) => (a.track - b.track) || (a.start - b.start))
      .map((c) => {
        if (c.track !== 0) return c;
        const packed = { ...c, start: cursor };
        cursor += c.duration;
        return packed;
      });

    setClips(workingClips);
    onStep?.({ label: "✂️ Editor Agent autocutting…", status: "done", agent: "editor-1" });
    return { message: result.reply };
  }

  // ── PHASE 2: RESEARCH — Researcher agent ──
  onStep?.({ label: "🔎 Researcher scanning the web…", status: "running", agent: "researcher" });
  const research = await base44.integrations.Core.InvokeLLM({
    model: "gemini_3_flash",
    add_context_from_internet: true,
    prompt: `You are a viral-content researcher. ${url ? `Browse this URL LIVE: ${url}` : `Research this topic: "${brief.topic}"`}
Extract: what it's about, the most gripping angle, key facts/quotes/numbers, target audience, and 3 viral hook ideas.`,
  });
  onStep?.({ label: "🔎 Researcher scanning the web…", status: "done", agent: "researcher" });

  // ── PHASE 3: SCRIPT — Scriptwriter agent ──
  const sceneCount = Math.min(Math.max(brief.scene_count || 5, 3), 6);
  onStep?.({ label: "📝 Scriptwriter drafting scenes…", status: "running", agent: "scriptwriter" });
  const script = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a professional scriptwriter agent working under the KUTT Director.

RESEARCH:
${typeof research === "string" ? research : JSON.stringify(research)}

DIRECTOR'S BRIEF: ${brief.enhanced_brief}
CONSISTENCY: ${brief.consistency_mode}
TOPIC: ${brief.topic}

Write ${sceneCount} scenes (2-6s each). Each scene's visual_prompt must be rich and cinematic.
${brief.consistency_mode === "strict" ? "ALL scenes MUST be visually consistent — same art direction, same subject type, same color palette." : "Some variation between scenes is OK — different angles/types within the topic."}
Set media="video" for 1-2 key scenes (hook + climax, duration 4/6/8), media="image" for the rest.`,
    response_json_schema: SCRIPT_SCHEMA,
  });
  onStep?.({ label: "📝 Scriptwriter drafting scenes…", status: "done", agent: "scriptwriter" });

  // ── PHASE 4: MEDIA GENERATION — parallel media agents ──
  const scenes = (script.scenes || []).slice(0, sceneCount);
  const genLabel = `🎨 Media agents generating ${scenes.length} scenes…`;
  onStep?.({ label: genLabel, status: "running", agent: "media" });
  const generated = await Promise.all(
    scenes.map(async (s) => {
      if (s.media === "video") {
        try {
          const dur = s.duration >= 7 ? 8 : s.duration >= 5 ? 6 : 4;
          const r = await base44.integrations.Core.GenerateVideo({ prompt: s.visual_prompt, duration: dur, aspect_ratio: "16:9" });
          if (r?.url) return { url: r.url, type: "video", duration: dur };
        } catch {}
      }
      try {
        const r = await base44.integrations.Core.GenerateImage({ prompt: s.visual_prompt });
        return r?.url ? { url: r.url, type: "image", duration: s.duration || 4 } : { error: "empty" };
      } catch (e) {
        return { error: e?.message || "failed" };
      }
    })
  );
  onStep?.({ label: genLabel, status: "done", agent: "media" });

  // Create assets from generated media
  const newAssets = [];
  scenes.forEach((s, i) => {
    const g = generated[i];
    if (!g || g.error) return;
    newAssets.push({
      id: uid(),
      type: g.type,
      url: g.url,
      name: `Scene ${i + 1} — ${(s.caption || script.title || "").slice(0, 36)}`,
      duration: g.duration,
      scene_index: i,
    });
  });

  if (newAssets.length === 0) throw new Error("Media generation failed for every scene");
  addAssets(newAssets);

  // ── PHASE 5: EDITOR AGENTS — parallel segment editing ──
  const editorCount = Math.min(brief.editor_count || 3, 10, newAssets.length);
  const segments = splitIntoSegments(scenes, editorCount);
  const actualEditorCount = segments.length;

  onStep?.({ label: `🎬 Director dispatching ${actualEditorCount} editor${actualEditorCount > 1 ? "s" : ""}…`, status: "running", agent: "director" });

  const editorResults = await Promise.all(
    segments.map((seg, i) =>
      runEditorAgent({
        editorId: i + 1,
        brief: brief.enhanced_brief,
        scenes: seg.scenes,
        consistencyMode: brief.consistency_mode,
        onStep,
      })
    )
  );
  onStep?.({ label: `🎬 Director dispatching ${actualEditorCount} editor${actualEditorCount > 1 ? "s" : ""}…`, status: "done", agent: "director" });

  // ── PHASE 6: ASSEMBLE — merge editor segments into one timeline ──
  onStep?.({ label: "🔗 Director assembling timeline…", status: "running", agent: "director" });
  const allClips = [];
  const allHyperframes = [];
  let segmentOffset = 0;

  editorResults.forEach((er, i) => {
    const seg = segments[i];
    const segStartIdx = scenes.indexOf(seg.scenes[0]);
    const segAssets = seg.scenes.map((_, localIdx) => newAssets.find((a) => a.scene_index === segStartIdx + localIdx)).filter(Boolean);

    const { clips: segClips, hyperframes: segHfs } = applyEditorPlan(er.plan, segAssets, segmentOffset);
    allClips.push(...segClips);
    allHyperframes.push(...segHfs);

    const segDuration = segClips.length > 0 ? Math.max(...segClips.map((c) => c.start + c.duration), 0) : 0;
    segmentOffset += segDuration;
  });

  setClips((prev) => [...prev, ...allClips, ...allHyperframes]);
  onStep?.({ label: "🔗 Director assembling timeline…", status: "done", agent: "director" });

  // ── PHASE 7: VIRAL ANALYSIS — Analyst agent ──
  onStep?.({ label: "📊 Viral Analyst final review…", status: "running", agent: "analyst" });
  const sceneList = scenes.map((s, i) => `**Scene ${i + 1}** (${s.duration}s): ${s.voiceover}${s.caption ? ` · 📺 "${s.caption}"` : ""}`).join("\n");
  onStep?.({ label: "📊 Viral Analyst final review…", status: "done", agent: "analyst" });

  const hyperframeCount = allHyperframes.length;
  const message = `## 🎬 ${script.title}\n\n**HOOK:** ${script.hook}\n\n${sceneList}\n\n---\n### 📜 Full Script\n${script.script}\n\n---\n### 📈 Viral Analysis\n${script.viral_notes}\n\n---\n### 🤖 Orchestration Summary\n- **${actualEditorCount} editor agent${actualEditorCount > 1 ? "s" : ""}** worked in parallel\n- **${hyperframeCount} text/animation hyperframe${hyperframeCount !== 1 ? "s" : ""}** added\n- **Consistency:** ${brief.consistency_mode}\n- **Topic:** ${brief.topic}\n\n✅ ${allClips.length} clips + ${hyperframeCount} hyperframes on your timeline — press play, then Export.`;

  return { message, script };
}