import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  runGeminiTriage,
  geminiIsConfigured,
  geminiCandidateModels,
} from './src/utils/geminiTriage';
import facilitiesHandler from './api/facilities';
import testGeminiHandler from './api/test-gemini';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

/**
 * `api/*.ts` are written as Vercel-style handlers (a Node request in, a Node response out) so
 * the same file runs unchanged on Vercel and locally. Express's `req`/`res` already satisfy that
 * shape — `res.status()` and `res.json()` included — so they mount directly, which is why
 * /api/test-gemini used to be reachable in production but 404 locally.
 */
function mountApiHandler(
  route: string,
  handler: (req: any, res: any) => unknown
): void {
  app.all(route, (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  });
}

// Health check route — also reports whether Gemini is actually wired up, so the client can
// show the real engine instead of assuming one.
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'CRISISBEACON Hybrid Disaster Triage',
    gemini: {
      configured: geminiIsConfigured(),
      models: geminiCandidateModels(),
      triageEndpoint: '/api/triage',
      diagnosticEndpoint: '/api/test-gemini',
    },
  });
});

// Green-zone facility lookup (hospitals + NGO offices from OpenStreetMap)
app.get('/api/facilities', facilitiesHandler);

// Gemini connectivity diagnostic (GET /api/test-gemini in the browser)
mountApiHandler('/api/test-gemini', testGeminiHandler);

// Gemini AI Triage Endpoint
app.post('/api/triage', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ success: false, error: 'Report text is required' });
      return;
    }

    const outcome = await runGeminiTriage(text);

    if (!outcome.success) {
      res.status(200).json({
        success: false,
        error: outcome.error || 'Gemini service temporarily unavailable',
        fallback: true,
      });
      return;
    }

    res.json({
      success: true,
      engine: 'Gemini AI',
      model: outcome.usedModel,
      data: outcome.parsedData,
    });
  } catch (error: any) {
    console.warn('Gemini Triage Endpoint caught unexpected error:', error?.message || error);
    res.status(200).json({
      success: false,
      error: error?.message || 'Failed to analyze disaster report with Gemini',
      fallback: true,
    });
  }
});

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  // A build sitting in dist/ must never silently shadow the live source. This used to treat
  // "NODE_ENV unset AND dist/index.html exists" as production, so the dev server served a
  // stale bundle and every source edit looked like it had done nothing. Production hosts set
  // NODE_ENV=production explicitly; anything else gets Vite middleware over the real files.
  const isProduction = process.env.NODE_ENV === 'production';
  const distBuiltAt = fs.existsSync(path.join(distPath, 'index.html'))
    ? fs.statSync(path.join(distPath, 'index.html')).mtime.toISOString()
    : 'no dist/ build found';
  console.log(
    isProduction
      ? `[crisisbeacon] production mode: serving the prebuilt dist/ bundle (${distBuiltAt})`
      : `[crisisbeacon] dev mode: serving live source through Vite middleware (dist/ is ignored; newest build ${distBuiltAt})`
  );

  if (!isProduction) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite middleware could not be started, falling back to static files:', err);
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CRISISBEACON Emergency Operations Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();