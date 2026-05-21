import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const publicDir = path.join(root, 'public');
const siteUrl = 'https://www.mybagpro.jp';

const staticPaths = [
  '/',
  '/pros',
  '/articles',
  '/clubs/drivers',
  '/sitemap',
];

const seedFiles = fs
  .readdirSync(docsDir)
  .filter((file) => file.endsWith('-seed.json'))
  .map((file) => path.join(docsDir, file));

const profilePaths = new Set();
const articlePaths = new Set();

const addProfile = (slug) => {
  if (typeof slug === 'string' && slug.trim()) profilePaths.add(`/pros/${slug.trim()}`);
};

const addArticle = (slug) => {
  if (typeof slug === 'string' && slug.trim()) articlePaths.add(`/articles/${slug.trim()}`);
};

for (const file of seedFiles) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const profileSlug = raw?.profile?.is_published === false ? null : raw?.profile?.slug;
    const articleSlug = raw?.article?.published === false ? null : raw?.article?.slug;

    addProfile(profileSlug);
    addArticle(articleSlug);
  } catch (error) {
    console.error(`Failed to parse ${file}:`, error);
  }
}

const docsJsonFiles = fs
  .readdirSync(docsDir)
  .filter((file) => file.endsWith('.json') && !file.endsWith('-seed.json'))
  .map((file) => path.join(docsDir, file));

for (const file of docsJsonFiles) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Array.isArray(raw?.articles)) {
      raw.articles.forEach((article) => {
        if (article?.published !== false) addArticle(article?.slug);
      });
    }
    if (Array.isArray(raw?.profiles)) {
      raw.profiles.forEach((entry) => {
        const profile = entry?.profile || entry;
        if (profile?.is_published === true) addProfile(profile?.slug);
      });
    }
  } catch {
    // Some docs files are diagnostic exports. They do not need to be sitemap inputs.
  }
}

const fallbackProfilesPath = path.join(publicDir, 'published-profiles-fallback.json');
if (fs.existsSync(fallbackProfilesPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(fallbackProfilesPath, 'utf8'));
    raw.profiles?.forEach((entry) => addProfile(entry?.profile?.slug || entry?.slug));
  } catch (error) {
    console.error(`Failed to parse ${fallbackProfilesPath}:`, error);
  }
}

const fallbackArticlesPath = path.join(publicDir, 'published-articles-fallback.json');
if (fs.existsSync(fallbackArticlesPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(fallbackArticlesPath, 'utf8'));
    raw.articles?.forEach((article) => addArticle(article?.slug));
  } catch (error) {
    console.error(`Failed to parse ${fallbackArticlesPath}:`, error);
  }
}

const urls = [...new Set([...staticPaths, ...profilePaths, ...articlePaths])].sort();
const lastmod = new Date().toISOString().slice(0, 10);

const getPriority = (pathname) => {
  if (pathname === '/') return '1.0';
  if (pathname === '/pros') return '0.9';
  if (pathname.startsWith('/pros/')) return '0.8';
  if (pathname.startsWith('/articles/')) return '0.7';
  return '0.6';
};

const getChangefreq = (pathname) => {
  if (pathname === '/' || pathname === '/pros' || pathname === '/articles') return 'daily';
  if (pathname.startsWith('/pros/') || pathname.startsWith('/articles/')) return 'weekly';
  return 'monthly';
};

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (pathname) => `  <url>
    <loc>${siteUrl}${pathname}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${getChangefreq(pathname)}</changefreq>
    <priority>${getPriority(pathname)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
console.log(`Generated sitemap with ${urls.length} URLs.`);
