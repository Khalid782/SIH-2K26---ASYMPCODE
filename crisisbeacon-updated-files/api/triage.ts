import type { Request, Response } from 'express';
import { runGeminiTriage } from '../src/utils/geminiTriage.js';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Use POST' });
  }
  const text = req.body?.text;
  if (typeof text !== 'string' || !text.trim() || text.length > 8000) {
    return res.status(400).json({ success: false, error: 'Report must contain 1-8000 characters.' });
  }
  const result = await runGeminiTriage(text);
  return res.json(result.success
    ? { success: true, engine: 'Gemini AI', model: result.usedModel, data: result.parsedData }
    : { success: false, fallback: true, error: result.error });
}
