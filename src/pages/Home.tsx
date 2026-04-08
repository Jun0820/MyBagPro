import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const popularPros = [
  {
    slug: 'ryo-ishikawa',
    name: '石川 遼',
    trait: '操作性と完成度を両立したツアー仕様',
    image:
      'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=320&q=80',
    clubs: [
      { label: '1W', model: 'ステルス プラス' },
      { label: '3W', model: 'SIM / ステルス プラス' },
      { label: 'IR', model: 'RORS プロト' },
      { label: 'PT', model: 'Spider X' },
    ],
  },
  {
    slug: 'keita-nakajima',
    name: '中島 啓太',
    trait: '飛距離と高さを活かす現代型セッティング',
    image:
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=320&q=80',
    clubs: [
      { label: '1W', model: 'Qi35 LS' },
      { label: '3W', model: 'Qi10 Tour' },
      { label: 'IR', model: 'P7CB / P7MB' },
      { label: 'PT', model: 'TP Soto' },
    ],
  },
  {
    slug: 'takumi-kanaya',
    name: '金谷 拓実',
    trait: 'PING中心で組んだ精密な競技志向セット',
    image:
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=320&q=80',
    clubs: [
      { label: '1W', model: 'G440 LST' },
      { label: '3W', model: 'G410 FW' },
      { label: 'IR', model: 'G710 / i230' },
      { label: 'PT', model: 'Sigma 2 Anser' },
    ],
  },
  {
    slug: 'tommy-fleetwood',
    name: 'トミー・フリートウッド',
    trait: '世界基準のショットメイクを支える14本',
    image:
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=320&q=80',
    clubs: [
      { label: '1W', model: 'Qi35 Driver' },
      { label: '5W', model: 'Qi35 FW' },
      { label: 'IR', model: 'P7TW' },
      { label: 'PT', model: 'Spider Tour Black' },
    ],
  },
];

const features = [
  {
    title: '診断で絞る',
    description: 'ヘッドスピードや悩みから、合う方向を短時間で整理します。',
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
    icon: Sparkles,
  },
  {
    title: 'プロと比較する',
    description: '人気選手の14本と自分の構成を見比べて、違いを直感的に把握できます。',
    image:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80',
    icon: BarChart3,
  },
  {
    title: '購入につなげる',
    description: '気になったクラブを、そのまま比較・検討・購入へ進めます。',
    image:
      'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=900&q=80',
    icon: Trophy,
  },
];

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen space-y-8 pb-20 md:space-y-12">
      <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="relative isolate min-h-[640px] md:min-h-[720px]">
          <img
            src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1800&q=80"
            alt="ゴルフ場でスイングするゴルファー"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(6,17,32,0.86)_8%,rgba(6,17,32,0.56)_42%,rgba(6,17,32,0.22)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.24),transparent_32%)]" />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-between gap-10 px-6 py-8 md:px-10 md:py-12">
            <div className="max-w-3xl pt-8 md:pt-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black tracking-[0.2em] text-white/90 backdrop-blur">
                <ShieldCheck size={14} className="text-emerald-300" />
                VERIFIED SETTINGS PLATFORM
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-white md:text-6xl">
                プロのセッティングを参考に、
                <br />
                あなただけのベストセットを見つけよう
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
                診断、比較、購入まで。迷いやすいクラブ選びを、ひとつの流れでわかりやすく。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    trackEvent('start_ai_diagnosis', {
                      source_page: 'home_hero',
                      destination: 'diagnosis',
                    });
                    navigate('/diagnosis');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-golf-500 to-emerald-500 px-7 py-4 text-sm font-black text-white shadow-[0_20px_40px_rgba(34,197,94,0.28)] transition-transform hover:-translate-y-0.5"
                >
                  診断を始める
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => {
                    trackEvent('select_content_group', {
                      source_page: 'home_hero',
                      target_type: 'pros_library',
                    });
                    navigate('/settings/pros');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur transition-colors hover:bg-white/16"
                >
                  プロのセッティングを見る
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-white/12 bg-white/12 p-5 text-white backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-black tracking-[0.16em] text-white/65">DIAGNOSIS PREVIEW</div>
                    <div className="mt-2 text-2xl font-black">いまの悩みから、おすすめ候補をすぐ表示</div>
                  </div>
                  <div className="rounded-full bg-white/14 px-3 py-1 text-xs font-black text-emerald-200">10 sec</div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[1.5rem] bg-slate-950/55 p-5">
                    <div className="text-[11px] font-black tracking-[0.14em] text-emerald-200">MATCH SCORE</div>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-5xl font-black">89</span>
                      <span className="pb-1 text-sm text-white/70">/ 100</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/80">
                      右ミスを抑えたい人向けに、直進性と寛容性の高い候補を優先。
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] bg-white p-5 text-trust-navy">
                    <div className="text-[11px] font-black tracking-[0.16em] text-slate-400">RESULT GRAPH</div>
                    <div className="mt-4 grid grid-cols-4 items-end gap-3">
                      {[78, 92, 74, 86].map((height, index) => (
                        <div key={height} className="space-y-2 text-center">
                          <div className="flex h-32 items-end rounded-full bg-slate-100 px-2 py-3">
                            <div
                              className={`w-full rounded-full ${
                                index === 1 ? 'bg-golf-600' : 'bg-sky-300'
                              }`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <div className="text-[11px] font-black tracking-[0.12em] text-slate-500">
                            {['直進性', '相性', '寛容性', '打感'][index]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/12 bg-white/10 p-5 text-white backdrop-blur-xl">
                <div className="text-[11px] font-black tracking-[0.16em] text-white/65">START HERE</div>
                <div className="mt-4 space-y-3">
                  {[
                    'プロの14本を参考にできる',
                    '自分に合う方向を診断で絞れる',
                    '比較した流れで購入まで進める',
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-3 rounded-[1.25rem] bg-slate-950/35 px-4 py-4">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-black text-emerald-200">
                        {index + 1}
                      </div>
                      <p className="text-sm font-bold leading-7 text-white/88">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-slate-200 bg-white px-6 py-12 shadow-sm md:px-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-golf-50 px-4 py-2 text-[11px] font-black tracking-[0.16em] text-golf-700">
                <Trophy size={14} />
                POPULAR PRO SETTINGS
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-trust-navy md:text-4xl">
                人気プロのセッティング
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                いま注目されているプロの14本を、見た目でも直感でも比較しやすくまとめました。
              </p>
            </div>

            <button
              onClick={() => navigate('/settings/pros')}
              className="inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:border-golf-500 hover:text-golf-700"
            >
              もっと見る
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {popularPros.map((pro) => (
              <article
                key={pro.slug}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-sm transition-transform hover:-translate-y-1"
              >
                <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef7f1_100%)] p-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={pro.image}
                      alt={`${pro.name}のプレースホルダー画像`}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md"
                    />
                    <div>
                      <h3 className="text-xl font-black text-trust-navy">{pro.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{pro.trait}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    {pro.clubs.map((club) => (
                      <div key={`${pro.slug}-${club.label}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-golf-50 text-xs font-black text-golf-700">
                            {club.label}
                          </div>
                          <div className="text-sm font-bold text-trust-navy">{club.model}</div>
                        </div>
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
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition-colors group-hover:bg-slate-900"
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

      <section className="rounded-[2.5rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-12 shadow-sm md:px-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-[11px] font-black tracking-[0.16em] text-sky-700">
              <ClipboardList size={14} />
              FEATURES / FLOW
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-trust-navy md:text-4xl">
              このサービスでできること
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
              参考にする、診断する、比較する、買う。クラブ選びの流れを、一か所で完結できるようにしています。
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                >
                  <img
                    src={feature.image}
                    alt={`${feature.title}をイメージしたプレースホルダー画像`}
                    className="h-52 w-full object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-golf-50 text-golf-700">
                        <Icon size={20} />
                      </div>
                      <h3 className="text-xl font-black text-trust-navy">{feature.title}</h3>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{feature.description}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 rounded-[2rem] bg-slate-950 p-6 text-white md:grid-cols-3">
            {[
              { step: '01', title: '見る', text: '人気プロの14本をカードで比較して、気になる構成を見つける。 ' },
              { step: '02', title: '診断する', text: '数問の質問から、自分に合う方向や候補クラブを絞る。' },
              { step: '03', title: '進める', text: '比較結果から、そのまま購入候補や関連記事へつなげる。' },
            ].map((item) => (
              <div key={item.step} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="text-[11px] font-black tracking-[0.16em] text-emerald-200">STEP {item.step}</div>
                <div className="mt-3 flex items-center gap-2 text-xl font-black">
                  <PlayCircle size={18} className="text-emerald-300" />
                  {item.title}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/78">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
