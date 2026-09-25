import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import {
  ETA_COMPONENTS,
  KILN_FIDELITY_RULES,
  KILN_RESPONSE_SCHEMA,
  kilnClonePrompt,
  kilnEditPrompt,
} from '../../shared/kilnEtaModel.ts';

const clean = (raw) => String(raw || '').replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();

function validate(result, imageUrl, strict) {
  const html = clean(result?.html);
  if (!/^<!doctype html>/i.test(html)) return 'HTML document is incomplete.';
  if (!/<head[\s>]/i.test(html) || !/<\/head>/i.test(html) || !/<body[\s>]/i.test(html) || !/<\/body>\s*<\/html>\s*$/i.test(html)) {
    return 'HTML document is incomplete.';
  }
  if (!Array.isArray(result?.sections) || !result.sections.length) return 'Source section inventory is missing.';
  const ids = new Set();
  for (const section of result.sections) {
    if (!/^[a-z0-9-]+$/i.test(section.id) || ids.has(section.id)) return 'Invalid source section inventory.';
    if (!Number.isInteger(section.itemCount) || section.itemCount < 0 || section.itemCount > 500) return 'Invalid source section inventory.';
    ids.add(section.id);
    if (!new RegExp(`data-source-section=["']${section.id}["']`).test(html)) return `Missing section: ${section.label}`;
    if (strict) {
      for (let i = 1; i <= section.itemCount; i++) {
        if (!new RegExp(`data-source-item=["']${section.id}-${i}["']`).test(html)) return `Missing item ${i} in ${section.label}`;
      }
    }
  }
  if (!/data-eta-component=/i.test(html)) return 'No ETA components were marked in the HTML.';
  if (!Array.isArray(result?.etaComponents) || !result.etaComponents.length) return 'ETA component map is missing.';
  for (const entry of result.etaComponents) {
    if (!ETA_COMPONENTS.includes(entry.component)) return `Unknown ETA component: ${entry.component}`;
  }
  if (result.usesSourceArtwork && imageUrl && !html.includes(imageUrl) && !html.includes(imageUrl.replace(/&/g, '&amp;'))) {
    return 'The original artwork is missing.';
  }
  return '';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.slice(0, 2000) : '';
    const instruction = typeof body?.instruction === 'string' ? body.instruction.slice(0, 2000) : '';
    const currentHtml = typeof body?.currentHtml === 'string' ? body.currentHtml : '';
    const isEdit = !!currentHtml && !!instruction;
    if (!isEdit && !imageUrl) return Response.json({ error: 'An image or an edit instruction is required.' }, { status: 400 });
    if (isEdit && currentHtml.length > 400000) return Response.json({ error: 'That component is too large to edit.' }, { status: 413 });

    const width = Number(body?.imageWidth);
    const height = Number(body?.imageHeight);
    const hasDimensions = Number.isFinite(width) && width > 0 && width <= 20000 && Number.isFinite(height) && height > 0 && height <= 50000;

    const prompt = isEdit
      ? kilnEditPrompt({ currentHtml, instruction, hasImage: !!imageUrl })
      : kilnClonePrompt({ instruction });

    const dimensionNote = hasDimensions
      ? `The source image is exactly ${width}px wide by ${height}px high — use a canvas of precisely those dimensions and those coordinates for artwork crops.`
      : 'Infer the source canvas dimensions from the image.';

    const attach = imageUrl ? { file_urls: [imageUrl] } : {};
    let failure = '';
    for (const model of ['claude-sonnet-5', 'gpt_6_luna']) {
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${prompt}\n${KILN_FIDELITY_RULES}\n${dimensionNote}${failure ? `\nA previous attempt was rejected: ${failure}. Return a fresh COMPLETE document, not a continuation.` : ''}`,
          model,
          ...attach,
          response_json_schema: KILN_RESPONSE_SCHEMA,
        });
        failure = validate(result, imageUrl, !isEdit);
        if (failure) {
          console.warn('KILN rejected a result:', failure);
          continue;
        }
        return Response.json({
          html: clean(result.html),
          sections: result.sections,
          etaComponents: result.etaComponents,
          reply: String(result.reply || '').trim(),
          imageWidth: hasDimensions ? width : null,
          imageHeight: hasDimensions ? height : null,
        });
      } catch (error) {
        failure = error.message || 'Generation failed.';
        console.warn('KILN attempt failed:', failure);
      }
    }
    return Response.json({ error: 'A complete component sheet could not be produced. Please retry — no partial result was accepted.', reason: failure }, { status: 502 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}