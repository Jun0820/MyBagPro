import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const docsDir = path.join(projectRoot, 'docs');
const outputPath = path.join(docsDir, 'gdo-2026-setting-audit.json');
const GDO_SETTING_RE = /https?:\/\/news\.golfdigest\.co\.jp\/players\/setting\/(\d+)(?:\/(\d{4})\/(\d+)\/?)?/g;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const decodeHtml = (value = '') =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

const stripTags = (html = '') =>
  decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\r/g, '')
  )
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();

const readSeedFiles = () =>
  fs
    .readdirSync(docsDir)
    .filter((file) => file.endsWith('-seed.json'))
    .map((file) => path.join(docsDir, file));

const extractGdoSources = (seed) => {
  const sources = [];
  const serialized = JSON.stringify(seed);
  for (const match of serialized.matchAll(GDO_SETTING_RE)) {
    sources.push({
      id: match[1],
      year: match[2] ? Number(match[2]) : null,
      url: match[0].replace(/\/?$/, '/'),
    });
  }
  return sources;
};

const extractCurrentGdoYear = (seed, sources) => {
  const titles = (seed.sources || []).map((source) => source.source_title || '').join('\n');
  const urlYears = sources.map((source) => source.year).filter(Boolean);
  const titleYears = [...titles.matchAll(/20\d{2}/g)].map((match) => Number(match[0]));
  const profileYear = Number(seed.profile?.season_year || 0) || null;
  return Math.max(0, ...urlYears, ...titleYears, profileYear || 0) || null;
};

const parseGdoSettingPage = (html, url) => {
  const title = stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
  if (!title || /見つかりません|Not Found|404/i.test(title)) return null;
  if (!/クラブセッティング/.test(title)) return null;

  const h1 = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const situation = stripTags(html.match(/<p class="situation"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
  const pageTitle = h1 || title.replace(/｜.*$/, '').trim();
  const playerName = pageTitle.replace(/\s*クラブセッティング.*$/, '').trim();
  const year = Number(pageTitle.match(/(20\d{2})年/)?.[1] || url.match(/\/(20\d{2})\//)?.[1] || 0) || null;
  const tournament = pageTitle.match(/20\d{2}年\s*(.+)$/)?.[1]?.trim() || '';

  const currentBlock =
    html.match(/<div[^>]+class="[^"]*setting-current[^"]*"[^>]*>([\s\S]*?)<p class="note"/i)?.[1] ||
    html.match(/<div[^>]+class="[^"]*setting-list[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
    '';

  const entries = [];
  let currentGenre = '';
  const tokenRe = /<h2[^>]+class="[^"]*genre[^"]*"[^>]*>([\s\S]*?)<\/h2>|<p[^>]+class="[^"]*club[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
  for (const match of currentBlock.matchAll(tokenRe)) {
    if (match[1]) {
      currentGenre = stripTags(match[1]);
      continue;
    }
    const text = stripTags(match[2] || '');
    if (!text) continue;
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    entries.push({
      genre: currentGenre,
      product: lines[0],
      shaft: lines.slice(1).join(' / ') || '',
    });
  }

  return {
    url,
    title: pageTitle,
    playerName,
    year,
    tournament,
    situation,
    itemCount: entries.length,
    entries,
  };
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml',
    },
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text, finalUrl: response.url };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const seedFiles = readSeedFiles();
  const profiles = [];

  for (const filePath of seedFiles) {
    const seed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const sources = extractGdoSources(seed);
    if (sources.length === 0) continue;
    const uniqueIds = [...new Set(sources.map((source) => source.id))];
    for (const id of uniqueIds) {
      profiles.push({
        file: path.relative(projectRoot, filePath),
        slug: seed.profile?.slug,
        name: seed.profile?.display_name,
        gdoId: id,
        currentGdoYear: extractCurrentGdoYear(seed, sources.filter((source) => source.id === id)),
        currentGdoUrls: sources.filter((source) => source.id === id).map((source) => source.url),
      });
    }
  }

  const seen = new Set();
  const checks = [];
  for (const profile of profiles) {
    const key = `${profile.slug}:${profile.gdoId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const candidateUrl = `https://news.golfdigest.co.jp/players/setting/${profile.gdoId}/2026/1/`;
    try {
      const { ok, status, text, finalUrl } = await fetchText(candidateUrl);
      const parsed = ok ? parseGdoSettingPage(text, finalUrl || candidateUrl) : null;
      const hasCandidateUrl = profile.currentGdoUrls.some((url) => url.replace(/\?.*$/, '') === candidateUrl);
      const needsUpdate = Boolean(parsed?.year && parsed.year >= 2026 && (!hasCandidateUrl || (profile.currentGdoYear || 0) < parsed.year));

      checks.push({
        ...profile,
        candidateUrl,
        status,
        found: Boolean(parsed),
        needsUpdate,
        gdo: parsed,
      });
    } catch (error) {
      checks.push({
        ...profile,
        candidateUrl,
        status: 'error',
        found: false,
        needsUpdate: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await sleep(150);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    checkedCount: checks.length,
    needsUpdateCount: checks.filter((check) => check.needsUpdate).length,
    found2026Count: checks.filter((check) => check.found && check.gdo?.year >= 2026).length,
    checks,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Checked ${report.checkedCount} GDO profiles.`);
  console.log(`Found 2026 pages: ${report.found2026Count}`);
  console.log(`Needs update: ${report.needsUpdateCount}`);
  console.log(`Wrote ${path.relative(projectRoot, outputPath)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
