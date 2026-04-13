import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Search,
  ShoppingCart,
  Star,
  Users,
  WandSparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';
import { profileCategories } from '../lib/profileMetadata';
import { getProfileVisuals } from '../lib/profileVisuals';
import { tournamentSpotlights } from '../lib/tournamentSpotlights';

const featuredSlugOrder = [
  'hideki-matsuyama',
  'ryo-ishikawa',
  'keita-nakajima',
  'hinako-shibuno',
  'ayaka-furue',
  'mao-saigo',
];

const kanaGroups = [
  { id: 'all', label: 'すべて' },
  { id: 'a', label: 'あ' },
  { id: 'ka', label: 'か' },
  { id: 'sa', label: 'さ' },
  { id: 'ta', label: 'た' },
  { id: 'na', label: 'な' },
  { id: 'ha', label: 'は' },
  { id: 'ma', label: 'ま' },
  { id: 'ya', label: 'や' },
  { id: 'ra', label: 'ら' },
  { id: 'wa', label: 'わ' },
] as const;

const heroImage =
  'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1920&q=80';

const marketingScene = (variant: 'library' | 'filter' | 'compare') =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    variant === 'library'
      ? `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0f3d2e"/>
              <stop offset="100%" stop-color="#14532d"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="720" fill="url(#bg)"/>
          <rect y="520" width="1200" height="200" fill="#3f8f55"/>
          <path d="M0 560 C180 500, 360 470, 600 520 S1000 620, 1200 540 L1200 720 L0 720 Z" fill="#2f6f40" opacity="0.9"/>
          <circle cx="960" cy="130" r="52" fill="#f8fafc" opacity="0.18"/>
          <g transform="translate(180 170)">
            <rect x="0" y="0" width="312" height="212" rx="24" fill="#08130f" opacity="0.5"/>
            <rect x="26" y="26" width="260" height="24" rx="12" fill="#cbd5e1" opacity="0.25"/>
            <rect x="26" y="72" width="220" height="20" rx="10" fill="#d1fae5" opacity="0.65"/>
            <rect x="26" y="110" width="188" height="18" rx="9" fill="#d1fae5" opacity="0.48"/>
            <rect x="26" y="146" width="168" height="18" rx="9" fill="#d1fae5" opacity="0.38"/>
          </g>
          <g transform="translate(735 145)">
            <path d="M58 0h28l16 192c1 20-16 37-36 37H15c-20 0-37-17-36-37L-6 0h27" fill="none" stroke="#f6d16f" stroke-width="14" stroke-linejoin="round"/>
            <path d="M68 0v-50" stroke="#f6d16f" stroke-width="12" stroke-linecap="round"/>
            <path d="M68 -50l48 10-48 16" fill="#f6d16f"/>
            <path d="M30 -8v-34" stroke="#f6d16f" stroke-width="10" stroke-linecap="round"/>
            <path d="M30 -42l34 7-34 14" fill="#f6d16f"/>
            <path d="M0 240c26 16 95 16 121 0" stroke="#f6d16f" stroke-width="10" stroke-linecap="round"/>
          </g>
          <circle cx="864" cy="540" r="14" fill="#ffffff"/>
          <circle cx="864" cy="540" r="4" fill="#cbd5e1"/>
        </svg>
      `
      : variant === 'filter'
        ? `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#082f49"/>
                <stop offset="100%" stop-color="#164e63"/>
              </linearGradient>
            </defs>
            <rect width="1200" height="720" fill="url(#bg)"/>
            <rect y="520" width="1200" height="200" fill="#3f8f55"/>
            <path d="M0 575 C180 500, 360 500, 620 560 S1030 620, 1200 545 L1200 720 L0 720 Z" fill="#2f6f40" opacity="0.85"/>
            <g transform="translate(130 112)">
              <rect width="372" height="304" rx="28" fill="#08131f" opacity="0.45"/>
              <rect x="30" y="34" width="156" height="18" rx="9" fill="#dbeafe" opacity="0.4"/>
              <rect x="30" y="78" width="118" height="18" rx="9" fill="#bfdbfe" opacity="0.8"/>
              <rect x="30" y="124" width="196" height="18" rx="9" fill="#bfdbfe" opacity="0.6"/>
              <rect x="30" y="176" width="258" height="20" rx="10" fill="#f8fafc" opacity="0.18"/>
              <circle cx="316" cy="186" r="34" fill="#34d399"/>
              <circle cx="316" cy="186" r="14" fill="#f8fafc"/>
            </g>
            <g transform="translate(685 70)">
              <circle cx="164" cy="116" r="42" fill="#f8fafc" opacity="0.12"/>
              <path d="M170 130c-28 26-41 50-44 112" stroke="#f6d16f" stroke-width="14" stroke-linecap="round"/>
              <path d="M150 132c64-16 100-46 132-94" stroke="#f6d16f" stroke-width="14" stroke-linecap="round"/>
              <path d="M126 244c36 9 74 9 116 0" stroke="#f6d16f" stroke-width="12" stroke-linecap="round"/>
              <rect x="30" y="252" width="212" height="120" rx="24" fill="#07141f" opacity="0.45"/>
              <path d="M68 332c20-22 41-34 64-34 21 0 35 8 51 24 8 8 18 10 30 5" fill="none" stroke="#86efac" stroke-width="12" stroke-linecap="round"/>
              <path d="M70 292h150" stroke="#cbd5e1" stroke-width="10" stroke-linecap="round" opacity="0.35"/>
            </g>
          </svg>
        `
        : `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#172554"/>
                <stop offset="100%" stop-color="#1d4ed8"/>
              </linearGradient>
            </defs>
            <rect width="1200" height="720" fill="url(#bg)"/>
            <rect y="520" width="1200" height="200" fill="#3f8f55"/>
            <path d="M0 580 C160 528, 380 520, 615 570 S1010 628, 1200 550 L1200 720 L0 720 Z" fill="#2f6f40" opacity="0.88"/>
            <g transform="translate(114 110)">
              <rect width="408" height="292" rx="30" fill="#08131f" opacity="0.38"/>
              <rect x="36" y="42" width="144" height="18" rx="9" fill="#dbeafe" opacity="0.34"/>
              <rect x="36" y="100" width="58" height="132" rx="18" fill="#93c5fd"/>
              <rect x="116" y="132" width="58" height="100" rx="18" fill="#bfdbfe"/>
              <rect x="196" y="80" width="58" height="152" rx="18" fill="#34d399"/>
              <rect x="276" y="58" width="58" height="174" rx="18" fill="#f6d16f"/>
            </g>
            <g transform="translate(728 108)">
              <path d="M40 318c72-30 126-74 174-142" fill="none" stroke="#f6d16f" stroke-width="14" stroke-linecap="round"/>
              <circle cx="44" cy="318" r="16" fill="#ffffff"/>
              <path d="M182 82c10-18 21-28 33-28 13 0 23 5 30 15" fill="none" stroke="#f6d16f" stroke-width="12" stroke-linecap="round"/>
              <path d="M257 298c-46 0-84-15-116-47" fill="none" stroke="#f6d16f" stroke-width="14" stroke-linecap="round"/>
              <path d="M238 328c-42-46-73-75-114-108" fill="none" stroke="#e2e8f0" stroke-width="10" stroke-linecap="round" opacity="0.5"/>
            </g>
          </svg>
        `
  );

const features = [
  {
    step: '01',
    title: '今の14本を一気に把握',
    description:
      '有名プロがいま使っているドライバー、アイアン、ボール、飛距離の目安まで、1ページで素早く確認できます。',
    image: marketingScene('library'),
    icon: Search,
    accent: 'bg-emerald-50 text-emerald-600',
    ctaLabel: '人気プロを見る',
    ctaHref: '/settings/pros',
  },
  {
    step: '02',
    title: '自分に近い条件で絞る',
    description:
      'ヘッドスピードやカテゴリから候補を絞り、参考にすべきセッティングを最短で見つけられます。',
    image: marketingScene('filter'),
    icon: BrainCircuit,
    accent: 'bg-blue-50 text-blue-600',
    ctaLabel: '条件で探す',
    ctaHref: '/settings/pros',
  },
  {
    step: '03',
    title: '比較して次の1本を決める',
    description:
      '気になるプロやクラブを比較しながら、自分のバッグに落とし込む候補整理までつなげられます。',
    image: marketingScene('compare'),
    icon: BarChart3,
    accent: 'bg-amber-50 text-amber-500',
    ctaLabel: '比較を始める',
    ctaHref: '/compare',
  },
];

export const Home = () => {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [activeCategory, setActiveCategory] = useState<(typeof profileCategories)[number]['id']>('all');
  const [activeKana, setActiveKana] = useState<(typeof kanaGroups)[number]['id']>('all');
  const [profiles, setProfiles] = useState<PublicSettingProfile[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      const data = await fetchPublishedSettingProfiles();
      if (isMounted) {
        setProfiles(data);
      }
    };

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredProfiles = useMemo(() => {
    const prioritized = featuredSlugOrder
      .map((slug) => profiles.find((profile) => profile.slug === slug))
      .filter(Boolean) as PublicSettingProfile[];

    const fallback = profiles.filter((profile) => !featuredSlugOrder.includes(profile.slug)).slice(0, 6 - prioritized.length);
    return [...prioritized, ...fallback].slice(0, 6);
  }, [profiles]);

  const handleSearch = () => {
    const query = searchName.trim();
    trackEvent('search_setting_profile', {
      source_page: 'home_hero',
      search_term: query || 'all',
    });
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (activeKana !== 'all') params.set('kana', activeKana);
    navigate(params.toString() ? `/settings/pros?${params.toString()}` : '/settings/pros');
  };

  return (
    <div className="min-h-screen space-y-8 pb-16 md:space-y-12">
      <section className="relative isolate overflow-hidden rounded-[2rem] shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
        <img
          src={heroImage}
          alt="ゴルフバッグとクラブセッティングのイメージ"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.28),transparent_28%)]" />

        <div className="relative flex min-h-[500px] items-center px-4 py-8 md:min-h-[640px] md:px-8 md:py-12">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] text-white/85 backdrop-blur">
              <Star size={12} className="text-emerald-300" />
              PRO SETTINGS
            </div>

            <h1 className="mt-4 max-w-3xl text-[2rem] font-black leading-[1.08] tracking-tight text-white md:mt-6 md:text-6xl">
              プロの14本から、
              <br className="hidden md:block" />
              自分の次の1本を見つける。
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 md:mt-5 md:text-lg md:leading-8">
              選手名やカテゴリから探して、比較や診断まで一気につなげられます。
            </p>

            <div className="mt-5 max-w-2xl rounded-[1.5rem] border border-white/15 bg-white/10 p-3 backdrop-blur md:mt-7 md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1rem] bg-white px-4 py-3 shadow-lg shadow-slate-950/15">
                  <Search className="shrink-0 text-slate-400" size={20} />
                  <input
                    value={searchName}
                    onChange={(event) => setSearchName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleSearch();
                    }}
                    placeholder="選手名を入力"
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 md:text-base"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-trust-navy px-5 text-sm font-black text-white transition hover:bg-slate-800 md:text-base"
                >
                  検索する
                </button>
              </div>
              <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {profileCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      activeCategory === category.id
                        ? 'bg-white text-trust-navy'
                        : 'border border-white/15 bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {kanaGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveKana(group.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      activeKana === group.id
                        ? 'bg-emerald-300 text-trust-navy'
                        : 'border border-white/15 bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row">
              <button
                onClick={() => {
                  trackEvent('start_ai_diagnosis', {
                    source_page: 'home_hero',
                    destination: 'diagnosis',
                  });
                  navigate('/diagnosis');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-green-600 md:px-8 md:py-4 md:text-lg"
              >
                <WandSparkles size={18} />
                診断を始める
              </button>

              <button
                onClick={() => {
                  trackEvent('select_content_group', {
                    source_page: 'home_hero',
                    target_type: 'pros_library',
                  });
                  navigate('/settings/pros');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-blue-700 md:px-8 md:py-4 md:text-lg"
              >
                <Users size={18} />
                プロのセッティングを見る
              </button>
            </div>

          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white px-4 py-8 shadow-sm md:px-10 md:py-12">
        <div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.18em] text-amber-600">TOURNAMENT SPOTLIGHT</div>
              <h2 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl">
                今週の大会で追うべき注目セッティング
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base md:leading-7">
                今週の大会で見ておきたい選手のセッティング特集を、ツアー別にまとめています。
              </p>
            </div>

            <button
              onClick={() => navigate('/articles')}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-trust-navy transition hover:border-slate-300 hover:bg-slate-50"
            >
              特集記事一覧へ
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-6 grid gap-3 xl:grid-cols-4">
            {tournamentSpotlights.map((spotlight) => (
              <button
                key={spotlight.articleSlug}
                onClick={() => {
                  trackEvent('select_article', {
                    source_page: 'home_tournament_spotlight',
                    article_slug: spotlight.articleSlug,
                    article_title: `${spotlight.tourLabel} ${spotlight.tournamentName}`,
                  });
                  navigate(`/articles/${spotlight.articleSlug}`);
                }}
                className="group rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(160deg,#ffffff_0%,#f8fafc_55%,#eff6ff_100%)] p-4 text-left transition-all hover:-translate-y-1 hover:border-golf-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black tracking-[0.14em] text-slate-500">{spotlight.tourLabel}</div>
                    <h3 className="mt-2 text-xl font-black text-trust-navy">{spotlight.tournamentName}</h3>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-700">
                    {spotlight.statusLabel}
                  </span>
                </div>
                <div className="mt-4 text-sm font-bold text-slate-500">{spotlight.eventDates}</div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{spotlight.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {spotlight.featuredPlayerSlugs.slice(0, 3).map((playerSlug) => {
                    const profile = profiles.find((item) => item.slug === playerSlug);
                    return (
                      <span
                        key={playerSlug}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm"
                      >
                        {profile?.name || playerSlug}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-golf-700 transition group-hover:translate-x-0.5">
                  記事を読む
                  <ArrowRight size={15} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="pro-settings" className="rounded-[2rem] bg-white px-4 py-8 shadow-sm md:px-10 md:py-12">
        <div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.18em] text-emerald-600">POPULAR SETTINGS</div>
              <h2 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl">よく見られているプロのセッティング</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base md:leading-7">
                よく見られている選手から、いま使っているクラブ構成をすぐ確認できます。
              </p>
            </div>

            <button
              onClick={() => navigate('/settings/pros')}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-trust-navy transition hover:border-slate-300 hover:bg-slate-50"
            >
              一覧をすべて見る
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featuredProfiles.map((pro) => (
              <article
                key={pro.slug}
                className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-4 border-b border-gray-100 bg-white p-4">
                  <img
                    src={getProfileVisuals(pro.slug, pro.instagramHandle, { preferInstagramPortrait: true }).portrait}
                    alt={`${pro.name}のプレースホルダー画像`}
                    className="h-16 w-16 rounded-full border border-slate-200 bg-slate-50 object-cover p-2"
                    onError={(event) => {
                      const visuals = getProfileVisuals(pro.slug, pro.instagramHandle, { preferInstagramPortrait: true });
                      const fallbackSrc = visuals.portraitMedia?.fallbackSrc;
                      if (!fallbackSrc) return;
                      const target = event.currentTarget;
                      if (target.src === fallbackSrc) return;
                      target.src = fallbackSrc;
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-800">
                        {pro.categoryLabel}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">{pro.contractLabel}</div>
                    </div>
                    <h3 className="mt-2 text-lg font-black text-gray-900">{pro.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600">{pro.tagline}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid gap-2">
                    {pro.clubs.slice(0, 3).map((club) => (
                      <div
                        key={`${pro.slug}-${club.category}`}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm"
                      >
                        <span className="shrink-0 font-bold text-slate-900">{club.specLabel || club.category}</span>
                        <span className="truncate text-right text-slate-600">{club.model}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      trackEvent('select_setting_profile', {
                        source_page: 'home_popular_pros',
                        profile_slug: pro.slug,
                      });
                      navigate(`/settings/pros/${pro.slug}`);
                    }}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-trust-navy py-3 font-black text-white transition hover:bg-slate-800"
                  >
                    詳細を見る
                    <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="rounded-[2rem] bg-white px-4 py-8 shadow-sm md:px-10 md:py-12">
        <div>
          <div className="text-center">
            <div className="text-[11px] font-black tracking-[0.16em] text-emerald-600">WHY MY BAG PRO</div>
            <h2 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl">探す、絞る、比較するを1つに</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600 md:text-base md:leading-7">
              まずはプロの14本を知り、自分に近い条件で候補を絞って、次の1本の判断につなげます。
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="text-center">
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                    <img
                      src={feature.image}
                      alt={`${feature.title}をイメージしたプレースホルダー画像`}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-5">
                      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${feature.accent}`}>
                        <Icon size={28} />
                      </div>
                      <div className="mt-4 text-[11px] font-black tracking-[0.16em] text-slate-400">
                        STEP {feature.step}
                      </div>
                      <h3 className="mt-2 text-xl font-black text-gray-900">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-gray-600">{feature.description}</p>
                      <button
                        onClick={() => navigate(feature.ctaHref)}
                        className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-trust-navy transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        {feature.ctaLabel}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-10 grid gap-4 rounded-[2rem] bg-slate-950 p-5 text-white md:grid-cols-3 md:p-6">
            {[
              {
                icon: Search,
                title: '探して知る',
                text: 'まずは気になる選手やブランドから入り、今どのモデルが実戦投入されているかを素早く把握する。',
              },
              {
                icon: BrainCircuit,
                title: '自分に当てはめる',
                text: 'ヘッドスピードや好みの系統に照らして、自分が参考にすべきセッティングだけに絞り込む。',
              },
              {
                icon: ShoppingCart,
                title: '比較して検討する',
                text: '候補の違いを整理しながら、比較・診断・購入検討へそのままつなげて迷いを減らす。',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/80">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
