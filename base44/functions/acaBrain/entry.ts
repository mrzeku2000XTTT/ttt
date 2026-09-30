import { context } from '../../shared/aca/authorization.ts';
import { brain } from '../../shared/aca/brain/run.ts';

export default async function (req) {
  try {
    const base = await context(req);
    return Response.json(await brain(base, await req.json()));
  } catch (e) {
    return Response.json(
      { error: e.code || 'INTERNAL_ERROR', message: e.code ? e.message : 'Brain operation failed' },
      { status: ['FORBIDDEN', 'UNAUTHORIZED'].includes(e.code) ? 403 : 400 },
    );
  }
}