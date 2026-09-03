import 'dotenv/config';
import fs from 'fs';

if ((process.env.MARMOT_TEST_MODE === 'true' || process.env.CI === 'true') && fs.existsSync('/tmp/supabase-disposable.env')) {
  try {
    const envLines = fs.readFileSync('/tmp/supabase-disposable.env', 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^export\s+([A-Z0-9_]+)="?(.*?)"?$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {}
}

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './api/index';

const PORT = 3000;

async function startServer() {
  // Vite middleware for local development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MARMOT Backend] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
