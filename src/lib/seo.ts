const SITE_NAME = 'My Bag Pro';
const SITE_URL = 'https://mybagpro.jp';

export const getSiteUrl = () => SITE_URL;

export const toAbsoluteUrl = (path = '/') => `${SITE_URL}${path}`;

export interface SeoPayload {
  title: string;
  description: string;
  path?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
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

export const applySeo = ({ title, description, path = '/', type = 'website', noindex = false }: SeoPayload) => {
  const absoluteUrl = `${SITE_URL}${path}`;
  document.title = `${title} | ${SITE_NAME}`;

  upsertMeta('meta[name="description"]', 'name', 'description', description);
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', `${title} | ${SITE_NAME}`);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', absoluteUrl);
  upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', `${title} | ${SITE_NAME}`);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
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
