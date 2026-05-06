import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPublishedArticleBySlug, fetchPublishedArticles, type PublicArticle } from '../lib/articles';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfileBySlug, type PublicSettingProfile } from '../lib/contentProfiles';
import { saveRecentlyViewed } from '../lib/recentlyViewed';
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

type RichArticleBlock =
  | { type: 'heading'; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'callout'; title: string; content: string }
  | { type: 'diagram'; lines: string[] }
  | { type: 'image'; url: string; alt: string; caption?: string };

const imagePattern = /^\[IMAGE\s+url="([^"]+)"\s+alt="([^"]+)"(?:\s+caption="([^"]+)")?\]$/;
const calloutPattern = /^\[CALLOUT\s+title="([^"]+)"\]$/;

const parseRichArticleBody = (body: string): RichArticleBlock[] => {
  const lines = body.split('\n');
  const blocks: RichArticleBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    const imageMatch = line.match(imagePattern);
    if (imageMatch) {
      blocks.push({
        type: 'image',
        url: imageMatch[1],
        alt: imageMatch[2],
        caption: imageMatch[3] || undefined,
      });
      index += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', content: line.replace(/^##\s+/, '') });
      index += 1;
      continue;
    }

    const calloutMatch = line.match(calloutPattern);
    if (calloutMatch) {
      index += 1;
      const contentLines: string[] = [];
      while (index < lines.length && lines[index].trim() !== '[/CALLOUT]') {
        contentLines.push(lines[index]);
        index += 1;
      }
      blocks.push({
        type: 'callout',
        title: calloutMatch[1],
        content: contentLines.join('\n').trim(),
      });
      index += 1;
      continue;
    }

    if (line === '[DIAGRAM]') {
      index += 1;
      const diagramLines: string[] = [];
      while (index < lines.length && lines[index].trim() !== '[/DIAGRAM]') {
        if (lines[index].trim()) {
          diagramLines.push(lines[index].trim());
        }
        index += 1;
      }
      blocks.push({ type: 'diagram', lines: diagramLines });
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().replace(/^- /, ''));
        index += 1;
      }
      blocks.push({ type: 'bullets', items });
      continue;
    }

    const paragraphLines: string[] = [rawLine];
    index += 1;
    while (index < lines.length) {
      const nextLine = lines[index].trim();
      if (
        !nextLine ||
        nextLine.startsWith('## ') ||
        nextLine.startsWith('- ') ||
        nextLine === '[DIAGRAM]' ||
        nextLine.match(calloutPattern) ||
        nextLine.match(imagePattern)
      ) {
        break;
      }
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push({
      type: 'paragraph',
      content: paragraphLines.join('\n').trim(),
    });
  }

  return blocks;
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
    if (!article || !slug) return;
    saveRecentlyViewed({
      id: `article:${slug}`,
      type: 'article',
      title: article.title,
      subtitle: article.excerpt || article.articleType,
      href: `/articles/${slug}`,
    });
  }, [article, slug]);

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
    return <div className="rounded-[1.5rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 md:rounded-[2rem] md:p-10">記事を読み込んでいます...</div>;
  }

  if (!article) {
    return <div className="rounded-[1.5rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 md:rounded-[2rem] md:p-10">記事が見つかりません。</div>;
  }

  const tournamentSpotlight = getTournamentSpotlightByArticleSlug(article.slug);
  const richBlocks = parseRichArticleBody(article.body);

  return (
    <div className="min-h-screen pb-20">
      <button
        onClick={() => navigate('/articles')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy md:mb-6"
      >
        <ArrowLeft size={16} />
        記事一覧へ戻る
      </button>

      <article className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 md:rounded-[2rem] md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black tracking-[0.15em] text-slate-500">
          <FileText size={14} />
          {articleTypeLabel[article.articleType]}
        </div>
        <h1 className="mt-4 text-[2rem] font-black tracking-tight text-trust-navy md:mt-5 md:text-6xl">{article.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500 md:mt-5">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} />
            {formatPublishedAt(article.publishedAt)}
          </span>
          {article.seasonYear && <span>{article.seasonYear}シーズン</span>}
        </div>
        {article.excerpt && (
          <p className="mt-5 rounded-[1.25rem] bg-slate-50 p-4 text-sm leading-6 text-slate-700 md:mt-6 md:rounded-[1.5rem] md:p-5 md:leading-7">
            {article.excerpt}
          </p>
        )}
        {article.relatedProfileSlug && article.relatedProfileName && (
          <div className="mt-5 rounded-[1.25rem] bg-golf-50/60 p-4 ring-1 ring-golf-200 md:mt-6 md:rounded-[1.5rem] md:p-5">
            <div className="text-[11px] font-black tracking-[0.14em] text-golf-700">PROFILE LINK</div>
            <h2 className="mt-2 text-lg font-black text-trust-navy md:text-xl">
              {article.relatedProfileName}のクラブセッティングを見る
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 md:leading-7">
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
        <div className="mt-6 space-y-5 md:mt-8 md:space-y-6">
          {richBlocks.map((block, blockIndex) => {
            if (block.type === 'heading') {
              return (
                <section key={`${block.type}-${blockIndex}`} className="pt-2">
                  <h2 className="text-xl font-black tracking-tight text-trust-navy md:text-[1.75rem]">
                    {block.content}
                  </h2>
                </section>
              );
            }

            if (block.type === 'paragraph') {
              return (
                <p
                  key={`${block.type}-${blockIndex}`}
                  className="whitespace-pre-wrap text-sm leading-7 text-slate-700 md:text-[15px] md:leading-8"
                >
                  {block.content}
                </p>
              );
            }

            if (block.type === 'bullets') {
              return (
                <div
                  key={`${block.type}-${blockIndex}`}
                  className="rounded-[1.25rem] bg-[#f8faf8] p-4 ring-1 ring-[#e4ece5] md:rounded-[1.5rem] md:p-5"
                >
                  <ul className="space-y-2.5">
                    {block.items.map((item, itemIndex) => (
                      <li key={`${item}-${itemIndex}`} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#176534]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }

            if (block.type === 'callout') {
              return (
                <div
                  key={`${block.type}-${blockIndex}`}
                  className="rounded-[1.25rem] bg-golf-50/60 p-4 ring-1 ring-golf-200 md:rounded-[1.5rem] md:p-5"
                >
                  <div className="text-[11px] font-black tracking-[0.14em] text-golf-700">{block.title}</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 md:leading-8">{block.content}</div>
                </div>
              );
            }

            if (block.type === 'diagram') {
              return (
                <div
                  key={`${block.type}-${blockIndex}`}
                  className="overflow-hidden rounded-[1.25rem] bg-white shadow-sm ring-1 ring-[#dbe7dd] md:rounded-[1.5rem]"
                >
                  <div className="border-b border-[#edf2ee] bg-[#f7faf7] px-4 py-3 text-[11px] font-black tracking-[0.14em] text-[#176534]">
                    図で整理
                  </div>
                  <div className="space-y-3 px-4 py-4 md:px-5 md:py-5">
                    {block.lines.map((diagramLine, lineIndex) => (
                      <div
                        key={`${diagramLine}-${lineIndex}`}
                        className="rounded-2xl border border-[#e8efea] bg-[#fbfcfb] px-4 py-3 font-mono text-xs leading-6 text-slate-700 md:text-sm"
                      >
                        {diagramLine}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <figure
                key={`${block.type}-${blockIndex}`}
                className="overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-slate-200 md:rounded-[1.5rem]"
              >
                <img src={block.url} alt={block.alt} className="h-auto w-full object-cover" />
                {block.caption && (
                  <figcaption className="border-t border-slate-100 px-4 py-3 text-xs leading-6 text-slate-500 md:px-5">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
        {tournamentSpotlight && tournamentProfiles.length > 0 && (
          <section className="mt-6 rounded-[1.25rem] bg-amber-50/70 p-4 ring-1 ring-amber-200 md:mt-8 md:rounded-[1.5rem] md:p-5">
            <div className="text-[11px] font-black tracking-[0.14em] text-amber-700">TOURNAMENT PLAYERS</div>
            <h2 className="mt-2 text-lg font-black text-trust-navy md:text-xl">
              {tournamentSpotlight.tournamentName}で追いたい注目選手
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700 md:leading-7">
              各選手のセッティング詳細ページでは、使用ドライバー、番手構成、飛距離、確認ソースまで一覧で見られます。
            </p>
            <div className="mt-4 grid gap-3 md:mt-5 md:gap-4 md:grid-cols-3">
              {tournamentProfiles.map((profile) => (
                <button
                  key={profile.slug}
                  onClick={() => navigate(`/settings/pros/${profile.slug}`)}
                  className="rounded-[1.125rem] border border-amber-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300 md:rounded-[1.25rem]"
                >
                  <div className="text-[11px] font-black tracking-[0.12em] text-amber-700">{profile.categoryLabel}</div>
                  <h3 className="mt-2 text-base font-black text-trust-navy md:text-lg">{profile.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 md:leading-7">{profile.summary}</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-sm font-black text-golf-700 md:mt-4">
                    セッティングを見る
                    <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
        {relatedProfile && (
          <section className="mt-6 rounded-[1.25rem] bg-slate-50 p-4 ring-1 ring-slate-200 md:mt-8 md:rounded-[1.5rem] md:p-5">
            <div className="text-[11px] font-black tracking-[0.14em] text-slate-500">SETTING SUMMARY</div>
            <h2 className="mt-2 text-lg font-black text-trust-navy md:text-xl">
              {relatedProfile.name}のクラブセッティング概要
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700 md:leading-8">
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
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                {relatedProfile.categoryLabel}をもっと見る
              </button>
            </div>
          </section>
        )}
      </article>

      {relatedArticles.length > 0 && (
        <section className="mt-6 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 md:mt-8 md:rounded-[2rem] md:p-8">
          <div className="text-xs font-black text-slate-400">次に読みたい記事</div>
          <h2 className="mt-2 text-xl font-black text-trust-navy md:text-2xl">セッティングの見方を深める</h2>
          <div className="mt-4 grid gap-3 md:mt-5 md:gap-4 md:grid-cols-3">
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
                className="rounded-[1.25rem] bg-slate-50 p-4 text-left ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:bg-white md:rounded-[1.5rem] md:p-5"
              >
                <div className="text-[11px] font-black tracking-[0.12em] text-slate-500">
                  {articleTypeLabel[relatedArticle.articleType]}
                </div>
                <h3 className="mt-2 text-base font-black text-trust-navy md:text-lg">{relatedArticle.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 md:leading-7">{relatedArticle.excerpt}</p>
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
