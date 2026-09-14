import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import triageHandler from './api/triage';
import newsHandler from './api/news';
import facilitiesHandler from './api/facilities';
dotenv.config();
const app = express();
app.use(express.json({ limit: '32kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/triage', triageHandler);
app.get('/api/news', newsHandler);
app.get('/api/facilities', facilitiesHandler);
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve('dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('CRISISBEACON ready'));
}
startServer();
