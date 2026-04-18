import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const repoRoot = process.cwd();
const socialsPath = path.join(repoRoot, 'src/lib/profileSocials.ts');
const outputDir = path.join(repoRoot, 'public/profile-images');
const outputMapPath = path.join(repoRoot, 'src/lib/instagramProfileImages.ts');

const loadEnvFile = async (filename) => {
  try {
    const raw = await fs.readFile(path.join(repoRoot, filename), 'utf8');
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
  } catch {
    return {};
  }
};

const loadEntriesFromSupabase = async () => {
  const localEnv = await loadEnvFile('.env.local');
  const baseEnv = await loadEnvFile('.env');
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

  if (!supabaseUrl || !anonKey) return [];

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('setting_profiles')
    .select('slug, instagram_handle')
    .not('instagram_handle', 'is', null);

  if (error || !data) return [];

  return data
    .map((row) => ({
      slug: row.slug,
      handle: String(row.instagram_handle || '').trim().replace(/^@/, ''),
    }))
    .filter((row) => row.slug && row.handle && !['-', '－', '—', '未公開'].includes(row.handle));
};

const loadEntriesFromLocalOverrides = async () => {
  const source = await fs.readFile(socialsPath, 'utf8');
  const matches = [...source.matchAll(/'([^']+)':\s*\{\s*instagramHandle:\s*'([^']+)'/g)];

  return matches.map((match) => ({ slug: match[1], handle: match[2] }));
};

const limit = Number.parseInt(process.env.LIMIT || '', 10);
const sourceEntries = await loadEntriesFromSupabase();
const fallbackEntries = sourceEntries.length > 0 ? sourceEntries : await loadEntriesFromLocalOverrides();
const entries = fallbackEntries.slice(0, Number.isFinite(limit) ? limit : undefined);

await fs.mkdir(outputDir, { recursive: true });

const decodeHtmlEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');

const isLikelyGenericInstagramAsset = (value) => {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return (
    normalized.includes('/rsrc.php/') ||
    normalized.includes('/static/images/') ||
    normalized.includes('instagram_logo') ||
    normalized.includes('instagram/assets') ||
    normalized.includes('apple-touch-icon') ||
    normalized.includes('favicon')
  );
};

const extractProfilePicUrlHd = (html) => {
  const directPatterns = [
    /"profile_pic_url_hd":"([^"]+)"/i,
    /"hd_profile_pic_url_info":\{"url":"([^"]+)"/i,
    /"profile_pic_url":"([^"]+)"/i,
  ];

  for (const pattern of directPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
};

const extractOgImage = (html) => {
  const marker = 'property="og:image"';
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const tagSlice = html.slice(markerIndex, markerIndex + 5000);
  const contentMatch = tagSlice.match(/content="([^"]+)"/i);
  return contentMatch?.[1] || null;
};

const extensionFromType = (contentType) => {
  if (!contentType) return 'jpg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  return 'jpg';
};

const results = {};
const failures = [];
const browserHeaders = {
  'user-agent': 'Mozilla/5.0',
};

for (const { slug, handle } of entries) {
  try {
    const profileResponse = await fetch(`https://www.instagram.com/${handle}/`, {
      headers: browserHeaders,
    });

    if (!profileResponse.ok) {
      failures.push({ slug, handle, reason: `profile ${profileResponse.status}` });
      continue;
    }

    const profileHtml = await profileResponse.text();
    const imageUrlFromHtml = extractProfilePicUrlHd(profileHtml) || extractOgImage(profileHtml);
    if (!imageUrlFromHtml) {
      failures.push({ slug, handle, reason: 'og:image missing' });
      continue;
    }

    const imageUrl = decodeHtmlEntities(imageUrlFromHtml);
    if (isLikelyGenericInstagramAsset(imageUrl)) {
      failures.push({ slug, handle, reason: 'generic instagram asset' });
      continue;
    }
    const imageResponse = await fetch(imageUrl, {
      headers: {
        ...browserHeaders,
        referer: `https://www.instagram.com/${handle}/`,
      },
    });

    if (!imageResponse.ok) {
      failures.push({ slug, handle, reason: `image ${imageResponse.status}` });
      continue;
    }

    const contentType = imageResponse.headers.get('content-type') || '';
    const ext = extensionFromType(contentType);
    const fileName = `${slug}.${ext}`;
    const filePath = path.join(outputDir, fileName);
    const arrayBuffer = await imageResponse.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    results[slug] = {
      src: `/profile-images/${fileName}`,
      handle,
    };
  } catch (error) {
    failures.push({ slug, handle, reason: error instanceof Error ? error.message : String(error) });
  }
}

const mapContents = `export const instagramProfileImages: Record<string, string | { src: string; handle?: string }> = ${JSON.stringify(results, null, 2)};\n`;
await fs.writeFile(outputMapPath, mapContents, 'utf8');

console.log(
  JSON.stringify(
    {
      total: entries.length,
      saved: Object.keys(results).length,
      failed: failures.length,
      source: sourceEntries.length > 0 ? 'supabase' : 'profileSocials',
      failures: failures.slice(0, 20),
    },
    null,
    2
  )
);
