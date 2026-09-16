import { base44 } from "@/api/base44Client";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export async function analyzeReferenceImage(file) {
  const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
  const res = await base44.integrations.Core.InvokeLLM({
    prompt:
      "You are a scene-layout analyzer for a camera-angle planner. Look at the reference image and list every main visible subject — people/characters, buildings, and key objects (1-6 subjects, prioritize characters). For each subject return a tight axis-aligned bounding box as decimals normalized 0-1, where x,y is the top-left corner and w,h the size. kind must be 'character' for people/creatures, 'building' for structures, 'object' for anything else.",
    file_urls: [file_url],
    response_json_schema: {
      type: "object",
      properties: {
        subjects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              kind: { type: "string" },
              x: { type: "number" },
              y: { type: "number" },
              w: { type: "number" },
              h: { type: "number" }
            },
            required: ["label", "kind", "x", "y", "w", "h"]
          }
        }
      },
      required: ["subjects"]
    }
  });

  const subjects = (res.subjects || [])
    .filter((s) => s && s.w > 0.02 && s.h > 0.02)
    .slice(0, 6)
    .map((s) => {
      const w = clamp(s.w * 100, 3, 98);
      const h = clamp(s.h * 100, 3, 98);
      return {
        label: (s.label || "Subject").slice(0, 24),
        kind: ["character", "building", "object"].includes(s.kind) ? s.kind : "object",
        x: clamp(s.x * 100, 0, 100 - w),
        y: clamp(s.y * 100, 0, 100 - h),
        w,
        h
      };
    });

  return { file_url, subjects };
}