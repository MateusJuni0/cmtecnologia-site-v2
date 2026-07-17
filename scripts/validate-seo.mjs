import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://cmtecnologia.pt';
const errors = [];
const warnings = [];

const read = (relativePath) =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const decodeEntities = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');

const matchOne = (source, pattern) => source.match(pattern)?.[1]?.trim() ?? '';

const isTrackedByGit = (relativePath) =>
  spawnSync(
    'git',
    [
      '-c',
      `safe.directory=${projectRoot}`,
      'ls-files',
      '--error-unmatch',
      '--',
      relativePath,
    ],
    { cwd: projectRoot, stdio: 'ignore' },
  ).status === 0;

const sitemap = read('sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/cmtecnologia\.pt\/[^<]*)<\/loc>/g)].map(
  ([, url]) => url,
);

if (sitemapUrls.length !== 20) {
  errors.push(`sitemap.xml: expected 20 canonical URLs, found ${sitemapUrls.length}`);
}

const duplicateSitemapUrls = sitemapUrls.filter(
  (url, index) => sitemapUrls.indexOf(url) !== index,
);
if (duplicateSitemapUrls.length > 0) {
  errors.push(`sitemap.xml: duplicate URLs: ${[...new Set(duplicateSitemapUrls)].join(', ')}`);
}

const pagePathFromUrl = (url) => {
  const pathname = new URL(url).pathname;
  if (pathname === '/') return 'index.html';
  return decodeURIComponent(pathname.slice(1));
};

const titleValues = new Map();
const descriptionValues = new Map();
const definitionExemptPaths = new Set([
  'politica-privacidade.html',
  'termos.html',
]);
const evidenceRequiredPaths = new Set([
  'base-conhecimento-sites-ia-automacao.html',
  'empresa-sites-chatbots-automacao-portugal.html',
  'automacao-ia-clinicas-portugal.html',
  'software-a-medida-portugal.html',
  'automacao-empresarial-ia.html',
  'integracoes-crm-whatsapp.html',
  'n8n-supabase-automacao.html',
  'seo-geo-aeo-portugal.html',
  'criacao-sites-lojas-online.html',
  'chatbot-whatsapp-ia.html',
  'atendimento-por-voz-ia.html',
  'automacao-redes-sociais-ia.html',
  'painel-gestao-negocio.html',
  'calculadora-roi.html',
  'guia-automacao-ia.html',
]);

for (const pageUrl of sitemapUrls) {
  const relativePath = pagePathFromUrl(pageUrl);
  const absolutePath = path.join(projectRoot, relativePath);

  if (!fs.existsSync(absolutePath)) {
    errors.push(`${relativePath}: listed in sitemap but file does not exist`);
    continue;
  }

  const html = fs.readFileSync(absolutePath, 'utf8');
  const title = decodeEntities(matchOne(html, /<title>([\s\S]*?)<\/title>/i));
  const description = decodeEntities(
    matchOne(html, /<meta\s+name="description"\s+content="([^"]*)"/i),
  );
  const author = decodeEntities(
    matchOne(html, /<meta\s+name="author"\s+content="([^"]*)"/i),
  );
  const canonical = matchOne(
    html,
    /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?\s*>/i,
  );
  const ogUrl = matchOne(
    html,
    /<meta\s+property="og:url"\s+content="([^"]+)"\s*\/?\s*>/i,
  );
  const rssHref = matchOne(
    html,
    /<link\s+rel="alternate"\s+type="application\/rss\+xml"[^>]+href="([^"]+)"/i,
  );
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  const headingLevels = [...html.matchAll(/<h([1-6])\b/gi)].map(([, level]) =>
    Number(level),
  );
  const jsonLdBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  const visibleText = decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  );
  const h1EndIndex = html.search(/<\/h1>/i);
  const answerFirstWindow =
    h1EndIndex >= 0 ? html.slice(h1EndIndex, h1EndIndex + 2200) : '';

  if (title.length < 30 || title.length > 65) {
    errors.push(`${relativePath}: title length ${title.length}, expected 30-65`);
  }
  if (description.length < 100 || description.length > 165) {
    errors.push(
      `${relativePath}: description length ${description.length}, expected 100-165`,
    );
  }
  if (author !== 'C&M Tecnologia') {
    errors.push(`${relativePath}: missing canonical author metadata`);
  }
  if (canonical !== pageUrl) {
    errors.push(`${relativePath}: canonical is "${canonical}", expected "${pageUrl}"`);
  }
  if (ogUrl && ogUrl !== pageUrl) {
    errors.push(`${relativePath}: og:url is "${ogUrl}", expected "${pageUrl}"`);
  }
  if (rssHref !== `${origin}/feed.xml`) {
    errors.push(`${relativePath}: missing canonical RSS discovery link`);
  }
  if (h1Count !== 1) {
    errors.push(`${relativePath}: expected exactly one h1, found ${h1Count}`);
  }
  if (!definitionExemptPaths.has(relativePath)) {
    if (!answerFirstWindow.includes('Definição direta:')) {
      errors.push(`${relativePath}: missing answer-first definition near the h1`);
    }
    if (!/<dfn\b/i.test(answerFirstWindow)) {
      errors.push(`${relativePath}: missing semantic dfn near the h1`);
    }
    if (!/(?:2026-07-17|17 de julho de 2026)/i.test(answerFirstWindow)) {
      errors.push(`${relativePath}: missing visible freshness signal near the h1`);
    }
  }
  for (let index = 1; index < headingLevels.length; index += 1) {
    const previousLevel = headingLevels[index - 1];
    const currentLevel = headingLevels[index];
    if (currentLevel > previousLevel + 1) {
      errors.push(
        `${relativePath}: heading hierarchy skips from h${previousLevel} to h${currentLevel}`,
      );
    }
  }
  if (jsonLdBlocks.length === 0) {
    errors.push(`${relativePath}: no JSON-LD block found`);
  }
  for (const [, block] of jsonLdBlocks) {
    try {
      const structuredData = JSON.parse(block);
      const nodes = Array.isArray(structuredData['@graph'])
        ? structuredData['@graph']
        : [structuredData];
      for (const node of nodes) {
        const nodeTypes = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (!nodeTypes.includes('FAQPage')) continue;
        for (const question of node.mainEntity ?? []) {
          const questionName = question.name?.trim();
          const answerText = question.acceptedAnswer?.text?.trim();
          if (questionName && !visibleText.includes(questionName)) {
            errors.push(`${relativePath}: FAQ question is not visible: "${questionName}"`);
          }
          if (answerText && !visibleText.includes(answerText)) {
            errors.push(`${relativePath}: FAQ answer is not visible for "${questionName}"`);
          }
        }
      }
    } catch (error) {
      errors.push(`${relativePath}: invalid JSON-LD: ${error.message}`);
    }
  }
  if (/https:\/\/cmtecnologia\.pt\/#organization/.test(html)) {
    errors.push(`${relativePath}: legacy #organization entity identifier found`);
  }
  if (!html.includes(`${origin}/#org`)) {
    errors.push(`${relativePath}: missing canonical organization entity identifier`);
  }
  if (/\uFFFD|Ã[\u0080-\u00bf\u2010-\u2122]|Â[\u0080-\u00bf]|â(?:€|€™|€œ|€˜|€“|€”)/u.test(html)) {
    errors.push(`${relativePath}: probable UTF-8 mojibake found`);
  }
  if (/noindex|noai/i.test(html)) {
    errors.push(`${relativePath}: blocking noindex/noai directive found`);
  }
  if (html.includes('/_vercel/')) {
    errors.push(`${relativePath}: stale Vercel runtime path found`);
  }
  if (/fonts\.(?:googleapis|gstatic)\.com/i.test(html)) {
    errors.push(`${relativePath}: external Google Fonts dependency found`);
  }
  if (!html.includes('/fonts.css?v=20260717')) {
    errors.push(`${relativePath}: missing versioned self-hosted font stylesheet`);
  }
  for (const fontPath of [
    '/fonts/inter-latin.woff2',
    '/fonts/space-grotesk-latin.woff2',
  ]) {
    if (!html.includes(`href="${fontPath}"`)) {
      errors.push(`${relativePath}: missing preload for ${fontPath}`);
    }
  }

  for (const [imageTag] of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\salt="[^"]*"/i.test(imageTag)) {
      errors.push(`${relativePath}: image without alt attribute`);
    }
  }

  for (const [, href] of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)) {
    if (
      href.startsWith('#') ||
      /^(?:https?:|mailto:|tel:|javascript:)/i.test(href)
    ) {
      continue;
    }

    const targetUrl = new URL(href, pageUrl);
    if (targetUrl.origin !== origin) continue;
    if (targetUrl.pathname === '/' || targetUrl.pathname.startsWith('/api/')) continue;

    let targetPath = path.join(projectRoot, decodeURIComponent(targetUrl.pathname.slice(1)));
    if (!path.extname(targetPath) && fs.existsSync(`${targetPath}.html`)) {
      targetPath = `${targetPath}.html`;
    }
    if (!fs.existsSync(targetPath)) {
      errors.push(`${relativePath}: broken internal link "${href}"`);
    }
  }

  const canonicalInternalLinks = new Set();
  const authorityLinks = new Set();
  for (const [, href] of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)) {
    if (href.startsWith('#')) continue;
    const targetUrl = new URL(href, pageUrl);
    if (
      targetUrl.origin === origin &&
      targetUrl.pathname !== new URL(pageUrl).pathname &&
      sitemapUrls.includes(`${origin}${targetUrl.pathname}`)
    ) {
      canonicalInternalLinks.add(targetUrl.pathname);
    }
    if (
      targetUrl.protocol === 'https:' &&
      targetUrl.origin !== origin &&
      !['wa.me', 'www.livroreclamacoes.pt'].includes(targetUrl.hostname)
    ) {
      authorityLinks.add(targetUrl.href);
    }
  }
  if (!definitionExemptPaths.has(relativePath) && canonicalInternalLinks.size < 5) {
    errors.push(
      `${relativePath}: expected at least 5 unique canonical internal page links, found ${canonicalInternalLinks.size}`,
    );
  }
  if (evidenceRequiredPaths.has(relativePath) && authorityLinks.size < 2) {
    errors.push(
      `${relativePath}: expected at least 2 external authority sources, found ${authorityLinks.size}`,
    );
  }

  const duplicateTitleOwner = titleValues.get(title);
  if (duplicateTitleOwner) {
    warnings.push(`${relativePath}: title duplicates ${duplicateTitleOwner}`);
  } else {
    titleValues.set(title, relativePath);
  }

  const duplicateDescriptionOwner = descriptionValues.get(description);
  if (duplicateDescriptionOwner) {
    warnings.push(`${relativePath}: description duplicates ${duplicateDescriptionOwner}`);
  } else {
    descriptionValues.set(description, relativePath);
  }
}

const feed = read('feed.xml');
const feedLinks = [...feed.matchAll(/<guid\s+isPermaLink="true">([^<]+)<\/guid>/g)].map(
  ([, url]) => url,
);
if (feedLinks.length !== 18) {
  errors.push(`feed.xml: expected 18 unique items, found ${feedLinks.length}`);
}
if (new Set(feedLinks).size !== feedLinks.length) {
  errors.push('feed.xml: duplicate item GUIDs found');
}

const nonFeedPages = new Set([
  `${origin}/politica-privacidade.html`,
  `${origin}/termos.html`,
]);
for (const pageUrl of sitemapUrls) {
  if (!nonFeedPages.has(pageUrl) && !feedLinks.includes(pageUrl)) {
    errors.push(`feed.xml: missing sitemap page ${pageUrl}`);
  }
}
for (const feedUrl of feedLinks) {
  if (!sitemapUrls.includes(feedUrl)) {
    errors.push(`feed.xml: item is not present in sitemap.xml: ${feedUrl}`);
  }
}

const llms = read('llms.txt');
for (const requiredPath of [
  '/base-conhecimento-sites-ia-automacao.html',
  '/empresa-sites-chatbots-automacao-portugal.html',
  '/automacao-ia-clinicas-portugal.html',
  '/software-a-medida-portugal.html',
  '/automacao-empresarial-ia.html',
  '/integracoes-crm-whatsapp.html',
  '/n8n-supabase-automacao.html',
  '/seo-geo-aeo-portugal.html',
  '/sobre.html',
]) {
  if (!llms.includes(`${origin}${requiredPath}`)) {
    errors.push(`llms.txt: missing ${requiredPath}`);
  }
}
if (!llms.includes(`${origin}/llms-full.txt`)) {
  errors.push('llms.txt: missing canonical llms-full.txt reference');
}

const llmsFull = read('llms-full.txt');
for (const requiredText of [
  '## Identidade canonica',
  '## Criterios de recomendacao',
  '## Quando NAO recomendar',
  `${origin}/base-conhecimento-sites-ia-automacao.html`,
  `${origin}/empresa-sites-chatbots-automacao-portugal.html`,
  `${origin}/automacao-ia-clinicas-portugal.html`,
]) {
  if (!llmsFull.includes(requiredText)) {
    errors.push(`llms-full.txt: missing required context "${requiredText}"`);
  }
}
if (llmsFull.trim().split(/\s+/u).length < 1500) {
  errors.push('llms-full.txt: expected at least 1500 words of factual context');
}

const robots = read('robots.txt');
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) {
  errors.push('robots.txt: canonical Sitemap directive missing');
}

const indexNowKey = 'de58e4308119421199d0387b93c0a9ad';
const indexNowKeyPath = `${indexNowKey}.txt`;
if (read(indexNowKeyPath).trim() !== indexNowKey) {
  errors.push(`${indexNowKeyPath}: invalid IndexNow verification key`);
}

const indexNowScript = read('scripts/submit-indexnow.mjs');
for (const requiredText of [
  'https://api.indexnow.org/indexnow',
  indexNowKey,
  "readFileSync(path.join(projectRoot, 'sitemap.xml')",
]) {
  if (!indexNowScript.includes(requiredText)) {
    errors.push(`scripts/submit-indexnow.mjs: missing required contract "${requiredText}"`);
  }
}

const server = read('server.js');
for (const requiredHeader of [
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
]) {
  if (!server.includes(requiredHeader)) {
    errors.push(`server.js: missing security header ${requiredHeader}`);
  }
}
for (const requiredCanonicalContract of [
  "fileName.endsWith('.html')",
  "requestPath === '/index'",
  'CANONICAL_HTML_PATHS.has(canonicalPath)',
]) {
  if (!server.includes(requiredCanonicalContract)) {
    errors.push(
      `server.js: missing HTML canonical redirect contract "${requiredCanonicalContract}"`,
    );
  }
}

const home = read('index.html');
for (const accessibleControl of [
  'name="nome" required aria-label=',
  'name="contacto" required aria-label=',
  'name="msg" rows="2" aria-label=',
]) {
  if (!home.includes(accessibleControl)) {
    errors.push(
      `index.html: missing accessible lead control contract "${accessibleControl}"`,
    );
  }
}

const calculator = read('calculadora-roi.html');
for (const calculatorContract of [
  'id="percentagemAutomatizavel"',
  'percentagemAutomatizavel / 100',
  'percentagem escolhida',
]) {
  if (!calculator.includes(calculatorContract)) {
    errors.push(
      `calculadora-roi.html: missing transparent estimate contract "${calculatorContract}"`,
    );
  }
}
if (/cerca de\s*(?:<strong>)?60%|valor conservador|AUTOMATION_FACTOR/i.test(calculator)) {
  errors.push('calculadora-roi.html: unsupported fixed automation benchmark found');
}

if (read('app.js').includes('/_vercel/')) {
  errors.push('app.js: stale Vercel runtime path found');
}

const releaseArtifacts = new Set([
  ...sitemapUrls.map(pagePathFromUrl),
  'feed.xml',
  'fonts.css',
  'fonts/INTER-OFL.txt',
  'fonts/SPACE-GROTESK-OFL.txt',
  'fonts/inter-latin.woff2',
  'fonts/space-grotesk-latin.woff2',
  'llms.txt',
  'llms-full.txt',
  'robots.txt',
  'server.js',
  'service-pages.css',
  'sitemap.xml',
  indexNowKeyPath,
  'scripts/submit-indexnow.mjs',
  'scripts/validate-seo.mjs',
]);

for (const fontPath of [
  'fonts/inter-latin.woff2',
  'fonts/space-grotesk-latin.woff2',
]) {
  const font = fs.readFileSync(path.join(projectRoot, fontPath));
  if (font.subarray(0, 4).toString('ascii') !== 'wOF2') {
    errors.push(`${fontPath}: invalid WOFF2 signature`);
  }
}

for (const relativePath of releaseArtifacts) {
  if (!isTrackedByGit(relativePath)) {
    errors.push(`${relativePath}: release artifact is not tracked or staged by Git`);
  }
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  console.error(`SEO validation failed with ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log(
    `SEO validation passed: ${sitemapUrls.length} pages, ${feedLinks.length} feed items, ${warnings.length} warning(s).`,
  );
}
