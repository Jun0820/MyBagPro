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

const formatDistanceForMode = (
  mode: 'carry' | 'total',
  carryDistance?: number | null,
  totalDistance?: number | null
) => {
  const value = mode === 'carry' ? carryDistance : totalDistance;
  if (typeof value === 'number') return `${value} yd`;
  return '未公開';
};

const formatStatLabel = (value?: string) => value || '未公開';

const formatSourceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    official: '公式',
    article: '記事',
    youtube: 'YouTube',
    instagram: 'Instagram',
    x: 'X',
    manual: '手動確認',
    tour_photo: '写真',
  };
  return labels[type] || type;
};

const simplifySourceNote = (value?: string | null) => {
  if (!value) return undefined;

  if (/trackman/i.test(value)) return 'TrackMan';
  if (/gc\s*quad|gcquad|foresight/i.test(value)) return 'GCQuad';
  if (/pga tour/i.test(value)) return 'PGA TOUR';
  if (/lpga/i.test(value)) return 'LPGA';
  if (/jgto/i.test(value)) return 'JGTO';
  if (/jlpga/i.test(value)) return 'JLPGA';
  if (/taylormade/i.test(value)) return 'TaylorMade';
  if (/callaway/i.test(value)) return 'Callaway';
  if (/titleist/i.test(value)) return 'Titleist';
  if (/golfwrx/i.test(value)) return 'GolfWRX';
  if (/gdo|golf digest/i.test(value)) return 'GDO';

  return value.replace(/\s+/g, ' ').trim().slice(0, 36);
};

const extractSourcePeriodTag = (setting: PublicSettingProfile) => {
  const summaryMonthMatch = setting.summary.match(/(20\d{2}年\d{1,2}月)/);
  if (summaryMonthMatch?.[1]) return summaryMonthMatch[1];

  const summaryYearMatch = setting.summary.match(/(20\d{2}年)/);
  if (summaryYearMatch?.[1]) return summaryYearMatch[1];

  const checkedAt = setting.sources.find((source) => source.checkedAt)?.checkedAt;
  if (!checkedAt) return setting.seasonYear ? `${setting.seasonYear}年` : null;

  const date = new Date(checkedAt);
  if (Number.isNaN(date.getTime())) return setting.seasonYear ? `${setting.seasonYear}年` : null;
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
};

const shortenTagline = (tagline: string) =>
  tagline
    .replace(/^\d{4}年取材・/, '')
    .replace(/^\d{4}年掲載・/, '')
    .replace(/注目セッティング/g, '注目')
    .trim();

const shortenSummary = (summary: string, name: string) =>
  summary
    .replace(new RegExp(`${name}の`, 'g'), '')
    .replace(/^\d{4}年[^。]*で確認できた/, '')
    .replace(/^\d{4}年[^。]*掲載。?/, '')
    .replace(/14本セッティング。?$/, '14本')
    .replace(/セッティング/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const formatBirthplace = (birthplace?: string | null, nationality?: string | null) => {
  const countryMap: Record<string, { label: string; flag: string }> = {
    Japan: { label: '日本', flag: '🇯🇵' },
    'United States': { label: 'アメリカ', flag: '🇺🇸' },
    Australia: { label: 'オーストラリア', flag: '🇦🇺' },
    Canada: { label: 'カナダ', flag: '🇨🇦' },
    'South Korea': { label: '韓国', flag: '🇰🇷' },
    Denmark: { label: 'デンマーク', flag: '🇩🇰' },
    Finland: { label: 'フィンランド', flag: '🇫🇮' },
    Austria: { label: 'オーストリア', flag: '🇦🇹' },
  };
  const prefectureMap: Record<string, string> = {
    Ehime: '愛媛県',
    Osaka: '大阪府',
    Miyagi: '宮城県',
    Yamaguchi: '山口県',
    Kagoshima: '鹿児島県',
    Okayama: '岡山県',
    Ibaraki: '茨城県',
    Fukuoka: '福岡県',
  };

  const hasJapaneseText = (value: string) => /[ぁ-んァ-ン一-龠々]/.test(value);

  if (nationality === 'Japan') {
    const raw = (birthplace || '').trim();
    if (raw && hasJapaneseText(raw)) return `${raw} 🇯🇵`;
    const base = raw.split(',')[0].trim();
    const normalized = prefectureMap[base] || base || '未公開';
    return normalized === '未公開' ? normalized : `${normalized} 🇯🇵`;
  }

  if (birthplace && hasJapaneseText(birthplace)) {
    return birthplace;
  }

  const country = nationality ? countryMap[nationality] : undefined;
  if (country) return `${country.label} ${country.flag}`;
  return nationality || birthplace || '未公開';
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
  const [distanceMode, setDistanceMode] = useState<'carry' | 'total'>('carry');

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
      removeStructuredData('profile-breadcrumbs');
      removeStructuredData('profile-faq');
      applySeo({
        title: 'プロのクラブセッティング詳細',
        description: '確認済みの14本のクラブセッティング詳細ページです。',
        path: getSeoPath(`/settings/pros/${slug}`),
      });
      return;
    }

    applySeo({
      title: `${setting.name}のクラブセッティング${setting.seasonYear ? ` ${setting.seasonYear}年` : ''}`,
      description: `${setting.name}のクラブセッティング詳細ページ。ドライバー、フェアウェイウッド、アイアン、ウェッジ、パター、使用ボール、契約メーカーまで確認できます。`,
      path: getSeoPath(`/settings/pros/${slug}`),
    });

    setStructuredData('profile-page', {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: `${setting.name}のクラブセッティング`,
      description: `${setting.name}のクラブセッティング詳細ページ。ドライバー、フェアウェイウッド、アイアン、ウェッジ、パター、使用ボール、契約メーカーまで確認できます。`,
      url: toAbsoluteUrl(getSeoPath(`/settings/pros/${slug}`)),
      mainEntity: {
        '@type': 'Person',
        name: setting.name,
        description: setting.summary,
        additionalType: setting.type,
        birthDate: setting.birthDate || undefined,
        nationality: setting.nationality || undefined,
        homeLocation: setting.birthplace || undefined,
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

    setStructuredData('profile-breadcrumbs', {
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
          name: 'プロのクラブセッティング一覧',
          item: toAbsoluteUrl('/settings/pros'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${setting.name}のクラブセッティング`,
          item: toAbsoluteUrl(getSeoPath(`/settings/pros/${slug}`)),
        },
      ],
    });

    setStructuredData('profile-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `${setting.name}のクラブセッティングでは何が確認できますか？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${setting.name}のドライバー、フェアウェイウッド、アイアン、ウェッジ、パター、使用ボール、契約メーカーを確認できます。`,
          },
        },
        {
          '@type': 'Question',
          name: `${setting.name}の契約メーカーはどこですか？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${setting.name}の契約メーカーは${setting.contractDisplay}です。`,
          },
        },
        {
          '@type': 'Question',
          name: `${setting.name}はどのボールとドライバーを使っていますか？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${setting.name}の使用ボールは${setting.ball}、掲載ドライバーは${driverClub ? driverClub.model : '未公開'}です。`,
          },
        },
      ],
    });
  }, [setting, slug]);

  useEffect(
    () => () => {
      removeStructuredData('profile-page');
      removeStructuredData('profile-breadcrumbs');
      removeStructuredData('profile-faq');
    },
    []
  );

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

  const visuals = getProfileVisuals(setting.slug, setting.instagramHandle);
  const sourcePeriodTag = extractSourcePeriodTag(setting);
  const profileFacts = [
    { label: '生年月日', value: setting.birthDate || '未公開' },
    { label: '出身地', value: formatBirthplace(setting.birthplace, setting.nationality) },
    { label: '契約', value: setting.contractDisplay },
    { label: 'ボール', value: setting.ball },
  ];
  const statCards = [
    { label: 'ヘッドスピード', value: formatStatLabel(setting.headSpeed) },
    { label: '平均スコア', value: formatStatLabel(setting.averageScore) },
    { label: 'ベストスコア', value: formatStatLabel(setting.bestScore) },
  ];
  const compactTagline = shortenTagline(setting.tagline);
  const compactSummary = shortenSummary(setting.summary, setting.name);

  return (
    <div className="min-h-screen overflow-x-hidden pb-20">
      <button
        onClick={() => navigate('/settings/pros')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={16} />
        プロ一覧へ戻る
      </button>

      <section className="overflow-hidden rounded-[1.75rem] bg-slate-950 text-white md:rounded-[2rem]">
        <div className="px-4 py-5 md:px-8 md:py-8">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black text-cyan-200">
              {setting.type}
            </div>
            {sourcePeriodTag && (
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black text-white/75">
                {sourcePeriodTag}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-3 md:gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-slate-200 md:h-24 md:w-24">
              {visuals.portraitMedia ? (
                <img
                  src={visuals.portraitMedia.src}
                  alt={visuals.portraitMedia.alt}
                  className="h-full w-full object-cover object-top"
                  onError={(event) => {
                    const fallbackSrc = visuals.portraitMedia?.fallbackSrc;
                    if (!fallbackSrc) return;
                    const target = event.currentTarget;
                    if (target.src === fallbackSrc) return;
                    target.src = fallbackSrc;
                  }}
                />
              ) : (
                <img src={visuals.hero} alt="" className="h-full w-full object-cover object-top" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {setting.kanaName && <div className="text-[11px] font-bold text-white/65 md:text-xs">{setting.kanaName}</div>}
              <h1 className="mt-1 text-[1.9rem] font-black leading-[1.03] tracking-tight md:text-5xl">
                {setting.name}
                {setting.age ? <span className="ml-2 text-base font-bold text-white/65 md:text-xl">({setting.age})</span> : null}
              </h1>
              <p className="mt-2 text-sm font-bold leading-6 text-cyan-200 md:text-base">{compactTagline}</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-300 md:max-w-3xl">{compactSummary}</p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {profileFacts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                <dt className="text-[10px] font-black tracking-[0.14em] text-slate-400">{fact.label}</dt>
                <dd className="mt-1 text-sm font-black leading-5 text-white">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/settings/pros?category=${setting.category}`)}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15 md:text-sm"
            >
              {setting.categoryLabel}
            </button>
            <button
              onClick={() => navigate('/settings/pros')}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15 md:text-sm"
            >
              一覧で探す
            </button>
            {relatedArticles.length > 0 && (
              <button
                onClick={() => navigate(`/articles/${relatedArticles[0].slug}`)}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15 md:text-sm"
              >
                関連記事
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 md:mt-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 md:rounded-[2rem] md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">PLAYER STATS</div>
              <h2 className="mt-2 text-2xl font-black text-trust-navy">スイングとスコア</h2>
            </div>
            <p className="text-sm leading-6 text-slate-500">
              公開ソース確認分のみ掲載。
            </p>
          </div>
          <div className="mt-4 grid gap-2.5 md:mt-5 md:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-[1.125rem] border border-slate-200 bg-slate-50 px-4 py-3.5 md:rounded-[1.25rem]">
                <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">{card.label}</div>
                <div className="mt-1.5 text-[1.75rem] font-black leading-none text-trust-navy md:text-2xl">{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 md:mt-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 md:rounded-[2rem] md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-trust-navy">クラブセッティング</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">飛距離はキャリーと総距離を切り替えて確認できます。</p>
            </div>
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 self-start">
              {[
                { id: 'carry', label: 'キャリー' },
                { id: 'total', label: '総距離' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDistanceMode(tab.id as 'carry' | 'total')}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    distanceMode === tab.id
                      ? 'bg-white text-trust-navy shadow-sm'
                      : 'text-slate-500 hover:text-trust-navy'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-slate-200 md:mt-5 md:rounded-[1.5rem]">
            <div className="hidden bg-slate-100 md:grid md:grid-cols-[0.7fr_1.2fr_2fr_2.2fr_1fr_1fr_1.2fr]">
              {['クラブ', 'メーカー', 'クラブ名', 'シャフト', 'ロフト', '硬さ', distanceMode === 'carry' ? 'キャリー' : '総距離'].map((heading) => (
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
                    <div className="hidden gap-3 px-4 py-4 md:grid md:grid-cols-[0.7fr_1.2fr_2fr_2.2fr_1fr_1fr_1.2fr] md:items-center">
                      <div>
                        <div className="text-sm font-black text-trust-navy">{formatClubLabel(club.category, club.specLabel)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-600">{club.brand || '未公開'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-trust-navy">{club.model}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-600">{shaftLabel || '未公開'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-600">{club.loft || '未公開'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-600">{club.shaftFlex || '未公開'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-600">
                          {formatDistanceForMode(distanceMode, club.carryDistance, club.totalDistance)}
                        </div>
                      </div>
                    </div>

                    <div className="md:hidden px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                            {formatClubLabel(club.category, club.specLabel)}
                          </div>
                          <div className="mt-1 text-base font-black leading-5 text-trust-navy">{club.model}</div>
                          <div className="mt-1 text-sm font-bold leading-5 text-slate-600">{club.brand || '未公開'}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[10px] font-black tracking-[0.14em] text-slate-400">
                            {distanceMode === 'carry' ? 'キャリー' : '総距離'}
                          </div>
                          <div className="mt-1 text-base font-black text-golf-700">
                            {formatDistanceForMode(distanceMode, club.carryDistance, club.totalDistance)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <div className="text-[10px] font-black tracking-[0.14em] text-slate-400">シャフト</div>
                          <div className="mt-0.5 font-bold leading-5 text-slate-600">{shaftLabel || '未公開'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-[0.14em] text-slate-400">ロフト / 硬さ</div>
                          <div className="mt-0.5 font-bold leading-5 text-slate-600">
                            {[club.loft || '未公開', club.shaftFlex || '未公開'].join(' / ')}
                          </div>
                        </div>
                      </div>

                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {setting.sources.length > 0 && (
        <section className="mt-4 md:mt-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 md:rounded-[2rem] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">SOURCE NOTES</div>
                <h2 className="mt-1.5 text-xl font-black text-trust-navy">確認ソース</h2>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                要点のみ表示
              </p>
            </div>
            <div className="mt-4 grid gap-2">
              {setting.sources.map((source) => (
                <div
                  key={`${source.type}-${source.url}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black tracking-[0.14em] text-slate-400">{formatSourceTypeLabel(source.type)}</div>
                      <div className="mt-1 truncate text-sm font-black text-trust-navy">{source.title}</div>
                    </div>
                    {source.checkedAt && (
                      <div className="shrink-0 text-[11px] font-bold text-slate-500">
                        {new Intl.DateTimeFormat('ja-JP').format(new Date(source.checkedAt))}
                      </div>
                    )}
                  </div>
                  {source.notes && <p className="mt-1 text-xs font-bold text-slate-500">{simplifySourceNote(source.notes)}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 md:mt-8">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm md:rounded-[2rem]">
          <div className="border-b border-slate-200 px-4 py-4 md:px-7">
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
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#111827_50%,#0b1120_100%)] px-4 py-7 text-white md:px-7 md:py-10">
              <div className="max-w-xl">
                <h3 className="text-2xl font-black tracking-tight">動画は順次追加しています。</h3>
              </div>
            </div>
          )}

          {channelLinks.length > 0 && (
            <div className="border-t border-slate-200 px-4 py-4 md:px-7">
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
        <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:mt-8 md:rounded-[2rem] md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">ARTICLES</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-trust-navy">関連記事</h2>
            </div>
            <button
              onClick={() => navigate('/articles')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              記事一覧
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {relatedArticles.map((article) => (
              <button
                key={article.slug}
                onClick={() => navigate(`/articles/${article.slug}`)}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-golf-300 hover:bg-white"
              >
                <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">
                  {articleTypeLabel[article.articleType]}
                </div>
                <h3 className="mt-2 text-base font-black tracking-tight text-trust-navy">{article.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-black text-golf-700">
                  記事を読む
                  <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {driverDetail && (
        <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:mt-8 md:rounded-[2rem] md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">DRIVER DETAIL</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-trust-navy">
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
