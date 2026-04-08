import { ArrowRight, Brain, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const diagnosisSteps = ['ヘッドスピード', '持ち球', '悩み'];

const benefitCards = [
  {
    title: '自分のバッグを保存',
    description: 'いま使っている14本を残して、次に見直す1本を見つけやすくする。',
  },
  {
    title: 'プロと比較できる',
    description: '憧れの選手や近いタイプの構成と、自分の差分をすぐ見比べる。',
  },
  {
    title: '候補を迷わず絞れる',
    description: '診断結果と購入導線がつながるので、見るだけで終わらない。',
  },
];

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen space-y-6 pb-20 md:space-y-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_45%,#eef5f1_100%)] shadow-sm">
        <div className="relative px-6 py-14 md:px-10 md:py-20">
          <div className="absolute inset-y-0 right-[-12%] hidden w-[46%] rounded-full bg-[radial-gradient(circle,_rgba(39,174,96,0.16),_rgba(255,255,255,0)_68%)] blur-2xl lg:block" />

          <div className="relative mx-auto max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-black tracking-[0.18em] text-slate-500 backdrop-blur">
              <Sparkles size={14} className="text-golf-700" />
              GOLF FITTING, SIMPLIFIED
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.04] tracking-tight text-trust-navy md:text-7xl">
              あなたに合うクラブを、
              <br />
              すぐ見つける。
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              ヘッドスピードと悩みから、選ぶべき方向が見えてくる。
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
                className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-7 py-4 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
              >
                10秒で診断する
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
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-7 py-4 text-sm font-black text-slate-700 transition-colors hover:border-golf-400 hover:text-golf-700"
              >
                プロのセッティングを見る
              </button>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">RESULT PREVIEW</div>
                    <div className="mt-2 text-2xl font-black text-trust-navy">おすすめは低スピン系 + 直進性重視</div>
                  </div>
                  <div className="rounded-full bg-golf-50 px-3 py-1 text-xs font-black text-golf-700">10 sec</div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                    <div className="text-[11px] font-black tracking-[0.14em] text-cyan-200">MATCH SCORE</div>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-5xl font-black">89</span>
                      <span className="pb-1 text-sm text-slate-300">/ 100</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      捕まりすぎを抑えつつ、右への不安を減らしたい人向け。
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <div className="grid grid-cols-4 items-end gap-3">
                      {[76, 92, 68, 84].map((height, index) => (
                        <div key={height} className="space-y-2 text-center">
                          <div className="flex h-36 items-end rounded-full bg-white px-2 py-3 shadow-inner">
                            <div
                              className={`w-full rounded-full ${
                                index === 1 ? 'bg-golf-700' : 'bg-slate-300'
                              }`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">
                            {['直進性', '相性', '寛容性', '操作性'][index]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white/70 p-5 backdrop-blur">
                <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">WHY PEOPLE START HERE</div>
                <div className="mt-4 space-y-3">
                  {['自分に合う方向が先に分かる', 'スペックで迷う前に候補を絞れる', '比較と購入までそのまま進める'].map((point) => (
                    <div key={point} className="flex items-start gap-3 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-golf-700" />
                      <p className="text-sm font-bold leading-7 text-trust-navy">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-slate-200 bg-white px-6 py-12 shadow-sm md:px-10 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black tracking-[0.16em] text-slate-500">
              <Brain size={14} className="text-cyan-700" />
              DIAGNOSIS
            </div>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-trust-navy md:text-5xl">
              答えは、
              <br />
              すぐ出る。
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              複雑なスペックより、まず相性から。
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {diagnosisSteps.map((step) => (
                <div
                  key={step}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700"
                >
                  {step}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                trackEvent('start_ai_diagnosis', {
                  source_page: 'home_diagnosis',
                  destination: 'diagnosis',
                });
                navigate('/diagnosis');
              }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-trust-navy px-7 py-4 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
            >
              無料で診断する
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-[11px] font-black tracking-[0.16em] text-cyan-200">QUESTION 01</div>
              <div className="mt-3 text-2xl font-black">いまのドライバーで多いミスは？</div>
              <div className="mt-5 grid gap-3">
                {['右に抜ける', '左に行きすぎる', '高さが出ない'].map((choice, index) => (
                  <div
                    key={choice}
                    className={`rounded-[1.25rem] px-4 py-4 text-sm font-black ${
                      index === 0 ? 'bg-white text-trust-navy' : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    {choice}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-[11px] font-black tracking-[0.16em] text-cyan-200">OUTPUT</div>
              <div className="mt-3 text-2xl font-black">捕まりすぎないヘッドを優先</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                方向性を揃えたい人向けに、おすすめ候補を3本まで絞り込みます。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafb_100%)] px-6 py-12 shadow-sm md:px-10 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black tracking-[0.16em] text-slate-500">
              <Sparkles size={14} className="text-golf-700" />
              MY BAG
            </div>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-trust-navy md:text-5xl">
              診断で、
              <br />
              終わらせない。
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              自分のバッグを持つと、比較も診断も、もっと自分向きになる。
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {benefitCards.map((card) => (
              <article key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-black text-trust-navy">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                trackEvent('begin_mybag_creation', {
                  source_page: 'home_benefits',
                });
                navigate('/mybag/create');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-7 py-4 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
            >
              My Bagを作る
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => {
                trackEvent('select_content_group', {
                  source_page: 'home_benefits',
                  target_type: 'articles',
                });
                navigate('/articles');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-4 text-sm font-black text-slate-700 transition-colors hover:border-golf-400 hover:text-golf-700"
            >
              記事から使い方を見る
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
