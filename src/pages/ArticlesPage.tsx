import { useEffect, useState } from 'react';
import { Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchPublishedArticles, type PublicArticle } from '../lib/articles';

export const ArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen pb-20">
      <section className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white md:px-10 md:py-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">
          <Newspaper size={14} />
          Articles
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">更新内容を記事として公開する</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
          確認済みのセッティング更新や公開情報の変更は、記事として公開して透明性を高めます。
        </p>
      </section>

      <section className="mt-8 grid gap-5">
        {isLoading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
            記事を読み込んでいます...
          </div>
        )}

        {!isLoading && articles.length === 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No Published Articles</div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">公開済み記事はまだありません。</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              `content_articles` に公開記事を追加すると、ここに表示されます。
            </p>
          </div>
        )}

        {articles.map((article) => (
          <button
            key={article.slug}
            onClick={() => navigate(`/articles/${article.slug}`)}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{article.articleType}</div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">{article.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{article.excerpt}</p>
          </button>
        ))}
      </section>
    </div>
  );
};
