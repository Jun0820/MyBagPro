export type BrandKey = 'golfid' | 'mybagpro';

export interface BrandConfig {
  brand: BrandKey;
  name: string;
  domain: string;
  url: string;
  mainCopy: string;
  description: string;
  primaryCta: string;
  primaryCtaHref: string;
  secondaryCta: string;
  secondaryCtaHref: string;
}

export const brandConfigs: Record<BrandKey, BrandConfig> = {
  golfid: {
    brand: 'golfid',
    name: 'Golf ID',
    domain: 'golfid.jp',
    url: 'https://golfid.jp',
    mainCopy: '上手くなる人は、自分のゴルフを知っている。',
    description:
      'クラブ、スコア、悩み、目標をまとめると、AIがあなたの“次の一手”を提案。作ったGolf IDはSNSプロフィールに貼って、仲間やフォロワーと共有できます。',
    primaryCta: '無料でGolf IDを作る',
    primaryCtaHref: '/create',
    secondaryCta: 'みんなのセッティングを見る',
    secondaryCtaHref: '/explore',
  },
  mybagpro: {
    brand: 'mybagpro',
    name: 'MyBagPro',
    domain: 'mybagpro.jp',
    url: 'https://mybagpro.jp',
    mainCopy: 'プロとみんなのクラブセッティングが見つかる。',
    description:
      'プロ・インフルエンサー・ゴルファーのクラブセッティングをチェック。気になるクラブ選びから、Golf IDでのAI上達診断までつなげられます。',
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

export const getCurrentHostname = () => {
  if (typeof window !== 'undefined') return window.location.hostname;
  return import.meta.env.VITE_CANONICAL_HOST || 'golfid.jp';
};

export const getBrandConfig = (hostname?: string) => brandConfigs[getBrandKeyForHostname(hostname ?? getCurrentHostname())];

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

  return getBrandConfig(hostname);
};
