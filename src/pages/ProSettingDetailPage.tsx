import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Instagram,
  Newspaper,
  PlayCircle,
  ShoppingBag,
  Twitter,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDriverDetailBySlug } from '../data/featuredSettings';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedArticles, type PublicArticle } from '../lib/articles';
import { fetchPublishedSettingProfileBySlug, type PublicProfileSource, type PublicSettingProfile } from '../lib/contentProfiles';
import { getProfileVisuals } from '../lib/profileVisuals';
import { applySeo, getSeoPath, removeStructuredData, setStructuredData, toAbsoluteUrl } from '../lib/seo';

const formatClubLabel = (category: string, specLabel?: string) => {
  if (specLabel) return specLabel;
  if (category === 'Driver') return '1W';
  if (category === 'Putter') return 'PT';
  return category;
};

const formatDistance = (carryDistance?: number | null, totalDistance?: number | null) => {
  if (carryDistance && totalDistance) {
    return `${carryDistance} / ${totalDistance}`;
  }
  if (carryDistance) return `${carryDistance}`;
  if (totalDistance) return `${totalDistance}`;
  return '未公開';
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
      if (pathMatch?.[2]) {
        return `https://www.youtube.com/embed/${pathMatch[2]}`;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const sourceTypeLabel: Record<string, string> = {
  official: '公式情報',
  youtube: 'YouTube',
  instagram: 'Instagram',
  article: '掲載記事',
  tour_photo: '実戦写真',
  manual: '確認メモ',
};

const sourceActionLabel: Record<string, string> = {
  official: '公式ページを見る',
  youtube: '動画を見る',
  instagram: 'Instagramを見る',
  article: '記事を開く',
  tour_photo: '写真を見る',
  manual: '確認内容を見る',
};

const formatCheckedAt = (checkedAt?: string | null) => {
  if (!checkedAt) return '確認日未設定';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(checkedAt));
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
          item: {
            '@type': 'Product',
            name: club.model,
            brand: club.brand || undefined,
            additionalProperty: [
              club.loft
                ? {
                    '@type': 'PropertyValue',
                    name: 'Loft',
                    value: club.loft,
                  }
                : null,
              club.shaftFlex
                ? {
                    '@type': 'PropertyValue',
                    name: 'Flex',
                    value: club.shaftFlex,
                  }
                : null,
              club.carryDistance || club.totalDistance
                ? {
                    '@type': 'PropertyValue',
                    name: 'Distance',
                    value: formatDistance(club.carryDistance, club.totalDistance),
                  }
                : null,
            ].filter(Boolean),
          },
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
        <p className="mt-3 text-sm text-slate-600">掲載プロフィールを確認中です。</p>
      </div>
    );
  }

  if (!setting) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">セッティングが見つかりません。</h1>
        <p className="mt-3 text-sm text-slate-600">ここには将来的に個別のプロ詳細ページが入ります。</p>
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
  const driverDetail = driverClub?.productSlug
    ? getDriverDetailBySlug(driverClub.productSlug)
    : undefined;
  const youtubeSource = setting.sources.find((source) => source.type === 'youtube');
  const instagramSource = setting.sources.find((source) => source.type === 'instagram');
  const officialSource = setting.sources.find((source) => source.type === 'official');
  const articleSources = setting.sources.filter((source) => source.type === 'article').slice(0, 2);
  const primaryYoutubeEmbed = youtubeSource ? getYoutubeEmbedUrl(youtubeSource.url) : null;
  const leadSources = [youtubeSource, instagramSource, officialSource, ...articleSources]
    .filter((source): source is PublicProfileSource => Boolean(source))
    .filter((source, index, self) => self.findIndex((item) => item.url === source.url) === index)
    .slice(0, 4);
  const channelLinks: Array<{ label: string; url: string; icon: typeof Globe }> = [];
  if (setting.websiteUrl) {
    channelLinks.push({ label: '公式サイト', url: setting.websiteUrl, icon: Globe });
  }
  const youtubeChannelUrl = setting.youtubeChannel ? toChannelUrl(setting.youtubeChannel, 'youtube') : undefined;
  if (youtubeChannelUrl) {
    channelLinks.push({ label: 'YouTube', url: youtubeChannelUrl, icon: PlayCircle });
  }
  const instagramChannelUrl = setting.instagramHandle ? toChannelUrl(setting.instagramHandle, 'instagram') : undefined;
  if (instagramChannelUrl) {
    channelLinks.push({ label: 'Instagram', url: instagramChannelUrl, icon: Instagram });
  }
  const xChannelUrl = setting.xHandle ? toChannelUrl(setting.xHandle, 'x') : undefined;
  if (xChannelUrl) {
    channelLinks.push({ label: 'X', url: xChannelUrl, icon: Twitter });
  }

  const visuals = getProfileVisuals(setting.slug);

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

              {channelLinks.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
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
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/90 transition-colors hover:bg-white/10"
                      >
                        <Icon size={15} />
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-black text-slate-400">区分</div>
                  <div className="mt-2 text-base font-black text-white">{setting.categoryLabel}</div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-black text-slate-400">契約区分</div>
                  <div className="mt-2 text-base font-black text-white">{setting.contractLabel}</div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-black text-slate-400">ヘッドスピード</div>
                  <div className="mt-2 text-base font-black text-white">{setting.headSpeed}</div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-black text-slate-400">平均スコア</div>
                  <div className="mt-2 text-base font-black text-white">{setting.averageScore}</div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-[11px] font-black text-slate-400">使用ボール</div>
                  <div className="mt-2 text-base font-black text-white">{setting.ball}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden">
            <img src={visuals.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.72)_100%)]" />
            <div className="absolute bottom-6 left-6 right-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur">
                <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">使用ドライバー</div>
                <div className="mt-2 text-sm font-black text-white">{driverClub ? driverClub.model : '未公開'}</div>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur">
                <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">使用ボール</div>
                <div className="mt-2 text-sm font-black text-white">{setting.ball}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 md:px-8">
            <h2 className="text-2xl font-black text-trust-navy">動画・公式・掲載記事</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">確認できたソースだけを掲載しています。</p>
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
                <h3 className="text-3xl font-black tracking-tight">確認済みの動画は順次追加しています。</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  現在は公式プロフィールと掲載記事を中心に公開しています。動画ソースが確認できた選手から順に表示します。
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.16em] text-slate-400">
            <Newspaper size={14} />
            確認済みソース
          </div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">このページの掲載根拠</h2>

          <div className="mt-5 space-y-3">
            {leadSources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackEvent('open_profile_source', {
                    source_page: 'pro_setting_detail',
                    profile_slug: setting.slug,
                    profile_name: setting.name,
                    source_type: source.type,
                    source_title: source.title,
                  })
                }
                className="block rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-golf-300 hover:bg-white"
              >
                <div className="text-[11px] font-black tracking-[0.16em] text-slate-400">
                  {sourceTypeLabel[source.type] || '確認ソース'}
                </div>
                <h3 className="mt-2 text-base font-black text-trust-navy">{source.title}</h3>
                <div className="mt-2 text-xs font-bold text-slate-400">確認日: {formatCheckedAt(source.checkedAt)}</div>
                {source.notes && <p className="mt-2 text-sm leading-7 text-slate-600">{source.notes}</p>}
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-black text-golf-700">
                  {sourceActionLabel[source.type] || '開く'}
                  <ArrowRight size={14} />
                </div>
              </a>
            ))}

            {leadSources.length === 0 && (
              <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                現在は表と掲載記事を中心に公開しています。動画や画像のソースが確認できた選手から順次追加します。
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-[1.45fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="mt-3 text-2xl font-black text-trust-navy">14本の構成をひと目で確認する</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            クラブ名、シャフト、ロフト、硬さ、飛距離までを一覧で見られるようにしています。まずは全体の並び方を見て、気になる番手を詳しく確認してください。
          </p>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="hidden bg-slate-100 md:grid md:grid-cols-[0.7fr_2fr_2.2fr_1fr_1fr_1.2fr]">
              {['クラブ', 'クラブ名', 'シャフト', 'ロフト(度)', '硬さ', '飛距離(Y)'].map((heading) => (
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
                    className={`w-full text-left ${
                      isDriver && driverDetail ? 'transition-colors hover:bg-cyan-50' : ''
                    }`}
                  >
                    <div className="grid gap-3 px-4 py-4 md:grid-cols-[0.7fr_2fr_2.2fr_1fr_1fr_1.2fr] md:items-center">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">クラブ</div>
                        <div className="text-sm font-black text-trust-navy">{formatClubLabel(club.category, club.specLabel)}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">クラブ名</div>
                        <div className="text-sm font-bold text-trust-navy">{club.model}</div>
                        {club.brand && <div className="mt-1 text-xs text-slate-500">{club.brand}</div>}
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">シャフト</div>
                        <div className="text-sm font-bold text-slate-700">{shaftLabel || '未公開'}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">ロフト(度)</div>
                        <div className="text-sm font-bold text-slate-700">{club.loft || '未公開'}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">硬さ</div>
                        <div className="text-sm font-bold text-slate-700">{club.shaftFlex || '未公開'}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">飛距離(Y)</div>
                        <div className="text-sm font-bold text-slate-700">{formatDistance(club.carryDistance, club.totalDistance)}</div>
                        {(club.carryDistance || club.totalDistance) && (
                          <div className="mt-1 text-[11px] text-slate-500">carry / total</div>
                        )}
                      </div>
                    </div>
                    {isDriver && driverDetail && (
                      <div className="px-4 pb-4">
                        <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-golf-700">
                          ドライバー詳細を見る
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-6">
            <h2 className="text-xl font-black text-trust-navy">このあとできること</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              気になる構成を見つけたら、そのまま比較や診断へ進めます。使っているドライバーが気になるときは購入比較にも移動できます。
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {driverDetail && (
                <button
                  onClick={() => {
                    trackEvent('view_buy_options', {
                      source_page: 'pro_setting_detail',
                      profile_slug: setting.slug,
                      profile_name: setting.name,
                      product_slug: driverDetail.slug,
                      product_name: `${driverDetail.brand} ${driverDetail.name}`,
                      category: 'drivers',
                    });
                    navigate(`/buy/drivers/${driverDetail.slug}`);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-trust-navy ring-1 ring-cyan-200"
                >
                  <ShoppingBag size={16} />
                  使用ドライバーの購入先を見る
                </button>
              )}
              <button
                onClick={() => {
                  trackEvent('start_setting_compare', {
                    source_page: 'pro_setting_detail',
                    profile_slug: setting.slug,
                    profile_name: setting.name,
                  });
                  navigate(`/compare?setting=${setting.slug}`);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
              >
                自分のバッグと比べる
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  trackEvent('start_ai_diagnosis', {
                    source_page: 'pro_setting_detail',
                    reference_profile_slug: setting.slug,
                    reference_profile_name: setting.name,
                  });
                  navigate('/diagnosis');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300 px-5 py-3 text-sm font-black text-cyan-700"
              >
                この構成を参考にAI診断する
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-8">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-black text-slate-400">
            <Newspaper size={14} />
            関連記事
          </div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">このセッティングと一緒に読みたい記事</h2>
          <div className="mt-5 space-y-4">
            {relatedArticles.map((article) => (
              <button
                key={article.slug}
                onClick={() => {
                  trackEvent('select_article', {
                    source_page: 'pro_setting_detail',
                    profile_slug: setting.slug,
                    profile_name: setting.name,
                    article_slug: article.slug,
                    article_title: article.title,
                  });
                  navigate(`/articles/${article.slug}`);
                }}
                className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                <h3 className="text-base font-black text-trust-navy">{article.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{article.excerpt}</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-black text-golf-700">
                  記事を読む
                  <ArrowRight size={14} />
                </div>
              </button>
            ))}
            {relatedArticles.length === 0 && (
              <p className="rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                このセッティングの見方や比較の使い方に関する記事を順次追加していきます。
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};
