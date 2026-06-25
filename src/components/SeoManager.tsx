import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getBrandConfig } from '../config/brand';
import { initAnalytics, trackPageView } from '../lib/analytics';
import { applySeo, getSeoPath } from '../lib/seo';

const googleSiteVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined;

const getRouteSeoMap = (): Record<string, { title: string; description: string; noindex?: boolean; keywords?: string[]; image?: string }> => {
  const brand = getBrandConfig();
  return {
    '/': {
      title: brand.mainCopy,
      description: brand.description,
      keywords:
        brand.brand === 'golfid'
          ? ['Golf ID', 'ゴルフ ID', 'AI ゴルフ診断', 'クラブセッティング', 'ゴルフ SNS プロフィール']
          : ['MyBagPro', 'クラブセッティング', 'プロ 使用クラブ', 'ゴルフ WITB', '女子プロ クラブセッティング'],
      image: '/article-visuals/golf-bag-course.jpg',
    },
    '/pros': {
      title: 'プロのクラブセッティング一覧',
      description: '日本男子、日本女子、海外男子、海外女子、インフルエンサー、レッスンプロのクラブセッティング一覧。選手名、カテゴリ、フリガナ、ヘッドスピードで絞り込めます。',
      keywords: ['プロ クラブセッティング 一覧', '女子プロ クラブセッティング', '男子プロ 使用クラブ', 'ゴルフ WITB'],
      image: '/article-visuals/clubs-grass.jpg',
    },
    '/settings/users': {
      title: 'みんなのセッティング',
      description: '一般ゴルファーの公開クラブセッティングを見て、自分に近い構成を探せます。',
    },
    '/explore': {
      title: 'みんなのGolf IDを見る',
      description: '公開されているGolf IDから、スコア、目標、ヘッドスピード、悩みを見て自分に近いゴルファーを探せます。',
      keywords: ['Golf ID 一覧', 'ゴルフ プロフィール', 'ゴルフ SNS プロフィール', 'AI ゴルフ診断'],
    },
    '/clubs/drivers': {
      title: '人気ドライバー一覧',
      description: '人気ドライバーと使用者の掲載データを見ながら、比較と購入導線につなげられます。',
    },
    '/articles': {
      title: '更新記事一覧',
      description: 'クラブセッティングの更新内容や掲載変更を記事として公開しています。',
      keywords: ['クラブセッティング 記事', '使用クラブ 最新', 'ゴルフクラブ ニュース'],
      image: '/article-visuals/green-flag.jpg',
    },
    '/sitemap': {
      title: 'サイトマップ',
      description: `${brand.name} の主要ページ一覧です。`,
    },
    '/compare': {
      title: 'セッティング比較',
      description: '自分のクラブセッティングとプロのセッティングを比較します。',
      noindex: true,
    },
    '/diagnosis': {
      title: 'AI診断',
      description: 'クラブセッティングやボールのAI診断ページです。',
      noindex: true,
    },
    '/ball-diagnosis': {
      title: 'ボール診断',
      description: 'ゴルファー向けのボール診断ページです。',
      noindex: true,
    },
    '/mypage': {
      title: 'マイページ',
      description: 'あなたのGolf IDを管理するページです。',
      noindex: true,
    },
    '/create': {
      title: 'Golf IDを作る',
      description: 'クラブ、スコア、悩み、目標をまとめてGolf IDを作成します。',
      keywords: ['Golf ID 作成', 'ゴルフ プロフィール', 'ゴルフ SNS プロフィール', 'AI ゴルフ診断'],
    },
    '/mybag/create': {
      title: 'Golf IDを作る',
      description: '自分のクラブセッティングを登録して管理します。',
      noindex: true,
    },
  };
};

const getSeoForPath = (pathname: string) => {
  const routeSeoMap = getRouteSeoMap();
  const brand = getBrandConfig();

  if (pathname === '/settings/pros' || pathname.startsWith('/settings/pros/')) {
    return {
      title: pathname === '/settings/pros' ? 'プロのクラブセッティング一覧' : 'プロのクラブセッティング詳細',
      description:
        pathname === '/settings/pros'
          ? '日本男子、日本女子、海外男子、海外女子、インフルエンサー、レッスンプロのクラブセッティング一覧。選手名、カテゴリ、フリガナ、ヘッドスピードで絞り込めます。'
          : '選手ごとのクラブセッティング詳細ページです。ドライバー、フェアウェイウッド、アイアン、ウェッジ、パター、使用ボールまで確認できます。',
      noindex: true,
    };
  }

  if (pathname.startsWith('/pros/')) {
    return {
      title: 'プロのクラブセッティング詳細',
      description: '選手ごとのクラブセッティング詳細ページです。ドライバー、フェアウェイウッド、アイアン、ウェッジ、パター、使用ボールまで確認できます。',
    };
  }

  if (pathname.startsWith('/settings/users/')) {
    return {
      title: 'みんなのセッティング詳細',
      description: '一般ゴルファーの公開クラブセッティング詳細ページです。バッグ構成、使用ボール、SNSや外部リンクまで確認できます。',
    };
  }

  if (pathname.startsWith('/u/') || pathname.startsWith('/@')) {
    const username = decodeURIComponent(pathname.replace(/^\/u\//, '').replace(/^\/@/, '')).replace(/^@+/, '').trim();
    return {
      title: username ? `${username}のGolf ID` : 'Golf ID',
      description: username
        ? `${username}さんのGolf ID。スコア、目標、ヘッドスピード、悩み、クラブセッティング、AI上達診断の次の一手をまとめています。`
        : 'スコア、クラブセッティング、ゴルフの悩みをまとめた公開Golf IDページです。',
    };
  }

  if (pathname.startsWith('/articles/')) {
    return {
      title: '更新記事',
      description: 'クラブセッティング掲載情報の更新記事です。記事から各選手の詳細ページへ進めます。',
      noindex: false,
    };
  }

  if (pathname.startsWith('/clubs/drivers/')) {
    return {
      title: 'ドライバー詳細',
      description: 'ドライバー製品の詳細と使用者データを確認できます。',
    };
  }

  if (pathname.startsWith('/buy/')) {
    return {
      title: '購入比較',
      description: 'クラブの購入先比較ページです。',
      noindex: true,
    };
  }

  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return {
      title: '管理ページ',
      description: `${brand.name} の管理・設定ページです。`,
      noindex: true,
    };
  }

  return routeSeoMap[pathname] || routeSeoMap['/'];
};

const getPublicSeoPath = (pathname: string) => {
  if (pathname === '/settings/pros') return '/pros';
  if (pathname.startsWith('/settings/pros/')) return pathname.replace('/settings/pros', '/pros');
  return pathname;
};

export const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const seo = getSeoForPath(location.pathname);
    const seoPath = getSeoPath(getPublicSeoPath(location.pathname));
    applySeo({
      title: seo.title,
      description: seo.description,
      path: seoPath,
      noindex: seo.noindex,
      type: location.pathname.startsWith('/articles/') ? 'article' : 'website',
      keywords: seo.keywords,
      image: seo.image,
    });
    trackPageView(seoPath, `${seo.title} | ${getBrandConfig().name}`);
  }, [location.pathname]);

  useEffect(() => {
    const selector = 'meta[name="google-site-verification"]';
    const existing = document.head.querySelector<HTMLMetaElement>(selector);

    if (!googleSiteVerification) {
      existing?.remove();
      return;
    }

    if (existing) {
      existing.setAttribute('content', googleSiteVerification);
      return;
    }

    const meta = document.createElement('meta');
    meta.setAttribute('name', 'google-site-verification');
    meta.setAttribute('content', googleSiteVerification);
    document.head.appendChild(meta);
  }, []);

  return null;
};
