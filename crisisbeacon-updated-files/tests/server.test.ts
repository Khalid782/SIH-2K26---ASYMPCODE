import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
test('Express shares the deployed triage handler and returns graceful missing-key fallback', async () => {
  const server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], { env: { ...process.env, PORT: '3199', GEMINI_API_KEY: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
      server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(timer); resolve(); } });
      server.on('exit', () => { clearTimeout(timer); reject(new Error('Server exited')); });
    });
    const health = await fetch('http://127.0.0.1:3199/api/health');
    assert.equal(health.status, 200);
    const response = await fetch('http://127.0.0.1:3199/api/triage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Flooding at Uppal' }),
    });
    assert.equal(response.status, 200); assert.equal((await response.json()).fallback, true);
    const bad = await fetch('http://127.0.0.1:3199/api/triage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(bad.status, 400);
  } finally {
    server.kill('SIGTERM');
    await new Promise<void>((resolve) => server.once('exit', () => resolve()));
  }
});
