import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView } from '../lib/analytics';
import { applySeo, getSeoPath } from '../lib/seo';

const routeSeoMap: Record<string, { title: string; description: string; noindex?: boolean }> = {
  '/': {
    title: 'プロのクラブセッティング検索サイト',
    description: '石川遼、中島啓太、松山英樹など有名プロのクラブセッティングを検索できる My Bag Pro。ドライバー、アイアン、パター、使用ボールまで確認済みデータを掲載します。',
  },
  '/settings/pros': {
    title: 'プロのクラブセッティング一覧',
    description: '日本男子、日本女子、海外男子、海外女子、インフルエンサー、レッスンプロのクラブセッティング一覧。選手名やクラブ名、五十音で検索できます。',
  },
  '/settings/users': {
    title: 'みんなのMy Bag',
    description: '一般ゴルファーの My Bag を見て、自分に近いクラブセッティングを探せます。',
  },
  '/clubs/drivers': {
    title: '人気ドライバー一覧',
    description: '人気ドライバーと使用者の掲載データを見ながら、比較と購入導線につなげられます。',
  },
  '/articles': {
    title: '更新記事一覧',
    description: 'クラブセッティングの更新内容や掲載変更を記事として公開しています。',
  },
  '/sitemap': {
    title: 'サイトマップ',
    description: 'My Bag Pro の主要ページ一覧です。',
  },
  '/compare': {
    title: 'セッティング比較',
    description: '自分のバッグとプロのセッティングを比較します。',
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
    description: 'あなたの My Bag を管理するページです。',
    noindex: true,
  },
  '/mybag/create': {
    title: 'My Bagを作る',
    description: '自分のクラブセッティングを登録して管理します。',
    noindex: true,
  },
};

const getSeoForPath = (pathname: string) => {
  if (pathname.startsWith('/settings/pros/')) {
    return {
      title: 'プロのクラブセッティング詳細',
      description: '選手ごとのクラブセッティング詳細ページです。ドライバー、フェアウェイウッド、アイアン、ウェッジ、パター、使用ボールまで確認できます。',
    };
  }

  if (pathname.startsWith('/settings/users/')) {
    return {
      title: 'みんなのMy Bag 詳細',
      description: '一般ゴルファーの公開クラブセッティング詳細ページです。バッグ構成、使用ボール、SNSや外部リンクまで確認できます。',
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

  return routeSeoMap[pathname] || routeSeoMap['/'];
};

export const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const seo = getSeoForPath(location.pathname);
    const seoPath = getSeoPath(location.pathname);
    applySeo({
      title: seo.title,
      description: seo.description,
      path: seoPath,
      noindex: seo.noindex,
      type: location.pathname.startsWith('/articles/') ? 'article' : 'website',
    });
    trackPageView(seoPath, `${seo.title} | My Bag Pro`);
  }, [location.pathname]);

  return null;
};
