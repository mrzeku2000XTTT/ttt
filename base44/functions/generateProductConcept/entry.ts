import { creditOperation, text, choice, publicImageUrls } from '../../shared/creditOperation.ts';

export default async function(req) {
  return creditOperation(req, async (base44, input) => {
    const brief = text(input.brief, 'Product description', 4000);
    const direction = choice(input.direction, ['clean hero shot', 'editorial angle', 'detail close-up', 'lifestyle composition'], 'direction');
    const refs = publicImageUrls(input.references || []);
    return await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: `Premium commercial product photography. ${brief}. Direction: ${direction}. Minimal white studio aesthetic, soft daylight, precise shadows, no text, no logos, no watermark.`,
      ...(refs.length ? { existing_image_urls: refs } : {})
    });
  });
}