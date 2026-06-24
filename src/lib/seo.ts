import { getBrandConfig, getBrandConfigByKey, getCanonicalBrandForPath, type BrandKey } from '../config/brand';

export const getSiteUrl = () => getBrandConfig().url;

export const toAbsoluteUrl = (path = '/', brand?: BrandKey) => {
  if (/^https?:\/\//i.test(path)) return path;
  const targetBrand = brand ? getBrandConfigByKey(brand) : getCanonicalBrandForPath(path);
  return `${targetBrand.url}${path.startsWith('/') ? path : `/${path}`}`;
};

export interface SeoPayload {
  title: string;
  description: string;
  path?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  keywords?: string[];
  image?: string;
}

export const setStructuredData = (id: string, payload: Record<string, unknown>) => {
  const selector = `script[data-seo-structured='${id}']`;
  let tag = document.head.querySelector<HTMLScriptElement>(selector);
  if (!tag) {
    tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.dataset.seoStructured = id;
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(payload);
};

export const removeStructuredData = (id: string) => {
  const tag = document.head.querySelector<HTMLScriptElement>(`script[data-seo-structured='${id}']`);
  tag?.remove();
};

const upsertMeta = (selector: string, attr: 'name' | 'property', value: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertCanonical = (href: string) => {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
};

const buildDocumentTitle = (title: string, path: string, brandName: string) => {
  const pathname = path.startsWith('http') ? new URL(path).pathname : path.split('?')[0] || '/';
  if (pathname === '/' && brandName === 'MyBagPro') {
    return `My Bag Pro | ${title}`;
  }
  return `${title} | ${brandName}`;
};

export const applySeo = ({
  title,
  description,
  path = '/',
  type = 'website',
  noindex = false,
  keywords = [],
  image,
}: SeoPayload) => {
  const absoluteUrl = toAbsoluteUrl(path);
  const imageUrl = image ? toAbsoluteUrl(image) : toAbsoluteUrl('/article-visuals/golf-bag-course.jpg');
  const displayBrand = getCanonicalBrandForPath(path);
  const documentTitle = buildDocumentTitle(title, path, displayBrand.name);
  document.title = documentTitle;

  upsertMeta('meta[name="description"]', 'name', 'description', description);
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', documentTitle);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', absoluteUrl);
  upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
  upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', displayBrand.name);
  upsertMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', documentTitle);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);
  if (keywords.length > 0) {
    upsertMeta('meta[name="keywords"]', 'name', 'keywords', keywords.join(', '));
  }
  upsertMeta(
    'meta[name="robots"]',
    'name',
    'robots',
    noindex ? 'noindex,nofollow,noarchive' : 'index,follow,max-image-preview:large'
  );
  upsertCanonical(absoluteUrl);
};

export const getSeoPath = (hashPath: string) => {
  if (!hashPath || hashPath === '/') return '/';
  return hashPath;
};
