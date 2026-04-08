import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ClipboardCheck,
  Search,
  ShoppingCart,
  Star,
  Users,
  WandSparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const heroImage =
  'https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?auto=format&fit=crop&w=1920&q=80';

const popularPros = [
  {
    slug: 'ryo-ishikawa',
    name: '石川 遼',
    tag: '操作性重視',
    trait: '鋭い操作性と完成度を両立したセッティング',
    image: 'https://i.pravatar.cc/160?img=11',
    clubs: [
      { label: '1W', model: 'ステルス プラス' },
      { label: '3W / 5W', model: 'SIM / ステルス プラス' },
      { label: 'アイアン', model: 'RORS プロト' },
      { label: 'パター', model: 'Spider X' },
    ],
  },
  {
    slug: 'keita-nakajima',
    name: '中島 啓太',
    tag: '飛距離重視',
    trait: '高さと飛距離を活かした現代型セット',
    image: 'https://i.pravatar.cc/160?img=5',
    clubs: [
      { label: '1W', model: 'Qi35 LS' },
      { label: '3W', model: 'Qi10 Tour' },
      { label: 'アイアン', model: 'P7CB / P7MB' },
      { label: 'パター', model: 'TP Soto' },
    ],
  },
  {
    slug: 'takumi-kanaya',
    name: '金谷 拓実',
    tag: '精密志向',
    trait: '競技ゴルファー向けの精密なPING中心構成',
    image: 'https://i.pravatar.cc/160?img=33',
    clubs: [
      { label: '1W', model: 'G440 LST' },
      { label: '3W', model: 'G410 FW' },
      { label: 'アイアン', model: 'G710 / i230' },
      { label: 'パター', model: 'Sigma 2 Anser' },
    ],
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

  return (
    <div className="min-h-screen space-y-10 pb-20 md:space-y-14">
      <section className="relative isolate overflow-hidden rounded-[2.25rem] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <img
          src={heroImage}
          alt="ゴルフ場でスイングするゴルファー"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.25),transparent_28%)]" />

        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-6 py-14 md:min-h-[680px] md:px-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black tracking-[0.16em] text-white/90 backdrop-blur">
              <Star size={14} className="text-emerald-300" />
              GOLF SETTING PLATFORM
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.16] tracking-tight text-white md:text-6xl">
              プロのセッティングを参考に、
              <br className="hidden md:block" />
              あなただけのベストセットを見つけよう
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
              スコアアップを目指すゴルファーのための、クラブ診断・比較プラットフォーム。
            </p>

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
          </div>
        </div>
      </section>

      <section id="pro-settings" className="rounded-[2.25rem] bg-gray-100 px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-black text-gray-900 md:text-4xl">人気プロのセッティング</h2>
            <p className="mt-4 text-base text-gray-600">
              トッププロ達が選んだこだわりのギアを、カードで直感的に見比べられます。
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {popularPros.map((pro) => (
              <article
                key={pro.slug}
                className="overflow-hidden rounded-[1.75rem] bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                    <img
                      src={pro.image}
                      alt={`${pro.name}のプレースホルダー画像`}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-black text-gray-900">{pro.name}</h3>
                      <span className="mt-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {pro.tag}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-gray-600">{pro.trait}</p>

                  <ul className="mt-5 space-y-3 text-sm text-gray-600">
                    {pro.clubs.map((club) => (
                      <li key={`${pro.slug}-${club.label}`} className="flex items-start justify-between gap-4">
                        <span className="shrink-0 font-bold text-gray-900">{club.label}</span>
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

          <div className="mt-10 grid gap-4 rounded-[2rem] bg-slate-950 p-6 text-white md:grid-cols-3">
            {[
              {
                icon: Search,
                title: '参考にする',
                text: '人気プロの14本を見て、いまのクラブ選びの基準を作る。',
              },
              {
                icon: ClipboardCheck,
                title: '診断する',
                text: 'いくつかの質問から、自分に合うクラブの方向性を絞る。',
              },
              {
                icon: ShoppingCart,
                title: '購入につなげる',
                text: '比較した流れのまま、候補クラブの検討と購入へ進む。',
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
