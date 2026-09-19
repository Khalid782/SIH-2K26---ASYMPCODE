import type { ServerResponse } from 'node:http';

type VercelRequest = { method?: string };
type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
};

const MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash'];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    status: 'ok',
    service: 'CRISISBEACON Hybrid Disaster Triage',
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      models: MODELS,
      triageEndpoint: '/api/triage',
      diagnosticEndpoint: '/api/test-gemini',
    },
  });
}
