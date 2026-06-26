import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const profilesPath = path.join(rootDir, 'public', 'published-profiles-fallback.json');
const articlesPath = path.join(rootDir, 'public', 'published-articles-fallback.json');
const prosShellPath = path.join(distDir, 'mybagpro-pros.html');
const articlesShellPath = path.join(distDir, 'mybagpro-articles.html');
const siteUrl = 'https://www.mybagpro.jp';
const fallbackImage = `${siteUrl}/article-visuals/golf-bag-course.jpg`;

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const stripText = (value) =>
  String(value ?? '')
    .replace(/\[IMAGE[^\]]+\]/g, ' ')
    .replace(/\[CALLOUT[^\]]+\]/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[-*]\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (value, fallback) => {
  const text = stripText(value || fallback);
  if (text.length <= 120) return text;
  return `${text.slice(0, 117)}...`;
};

const replaceTag = (html, pattern, replacement) => html.replace(pattern, replacement);

const replaceMeta = (html, attr, name, content) => {
  const escaped = escapeHtml(content);
  const selector = `${attr}="${name}"`;
  const pattern = new RegExp(`<meta\\s+${selector}\\s+content="[^"]*"\\s*/?>`, 'i');
  const replacement = `<meta ${selector} content="${escaped}" />`;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace('</head>', `  ${replacement}\n</head>`);
};

const replaceCanonical = (html, url) => {
  const escaped = escapeHtml(url);
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  const replacement = `<link rel="canonical" href="${escaped}" />`;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace('</head>', `  ${replacement}\n</head>`);
};

const applySeo = (html, { title, description, canonical, image = fallbackImage, type = 'website' }) => {
  const fullTitle = title.endsWith('| MyBagPro') ? title : `${title} | MyBagPro`;
  let next = html;
  next = replaceTag(next, /<title>.*?<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
  next = replaceCanonical(next, canonical);
  next = replaceMeta(next, 'name', 'description', description);
  next = replaceMeta(next, 'property', 'og:title', fullTitle);
  next = replaceMeta(next, 'property', 'og:description', description);
  next = replaceMeta(next, 'property', 'og:url', canonical);
  next = replaceMeta(next, 'property', 'og:type', type);
  next = replaceMeta(next, 'property', 'og:site_name', 'MyBagPro');
  next = replaceMeta(next, 'property', 'og:image', image);
  next = replaceMeta(next, 'name', 'twitter:title', fullTitle);
  next = replaceMeta(next, 'name', 'twitter:description', description);
  next = replaceMeta(next, 'name', 'twitter:image', image);
  return next;
};

const writeHtml = (urlPath, html) => {
  const outputDir = path.join(distDir, urlPath.replace(/^\/+/, ''));
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
};

const getDriverName = (profilePackage) => {
  const driver = (profilePackage.bagItems || []).find((club) => club.category === 'Driver');
  return [driver?.brand, driver?.model_name].filter(Boolean).join(' ') || 'ドライバー';
};

const generateProsHtml = () => {
  if (!fs.existsSync(prosShellPath) || !fs.existsSync(profilesPath)) return 0;
  const shell = fs.readFileSync(prosShellPath, 'utf8');
  const { profiles = [] } = readJson(profilesPath);
  let count = 0;

  for (const profilePackage of profiles) {
    const profile = profilePackage.profile || {};
    if (!profile.slug || !profile.display_name) continue;
    const year = profile.season_year ? `${profile.season_year}年` : '最新';
    const title = `${profile.display_name} クラブセッティング ${year}｜ドライバー・アイアン・パターまで`;
    const description = `${profile.display_name}のクラブセッティング${year}版。${getDriverName(profilePackage)}、フェアウェイウッド、アイアン、ウェッジ、パター、使用ボールまで確認できます。`;
    const canonical = `${siteUrl}/pros/${profile.slug}`;
    const html = applySeo(shell, { title, description, canonical, image: `${siteUrl}/article-visuals/clubs-grass.jpg` });
    writeHtml(`/pros/${profile.slug}`, html);
    count += 1;
  }

  return count;
};

const generateArticleHtml = () => {
  if (!fs.existsSync(articlesShellPath) || !fs.existsSync(articlesPath)) return 0;
  const shell = fs.readFileSync(articlesShellPath, 'utf8');
  const { articles = [] } = readJson(articlesPath);
  let count = 0;

  for (const article of articles) {
    if (!article.slug || !article.title) continue;
    const title = article.title;
    const description = truncate(
      article.excerpt || article.body,
      'プロ・インフルエンサー・ゴルファーのクラブセッティングをチェック。気になるクラブ選びから、Golf IDでのAI上達診断までつなげられます。'
    );
    const canonical = `${siteUrl}/articles/${article.slug}`;
    const html = applySeo(shell, { title, description, canonical, image: `${siteUrl}/article-visuals/green-flag.jpg`, type: 'article' });
    writeHtml(`/articles/${article.slug}`, html);
    count += 1;
  }

  return count;
};

const prosCount = generateProsHtml();
const articleCount = generateArticleHtml();
console.log(`Generated detail SEO HTML: ${prosCount} pro pages, ${articleCount} article pages.`);
