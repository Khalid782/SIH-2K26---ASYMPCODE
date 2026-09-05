import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { runGeminiTriage } from './src/utils/geminiTriage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'CRISISBEACON Hybrid Disaster Triage' });
});

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
  const isProduction = process.env.NODE_ENV === 'production' || (!process.env.NODE_ENV && fs.existsSync(path.join(distPath, 'index.html')));

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