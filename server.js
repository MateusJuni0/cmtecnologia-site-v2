// Self-hosted server for cmtecnologia.pt — replaces Vercel.
// Serves the static site + mounts the 3 former Vercel functions as routes.
// The Vercel handlers in api/*.js are (req, res) style, so Express runs them
// verbatim — no changes to the function code. See docs/DEPLOY.md.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ines from './api/ines.js';
import madalena from './api/madalena.js';
import lead from './api/lead.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.disable('x-powered-by');

// Inês posts base64-encoded WAV audio, so allow a generous JSON body.
app.use(express.json({ limit: '25mb' }));

// Health check for Docker / the Cloudflare tunnel.
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

// Former Vercel serverless functions (Vercel mapped /api/<name> -> api/<name>.js).
app.post('/api/ines', ines);
app.post('/api/madalena', madalena);
app.post('/api/lead', lead);

// Static multi-page site: index.html, app.js, styles.css, guia, robots.txt,
// sitemap.xml, scenes/ (videos), etc. Clean URLs via the html extension.
// dotfiles ignored so .git / .env-style paths are never served. Unknown paths
// fall through to Express's native 404 (parity with Vercel).
app.use(
  express.static(__dirname, {
    index: 'index.html',
    dotfiles: 'ignore',
    extensions: ['html'],
    setHeaders(res, filePath) {
      // Long-cache immutable media/fonts; HTML stays revalidated by default.
      if (/\.(mp4|webm|woff2?|png|jpe?g|webp|avif|svg|ico)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`cmtecnologia.pt site listening on :${PORT}`);
});
