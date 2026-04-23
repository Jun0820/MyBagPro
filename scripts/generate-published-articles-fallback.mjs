import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const projectRoot = path.resolve(process.cwd());
const outputPath = path.join(projectRoot, 'public', 'published-articles-fallback.json');
const docsFallbackFiles = [
  path.join(projectRoot, 'docs', 'article-seeds-launch-20.json'),
  path.join(projectRoot, 'docs', 'tournament-spotlight-articles-2026-04-10.json'),
  path.join(projectRoot, 'docs', 'tournament-spotlight-articles-2026-04-18.json'),
  path.join(projectRoot, 'docs', 'mybag-registration-before-diagnosis-2026-04-23.json'),
];

function loadEnvFile(filename) {
  const filepath = path.join(projectRoot, filename);
  if (!fs.existsSync(filepath)) return {};

  const raw = fs.readFileSync(filepath, 'utf8');
  const entries = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

function readConfig() {
  const localEnv = loadEnvFile('.env.local');
  const baseEnv = loadEnvFile('.env');

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    localEnv.VITE_SUPABASE_URL ||
    baseEnv.VITE_SUPABASE_URL ||
    '';

  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    localEnv.VITE_SUPABASE_ANON_KEY ||
    baseEnv.VITE_SUPABASE_ANON_KEY ||
    '';

  return { supabaseUrl, anonKey };
}

function uniqueBySlug(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.slug || seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function loadDocsFallback() {
  const articles = [];

  for (const filepath of docsFallbackFiles) {
    if (!fs.existsSync(filepath)) continue;
    const payload = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const rows = Array.isArray(payload) ? payload : payload.articles || [];
    for (const article of rows) {
      if (article?.published !== true || !article?.slug) continue;
      articles.push(article);
    }
  }

  return uniqueBySlug(articles);
}

async function loadFromSupabase() {
  const { supabaseUrl, anonKey } = readConfig();
  if (!supabaseUrl || !anonKey) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.');
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('content_articles')
    .select('slug, title, excerpt, body, article_type, published, published_at, season_year, related_profile_id')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(500);

  if (error) throw error;
  return data || [];
}

async function main() {
  let articles = [];
  let source = 'supabase';

  try {
    articles = await loadFromSupabase();
  } catch (error) {
    console.warn(`Supabase article fetch failed, falling back to docs snapshot: ${error.message || error}`);
    source = 'docs';
  }

  if (!articles.length) {
    const docsFallback = loadDocsFallback();
    if (docsFallback.length) {
      articles = docsFallback;
      source = 'docs';
    }
  }

  if (!articles.length) {
    throw new Error('No published articles available from Supabase or docs fallback.');
  }

  const normalized = uniqueBySlug(articles).map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || '',
    body: article.body,
    article_type: article.article_type,
    published_at: article.published_at || null,
    season_year: article.season_year ?? null,
    related_profile_id: article.related_profile_id || null,
  }));

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source,
        count: normalized.length,
        articles: normalized,
      },
      null,
      2
    ) + '\n'
  );

  console.log(`Generated ${normalized.length} published article fallbacks from ${source} -> ${path.relative(projectRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
