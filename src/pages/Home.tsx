import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleGauge,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRoundSearch,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const heroImage =
  'https://images.unsplash.com/photo-1510160493562-2a35f8ad1ebb?auto=format&fit=crop&w=1600&q=80';

const contentCards = [
  {
    tag: 'NEW',
    title: '最新プロセッティング',
    subtitle: '人気プロの最新14本を俯瞰して比較',
    image:
      'https://images.unsplash.com/photo-1535132011086-b8818f016104?auto=format&fit=crop&w=900&q=80',
    href: '/settings/pros',
    label: 'プロのセッティング',
  },
  {
    tag: 'ランキング',
    title: 'ドライバー比較ランキング',
    subtitle: '飛距離・方向性・寛容性を軸に比較',
    image:
      'https://images.unsplash.com/photo-1627591641174-5f0fd692d1c3?auto=format&fit=crop&w=900&q=80',
    href: '/compare',
    label: 'クラブ比較',
  },
  {
    tag: 'ガイド',
    title: 'アイアンの選び方 完全ガイド',
    subtitle: '中級者が失敗しないための整理',
    image:
      'https://images.unsplash.com/photo-1627384113972-f4c2f6bb77eb?auto=format&fit=crop&w=900&q=80',
    href: '/articles',
    label: '記事・コラム',
  },
  {
    tag: 'お悩み解決',
    title: 'スライスの原因と改善方法',
    subtitle: 'クラブ選びで見直すべきポイント',
    image:
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=80',
    href: '/articles',
    label: 'お悩み解決',
  },
];

const featureCards = [
  {
    icon: CircleGauge,
    title: 'スコア・ショット分析',
    description: 'あなたの傾向や課題をデータで可視化します。',
  },
  {
    icon: Sparkles,
    title: '最適なクラブ提案',
    description: '数千通りのデータから最適な組み合わせを整理します。',
  },
  {
    icon: ShieldCheck,
    title: 'プロとの比較',
    description: 'プロの平均データと比べて現在地を把握できます。',
  },
  {
    icon: Trophy,
    title: '改善ポイント提示',
    description: '次に効く見直しポイントを具体的に返します。',
  },
];

const trustStats = [
  { icon: BarChart3, label: '診断実績', value: '15,000件以上' },
  { icon: UserRoundSearch, label: '分析プロ', value: '300名以上' },
  { icon: Trophy, label: 'クラブデータ', value: '1,200本以上' },
];

const supportStats = [
  { title: '診断満足度', value: '96%', note: '診断結果に満足いただいています' },
  { title: 'リピート率', value: '82%', note: '保存して使うユーザーが増えています' },
  { title: 'スコア改善実感', value: '平均 7.2打改善', note: '登録と診断を併用した利用者ベース' },
];

const handleChartPoints = [
  'あなたのスコア傾向',
  'ショットの傾向',
  'おすすめの改善ポイント',
];

export const Home = () => {
  const navigate = useNavigate();

  const handleDiagnosisStart = (source: 'hero' | 'sample' | 'footer') => {
    trackEvent('start_ai_diagnosis', {
      source_page: `home_${source}`,
      destination: 'diagnosis',
    });
    navigate('/diagnosis');
  };

  return (
    <div className="space-y-8 pb-8 md:space-y-12 md:pb-14">
      <section className="overflow-hidden rounded-[32px] border border-[#e3ece4] bg-white shadow-[0_28px_70px_-48px_rgba(15,15,16,0.35)]">
        <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="px-6 py-8 md:px-10 md:py-12 xl:py-14">
            <div className="text-sm font-bold text-[#c18e2f] md:text-base">データでわかる、あなたのゴルフ</div>
            <h1 className="mt-4 max-w-[12ch] text-[clamp(2.3rem,5vw,5rem)] font-black leading-[1.05] tracking-tight text-[#121416]">
              そのクラブ、本当にあなたに合っていますか？
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-lg md:leading-8">
              プロのセッティングデータと独自の分析ロジックで、
              <br className="hidden md:block" />
              あなたに最適なクラブ選びをサポートします。
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => handleDiagnosisStart('hero')}
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#176534] px-6 text-base font-black text-white transition hover:bg-[#13542b]"
              >
                無料でクラブ診断をはじめる
              </button>
              <button
                onClick={() => navigate('/mypage')}
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[#b8cfbd] bg-white px-6 text-base font-black text-[#176534] transition hover:bg-[#f6fbf7]"
              >
                自分のセッティングを分析する
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {trustStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-[22px] border border-[#e6ece6] bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2f8f3] text-[#176534]">
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500">{stat.label}</div>
                        <div className="mt-1 text-xl font-black text-[#151719]">{stat.value}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden xl:min-h-full">
            <img src={heroImage} alt="ゴルフバッグとクラブ" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(255,255,255,0.08),rgba(255,255,255,0.88)_52%,rgba(255,255,255,0.98)_92%)] xl:bg-[linear-gradient(270deg,rgba(255,255,255,0.08),rgba(255,255,255,0.62)_18%,rgba(255,255,255,0)_42%)]" />
          </div>
        </div>

        <div className="border-t border-[#eef2ee] bg-white px-4 py-4 md:px-8 md:py-5">
          <div className="grid gap-3 md:grid-cols-4">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-[22px] border border-[#e8efea] bg-[#fbfcfb] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#176534]">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-[#151719]">{feature.title}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-600">{feature.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.65fr_0.75fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[#151719] md:text-3xl">おすすめコンテンツ</h2>
            </div>
            <button onClick={() => navigate('/articles')} className="hidden items-center gap-2 text-sm font-black text-[#176534] md:inline-flex">
              すべて見る
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {contentCards.map((card) => (
              <button
                key={card.title}
                onClick={() => navigate(card.href)}
                className="overflow-hidden rounded-[24px] border border-[#e3ebe4] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3 rounded-full bg-[#2563eb] px-2.5 py-1 text-[10px] font-black text-white">
                    {card.tag}
                  </div>
                </div>
                <div className="px-4 py-4">
                  <div className="text-xl font-black leading-7 text-[#151719]">{card.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{card.subtitle}</div>
                  <div className="mt-4 inline-flex rounded-full bg-[#f1f6f2] px-3 py-1 text-xs font-black text-[#176534]">
                    {card.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-[28px] bg-[#15542f] p-5 text-white shadow-[0_24px_60px_-42px_rgba(21,84,47,0.8)] md:p-6">
          <div className="text-2xl font-black">無料クラブ診断</div>
          <p className="mt-3 text-sm leading-7 text-white/80">
            たった30秒であなたのゴルフを分析。保存後は比較候補としていつでも見返せます。
          </p>
          <div className="mt-5 space-y-3 text-sm font-bold text-white/90">
            <div className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-1 shrink-0" /> スイングタイプやミス傾向を分析</div>
            <div className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-1 shrink-0" /> 最適なクラブ候補を提案</div>
            <div className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-1 shrink-0" /> 診断結果は保存して比較可能</div>
          </div>
          <button
            onClick={() => handleDiagnosisStart('sample')}
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-white px-5 text-base font-black text-[#15542f] transition hover:bg-[#f3f6f3]"
          >
            診断をはじめる
          </button>

          <div className="mt-6 rounded-[24px] bg-white/10 p-4">
            <div className="text-base font-black">診断サンプル</div>
            <div className="mt-4 flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-white/35 bg-white text-3xl font-black text-[#15542f]">
                72
              </div>
              <div className="flex-1 space-y-2.5 text-sm font-bold">
                {[
                  ['飛距離感', 70, 'bg-[#1f7a45]'],
                  ['方向性', 75, 'bg-[#1e3a8a]'],
                  ['安定性', 72, 'bg-[#d0a73f]'],
                  ['操作性', 68, 'bg-[#c0392b]'],
                ].map(([label, value, color]) => (
                  <div key={label as string}>
                    <div className="mb-1 flex items-center justify-between text-white/90">
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/15">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[28px] border border-[#e4ece5] bg-white p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-500">データが導く、最適なクラブ選び</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#151719]">プロのデータとあなたのデータを並べる</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            プロのデータとあなたのデータを比較して、最適なセッティングを見つけましょう。
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {handleChartPoints.map((label, index) => (
              <div key={label} className="rounded-[24px] border border-[#ebf0eb] bg-[#fbfcfb] p-4">
                <div className="text-sm font-black text-[#151719]">{label}</div>
                <div className="mt-4 h-40 rounded-[20px] border border-[#e6ece7] bg-white p-4">
                  {index === 0 && (
                    <div className="flex h-full items-end gap-2">
                      {[84, 72, 91, 77, 88, 70, 95, 74, 86].map((point, idx) => (
                        <div key={idx} className="flex-1">
                          <div className="rounded-t-xl bg-[#176534]" style={{ height: `${point}px` }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {index === 1 && (
                    <div className="flex h-full items-center justify-center">
                      <div className="relative h-32 w-32 rounded-full border border-[#dfe7df]">
                        <div className="absolute inset-[18%] rotate-12 border border-[#166534]" />
                        <div className="absolute inset-[28%] rotate-45 border border-[#166534]/70" />
                        <div className="absolute inset-[38%] rotate-[76deg] border border-[#166534]/50" />
                      </div>
                    </div>
                  )}
                  {index === 2 && (
                    <div className="space-y-4">
                      {[
                        'ドライバーの方向性が課題',
                        'アイアンのスピン量を最適化',
                        'アプローチの安定性を向上',
                      ].map((item, idx) => (
                        <div key={item} className="flex items-start gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf5ef] text-xs font-black text-[#176534]">
                            {String(idx + 1).padStart(2, '0')}
                          </div>
                          <div className="text-sm font-bold text-slate-700">{item}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="self-end rounded-[28px] border border-[#e4ece5] bg-white p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-500">多くのゴルファーに支持されています</div>
          <div className="mt-5 space-y-4">
            {supportStats.map((stat) => (
              <div key={stat.title} className="rounded-[22px] border border-[#ebf0eb] bg-[#fbfcfb] px-5 py-5">
                <div className="text-sm font-black text-slate-500">{stat.title}</div>
                <div className="mt-2 text-[2rem] font-black tracking-tight text-[#151719]">{stat.value}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{stat.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-xs font-bold text-slate-400">※2024年1月〜2024年12月の利用者アンケート結果より</div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(90deg,rgba(17,19,21,0.88),rgba(21,84,47,0.92))] px-6 py-7 text-white shadow-[0_24px_60px_-42px_rgba(15,15,16,0.7)] md:px-10 md:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-3xl font-black tracking-tight">データで、あなたのゴルフはもっと良くなる。</div>
            <div className="mt-2 text-sm leading-7 text-white/80">
              まずは無料診断で、最適なクラブ選びの第一歩を踏み出しましょう。
            </div>
          </div>
          <button
            onClick={() => handleDiagnosisStart('footer')}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#c8a96a] px-7 text-base font-black text-[#111315] transition hover:bg-[#d5b57b]"
          >
            無料でクラブ診断をはじめる
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
};
