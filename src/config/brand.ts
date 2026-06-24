export type BrandKey = 'golfid' | 'mybagpro';

export interface BrandConfig {
  brand: BrandKey;
  key: BrandKey;
  name: string;
  domain: string;
  url: string;
  canonicalHost: string;
  mainCopy: string;
  description: string;
  homeTitle: string;
  primaryCta: string;
  primaryCtaHref: string;
  secondaryCta: string;
  secondaryCtaHref: string;
}

export const brandConfigs: Record<BrandKey, BrandConfig> = {
  golfid: {
    brand: 'golfid',
    key: 'golfid',
    name: 'Golf ID',
    domain: 'golfid.jp',
    url: 'https://golfid.jp',
    canonicalHost: 'golfid.jp',
    mainCopy: '上手くなる人は、自分のゴルフを知っている。',
    description:
      'クラブ、スコア、悩み、目標をまとめると、AIがあなたの“次の一手”を提案。作ったGolf IDはSNSプロフィールに貼って、仲間やフォロワーと共有できます。',
    homeTitle: '上手くなる人は、自分のゴルフを知っている。 | Golf ID',
    primaryCta: '無料でGolf IDを作る',
    primaryCtaHref: '/create',
    secondaryCta: 'みんなのセッティングを見る',
    secondaryCtaHref: '/explore',
  },
  mybagpro: {
    brand: 'mybagpro',
    key: 'mybagpro',
    name: 'MyBagPro',
    domain: 'www.mybagpro.jp',
    url: 'https://www.mybagpro.jp',
    canonicalHost: 'www.mybagpro.jp',
    mainCopy: 'プロとみんなのクラブセッティングが見つかる。',
    description:
      'プロ・インフルエンサー・ゴルファーのクラブセッティングをチェック。気になるクラブ選びから、Golf IDでのAI上達診断までつなげられます。',
    homeTitle: 'MyBagPro | プロとみんなのクラブセッティングが見つかる',
    primaryCta: 'プロのセッティングを見る',
    primaryCtaHref: '/pros',
    secondaryCta: 'Golf IDを作る',
    secondaryCtaHref: 'https://golfid.jp/create',
  },
};

export const normalizeHostname = (hostname?: string) =>
  (hostname || '').toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '');

export const getBrandKeyForHostname = (hostname?: string): BrandKey => {
  const normalized = normalizeHostname(hostname);
  if (normalized === 'mybagpro.jp') return 'mybagpro';
  return 'golfid';
};

export const getConfiguredBrandKey = (): BrandKey | null => {
  const value = (import.meta.env.VITE_BRAND || '').toLowerCase();
  if (value === 'golfid' || value === 'mybagpro') return value;
  return null;
};

export const getCurrentHostname = () => {
  if (typeof window !== 'undefined') return window.location.hostname;
  return import.meta.env.VITE_CANONICAL_HOST || 'golfid.jp';
};

export const getBrandConfig = (hostname?: string) =>
  brandConfigs[getConfiguredBrandKey() ?? getBrandKeyForHostname(hostname ?? getCurrentHostname())];

export const getBrandConfigByKey = (brand: BrandKey) => brandConfigs[brand];

export const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

export const getCanonicalBrandForPath = (path = '/', hostname?: string): BrandConfig => {
  const pathname = path.startsWith('http') ? new URL(path).pathname : path.split('?')[0] || '/';

  if (
    pathname === '/pros' ||
    pathname.startsWith('/pros/') ||
    pathname === '/articles' ||
    pathname.startsWith('/articles/') ||
    pathname === '/clubs/drivers' ||
    pathname.startsWith('/clubs/drivers/') ||
    pathname.startsWith('/buy/')
  ) {
    return brandConfigs.mybagpro;
  }

  if (
    pathname === '/create' ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/@') ||
    pathname === '/diagnosis' ||
    pathname.startsWith('/diagnosis/') ||
    pathname === '/mypage' ||
    pathname.startsWith('/mypage') ||
    pathname === '/settings/users' ||
    pathname.startsWith('/settings/users/') ||
    pathname === '/explore' ||
    pathname === '/bag'
  ) {
    return brandConfigs.golfid;
  }

  const configuredBrand = getConfiguredBrandKey();
  return configuredBrand ? brandConfigs[configuredBrand] : getBrandConfig(hostname);
};
