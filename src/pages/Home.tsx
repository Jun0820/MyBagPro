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
  { id: 'latin', label: 'A-Z' },
] as const;

const heroImage =
  'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1920&q=80';

const features = [
  {
    step: '01',
    title: 'AIクラブ診断',
    description:
      'ヘッドスピードや悩みをもとに、あなたに合うクラブの方向性を短時間で整理します。',
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
    icon: BrainCircuit,
    accent: 'bg-green-50 text-green-600',
  },
  {
    step: '02',
    title: '性能比較',
    description:
      '人気プロのセッティングや気になるクラブを並べて、違いをわかりやすく比較できます。',
    image:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80',
    icon: BarChart3,
    accent: 'bg-blue-50 text-blue-600',
  },
  {
    step: '03',
    title: 'そのまま購入',
    description:
      '診断や比較から見つけた候補を、そのまま購入検討やショップ比較へつなげられます。',
    image:
      'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=900&q=80',
    icon: ShoppingCart,
    accent: 'bg-amber-50 text-amber-500',
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
    <div className="min-h-screen space-y-10 pb-20 md:space-y-14">
      <section className="relative isolate overflow-hidden rounded-[2.25rem] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <img
          src={heroImage}
          alt="ゴルフバッグとクラブセッティングのイメージ"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.28),transparent_28%)]" />

        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-5 py-12 md:min-h-[680px] md:px-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black tracking-[0.16em] text-white/90 backdrop-blur">
              <Star size={14} className="text-emerald-300" />
              GOLF CLUB SETTING PLATFORM
            </div>

            <h1 className="mt-6 text-[2.4rem] font-black leading-[1.14] tracking-tight text-white md:text-6xl">
              有名プロの現在の
              <br className="hidden md:block" />
              クラブセッティングを、
              <br className="hidden md:block" />
              すぐ探して知る。
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/90 md:mt-6 md:text-xl md:leading-8">
              石川遼や中島啓太のような有名プロの14本をまとめて検索し、クラブ選びの参考にできるサイトです。
              そのあとに自分のセッティング登録や診断へ進めます。
            </p>

            <div className="mt-8 max-w-2xl rounded-[1.75rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1rem] bg-white px-4 py-3 shadow-lg shadow-slate-950/15">
                  <Search className="shrink-0 text-slate-400" size={20} />
                  <input
                    value={searchName}
                    onChange={(event) => setSearchName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleSearch();
                    }}
                    placeholder="選手名・クラブ名で検索"
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 md:text-base"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center justify-center rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 md:text-base"
                >
                  検索する
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {profileCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      activeCategory === category.id
                        ? 'bg-white text-trust-navy'
                        : 'border border-white/15 bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {kanaGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveKana(group.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
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

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
              <button
                onClick={() => {
                  trackEvent('start_ai_diagnosis', {
                    source_page: 'home_hero',
                    destination: 'diagnosis',
                  });
                  navigate('/diagnosis');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-green-500 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-green-600"
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
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-blue-700"
              >
                <Users size={18} />
                プロのセッティングを見る
              </button>
            </div>

          </div>
        </div>
      </section>

      <section className="rounded-[2.25rem] bg-white px-5 py-10 shadow-sm md:px-10 md:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.18em] text-amber-600">TOURNAMENT SPOTLIGHT</div>
              <h2 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl">
                今週の大会で追うべき注目セッティング
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600 md:text-base">
                2026年4月10日時点の開催中大会とオフ週の主要ツアーから、いま見ておきたい選手のクラブセッティング記事をまとめています。
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

          <div className="mt-8 grid gap-4 xl:grid-cols-4">
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
                className="group rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(160deg,#ffffff_0%,#f8fafc_55%,#eff6ff_100%)] p-5 text-left transition-all hover:-translate-y-1 hover:border-golf-300 hover:shadow-lg"
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

      <section id="pro-settings" className="rounded-[2.25rem] bg-white px-5 py-10 shadow-sm md:px-10 md:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.18em] text-emerald-600">POPULAR SETTINGS</div>
              <h2 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl">よく見られているプロのセッティング</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600 md:text-base">
                検索されやすい有名選手のページから、いま使われているクラブ構成をすぐ確認できます。
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

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredProfiles.map((pro) => (
              <article
                key={pro.slug}
                className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-4 border-b border-gray-100 bg-white p-5">
                  <img
                    src={getProfileVisuals(pro.slug, pro.instagramHandle).portrait}
                    alt={`${pro.name}のプレースホルダー画像`}
                    className="h-16 w-16 rounded-full border border-slate-200 bg-slate-50 object-cover p-2"
                    onError={(event) => {
                      const visuals = getProfileVisuals(pro.slug, pro.instagramHandle);
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
                    <h3 className="mt-2 text-xl font-black text-gray-900">{pro.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">{pro.tagline}</p>
                  </div>
                </div>
                <div className="p-5">
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

      <section id="features" className="rounded-[2.25rem] bg-white px-6 py-12 shadow-sm md:px-10 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-black text-gray-900 md:text-4xl">My Bag Proでできること</h2>
            <p className="mt-4 text-base text-gray-600">
              自分に合ったクラブを見つけるための3つのステップ
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="text-center">
                  <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                    <img
                      src={feature.image}
                      alt={`${feature.title}をイメージしたプレースホルダー画像`}
                      className="h-52 w-full object-cover"
                    />
                    <div className="p-6">
                      <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${feature.accent}`}>
                        <Icon size={40} />
                      </div>
                      <div className="mt-6 text-[11px] font-black tracking-[0.16em] text-slate-400">
                        STEP {feature.step}
                      </div>
                      <h3 className="mt-3 text-xl font-black text-gray-900">{feature.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-gray-600">{feature.description}</p>
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
                text: 'まず有名プロの現在の14本を検索し、誰が何を使っているかを知る。',
              },
              {
                icon: BrainCircuit,
                title: '自分に当てはめる',
                text: '見つけたセッティングを参考に、自分の方向性や比較条件を整理する。',
              },
              {
                icon: ShoppingCart,
                title: '比較して検討する',
                text: '気になるクラブはそのまま比較と購入導線に進める。',
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
