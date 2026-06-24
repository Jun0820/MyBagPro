import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Newspaper, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchPublishedArticles, type PublicArticle } from '../lib/articles';
import { defaultArticleVisual, getArticleVisual, isGenericArticleImage } from '../lib/articleVisuals';
import { matchesSearchText } from '../lib/searchNormalizer';
import { getTournamentSpotlightByArticleSlug } from '../lib/tournamentSpotlights';

type ArticleFilter = 'all' | PublicArticle['articleType'];

const articleTypeLabel: Record<PublicArticle['articleType'], string> = {
  news: 'お知らせ',
  update: '更新情報',
  column: '読みもの',
};

const filterLabel: Record<ArticleFilter, string> = {
  all: 'すべて',
  news: 'お知らせ',
  update: '更新情報',
  column: '読みもの',
};

const formatPublishedAt = (publishedAt: string | null) => {
  if (!publishedAt) return '公開日未設定';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(publishedAt));
};

const articleImagePattern = /\[IMAGE\s+url="([^"]+)"\s+alt="([^"]+)"/;

const getArticleImage = (article: PublicArticle) => {
  const match = article.body.match(articleImagePattern);
  const contextualVisual = getArticleVisual(article);
  const bodyImageUrl = match?.[1];

  if (!bodyImageUrl || isGenericArticleImage(bodyImageUrl)) {
    return contextualVisual;
  }

  return {
    url: bodyImageUrl,
    alt: match?.[2] || contextualVisual.alt,
  };
};

export const ArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ArticleFilter>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      const data = await fetchPublishedArticles();
      if (isMounted) {
        setArticles(data);
        setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredArticles = articles.filter((article) => {
    if (activeFilter !== 'all' && article.articleType !== activeFilter) return false;
    return matchesSearchText(
      [article.title, article.excerpt, article.body, article.relatedProfileName, article.seasonYear],
      searchText
    );
  });

  const updateCount = articles.filter((article) => article.articleType === 'update').length;
  const columnCount = articles.filter((article) => article.articleType === 'column').length;
  const newsCount = articles.filter((article) => article.articleType === 'news').length;

  return (
    <div className="min-h-screen pb-16">
      <section className="bg-slate-950 px-5 py-7 text-white md:px-8 md:py-9">
        <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-cyan-200">
          <Newspaper size={14} />
          更新記事
        </div>
        <h1 className="mt-4 max-w-4xl text-[2rem] font-black tracking-tight md:mt-5 md:text-5xl">セッティングの見方と更新内容</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:mt-4 md:text-base md:leading-7">
          確認済みの掲載更新、比較や診断の使い方、セッティングの読み解き方をまとめています。
          プロフィールだけでは伝わりにくい背景を、あとから追いやすい形で公開します。
        </p>

        <div className="mt-5 grid gap-px overflow-hidden bg-white/10 sm:grid-cols-3">
          <div className="bg-slate-950/90 px-4 py-3">
            <div className="text-xs font-black text-slate-400">公開記事</div>
            <div className="mt-2 text-2xl font-black text-white">{articles.length}</div>
          </div>
          <div className="bg-slate-950/90 px-4 py-3">
            <div className="text-xs font-black text-slate-400">更新情報</div>
            <div className="mt-2 text-2xl font-black text-white">{updateCount}</div>
          </div>
          <div className="bg-slate-950/90 px-4 py-3">
            <div className="text-xs font-black text-slate-400">読みもの</div>
            <div className="mt-2 text-2xl font-black text-white">{columnCount + newsCount}</div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-lg bg-emerald-950 px-5 py-5 text-white shadow-sm ring-1 ring-emerald-900/40 md:mt-6 md:px-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">Golf ID</div>
            <h2 className="mt-2 text-xl font-black md:text-2xl">このクラブ、あなたにも合う？</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">
              Golf IDを作って、AI上達診断を受けると、自分のスコア・悩み・クラブ構成から次に見直すポイントを整理できます。
            </p>
          </div>
          <a
            href="https://golfid.jp/create"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
          >
            無料でGolf IDを作る
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section className="mt-5 grid gap-3.5 md:mt-7 md:gap-4">
        <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200">
          <label className="flex min-h-[44px] items-center gap-2 rounded-md bg-slate-50 px-3">
            <Search size={17} className="shrink-0 text-slate-400" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="記事名・選手名・メーカー・番手で検索"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5 px-1 pb-1">
            {['7W', 'ピン', 'ユーティリティ', 'ドライバー', '女子プロ'].map((query) => (
              <button
                key={query}
                onClick={() => setSearchText(query)}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 transition hover:bg-golf-50 hover:text-golf-700"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {(['all', 'update', 'column', 'news'] as ArticleFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-black transition-colors ${
                activeFilter === filter
                  ? 'bg-trust-navy text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-golf-700 hover:ring-golf-300'
              }`}
            >
              {filterLabel[filter]}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="rounded-[2rem] bg-white p-7 text-sm font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
            記事を読み込んでいます...
          </div>
        )}

        {!isLoading && articles.length === 0 && (
          <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-slate-200">
            <div className="text-[11px] font-black tracking-[0.15em] text-slate-400">記事が見つかりません</div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">公開中の記事を取得できませんでした。</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              一時的な取得エラーか、まだ公開記事がない状態です。時間を置いて再読み込みすると表示される場合があります。
            </p>
          </div>
        )}

        {!isLoading && articles.length > 0 && filteredArticles.length === 0 && (
          <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-slate-200">
            <div className="text-[11px] font-black tracking-[0.15em] text-slate-400">絞り込み結果</div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">{filterLabel[activeFilter]}の記事はまだありません。</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              別のカテゴリを選ぶと、公開済みの記事を見られます。
            </p>
          </div>
        )}

        {filteredArticles.map((article) => (
          <button
            key={article.slug}
            onClick={() => navigate(`/articles/${article.slug}`)}
            className="grid overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md md:grid-cols-[220px_minmax(0,1fr)]"
          >
            {(() => {
              const spotlight = getTournamentSpotlightByArticleSlug(article.slug);
              const relatedCount = spotlight?.featuredPlayerSlugs.length || 0;
              const image = getArticleImage(article);

              return (
                <>
            <div className="h-40 overflow-hidden md:h-full">
              <img
                src={image.url}
                alt={image.alt}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  const target = event.currentTarget;
                  if (target.src.endsWith(defaultArticleVisual.url)) return;
                  target.src = defaultArticleVisual.url;
                }}
              />
            </div>
            <div className="p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black tracking-[0.12em] text-slate-600">
                {articleTypeLabel[article.articleType]}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={14} />
                {formatPublishedAt(article.publishedAt)}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-black text-trust-navy md:text-2xl">{article.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 md:mt-2.5 md:leading-7">{article.excerpt}</p>
            {article.relatedProfileSlug && article.relatedProfileName && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-golf-50 px-3 py-1 text-[11px] font-black tracking-[0.08em] text-golf-700">
                関連ページ
                <span>{article.relatedProfileName}</span>
              </div>
            )}
            {!article.relatedProfileSlug && relatedCount > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-golf-50 px-3 py-1 text-[11px] font-black tracking-[0.08em] text-golf-700">
                関連ページ
                <span>{relatedCount}選手</span>
              </div>
            )}
            <div className="mt-3 inline-flex items-center gap-2 text-sm font-black text-trust-navy md:mt-4">
              記事を読む
              <ArrowRight size={16} />
            </div>
            </div>
                </>
              );
            })()}
          </button>
        ))}
      </section>
    </div>
  );
};
