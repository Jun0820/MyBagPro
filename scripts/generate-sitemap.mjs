import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const publicDir = path.join(root, 'public');
const siteUrl = 'https://mybagpro.jp';

const staticPaths = [
  '/',
  '/settings/pros',
  '/articles',
  '/clubs/drivers',
  '/settings/users',
  '/sitemap',
];

const seedFiles = fs
  .readdirSync(docsDir)
  .filter((file) => file.endsWith('-seed.json'))
  .map((file) => path.join(docsDir, file));

const profilePaths = [];
const articlePaths = [];

for (const file of seedFiles) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const profileSlug = raw?.profile?.slug;
    const articleSlug = raw?.article?.slug;

    if (profileSlug) profilePaths.push(`/settings/pros/${profileSlug}`);
    if (articleSlug) articlePaths.push(`/articles/${articleSlug}`);
  } catch (error) {
    console.error(`Failed to parse ${file}:`, error);
  }
}

const urls = [...new Set([...staticPaths, ...profilePaths, ...articlePaths])];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (pathname) => `  <url>
    <loc>${siteUrl}${pathname}</loc>
  </url>`
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
console.log(`Generated sitemap with ${urls.length} URLs.`);
