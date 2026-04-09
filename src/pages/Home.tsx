import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Club,
  Goal,
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

const featuredSlugOrder = ['ryo-ishikawa', 'keita-nakajima', 'takumi-kanaya', 'yui-kawamoto'];

const heroImage =
  'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1920&q=80';

const golfHighlights = [
  {
    title: 'まず有名プロの14本を知る',
    copy: '誰がどのドライバー、アイアン、パターを使っているかを最初に把握できます。',
    icon: Club,
  },
  {
    title: '選手名で検索してすぐ見る',
    copy: '石川遼や中島啓太のように、気になる選手名から直接詳細へ入れます。',
    icon: Goal,
  },
  {
    title: 'そのあと診断と比較へ進む',
    copy: '見つけたセッティングを参考にしながら、自分の登録や比較に進めます。',
    icon: ShoppingCart,
  },
];

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

    const fallback = profiles.filter((profile) => !featuredSlugOrder.includes(profile.slug)).slice(0, 4 - prioritized.length);
    return [...prioritized, ...fallback].slice(0, 4);
  }, [profiles]);

  const handleSearch = () => {
    const query = searchName.trim();
    trackEvent('search_setting_profile', {
      source_page: 'home_hero',
      search_term: query || 'all',
    });
    navigate(query ? `/settings/pros?search=${encodeURIComponent(query)}` : '/settings/pros');
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

        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-8 px-6 py-14 md:min-h-[680px] md:grid-cols-[minmax(0,1.2fr)_420px] md:px-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black tracking-[0.16em] text-white/90 backdrop-blur">
              <Star size={14} className="text-emerald-300" />
              GOLF CLUB SETTING PLATFORM
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.16] tracking-tight text-white md:text-6xl">
              有名プロの現在の
              <br className="hidden md:block" />
              クラブセッティングを、
              <br className="hidden md:block" />
              すぐ探して知る。
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
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
                    placeholder="選手名で検索 例: 石川遼 クラブセッティング"
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
              <div className="mt-3 flex flex-wrap gap-2">
                {['石川遼', '中島啓太', '金谷拓実', '河本結'].map((name) => (
                  <button
                    key={name}
                    onClick={() => navigate(`/settings/pros?search=${encodeURIComponent(name)}`)}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 transition hover:bg-white/20"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
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

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {golfHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-emerald-300">
                      <Icon size={20} />
                    </div>
                    <h2 className="mt-4 text-sm font-black text-white md:text-base">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/75">{item.copy}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {profileCategories
                .filter((category) => category.id !== 'all')
                .map((category) => (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/settings/pros?category=${encodeURIComponent(category.id)}`)}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/85 transition hover:bg-white/20"
                  >
                    {category.label}
                  </button>
                ))}
            </div>
          </div>

          <div className="grid gap-4">
            {featuredProfiles.map((pro) => (
              <button
                key={`hero-${pro.slug}`}
                onClick={() => navigate(`/settings/pros/${pro.slug}`)}
                className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/60 text-left shadow-lg backdrop-blur transition hover:-translate-y-1 hover:border-white/20"
              >
                <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-0">
                  <img
                    src={getProfileVisuals(pro.slug).portrait}
                    alt={`${pro.name}のプレースホルダー画像`}
                    className="h-full min-h-[144px] w-full bg-white object-cover p-3"
                  />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black tracking-[0.12em] text-white/80">
                        {pro.categoryLabel}
                      </span>
                      <span className="text-[11px] font-bold text-white/45">{pro.contractLabel}</span>
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-white">{pro.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/75">{pro.tagline}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {pro.clubs.slice(0, 3).map((club) => (
                        <span
                          key={`hero-club-${pro.slug}-${club.category}`}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-cyan-100"
                        >
                          {club.specLabel || club.category} {club.model}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="pro-settings" className="rounded-[2.25rem] bg-gray-100 px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-black text-gray-900 md:text-4xl">有名プロのクラブセッティングをすぐ探す</h2>
            <p className="mt-4 text-base text-gray-600">
              選手名検索とカテゴリ分けから、現在の14本と使用ボールをすぐ確認できます。
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {featuredProfiles.map((pro) => (
              <article
                key={pro.slug}
                className="overflow-hidden rounded-[1.75rem] bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center gap-4 border-b border-gray-100 bg-white p-6">
                  <img
                    src={getProfileVisuals(pro.slug).portrait}
                    alt={`${pro.name}のプレースホルダー画像`}
                    className="h-16 w-16 rounded-full border border-slate-200 bg-white object-cover p-2"
                  />
                  <div>
                    <div className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {pro.categoryLabel}
                    </div>
                    <h3 className="mt-3 text-xl font-black text-gray-900">{pro.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-gray-600">{pro.tagline}</p>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-3 text-sm text-gray-600">
                    {pro.clubs.slice(0, 4).map((club) => (
                      <li key={`${pro.slug}-${club.category}`} className="flex items-start justify-between gap-4">
                        <span className="shrink-0 font-bold text-gray-900">{club.specLabel || club.category}</span>
                        <span className="text-right">{club.model}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      trackEvent('select_setting_profile', {
                        source_page: 'home_popular_pros',
                        profile_slug: pro.slug,
                      });
                      navigate(`/settings/pros/${pro.slug}`);
                    }}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-500 py-3 font-black text-green-600 transition hover:bg-green-50"
                  >
                    現在の14本を見る
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

          <div className="mt-10 grid gap-4 rounded-[2rem] bg-slate-950 p-6 text-white md:grid-cols-3">
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
