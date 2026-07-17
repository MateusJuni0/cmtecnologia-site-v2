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

if (sitemapUrls.length !== 19) {
  errors.push(`sitemap.xml: expected 19 canonical URLs, found ${sitemapUrls.length}`);
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
  if (/\uFFFD|Ã[\u0080-\u00bf\u2010-\u2122]|Â[\u0080-\u00bf]|â(?:€|€™|€œ|€˜|€“|€”)/u.test(html)) {
    errors.push(`${relativePath}: probable UTF-8 mojibake found`);
  }
  if (/noindex|noai/i.test(html)) {
    errors.push(`${relativePath}: blocking noindex/noai directive found`);
  }
  if (html.includes('/_vercel/')) {
    errors.push(`${relativePath}: stale Vercel runtime path found`);
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
if (feedLinks.length !== 17) {
  errors.push(`feed.xml: expected 17 unique items, found ${feedLinks.length}`);
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

if (read('app.js').includes('/_vercel/')) {
  errors.push('app.js: stale Vercel runtime path found');
}

const releaseArtifacts = new Set([
  ...sitemapUrls.map(pagePathFromUrl),
  'feed.xml',
  'llms.txt',
  'llms-full.txt',
  'robots.txt',
  'server.js',
  'service-pages.css',
  'sitemap.xml',
  'scripts/validate-seo.mjs',
]);
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
