import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import {
  ETA_COMPONENTS,
  KILN_BUILD_RULES,
  KILN_FIDELITY_RULES,
  KILN_RESPONSE_SCHEMA,
  kilnBuildPrompt,
  kilnClonePrompt,
  kilnEditPrompt,
} from '../../shared/kilnEtaModel.ts';

const clean = (raw) => String(raw || '').replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();

function validate(result, imageUrl, mode, wanted) {
  const html = clean(result?.html);
  if (!/^<!doctype html>/i.test(html)) return 'HTML document is incomplete.';
  if (!/<head[\s>]/i.test(html) || !/<\/head>/i.test(html) || !/<body[\s>]/i.test(html) || !/<\/body>\s*<\/html>\s*$/i.test(html)) {
    return 'HTML document is incomplete.';
  }
  // A clone must account for every section of the source; a rebuild or an edit may restructure.
  if (mode === 'clone') {
    if (!Array.isArray(result?.sections) || !result.sections.length) return 'Source section inventory is missing.';
    const ids = new Set();
    for (const section of result.sections) {
      if (!/^[a-z0-9-]+$/i.test(section.id) || ids.has(section.id)) return 'Invalid source section inventory.';
      if (!Number.isInteger(section.itemCount) || section.itemCount < 0 || section.itemCount > 500) return 'Invalid source section inventory.';
      ids.add(section.id);
      if (!new RegExp(`data-source-section=["']${section.id}["']`).test(html)) return `Missing section: ${section.label}`;
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
  if (wanted && !new RegExp(`data-eta-component=["']${wanted}["']`).test(html)) {
    return `The rebuilt block is not marked as an ETA ${wanted}.`;
  }
  // Signed links rotate every hour, so compare the file path and ignore the query
  // signature — an edit that keeps the previous link is still the same artwork.
  if (result.usesSourceArtwork && imageUrl) {
    const artworkPath = imageUrl.split('?')[0];
    if (!html.includes(artworkPath) && !html.includes(imageUrl)) return 'The original artwork is missing.';
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
    const component = ETA_COMPONENTS.includes(body?.component) ? body.component : '';
    const isEdit = !!currentHtml && !!instruction;
    const wantsBuild = body?.mode === 'build' && !!imageUrl;
    const mode = isEdit ? 'edit' : wantsBuild ? 'build' : 'clone';
    if (!isEdit && !imageUrl) return Response.json({ error: 'An image or an edit instruction is required.' }, { status: 400 });
    if (isEdit && currentHtml.length > 400000) return Response.json({ error: 'That component is too large to edit.' }, { status: 413 });

    const width = Number(body?.imageWidth);
    const height = Number(body?.imageHeight);
    const hasDimensions = Number.isFinite(width) && width > 0 && width <= 20000 && Number.isFinite(height) && height > 0 && height <= 50000;

    const prompt = mode === 'edit'
      ? kilnEditPrompt({ currentHtml, instruction, hasImage: !!imageUrl })
      : mode === 'build'
        ? kilnBuildPrompt({ component, instruction })
        : kilnClonePrompt({ instruction });

    const dimensionNote = hasDimensions
      ? `The source image is exactly ${width}px wide by ${height}px high — use a canvas of precisely those dimensions and those coordinates for artwork crops.`
      : 'Infer the source canvas dimensions from the image.';

    const attach = imageUrl ? { file_urls: [imageUrl] } : {};
    let failure = '';
    for (const model of ['claude-sonnet-5', 'gpt_5_6_luna']) {
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${prompt}\n${mode === 'build' ? KILN_BUILD_RULES : KILN_FIDELITY_RULES}\n${dimensionNote}${failure ? `\nA previous attempt was rejected: ${failure}. Return a fresh COMPLETE document, not a continuation.` : ''}`,
          model,
          ...attach,
          response_json_schema: KILN_RESPONSE_SCHEMA,
        });
        failure = validate(result, imageUrl, mode, component);
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
        // Keep the most useful reason: a rejected result explains more than a
        // provider error that followed it.
        failure = failure || error.message || 'Generation failed.';
        console.warn('KILN attempt failed:', failure);
      }
    }
    return Response.json({ error: 'A complete component sheet could not be produced. Please retry — no partial result was accepted.', reason: failure }, { status: 502 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}