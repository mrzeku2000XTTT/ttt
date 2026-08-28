import { base44 } from "@/api/base44Client";

/**
 * Generates new learning modules for a course — used by both the infinite
 * modules button and the recap popup. Avoids repeating already-covered concepts.
 *
 * @param {object} opts
 * @param {string} opts.topic
 * @param {string} opts.skillLevel
 * @param {string} opts.theme
 * @param {string[]} opts.additionalThemes
 * @param {number} opts.count
 * @param {string[]} opts.existingConcepts
 * @param {string[]} opts.sourceUrls
 * @returns {Promise<object[]>} array of new module objects
 */
export async function generateMoreModules({
  topic,
  skillLevel,
  theme,
  additionalThemes = [],
  count = 5,
  existingConcepts = [],
  sourceUrls = [],
}) {
  const allThemes = [theme, ...additionalThemes].filter(Boolean);
  const themeStr = allThemes.join(" blended with ");

  const avoidContext =
    existingConcepts.length > 0
      ? `\n\nIMPORTANT: These concepts have already been covered. Do NOT repeat them — generate NEW, different concepts that build on what was learned:\n${existingConcepts
          .map((c, i) => `${i + 1}. ${c}`)
          .join("\n")}`
      : "";

  const sourceContext =
    sourceUrls.length > 0
      ? `\n\nThe user provided these source URLs to learn from. Search the web and use them as primary references:\n${sourceUrls
          .map((u, i) => `${i + 1}. ${u}`)
          .join("\n")}`
      : "";

  const outlineRes = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a curriculum designer. Create exactly ${count} NEW learning modules.

Topic: ${topic}
Skill level: ${skillLevel}
Theme(s): ${themeStr}

Generate ${count} modules that teach this topic at ${skillLevel} level. Each module should wrap the real concept in a metaphor/scenario from the theme "${themeStr}".${avoidContext}${sourceContext}

IMPORTANT: Search the web to fact-check all content. Use the latest up-to-date information. The real_facts must be accurate and current.

Return JSON with this exact structure:
{
  "modules": [
    {
      "title": "Module title",
      "concept": "The real concept being taught",
      "theme_hook": "One-line themed hook",
      "content": "Full 3-4 paragraph explanation using theme analogies. Keep real facts accurate. Use original characters inspired by the theme mood, not copyrighted names.",
      "real_facts": "A clear 'Here\\'s what\\'s actually true' summary separating fact from metaphor",
      "knowledge_check": [
        {"question": "Question about the real concept", "options": ["opt1","opt2","opt3"], "answer": 0}
      ]
    }
  ]
}

Each knowledge_check has exactly 3 questions. Generate exactly ${count} modules.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              concept: { type: "string" },
              theme_hook: { type: "string" },
              content: { type: "string" },
              real_facts: { type: "string" },
              knowledge_check: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    answer: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const outline = typeof outlineRes === "string" ? JSON.parse(outlineRes) : outlineRes;
  const modules = outline.modules || [];

  // Generate images in parallel
  const imagePromises = modules.map((m) =>
    base44.integrations.Core.GenerateImage({
      prompt: `Educational illustration for a learning module about "${m.concept}". Theme mood: ${themeStr}. Style: clean, modern, warm, original art (no copyrighted characters). Soft colors, minimal, approachable. No text in image.`,
    }).catch(() => null)
  );
  const imageResults = await Promise.all(imagePromises);

  return modules.map((m, i) => ({
    ...m,
    order: i,
    image_url: imageResults[i]?.url || "",
    completed: false,
    chat: [],
  }));
}