import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Globe, Instagram, PlayCircle, ShoppingBag, Twitter } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDriverDetailBySlug } from '../data/featuredSettings';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedArticles, type PublicArticle } from '../lib/articles';
import { fetchPublishedSettingProfileBySlug, type PublicSettingProfile } from '../lib/contentProfiles';
import { getProfileVisuals } from '../lib/profileVisuals';
import { applySeo, getSeoPath, removeStructuredData, setStructuredData, toAbsoluteUrl } from '../lib/seo';

const formatClubLabel = (category: string, specLabel?: string) => {
  if (specLabel) return specLabel;
  if (category === 'Driver') return '1W';
  if (category === 'Putter') return 'PT';
  return category;
};

const formatDistance = (carryDistance?: number | null, totalDistance?: number | null) => {
  if (carryDistance && totalDistance) return `${carryDistance} / ${totalDistance}`;
  if (carryDistance) return `${carryDistance}`;
  if (totalDistance) return `${totalDistance}`;
  return '未公開';
};

const formatBirthplace = (birthplace?: string | null, nationality?: string | null) => {
  if (birthplace && nationality && !birthplace.includes(nationality)) {
    return `${birthplace}（${nationality}）`;
  }
  return birthplace || nationality || '未公開';
};

const getYoutubeEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const pathMatch = parsed.pathname.match(/^\/(embed|shorts)\/([^/?]+)/);
      if (pathMatch?.[2]) return `https://www.youtube.com/embed/${pathMatch[2]}`;
    }
  } catch {
    return null;
  }
  return null;
};

const toChannelUrl = (value: string, platform: 'youtube' | 'instagram' | 'x') => {
  if (/^https?:\/\//.test(value)) return value;
  const normalized = value.replace(/^@/, '').trim();
  if (!normalized) return undefined;
  if (platform === 'youtube') return `https://www.youtube.com/${normalized}`;
  if (platform === 'instagram') return `https://www.instagram.com/${normalized}/`;
  return `https://x.com/${normalized}`;
};

const evergreenPrioritySlugs = [
  'how-to-read-pro-setting-pages',
  'how-to-use-setting-compare',
  'why-14-clubs-matter',
  'driver-diagnosis-purpose',
  'what-to-check-before-publishing-profile',
];

const articleTypeLabel: Record<'news' | 'update' | 'column', string> = {
  news: 'お知らせ',
  update: '更新情報',
  column: '読みもの',
};

const pickRecommendedArticles = (articles: PublicArticle[], profileName: string) => {
  const directMatches = articles.filter(
    (article) =>
      article.title.includes(profileName) ||
      article.excerpt.includes(profileName) ||
      article.body.includes(profileName)
  );

  const evergreenMatches = evergreenPrioritySlugs
    .map((targetSlug) => articles.find((article) => article.slug === targetSlug))
    .filter(Boolean) as PublicArticle[];

  return [...directMatches, ...evergreenMatches]
    .filter((article, index, self) => self.findIndex((item) => item.slug === article.slug) === index)
    .slice(0, 3);
};

export const ProSettingDetailPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [setting, setSetting] = useState<PublicSettingProfile | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<PublicArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSetting = async () => {
      if (!slug) {
        setSetting(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const profile = await fetchPublishedSettingProfileBySlug(slug);
      if (isMounted) {
        setSetting(profile);
        setIsLoading(false);
      }
    };

    loadSetting();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    if (!setting) {
      removeStructuredData('profile-page');
      applySeo({
        title: 'プロのクラブセッティング詳細',
        description: '確認済みの14本のクラブセッティング詳細ページです。',
        path: getSeoPath(`/settings/pros/${slug}`),
      });
      return;
    }

    applySeo({
      title: `${setting.name}のクラブセッティング`,
      description: `${setting.name}の確認済み14本セッティング。使用ボールやシャフト情報まで見られます。`,
      path: getSeoPath(`/settings/pros/${slug}`),
    });

    setStructuredData('profile-page', {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: `${setting.name}のクラブセッティング`,
      description: `${setting.name}の確認済み14本セッティング。使用ボールやシャフト情報まで見られます。`,
      url: toAbsoluteUrl(getSeoPath(`/settings/pros/${slug}`)),
      mainEntity: {
        '@type': 'Person',
        name: setting.name,
        description: setting.summary,
        additionalType: setting.type,
      },
      hasPart: {
        '@type': 'ItemList',
        name: `${setting.name}の14本セッティング`,
        numberOfItems: setting.clubs.length,
        itemListElement: setting.clubs.map((club, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${formatClubLabel(club.category, club.specLabel)} ${club.model}`,
        })),
      },
    });
  }, [setting, slug]);

  useEffect(() => () => removeStructuredData('profile-page'), []);

  useEffect(() => {
    let isMounted = true;

    const loadArticles = async () => {
      if (!setting) {
        setRelatedArticles([]);
        return;
      }

      const articles = await fetchPublishedArticles({ limit: 50 });
      if (isMounted) {
        setRelatedArticles(pickRecommendedArticles(articles, setting.name));
      }
    };

    loadArticles();
    return () => {
      isMounted = false;
    };
  }, [setting]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">セッティングを読み込んでいます。</h1>
      </div>
    );
  }

  if (!setting) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">セッティングが見つかりません。</h1>
        <button
          onClick={() => navigate('/settings/pros')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
        >
          一覧へ戻る
        </button>
      </div>
    );
  }

  const driverClub = setting.clubs.find((club) => club.category === 'Driver');
  const driverDetail = driverClub?.productSlug ? getDriverDetailBySlug(driverClub.productSlug) : undefined;
  const youtubeSource = setting.sources.find((source) => source.type === 'youtube');
  const primaryYoutubeEmbed = youtubeSource ? getYoutubeEmbedUrl(youtubeSource.url) : null;
  const channelLinks: Array<{ label: string; url: string; icon: typeof Globe }> = [];
  if (setting.websiteUrl) channelLinks.push({ label: '公式サイト', url: setting.websiteUrl, icon: Globe });
  const youtubeChannelUrl = setting.youtubeChannel ? toChannelUrl(setting.youtubeChannel, 'youtube') : undefined;
  if (youtubeChannelUrl) channelLinks.push({ label: 'YouTube', url: youtubeChannelUrl, icon: PlayCircle });
  const instagramChannelUrl = setting.instagramHandle ? toChannelUrl(setting.instagramHandle, 'instagram') : undefined;
  if (instagramChannelUrl) channelLinks.push({ label: 'Instagram', url: instagramChannelUrl, icon: Instagram });
  const xChannelUrl = setting.xHandle ? toChannelUrl(setting.xHandle, 'x') : undefined;
  if (xChannelUrl) channelLinks.push({ label: 'X', url: xChannelUrl, icon: Twitter });

  const visuals = getProfileVisuals(setting.slug);
  const profileFacts = [
    { label: 'ふりがな', value: setting.kanaName || '未公開' },
    { label: '年齢', value: setting.age ? `${setting.age}歳` : '未公開' },
    { label: '生年月日', value: setting.birthDate || '未公開' },
    { label: '性別', value: setting.genderLabel },
    { label: '出身地', value: formatBirthplace(setting.birthplace, setting.nationality) },
    { label: '契約区分', value: setting.contractDisplay },
  ];

  return (
    <div className="min-h-screen pb-20">
      <button
        onClick={() => navigate('/settings/pros')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={16} />
        プロ一覧へ戻る
      </button>

      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
          <div className="px-6 py-10 md:px-10 md:py-14">
            <div className="max-w-4xl">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black text-cyan-200">
                {setting.type}
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{setting.name}</h1>
              <p className="mt-4 text-lg font-bold text-cyan-200">{setting.tagline}</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">{setting.summary}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {profileFacts.map((fact) => (
                  <div key={fact.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-[11px] font-black text-slate-400">{fact.label}</div>
                    <div className="mt-2 text-base font-black text-white">{fact.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden">
            <img src={visuals.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.72)_100%)]" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur">
                <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">使用ドライバー</div>
                <div className="mt-2 text-sm font-black text-white">{driverClub ? driverClub.model : '未公開'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-black text-trust-navy">クラブセッティング</h2>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="hidden bg-slate-100 md:grid md:grid-cols-[0.7fr_2fr_2.2fr_1fr_1fr_1.2fr]">
              {['クラブ', 'クラブ名', 'シャフト', 'ロフト', '硬さ', '飛距離'].map((heading) => (
                <div key={heading} className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {heading}
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-200 bg-white">
              {setting.clubs.map((club, index) => {
                const isDriver = club.category === 'Driver';
                const shaftLabel = [club.shaftBrand, club.shaftModel].filter(Boolean).join(' ');
                return (
                  <button
                    key={`${setting.slug}-${club.category}-${club.specLabel || index}`}
                    onClick={() => {
                      if (isDriver && driverDetail) {
                        trackEvent('view_product_detail', {
                          source_page: 'pro_setting_detail',
                          profile_slug: setting.slug,
                          profile_name: setting.name,
                          product_slug: driverDetail.slug,
                          product_name: `${driverDetail.brand} ${driverDetail.name}`,
                          category: 'drivers',
                        });
                        navigate(`/clubs/drivers/${driverDetail.slug}`);
                      }
                    }}
                    className={`w-full text-left ${isDriver && driverDetail ? 'transition-colors hover:bg-cyan-50' : ''}`}
                  >
                    <div className="grid gap-3 px-4 py-4 md:grid-cols-[0.7fr_2fr_2.2fr_1fr_1fr_1.2fr] md:items-center">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">クラブ</div>
                        <div className="text-sm font-black text-trust-navy">{formatClubLabel(club.category, club.specLabel)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">クラブ名</div>
                        <div className="text-sm font-black text-trust-navy">{club.model}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">シャフト</div>
                        <div className="text-sm font-bold text-slate-600">{shaftLabel || '未公開'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">ロフト</div>
                        <div className="text-sm font-bold text-slate-600">{club.loft || '未公開'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">硬さ</div>
                        <div className="text-sm font-bold text-slate-600">{club.shaftFlex || '未公開'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">飛距離</div>
                        <div className="text-sm font-bold text-slate-600">{formatDistance(club.carryDistance, club.totalDistance)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 md:px-8">
            <h2 className="text-2xl font-black text-trust-navy">動画と公式リンク</h2>
          </div>

          {primaryYoutubeEmbed ? (
            <div className="aspect-video w-full bg-slate-950">
              <iframe
                src={primaryYoutubeEmbed}
                title={`${setting.name}のスイングまたはセッティング動画`}
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#111827_50%,#0b1120_100%)] px-6 py-10 text-white md:px-8 md:py-12">
              <div className="max-w-xl">
                <h3 className="text-3xl font-black tracking-tight">動画は順次追加しています。</h3>
              </div>
            </div>
          )}

          {channelLinks.length > 0 && (
            <div className="border-t border-slate-200 px-6 py-5 md:px-8">
              <div className="flex flex-wrap gap-3">
                {channelLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        trackEvent('open_profile_channel', {
                          source_page: 'pro_setting_detail',
                          profile_slug: setting.slug,
                          profile_name: setting.name,
                          channel_label: link.label,
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-white"
                    >
                      <Icon size={15} />
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {relatedArticles.length > 0 && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">ARTICLES</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-trust-navy">関連記事</h2>
            </div>
            <button
              onClick={() => navigate('/articles')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              記事一覧
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {relatedArticles.map((article) => (
              <button
                key={article.slug}
                onClick={() => navigate(`/articles/${article.slug}`)}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-golf-300 hover:bg-white"
              >
                <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">
                  {articleTypeLabel[article.articleType]}
                </div>
                <h3 className="mt-3 text-lg font-black tracking-tight text-trust-navy">{article.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{article.excerpt}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-golf-700">
                  記事を読む
                  <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {driverDetail && (
        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">DRIVER DETAIL</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-trust-navy">
                {driverDetail.brand} {driverDetail.name}
              </h2>
            </div>
            <button
              onClick={() => navigate(`/clubs/drivers/${driverDetail.slug}`)}
              className="inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              ドライバー詳細を見る
              <ShoppingBag size={16} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
