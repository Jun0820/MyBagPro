import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchPublishedArticles, type PublicArticle } from '../lib/articles';

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

export const ArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ArticleFilter>('all');

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

  const filteredArticles =
    activeFilter === 'all'
      ? articles
      : articles.filter((article) => article.articleType === activeFilter);

  const updateCount = articles.filter((article) => article.articleType === 'update').length;
  const columnCount = articles.filter((article) => article.articleType === 'column').length;
  const newsCount = articles.filter((article) => article.articleType === 'news').length;

  return (
    <div className="min-h-screen pb-20">
      <section className="rounded-[1.5rem] bg-slate-950 px-5 py-7 text-white md:rounded-[2rem] md:px-10 md:py-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black tracking-[0.15em] text-cyan-200">
          <Newspaper size={14} />
          更新記事
        </div>
        <h1 className="mt-4 text-[2rem] font-black tracking-tight md:mt-5 md:text-6xl">セッティングの見方と更新内容を、記事で分かりやすく残す。</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:mt-4 md:text-base md:leading-7">
          確認済みの掲載更新、比較や診断の使い方、セッティングの読み解き方をまとめています。
          プロフィールだけでは伝わりにくい背景を、あとから追いやすい形で公開します。
        </p>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3.5 md:rounded-2xl md:py-4">
            <div className="text-xs font-black text-slate-400">公開記事</div>
            <div className="mt-2 text-2xl font-black text-white">{articles.length}</div>
          </div>
          <div className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3.5 md:rounded-2xl md:py-4">
            <div className="text-xs font-black text-slate-400">更新情報</div>
            <div className="mt-2 text-2xl font-black text-white">{updateCount}</div>
          </div>
          <div className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3.5 md:rounded-2xl md:py-4">
            <div className="text-xs font-black text-slate-400">読みもの</div>
            <div className="mt-2 text-2xl font-black text-white">{columnCount + newsCount}</div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:mt-8 md:gap-5">
        <div className="flex flex-wrap gap-3">
          {(['all', 'update', 'column', 'news'] as ArticleFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-black transition-colors ${
                activeFilter === filter
                  ? 'bg-trust-navy text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-golf-300 hover:text-golf-700'
              }`}
            >
              {filterLabel[filter]}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
            記事を読み込んでいます...
          </div>
        )}

        {!isLoading && articles.length === 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
            <div className="text-[11px] font-black tracking-[0.15em] text-slate-400">記事が見つかりません</div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">公開中の記事を取得できませんでした。</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              一時的な取得エラーか、まだ公開記事がない状態です。時間を置いて再読み込みすると表示される場合があります。
            </p>
          </div>
        )}

        {!isLoading && articles.length > 0 && filteredArticles.length === 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
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
            className="rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl md:rounded-[2rem] md:p-6"
          >
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
            <p className="mt-2.5 text-sm leading-6 text-slate-600 md:mt-3 md:leading-7">{article.excerpt}</p>
            {article.relatedProfileSlug && article.relatedProfileName && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-golf-50 px-3 py-1 text-[11px] font-black tracking-[0.08em] text-golf-700">
                関連ページ
                <span>{article.relatedProfileName}</span>
              </div>
            )}
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-trust-navy md:mt-5">
              記事を読む
              <ArrowRight size={16} />
            </div>
          </button>
        ))}
      </section>
    </div>
  );
};
