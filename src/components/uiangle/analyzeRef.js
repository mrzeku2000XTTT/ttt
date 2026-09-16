import { base44 } from '@/api/base44Client';
import { clamp, newSubject, toWorld } from '@/components/uiangle/angleModel';

export async function analyzeReferenceImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG or WebP reference.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Please choose an image smaller than 15 MB.');
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 86400 });
  const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('The reference image could not be opened.')); img.src = signed_url; });
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: 'Analyze visible characters, buildings and important objects, up to 8. Return a tight bounding box x,y,w,h normalized 0..1 in the original image. For EACH subject, trace its visible OUTER silhouette clockwise as 24-60 polygon points with x,y in 0..1 LOCAL TO ITS BOUNDING BOX. Follow head, shoulders, arms, hands, legs and feet; do not return a bounding rectangle for characters. Never infer occluded limbs. Building outlines follow roof and walls. These are editable approximate outlines, not pixel-perfect segmentation. kind is character, building or object.',
    file_urls: [signed_url],
    response_json_schema: { type: 'object', properties: { subjects: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, kind: { type: 'string', enum: ['character','building','object'] }, x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' }, outline: { type: 'array', items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x','y'] } } }, required: ['label','kind','x','y','w','h','outline'] } } }, required: ['subjects'] }
  });
  const subjects = (result.subjects || []).filter(s => [s.x,s.y,s.w,s.h].every(Number.isFinite) && s.w > .01 && s.h > .01).slice(0,8).map(s => {
    const source = { x: clamp(s.x,0,.99), y: clamp(s.y,0,.99), w: clamp(s.w,.01,1-clamp(s.x,0,.99)), h: clamp(s.h,.01,1-clamp(s.y,0,.99)) };
    const points = (s.outline || []).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)).slice(0,80).map(p => [clamp(p.x,0,1)*100,clamp(p.y,0,1)*100]);
    const item = newSubject(s.kind), height = s.kind === 'building' ? 3 : s.kind === 'character' ? 1.8 : 1.2;
    const fit=Math.min(1600/image.width,900/image.height), fw=image.width*fit/16, fh=image.height*fit/9, ox=(100-fw)/2, oy=(100-fh)/2;
    return { ...item, label: s.label.slice(0,40), source, w: source.w*fw, h: source.h*fh, x: toWorld(ox+(source.x+source.w/2)*fw), z: toWorld(oy+(source.y+source.h)*fh), height, width: clamp(height*source.w*image.width/(source.h*image.height),.15,6), outline: points.length >= 3 ? points : item.outline, estimated: points.length >= 3 };
  });
  return { reference: { uri: file_uri, url: signed_url, width: image.width, height: image.height }, subjects };
}