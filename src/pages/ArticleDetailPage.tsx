import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPublishedArticleBySlug, fetchPublishedArticles, type PublicArticle } from '../lib/articles';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfileBySlug, type PublicSettingProfile } from '../lib/contentProfiles';
import { applySeo, getSeoPath, removeStructuredData, setStructuredData, toAbsoluteUrl } from '../lib/seo';
import { getTournamentSpotlightByArticleSlug } from '../lib/tournamentSpotlights';

const articleTypeLabel: Record<PublicArticle['articleType'], string> = {
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

export const ArticleDetailPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<PublicArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<PublicArticle[]>([]);
  const [relatedProfile, setRelatedProfile] = useState<PublicSettingProfile | null>(null);
  const [tournamentProfiles, setTournamentProfiles] = useState<PublicSettingProfile[]>([]);
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
      const [data, related] = await Promise.all([
        fetchPublishedArticleBySlug(slug),
        fetchPublishedArticles({ limit: 3, excludeSlug: slug }),
      ]);
      if (isMounted) {
        setArticle(data);
        setRelatedArticles(related);
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
      removeStructuredData('article-breadcrumbs');
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
      about: article.relatedProfileName
        ? {
            '@type': 'Person',
            name: article.relatedProfileName,
            url: article.relatedProfileSlug
              ? toAbsoluteUrl(getSeoPath(`/settings/pros/${article.relatedProfileSlug}`))
              : undefined,
          }
        : undefined,
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

    setStructuredData('article-breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'ホーム',
          item: toAbsoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: '更新記事',
          item: toAbsoluteUrl('/articles'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.title,
          item: toAbsoluteUrl(getSeoPath(`/articles/${slug}`)),
        },
      ],
    });
  }, [article, slug]);

  useEffect(
    () => () => {
      removeStructuredData('article-page');
      removeStructuredData('article-breadcrumbs');
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      const spotlight = getTournamentSpotlightByArticleSlug(article?.slug);

      const [singleProfile, spotlightProfiles] = await Promise.all([
        article?.relatedProfileSlug ? fetchPublishedSettingProfileBySlug(article.relatedProfileSlug) : Promise.resolve(null),
        spotlight
          ? Promise.all(spotlight.featuredPlayerSlugs.map((profileSlug) => fetchPublishedSettingProfileBySlug(profileSlug)))
          : Promise.resolve([]),
      ]);

      if (!isMounted) return;
      setRelatedProfile(singleProfile);
      setTournamentProfiles((spotlightProfiles || []).filter(Boolean) as PublicSettingProfile[]);
    };

    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, [article?.relatedProfileSlug, article?.slug]);

  if (isLoading) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">記事を読み込んでいます...</div>;
  }

  if (!article) {
    return <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">記事が見つかりません。</div>;
  }

  const tournamentSpotlight = getTournamentSpotlightByArticleSlug(article.slug);

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
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black tracking-[0.15em] text-slate-500">
          <FileText size={14} />
          {articleTypeLabel[article.articleType]}
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-trust-navy md:text-6xl">{article.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} />
            {formatPublishedAt(article.publishedAt)}
          </span>
          {article.seasonYear && <span>{article.seasonYear}シーズン</span>}
        </div>
        {article.excerpt && (
          <p className="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            {article.excerpt}
          </p>
        )}
        {article.relatedProfileSlug && article.relatedProfileName && (
          <div className="mt-6 rounded-[1.5rem] border border-golf-200 bg-golf-50/60 p-5">
            <div className="text-[11px] font-black tracking-[0.14em] text-golf-700">PROFILE LINK</div>
            <h2 className="mt-2 text-xl font-black text-trust-navy">
              {article.relatedProfileName}のクラブセッティングを見る
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              この記事の元になった掲載ページから、ドライバー、アイアン、パター、使用ボールまで一覧で確認できます。
            </p>
            <button
              onClick={() => navigate(`/settings/pros/${article.relatedProfileSlug}`)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              クラブセッティングを見る
              <ArrowRight size={16} />
            </button>
          </div>
        )}
        <div className="mt-8 whitespace-pre-wrap text-sm leading-8 text-slate-700">{article.body}</div>
        {tournamentSpotlight && tournamentProfiles.length > 0 && (
          <section className="mt-8 rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-5">
            <div className="text-[11px] font-black tracking-[0.14em] text-amber-700">TOURNAMENT PLAYERS</div>
            <h2 className="mt-2 text-xl font-black text-trust-navy">
              {tournamentSpotlight.tournamentName}で追いたい注目選手
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              各選手のセッティング詳細ページでは、使用ドライバー、番手構成、飛距離、確認ソースまで一覧で見られます。
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {tournamentProfiles.map((profile) => (
                <button
                  key={profile.slug}
                  onClick={() => navigate(`/settings/pros/${profile.slug}`)}
                  className="rounded-[1.25rem] border border-amber-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300"
                >
                  <div className="text-[11px] font-black tracking-[0.12em] text-amber-700">{profile.categoryLabel}</div>
                  <h3 className="mt-2 text-lg font-black text-trust-navy">{profile.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{profile.summary}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-golf-700">
                    セッティングを見る
                    <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
        {relatedProfile && (
          <section className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="text-[11px] font-black tracking-[0.14em] text-slate-500">SETTING SUMMARY</div>
            <h2 className="mt-2 text-xl font-black text-trust-navy">
              {relatedProfile.name}のクラブセッティング概要
            </h2>
            <p className="mt-3 text-sm leading-8 text-slate-700">
              {relatedProfile.name}の{relatedProfile.seasonYear ? `${relatedProfile.seasonYear}年` : '最新'}クラブセッティングでは、
              使用ドライバー{relatedProfile.clubs.find((club) => club.category === 'Driver')?.model || '未公開'}、
              使用ボール{relatedProfile.ball}、
              契約メーカー{relatedProfile.contractDisplay}を確認できます。詳細ページではクラブ名、メーカー、シャフト、ロフト、
              硬さ、飛距離まで一覧で見られます。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/settings/pros/${relatedProfile.slug}`)}
                className="inline-flex items-center gap-2 rounded-full bg-trust-navy px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
              >
                詳細ページを見る
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate(`/settings/pros?category=${relatedProfile.category}`)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100"
              >
                {relatedProfile.categoryLabel}をもっと見る
              </button>
            </div>
          </section>
        )}
      </article>

      {relatedArticles.length > 0 && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-xs font-black text-slate-400">次に読みたい記事</div>
          <h2 className="mt-2 text-2xl font-black text-trust-navy">セッティングの見方を深める</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {relatedArticles.map((relatedArticle) => (
              <button
                key={relatedArticle.slug}
                onClick={() => {
                  trackEvent('select_article', {
                    source_page: 'article_detail',
                    article_slug: relatedArticle.slug,
                    article_title: relatedArticle.title,
                  });
                  navigate(`/articles/${relatedArticle.slug}`);
                }}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-left transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="text-[11px] font-black tracking-[0.12em] text-slate-500">
                  {articleTypeLabel[relatedArticle.articleType]}
                </div>
                <h3 className="mt-2 text-lg font-black text-trust-navy">{relatedArticle.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{relatedArticle.excerpt}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-golf-700">
                  続きを読む
                  <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
