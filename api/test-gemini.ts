// ---------------------------------------------------------------------------
// DIAGNOSTIC: GET or POST /api/test-gemini
// This endpoint intentionally performs a single, lightweight Gemini check.
// It is designed to fail fast and remain under the Vercel timeout budget.
// ---------------------------------------------------------------------------

const MODEL_NAME = 'gemini-3.8-flash';
const TIMEOUT_MS = 9_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const startedAt = Date.now();
  const keyConfigured = Boolean(process.env.GEMINI_API_KEY);

  if (!keyConfigured) {
    return json({
      ok: false,
      stage: 'env',
      keyConfigured: false,
      httpStatus: 200,
      latencyMs: Date.now() - startedAt,
      model: MODEL_NAME,
      error: 'GEMINI_API_KEY is missing from the server environment.',
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY ?? '')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say exactly: TEST_OK' }] }],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );

    const payload = await response.json().catch(() => null);
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const ok = response.ok && text.includes('TEST_OK');
    const latencyMs = Date.now() - startedAt;

    return json({
      ok,
      stage: 'gemini-check',
      keyConfigured: true,
      httpStatus: response.status,
      latencyMs,
      model: MODEL_NAME,
      ...(ok ? {} : { error: 'Gemini diagnostic did not return the expected response.' }),
    });
  } catch (error: any) {
    return json({
      ok: false,
      stage: 'gemini-check',
      keyConfigured: true,
      httpStatus: 504,
      latencyMs: Date.now() - startedAt,
      model: MODEL_NAME,
      error: error?.name === 'TimeoutError' ? `Gemini request timed out after ${TIMEOUT_MS}ms.` : (error?.message || 'Unknown Gemini diagnostic error'),
    }, 504);
  }
}