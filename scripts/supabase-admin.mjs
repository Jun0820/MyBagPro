import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const projectRoot = path.resolve(process.cwd());

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

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    localEnv.SUPABASE_SERVICE_ROLE_KEY ||
    '';

  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    localEnv.VITE_SUPABASE_ANON_KEY ||
    baseEnv.VITE_SUPABASE_ANON_KEY ||
    '';

  return { supabaseUrl, serviceRoleKey, anonKey };
}

function getAdminClient() {
  const { supabaseUrl, serviceRoleKey } = readConfig();

  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is missing.');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local before using admin commands.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function parseProfileSocialOverrides() {
  const socialFile = path.join(projectRoot, 'src/lib/profileSocials.ts');

  if (!fs.existsSync(socialFile)) {
    throw new Error(`Social overrides file not found: ${socialFile}`);
  }

  const source = fs.readFileSync(socialFile, 'utf8');
  const overrides = [];
  const linePattern = /^\s*'([^']+)':\s*\{\s*([^}]*)\},?\s*$/gm;

  let match;
  while ((match = linePattern.exec(source)) !== null) {
    const [, slug, body] = match;
    const instagramMatch = body.match(/instagramHandle:\s*'([^']+)'/);
    const xMatch = body.match(/xHandle:\s*'([^']+)'/);

    overrides.push({
      slug,
      instagram_handle: instagramMatch?.[1] || null,
      x_handle: xMatch?.[1] || null,
    });
  }

  return overrides.filter((entry) => entry.instagram_handle || entry.x_handle);
}

async function checkConnection() {
  const { supabaseUrl, serviceRoleKey, anonKey } = readConfig();

  console.log(JSON.stringify({
    supabaseUrlConfigured: Boolean(supabaseUrl),
    anonKeyConfigured: Boolean(anonKey),
    serviceRoleKeyConfigured: Boolean(serviceRoleKey),
  }, null, 2));

  if (!serviceRoleKey) {
    console.log('Service role key is not configured, so write commands are disabled.');
    return;
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('setting_profiles')
    .select('slug, display_name, is_published')
    .limit(5);

  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}

async function publishProfile(slug) {
  if (!slug) throw new Error('Usage: npm run supabase:publish-profile -- <slug>');

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('setting_profiles')
    .update({
      is_published: true,
      verified_at: new Date().toISOString(),
    })
    .eq('slug', slug)
    .select('slug, display_name, is_published, verified_at')
    .single();

  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}

async function insertSource(slug, sourceType, sourceUrl, sourceTitle, notes = '') {
  if (!slug || !sourceType || !sourceUrl || !sourceTitle) {
    throw new Error('Usage: npm run supabase:insert-source -- <slug> <sourceType> <sourceUrl> <sourceTitle> [notes]');
  }

  const supabase = getAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from('setting_profiles')
    .select('id, slug, display_name')
    .eq('slug', slug)
    .single();

  if (profileError) throw profileError;

  const payload = {
    profile_id: profile.id,
    source_type: sourceType,
    source_url: sourceUrl,
    source_title: sourceTitle,
    checked_at: new Date().toISOString(),
    notes,
  };

  const { data, error } = await supabase
    .from('content_sources')
    .insert(payload)
    .select('id, source_type, source_title, source_url, checked_at')
    .single();

  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}

async function upsertArticle(profileSlug, articleSlug, title, excerpt, body, seasonYear) {
  if (!profileSlug || !articleSlug || !title || !excerpt || !body || !seasonYear) {
    throw new Error('Usage: npm run supabase:upsert-article -- <profileSlug> <articleSlug> <title> <excerpt> <body> <seasonYear>');
  }

  const supabase = getAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from('setting_profiles')
    .select('id')
    .eq('slug', profileSlug)
    .single();

  if (profileError) throw profileError;

  const payload = {
    slug: articleSlug,
    title,
    excerpt,
    body,
    article_type: 'update',
    related_profile_id: profile.id,
    season_year: Number(seasonYear),
    published: true,
    published_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('content_articles')
    .upsert(payload, { onConflict: 'slug' })
    .select('slug, title, published, published_at')
    .single();

  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}

async function upsertArticlesFromFile(filepath) {
  if (!filepath) {
    throw new Error('Usage: npm run supabase:upsert-articles -- <jsonFilePath>');
  }

  const absolutePath = path.isAbsolute(filepath)
    ? filepath
    : path.join(projectRoot, filepath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const payload = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  const articles = Array.isArray(payload) ? payload : payload.articles;

  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error('JSON payload must include a non-empty articles array.');
  }

  const supabase = getAdminClient();
  const profileCache = new Map();
  const results = [];

  for (const article of articles) {
    if (!article.slug || !article.title || !article.excerpt || !article.body || !article.article_type) {
      throw new Error(`Each article needs slug, title, excerpt, body, and article_type. Invalid slug: ${article.slug || 'unknown'}`);
    }

    let relatedProfileId = null;

    if (article.related_profile_slug) {
      if (!profileCache.has(article.related_profile_slug)) {
        const { data: profile, error: profileError } = await supabase
          .from('setting_profiles')
          .select('id')
          .eq('slug', article.related_profile_slug)
          .single();

        if (profileError) throw profileError;
        profileCache.set(article.related_profile_slug, profile.id);
      }

      relatedProfileId = profileCache.get(article.related_profile_slug);
    }

    const articlePayload = {
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      article_type: article.article_type,
      related_profile_id: relatedProfileId,
      related_product_id: article.related_product_id || null,
      season_year: article.season_year ? Number(article.season_year) : null,
      published: article.published ?? true,
      published_at: article.published_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('content_articles')
      .upsert(articlePayload, { onConflict: 'slug' })
      .select('slug, title, published, published_at')
      .single();

    if (error) throw error;
    results.push(data);
  }

  console.log(JSON.stringify({
    imported: results.length,
    articles: results,
  }, null, 2));
}

async function upsertSettingProfileFromFile(filepath) {
  if (!filepath) {
    throw new Error('Usage: npm run supabase:upsert-setting-profile -- <jsonFilePath>');
  }

  const absolutePath = path.isAbsolute(filepath)
    ? filepath
    : path.join(projectRoot, filepath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const payload = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  const { profile, bagItems = [], sources = [], article } = payload;

  if (!profile?.slug) {
    throw new Error('JSON payload must include profile.slug');
  }

  const supabase = getAdminClient();

  const profileUpsertPayload = { ...profile };
  delete profileUpsertPayload.id;

  const { data: upsertedProfile, error: profileError } = await supabase
    .from('setting_profiles')
    .upsert(profileUpsertPayload, { onConflict: 'slug' })
    .select('id, slug, display_name, is_published')
    .single();

  if (profileError) throw profileError;

  await supabase
    .from('setting_bag_items')
    .delete()
    .eq('profile_id', upsertedProfile.id);

  if (bagItems.length > 0) {
    const bagPayload = bagItems.map((item) => ({
      ...item,
      profile_id: upsertedProfile.id,
    }));

    const { error: bagError } = await supabase
      .from('setting_bag_items')
      .insert(bagPayload);

    if (bagError) throw bagError;
  }

  if (sources.length > 0) {
    const { data: existingSources, error: existingSourcesError } = await supabase
      .from('content_sources')
      .select('source_type, source_url, source_title')
      .eq('profile_id', upsertedProfile.id);

    if (existingSourcesError) throw existingSourcesError;

    const existingKeys = new Set(
      (existingSources || []).map((source) =>
        `${source.source_type}__${source.source_url || ''}__${source.source_title || ''}`
      )
    );

    const newSources = sources
      .map((source) => ({
        ...source,
        profile_id: upsertedProfile.id,
      }))
      .filter((source) => {
        const key = `${source.source_type}__${source.source_url || ''}__${source.source_title || ''}`;
        return !existingKeys.has(key);
      });

    if (newSources.length > 0) {
      const { error: sourcesError } = await supabase
        .from('content_sources')
        .insert(newSources);

      if (sourcesError) throw sourcesError;
    }
  }

  let articleResult = null;
  if (article?.slug) {
    const articlePayload = {
      ...article,
      related_profile_id: upsertedProfile.id,
    };

    const { data, error } = await supabase
      .from('content_articles')
      .upsert(articlePayload, { onConflict: 'slug' })
      .select('slug, title, published, published_at')
      .single();

    if (error) throw error;
    articleResult = data;
  }

  console.log(JSON.stringify({
    profile: upsertedProfile,
    bagItemsInserted: bagItems.length,
    sourcesProcessed: sources.length,
    article: articleResult,
  }, null, 2));
}

async function syncSocialOverrides({ dryRun = false } = {}) {
  const supabase = getAdminClient();
  const overrides = parseProfileSocialOverrides();

  const { data: profiles, error } = await supabase
    .from('setting_profiles')
    .select('id, slug, display_name, instagram_handle, x_handle')
    .in('slug', overrides.map((entry) => entry.slug));

  if (error) throw error;

  const profileMap = new Map((profiles || []).map((profile) => [profile.slug, profile]));
  const updates = [];
  const missing = [];

  for (const entry of overrides) {
    const profile = profileMap.get(entry.slug);

    if (!profile) {
      missing.push(entry.slug);
      continue;
    }

    const nextInstagram = entry.instagram_handle ?? profile.instagram_handle;
    const nextX = entry.x_handle ?? profile.x_handle;

    if (profile.instagram_handle === nextInstagram && profile.x_handle === nextX) {
      continue;
    }

    updates.push({
      id: profile.id,
      slug: profile.slug,
      display_name: profile.display_name,
      instagram_handle: nextInstagram,
      x_handle: nextX,
    });
  }

  if (!dryRun && updates.length > 0) {
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('setting_profiles')
        .update({
          instagram_handle: update.instagram_handle,
          x_handle: update.x_handle,
        })
        .eq('id', update.id);

      if (updateError) throw updateError;
    }
  }

  console.log(JSON.stringify({
    dryRun,
    parsedOverrides: overrides.length,
    matchedProfiles: profiles?.length || 0,
    updatedProfiles: updates.length,
    missingProfiles: missing,
    sampleUpdates: updates.slice(0, 20).map(({ slug, display_name, instagram_handle, x_handle }) => ({
      slug,
      display_name,
      instagram_handle,
      x_handle,
    })),
  }, null, 2));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'check':
      await checkConnection();
      break;
    case 'publish-profile':
      await publishProfile(args[0]);
      break;
    case 'insert-source':
      await insertSource(args[0], args[1], args[2], args[3], args[4]);
      break;
    case 'upsert-article':
      await upsertArticle(args[0], args[1], args[2], args[3], args[4], args[5]);
      break;
    case 'upsert-articles':
      await upsertArticlesFromFile(args[0]);
      break;
    case 'upsert-setting-profile':
      await upsertSettingProfileFromFile(args[0]);
      break;
    case 'sync-social-overrides':
      await syncSocialOverrides({ dryRun: args.includes('--dry-run') });
      break;
    default:
      throw new Error(
        'Unknown command. Use one of: check, publish-profile, insert-source, upsert-article, upsert-articles, upsert-setting-profile, sync-social-overrides'
      );
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
