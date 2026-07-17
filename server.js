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

// Baseline browser protections. The public site is always HTTPS through the
// dedicated Cloudflare tunnel; the origin remains bound to localhost on VPS.
app.use((_req, res, next) => {
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), geolocation=(), payment=(), microphone=(self)',
  });
  next();
});

// Canonicalise public page requests at the application layer as a fallback
// when Cloudflare forwards the www host to this origin. Keep non-idempotent
// API requests untouched so a redirect can never change a POST into a GET.
app.use((req, res, next) => {
  const isPublicRead = req.method === 'GET' || req.method === 'HEAD';
  if (isPublicRead && req.hostname.toLowerCase() === 'www.cmtecnologia.pt') {
    return res.redirect(301, `https://cmtecnologia.pt${req.originalUrl}`);
  }

  next();
});

// Inês posts base64-encoded WAV audio, so allow a generous JSON body.
app.use(express.json({ limit: '25mb' }));

// Health check for Docker / the Cloudflare tunnel.
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

// Former Vercel serverless functions (Vercel mapped /api/<name> -> api/<name>.js).
app.post('/api/ines', ines);
app.post('/api/madalena', madalena);
app.post('/api/lead', lead);

// --- SEO: 301 redirects for legacy URLs from the previous Next.js site -------
// These paths existed on the old (Vercel/Next.js) cmtecnologia.pt and were
// indexed by Google. After the v2 single-page cutover they 404, which Search
// Console flags as "Não encontrado (404)" and which wastes crawl budget. A 301
// to the closest live section clears the error and preserves link signals.
// (2026-06-15 — see docs/DEPLOY.md / Search Console indexing fix.)
const LEGACY_REDIRECTS = {
  '/healthcare': '/',
  '/setup-1h': '/#contacto',
  '/case-studies': '/#trabalhos',
  '/case-studies/cronohomeservice': '/#trabalhos',
  '/case-studies/dental': '/#trabalhos',
  '/case-studies/pediatria': '/#trabalhos',
};

app.use((req, res, next) => {
  // Normalise a single trailing slash (except root) for the lookup.
  const p =
    req.path.length > 1 && req.path.endsWith('/')
      ? req.path.slice(0, -1)
      : req.path;

  // Browsers and crawlers always request /favicon.ico; map it to the real icon
  // (the page declares scenes/favicon-192.png, so /favicon.ico itself 404s).
  if (p === '/favicon.ico') return res.redirect(301, '/scenes/favicon-192.png');

  if (LEGACY_REDIRECTS[p]) return res.redirect(301, LEGACY_REDIRECTS[p]);
  // Any other legacy case-study sub-path also maps to the works section.
  if (p.startsWith('/case-studies/')) return res.redirect(301, '/#trabalhos');

  next();
});

// llms.txt is also exposed at the emerging well-known location. Google does
// not require this file for AI features; it is a crawler-friendly discovery
// aid for clients that choose to support the convention.
app.get('/.well-known/llms.txt', (_req, res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'llms.txt'));
});

app.get('/.well-known/llms-full.txt', (_req, res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'llms-full.txt'));
});

// The application and public website share one project directory. Deny source,
// operational documentation and local backup paths before express.static so a
// non-Docker launch cannot expose files that .dockerignore normally removes.
app.use((req, res, next) => {
  const publicPath = req.path.toLowerCase();
  const isPrivatePath =
    publicPath === '/server.js' ||
    publicPath === '/package.json' ||
    publicPath === '/package-lock.json' ||
    publicPath === '/dockerfile' ||
    publicPath.endsWith('.md') ||
    publicPath.includes('.bak') ||
    publicPath.startsWith('/api/') ||
    publicPath.startsWith('/docs/') ||
    publicPath.startsWith('/scripts/');

  if (isPrivatePath) return res.sendStatus(404);
  next();
});

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
