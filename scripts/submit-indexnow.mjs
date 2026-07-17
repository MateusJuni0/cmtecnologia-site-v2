import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://cmtecnologia.pt';
const host = new URL(origin).hostname;
const key = 'de58e4308119421199d0387b93c0a9ad';
const keyFile = `${key}.txt`;
const endpoint = 'https://api.indexnow.org/indexnow';
const isDryRun = process.argv.includes('--dry-run');

const publicKey = fs.readFileSync(path.join(projectRoot, keyFile), 'utf8').trim();
if (publicKey !== key) {
  throw new Error(`${keyFile} must contain the exact IndexNow key`);
}

const sitemap = fs.readFileSync(path.join(projectRoot, 'sitemap.xml'), 'utf8');
const discoveredUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, url]) => url.trim(),
);
const urlList = [...new Set(discoveredUrls)];

if (urlList.length === 0 || urlList.length > 10_000) {
  throw new Error(`Expected 1-10000 sitemap URLs, found ${urlList.length}`);
}
if (urlList.length !== discoveredUrls.length) {
  throw new Error('sitemap.xml contains duplicate URLs');
}

for (const url of urlList) {
  const parsed = new URL(url);
  if (parsed.origin !== origin || parsed.hash || parsed.search) {
    throw new Error(`IndexNow URL must be canonical and same-origin: ${url}`);
  }
}

const payload = {
  host,
  key,
  keyLocation: `${origin}/${keyFile}`,
  urlList,
};

if (isDryRun) {
  console.log(`IndexNow dry run passed: ${urlList.length} canonical URLs.`);
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(30_000),
});

if (![200, 202].includes(response.status)) {
  const responseBody = (await response.text()).slice(0, 500);
  throw new Error(`IndexNow rejected the submission (${response.status}): ${responseBody}`);
}

console.log(
  `IndexNow accepted ${urlList.length} canonical URLs with HTTP ${response.status}.`,
);
