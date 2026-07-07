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
    mainCopy: 'あなたのゴルフを、1ページで伝える。',
    description:
      'スコア、クラブ、SNS、QRをひとつにまとめるゴルファーの共有プロフィール。コーチ、フィッター、同伴者、SNSにあなたのゴルフをすぐ共有できます。',
    homeTitle: 'あなたのゴルフを、1ページで伝える。 | Golf ID',
    primaryCta: 'Golf IDを作成する',
    primaryCtaHref: '/create',
    secondaryCta: 'みんなのGolf IDを見る',
    secondaryCtaHref: '/explore',
  },
  mybagpro: {
    brand: 'mybagpro',
    key: 'mybagpro',
    name: 'MyBagPro',
    domain: 'www.mybagpro.jp',
    url: 'https://www.mybagpro.jp',
    canonicalHost: 'www.mybagpro.jp',
    mainCopy: 'あなたのクラブと課題を診断する。',
    description:
      'プロ・インフルエンサー・一般ゴルファーのクラブセッティングを比較し、My Bagから番手間ギャップ、シャフト、ロフト、飛距離バランスを分析します。',
    homeTitle: 'MyBagPro | あなたのクラブと課題を診断する',
    primaryCta: 'クラブ診断を始める',
    primaryCtaHref: '/diagnosis',
    secondaryCta: 'プロのセッティングを見る',
    secondaryCtaHref: '/pros',
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
