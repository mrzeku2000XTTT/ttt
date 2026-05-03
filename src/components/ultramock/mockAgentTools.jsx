// Tool definitions + executor for the Cháoxiào AI agent.
// The agent emits a JSON plan of tool calls; this file knows how to run them
// against the page's state.
import { MOTION_PRESETS } from "./motionPresets";
import { CAMERA_PRESETS } from "./cameraPresets";

export const TOOL_LIST = [
  { name: "add_device", desc: "Add a new device to the canvas", args: "{ device?: 'iphone'|'android'|'ipad'|'macbook'|'imac'|'browser'|'none', x?: 0-100, y?: 0-100 }" },
  { name: "add_text", desc: "Add a text layer", args: "{ text: string, x?: 0-100, y?: 0-100, fontSize?: 14-120, color?: hex, animation?: 'none'|'typewriter' }" },
  { name: "update_item", desc: "Update the currently-selected item (or by id) — change device type, scale, rotation, corner radius, position, text, color, animation, etc.", args: "{ id?: string, device?: ..., scale?: 0.3-1.4, rotX?: -180..180, rotY?: -180..180, cornerRadius?: 0-2, x?: 0-100, y?: 0-100, text?: string, fontSize?: number, color?: hex, fontWeight?: 400|700|900, animation?: 'none'|'typewriter', boxWidth?: 15-100 }" },
  { name: "select_item", desc: "Select an item by id or by index (0-based)", args: "{ id?: string, index?: number }" },
  { name: "remove_item", desc: "Remove an item by id (or selected if no id)", args: "{ id?: string }" },
  { name: "set_background", desc: "Change the canvas background preset", args: "{ background: 'sunset'|'ocean'|'forest'|'peach'|'mono'|'ivory'|'midnight'|'candy'|'white'|'black' }" },
  { name: "set_padding", desc: "Change canvas padding in pixels (20-160)", args: "{ padding: number }" },
  { name: "set_duration", desc: "Set total animation duration in seconds (1-30)", args: "{ seconds: number }" },
  { name: "apply_preset", desc: "Apply a motion preset to the timeline of the SELECTED device. mode 'replace' wipes & sets across full duration; 'chain' appends at playhead.", args: "{ preset_id: string, mode?: 'replace'|'chain' }" },
  { name: "chain_presets", desc: "Apply multiple presets in sequence (chain mode). Great for storytelling: e.g. ['slide-in-left','chat-zoom','words-pop'].", args: "{ preset_ids: string[] }" },
  { name: "clear_timeline", desc: "Clear all keyframes from the selected device's timeline", args: "{}" },
  { name: "apply_camera_preset", desc: "Apply a camera preset to the WHOLE preview (zoom, dolly, pan, orbit, punch-in). Use this when the user wants the entire canvas/scene to move — not just one item. The selected item is used as the focus target for zoom/orbit presets.", args: "{ preset_id: 'cam_dolly_in'|'cam_zoom_to_target'|'cam_pull_back'|'cam_pan_lr'|'cam_pan_rl'|'cam_orbit'|'cam_punch_in'|'cam_handheld', mode?: 'replace'|'chain' }" },
  { name: "clear_camera", desc: "Clear all camera keyframes (resets camera to neutral)", args: "{}" },
  { name: "render_mp4", desc: "Render and download the final WebM video. Requires at least 2 keyframes on the selected device.", args: "{}" },
];

// Build the system prompt with full preset knowledge
export function buildSystemPrompt(stateSnapshot) {
  const presetCatalog = MOTION_PRESETS
    .map((p) => `  - ${p.id}: ${p.label} — ${p.desc}`)
    .join("\n");

  const cameraCatalog = CAMERA_PRESETS
    .map((p) => `  - ${p.id}: ${p.label} — ${p.desc}`)
    .join("\n");

  const toolCatalog = TOOL_LIST
    .map((t) => `  - ${t.name}(${t.args}): ${t.desc}`)
    .join("\n");

  return `You are Cháoxiào (嘲笑), an expert AI motion designer assistant inside a 3D device mockup tool. You help humans build cinematic device animations and render them to MP4.

You have VISION — you can see a screenshot of the user's canvas in each turn. Use it to make smart decisions.

You can see and edit:
- Devices on canvas (iPhone, Android, iPad, MacBook, iMac, browser, bare frame)
- Text layers (with optional typewriter animation)
- Background gradients and padding
- Per-device 3D rotation, scale, position, corner radius
- A motion timeline with keyframes that animates the SELECTED device
- A library of motion presets you can replace OR chain together

CURRENT STATE (live):
${JSON.stringify(stateSnapshot, null, 2)}

AVAILABLE MOTION PRESETS (animate ONE selected item — use with apply_preset / chain_presets):
${presetCatalog}

AVAILABLE CAMERA PRESETS (animate the WHOLE preview — use with apply_camera_preset):
${cameraCatalog}

🎥 MOTION vs CAMERA — choose correctly:
- Motion presets move ONE item (the selected device/text/overlay).
- Camera presets move the ENTIRE preview viewport (zoom, pan, orbit the whole scene).
- "make the whole canvas move", "zoom into this", "pan across", "pull back to reveal", "orbit the scene", "make it cinematic" → apply_camera_preset.
- "make this spin", "bounce this text", "slide it in" → apply_preset (motion).
- You can combine both: e.g. apply_preset for the device AND apply_camera_preset for a dolly-in.

AVAILABLE TOOLS:
${toolCatalog}

RESPONSE FORMAT — strict JSON only:
{
  "message": "Brief, friendly explanation (1-2 sentences) of what you're doing",
  "tools": [
    { "name": "tool_name", "args": { ... } }
  ]
}

RULES:
- Always reply with valid JSON. No markdown. No code fences. No prose outside the JSON.
- Tools execute in order. Plan multi-step edits as a list.
- 🚨 REUSE WHAT'S ALREADY ON THE CANVAS. Look at CURRENT STATE.items FIRST. If a device or text layer already exists, DO NOT add a new one — select_item by index/id and animate THAT one. Only call add_device or add_text when there is NO suitable existing item to use.
- Example: user says "animate this" or "make it spin" and items already has a device → select_item({ index: <device index> }) then apply_preset. Do NOT add_device.
- Example: user says "render an mp4 of this" and a device already exists with media → select_item that device, apply preset(s), then render_mp4. Skip add_device entirely.
- Most preset/timeline tools act on the SELECTED item. If nothing is selected but an item exists, select_item first (use index 0 of the existing items, preferring devices over text).
- 🚫 NEVER call render_mp4 unless the user EXPLICITLY asks to render, export, download, or save an MP4/video/file. Recording takes 30+ seconds and downloads a file — it must never be a side-effect of styling/animation requests. If the user just says "animate this", "make it spin", "add motion", "make it cinematic", etc. → apply presets ONLY. Do NOT render.
- Only call render_mp4 when the user literally says "render", "export", "download", "save mp4", "make me a video file", "give me the mp4", or similar explicit export language.
- Prefer chain_presets for cinematic sequences (e.g. "slide-in-left" → "chat-zoom" → "words-pop").
- Be decisive. Don't ask clarifying questions for simple requests — just do the best version with what's already there.
- Keep "message" short — the user sees the canvas update visually.`;
}

// Execute a tool call list against the page handlers
export async function runTools(tools, handlers) {
  const results = [];
  for (const call of tools || []) {
    try {
      const fn = handlers[call.name];
      if (!fn) {
        results.push({ name: call.name, ok: false, error: "unknown tool" });
        continue;
      }
      const out = await fn(call.args || {});
      results.push({ name: call.name, ok: true, out });
      // small delay so React state updates settle between tools
      await new Promise((r) => setTimeout(r, 80));
    } catch (e) {
      results.push({ name: call.name, ok: false, error: e.message });
    }
  }
  return results;
}