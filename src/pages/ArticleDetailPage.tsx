import { useEffect, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPublishedArticleBySlug, type PublicArticle } from '../lib/articles';
import { applySeo, getSeoPath, removeStructuredData, setStructuredData, toAbsoluteUrl } from '../lib/seo';

export const ArticleDetailPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<PublicArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!slug) {
        setArticle(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const data = await fetchPublishedArticleBySlug(slug);
      if (isMounted) {
        setArticle(data);
        setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    if (!article) {
      removeStructuredData('article-page');
      applySeo({
        title: '更新記事',
        description: '掲載データやクラブセッティングの更新内容を公開する記事です。',
        path: getSeoPath(`/articles/${slug}`),
        type: 'article',
      });
      return;
    }

    applySeo({
      title: article.title,
      description: article.excerpt || 'クラブセッティングの更新内容を公開する記事です。',
      path: getSeoPath(`/articles/${slug}`),
      type: 'article',
    });

    setStructuredData('article-page', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt || 'クラブセッティングの更新内容を公開する記事です。',
      articleSection: article.articleType,
      datePublished: article.publishedAt || undefined,
      dateModified: article.publishedAt || undefined,
      mainEntityOfPage: toAbsoluteUrl(getSeoPath(`/articles/${slug}`)),
      url: toAbsoluteUrl(getSeoPath(`/articles/${slug}`)),
      publisher: {
        '@type': 'Organization',
        name: 'My Bag Pro',
        url: toAbsoluteUrl('/'),
      },
      author: {
        '@type': 'Organization',
        name: 'My Bag Pro',
      },
    });
  }, [article, slug]);

  useEffect(() => () => removeStructuredData('article-page'), []);

  if (isLoading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">記事を読み込んでいます...</div>;
  }

  if (!article) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">記事が見つかりません。</div>;
  }

  return (
    <div className="min-h-screen pb-20">
      <button
        onClick={() => navigate('/articles')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={16} />
        記事一覧へ戻る
      </button>

      <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          <FileText size={14} />
          {article.articleType}
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-trust-navy md:text-6xl">{article.title}</h1>
        <p className="mt-6 whitespace-pre-wrap text-sm leading-8 text-slate-700">{article.body}</p>
      </article>
    </div>
  );
};
