// Behaviour tests for server.js: canonical HTTPS redirect and the branded 404 page.
// Run: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmtec-site-test-'));
const leadsFile = path.join(dataDir, 'leads.jsonl');
const port = 39000 + Math.floor(Math.random() * 900);
const base = `http://127.0.0.1:${port}`;
let server;

const get = (urlPath, headers = {}, method = 'GET') =>
  fetch(base + urlPath, { method, headers, redirect: 'manual' });

before(async () => {
  server = spawn(process.execPath, ['server.js'], {
    cwd: root,
    // No alert credentials: a test lead must never reach Telegram or email.
    env: {
      ...process.env,
      PORT: String(port),
      SITE_DATA_DIR: dataDir,
      TG_BOT_TOKEN: '',
      TG_LEAD_CHAT_ID: '',
      RESEND_API_KEY: '',
    },
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

after(() => {
  server?.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

const postLead = (body, ip) =>
  fetch(`${base}/api/lead`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
    body: JSON.stringify(body),
  });
const recordedLeads = () =>
  fs.existsSync(leadsFile) ? fs.readFileSync(leadsFile, 'utf8') : '';

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

test('pages carry a Content-Security-Policy that only allows our scripts and the pinned CDN', async () => {
  const csp = (await get('/')).headers.get('content-security-policy') || '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' 'unsafe-inline' https:\/\/cdn\.jsdelivr\.net(;|$)/);
  assert.match(csp, /object-src 'none'/);
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

test('a real lead is recorded', async () => {
  const res = await postLead({ name: 'Pessoa Real', contact: 'real@exemplo.pt', need: 'site' }, '203.0.113.1');
  assert.equal(res.status, 200);
  assert.match(recordedLeads(), /real@exemplo\.pt/);
});

test('a lead with the hidden anti-bot field filled is accepted silently and never recorded', async () => {
  const res = await postLead({ name: 'Bot', contact: 'bot@spam.example', hp: 'https://spam.example' }, '203.0.113.2');
  assert.equal(res.status, 200);
  assert.doesNotMatch(recordedLeads(), /bot@spam\.example/);
});

test('one visitor sending too many leads gets 429; another visitor is unaffected', async () => {
  const statuses = [];
  for (let i = 0; i < 9; i += 1) {
    statuses.push((await postLead({ name: 'Flood', contact: `flood${i}@spam.example` }, '203.0.113.3')).status);
  }
  assert.deepEqual(statuses.slice(0, 8), Array(8).fill(200));
  assert.equal(statuses[8], 429);
  assert.equal((await postLead({ name: 'Outra', contact: 'outra@exemplo.pt' }, '203.0.113.4')).status, 200);
});

test('the chat endpoints are rate limited too (blocked before reaching Gemini)', async () => {
  let last;
  for (let i = 0; i < 41; i += 1) {
    last = await fetch(`${base}/api/madalena`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.5' },
      body: '{}',
    });
  }
  assert.equal(last.status, 429);
});

test('existing clean-URL redirects still work', async () => {
  const res = await get('/sobre');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), '/sobre.html');
});
