// Behaviour tests for server.js: canonical HTTPS redirect and the branded 404 page.
// Run: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 39000 + Math.floor(Math.random() * 900);
const base = `http://127.0.0.1:${port}`;
let server;

const get = (urlPath, headers = {}, method = 'GET') =>
  fetch(base + urlPath, { method, headers, redirect: 'manual' });

before(async () => {
  server = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(`${base}/healthz`)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('server did not start');
});

after(() => server?.kill());

const HTTP_VISITOR = { 'cf-visitor': '{"scheme":"http"}' };
const HTTPS_VISITOR = { 'cf-visitor': '{"scheme":"https"}' };

test('a visitor on http:// is sent to the https apex with one 301', async () => {
  const res = await get('/sobre.html?x=1', HTTP_VISITOR);
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), 'https://cmtecnologia.pt/sobre.html?x=1');
});

test('a visitor already on https:// is served directly', async () => {
  const res = await get('/', HTTPS_VISITOR);
  assert.equal(res.status, 200);
});

test('requests without the Cloudflare header (Docker health check) are not redirected', async () => {
  assert.equal((await get('/healthz')).status, 200);
  assert.equal((await get('/')).status, 200);
});

test('an API POST over http:// is never redirected (would turn into a GET)', async () => {
  const res = await fetch(`${base}/api/lead`, {
    method: 'POST',
    headers: { ...HTTP_VISITOR, 'content-type': 'application/json' },
    body: '{}',
    redirect: 'manual',
  });
  assert.equal(res.status, 400);
});

test('an unknown page returns 404 with the branded page in Portuguese', async () => {
  const res = await get('/pagina-que-nao-existe');
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  assert.match(html, /<html lang="pt-PT">/);
  assert.match(html, /<meta name="robots" content="noindex/);
  assert.match(html, /href="\/"/);
  assert.doesNotMatch(html, /Cannot GET/);
});

test('the 404 page itself is never served as a 200 page', async () => {
  assert.equal((await get('/404.html')).status, 404);
  assert.equal((await get('/404')).status, 404);
});

test('existing clean-URL redirects still work', async () => {
  const res = await get('/sobre');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), '/sobre.html');
});
