import { runGeminiTriage } from '../src/utils/geminiTriage';

// Vercel serverless function: maps to POST /api/triage on the deployed site.
// This is what the AI Triage Console calls in production — the Express
// server (server.ts) only runs in the dev/preview sandbox.
export const config = {
  runtime: 'nodejs20.x',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = body?.text;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return Response.json({ success: false, error: 'Report text is required' }, { status: 400 });
  }

  const outcome = await runGeminiTriage(text);

  if (!outcome.success) {
    return Response.json({
      success: false,
      error: outcome.error || 'Gemini service temporarily unavailable',
      fallback: true,
    });
  }

  return Response.json({
    success: true,
    engine: 'Gemini AI',
    model: outcome.usedModel,
    data: outcome.parsedData,
  });
}