import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  Search,
  ShieldCheck,
  WandSparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const heroImage =
  'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1920&q=80';

const trustPoints = [
  'ヘッドスピードや球筋、ミス傾向をもとに整理',
  'フィッティング視点でクラブの方向性を提案',
  'プロのセッティングや比較導線までつなげられる',
];

const commonMistakes = [
  'なんとなく人気クラブを買う',
  '試打せずに決める',
  '店員のおすすめだけで決める',
];

const solutions = [
  {
    title: '自分のタイプが分かる',
    description: '今のスイング傾向やミスの出方を、選び直しやすい言葉で整理します。',
    icon: BrainCircuit,
  },
  {
    title: '合うクラブが分かる',
    description: '次に選ぶべきクラブの方向性が見えて、迷いを減らせます。',
    icon: WandSparkles,
  },
  {
    title: 'プロと比較できる',
    description: '診断結果をプロの14本と見比べながら、候補を絞り込めます。',
    icon: BarChart3,
  },
];

const outcomePoints = [
  '課題が言語化される',
  '原因が分かる',
  '選ぶべき方向性が分かる',
];

const popularContent = [
  {
    eyebrow: 'PRO SETTINGS',
    title: 'プロのセッティング',
    description: '人気選手の14本を見て、参考にしたい組み合わせを探せます。',
    href: '/settings/pros',
    icon: ShieldCheck,
    buttonLabel: 'プロを見る',
  },
  {
    eyebrow: 'ARTICLES',
    title: '悩みから探す',
    description: 'スライスや飛距離不足など、悩み別に記事から整理できます。',
    href: '/articles',
    icon: CircleHelp,
    buttonLabel: '記事を読む',
  },
  {
    eyebrow: 'COMPARE',
    title: '比較コンテンツ',
    description: '候補クラブを並べて違いを見ながら、購入判断につなげられます。',
    href: '/compare',
    icon: Search,
    buttonLabel: '比較を見る',
  },
];

export const Home = () => {
  const navigate = useNavigate();

  const handleDiagnosisStart = (source: 'hero' | 'mid' | 'bottom') => {
    trackEvent('start_ai_diagnosis', {
      source_page: `home_${source}`,
      destination: 'diagnosis',
    });
    navigate('/diagnosis');
  };

  return (
    <div className="min-h-screen space-y-5 pb-12 md:space-y-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
        <img
          src={heroImage}
          alt="ゴルフバッグとクラブセッティングのイメージ"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/58" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.24),transparent_30%)]" />

        <div className="relative px-5 py-8 md:px-10 md:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] text-white/90 backdrop-blur">
              <WandSparkles size={12} className="text-emerald-300" />
              FREE CLUB DIAGNOSIS
            </div>

            <h1 className="mx-auto mt-4 max-w-4xl text-[clamp(2rem,8vw,4.6rem)] font-black leading-[1.02] tracking-tight text-white">
              そのクラブ、
              <br className="sm:hidden" />
              本当にあなたに
              <br />
              合っていますか？
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/90 md:text-lg md:leading-8">
              ヘッドスピードや球筋、ミス傾向から、
              <br className="hidden sm:block" />
              最適なセッティングの方向性を診断します。
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => handleDiagnosisStart('hero')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-golf-500 px-6 py-4 text-base font-black text-white shadow-lg shadow-golf-900/20 transition hover:-translate-y-0.5 hover:bg-golf-600 sm:w-auto sm:min-w-[240px]"
              >
                <WandSparkles size={18} />
                30秒で無料診断
              </button>
              <button
                onClick={() => navigate('/settings/pros')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-4 text-base font-black text-white backdrop-blur transition hover:bg-white/15 sm:w-auto sm:min-w-[240px]"
              >
                <ShieldCheck size={18} />
                プロのセッティングを見る
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {['ログイン不要', '結果は保存可能', 'フィッティング理論ベース'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black text-white/85 backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white px-5 py-6 shadow-sm md:px-10 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="text-[11px] font-black tracking-[0.18em] text-emerald-600">WHY IT WORKS</div>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">診断の考え方</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base md:leading-7">
              数値とプレースタイルの両方を見ながら、合うクラブの方向性を整理します。
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {trustPoints.map((point) => (
              <div
                key={point}
                className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold leading-6 text-slate-700"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{point}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white px-5 py-6 shadow-sm md:px-10 md:py-8">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-amber-600">COMMON MISTAKES</div>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">クラブ選びで、こんな失敗ありませんか？</h2>
            <div className="mt-4 space-y-3">
              {commonMistakes.map((mistake) => (
                <div
                  key={mistake}
                  className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
                >
                  {mistake}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] bg-trust-navy px-5 py-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
            <div className="text-[11px] font-black tracking-[0.18em] text-emerald-300">RETHINK</div>
            <p className="mt-3 text-2xl font-black leading-tight md:text-3xl">
              その選び方、
              <br />
              合っていない可能性があります。
            </p>
            <p className="mt-4 text-sm leading-7 text-white/80">
              人気や雰囲気だけで選ぶより、自分のスイング傾向に合う方向性を先に知るほうが、失敗しにくくなります。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white px-5 py-6 shadow-sm md:px-10 md:py-8">
        <div className="text-center">
          <div className="text-[11px] font-black tracking-[0.18em] text-sky-600">WHAT YOU CAN DO</div>
          <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">このサイトでできること</h2>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <article
                key={solution.title}
                className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 text-center shadow-sm"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-trust-navy">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-black text-gray-900">{solution.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{solution.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] bg-white px-5 py-6 shadow-sm md:px-10 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="text-[11px] font-black tracking-[0.18em] text-purple-600">AFTER DIAGNOSIS</div>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">診断後に分かること</h2>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {outcomePoints.map((point, index) => (
              <div
                key={point}
                className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-5 text-center"
              >
                <div className="text-[11px] font-black tracking-[0.18em] text-slate-400">STEP 0{index + 1}</div>
                <div className="mt-3 text-base font-black text-trust-navy">{point}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-trust-navy px-5 py-7 text-center text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] md:px-10 md:py-9">
        <div className="mx-auto max-w-3xl">
          <div className="text-[11px] font-black tracking-[0.18em] text-emerald-300">FREE START</div>
          <h2 className="mt-3 text-2xl font-black md:text-3xl">まずは無料で、自分に合う方向性をチェック</h2>
          <p className="mt-3 text-sm leading-6 text-white/75 md:text-base md:leading-7">
            ログインしなくても診断は始められます。気に入った結果はあとから保存できます。
          </p>
          <button
            onClick={() => handleDiagnosisStart('bottom')}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-golf-500 px-7 py-4 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-golf-600 sm:w-auto"
          >
            <WandSparkles size={18} />
            無料診断をはじめる
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white px-5 py-6 shadow-sm md:px-10 md:py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-amber-600">POPULAR CONTENT</div>
            <h2 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl">人気コンテンツ</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base md:leading-7">
              診断の前後で見ておくと、クラブ選びの精度をさらに上げやすいコンテンツです。
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {popularContent.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black tracking-[0.14em] text-slate-500">
                  {item.eyebrow}
                </div>
                <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-trust-navy text-white">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-xl font-black text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                <button
                  onClick={() => navigate(item.href)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-black text-trust-navy transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                >
                  {item.buttonLabel}
                  <ArrowRight size={15} />
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
