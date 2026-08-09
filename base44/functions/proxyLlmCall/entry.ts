import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * proxyLlmCall — server-side proxy for LLM providers that block browser CORS.
 * DeepSeek, OpenAI (direct), Anthropic (direct) all block cross-origin browser
 * requests. This function receives the provider config + messages + key and
 * calls the provider server-side (no CORS), returning the response.
 *
 * The API key is sent from the browser (localStorage) — it never touches the
 * database. This function is a pure pass-through proxy.
 *
 * IMPORTANT: Always returns HTTP 200 with { content, error } in the body.
 * This way base44.functions.invoke does NOT throw — errors are surfaced as
 * { error: "..." } and handled by callLocalLlm's error check.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' });

    const { baseUrl, model, messages, apiKey, temperature, maxTokens } = await req.json();

    if (!baseUrl || !model || !apiKey) {
      return Response.json({ error: 'Missing baseUrl, model, or apiKey' });
    }

    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    if (baseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://ttt.base44.app';
      headers['X-Title'] = 'TTT Builder';
    }

    const body = {
      model,
      messages,
      temperature: temperature ?? 0.3,
      max_tokens: maxTokens ?? 8192,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err?.name === 'AbortError') {
        return Response.json({ error: `Provider timed out after 120s` });
      }
      return Response.json({ error: `Could not reach ${baseUrl}: ${err.message}` });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return Response.json({ error: `Provider error ${res.status}: ${txt.slice(0, 500)}` });
    }

    const data = await res.json();
    const out = data?.choices?.[0]?.message?.content;
    const text = Array.isArray(out) ? out.map((p) => p.text || '').join('') : out;
    if (text == null) return Response.json({ error: 'Provider returned no content' });

    return Response.json({ content: text });
  } catch (error) {
    return Response.json({ error: error.message });
  }
}