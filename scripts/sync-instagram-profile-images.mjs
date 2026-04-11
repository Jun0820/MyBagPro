import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const socialsPath = path.join(repoRoot, 'src/lib/profileSocials.ts');
const outputDir = path.join(repoRoot, 'public/profile-images');
const outputMapPath = path.join(repoRoot, 'src/lib/instagramProfileImages.ts');

const source = await fs.readFile(socialsPath, 'utf8');
const matches = [...source.matchAll(/'([^']+)':\s*\{\s*instagramHandle:\s*'([^']+)'/g)];
const limit = Number.parseInt(process.env.LIMIT || '', 10);
const entries = matches
  .map((match) => ({ slug: match[1], handle: match[2] }))
  .slice(0, Number.isFinite(limit) ? limit : undefined);

await fs.mkdir(outputDir, { recursive: true });

const decodeHtmlEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');

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
    results[slug] = `/profile-images/${fileName}`;
  } catch (error) {
    failures.push({ slug, handle, reason: error instanceof Error ? error.message : String(error) });
  }
}

const mapContents = `export const instagramProfileImages: Record<string, string> = ${JSON.stringify(results, null, 2)};\n`;
await fs.writeFile(outputMapPath, mapContents, 'utf8');

console.log(
  JSON.stringify(
    {
      total: entries.length,
      saved: Object.keys(results).length,
      failed: failures.length,
      failures: failures.slice(0, 20),
    },
    null,
    2
  )
);
