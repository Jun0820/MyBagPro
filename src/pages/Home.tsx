import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Search,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { useDiagnosis } from '../context/DiagnosisContext';

const heroImage = '/articles/golf-clubs-grass-pexels-20808740.jpg';

const primaryMoves = [
  {
    title: '自分のクラブを登録',
    text: '番手、モデル、シャフト、飛距離を入れてバッグを見える化します。',
    href: '/mypage/clubs',
    icon: ClipboardList,
  },
  {
    title: 'プロの14本を見る',
    text: '日本女子、男子、海外プロのクラブセッティングを確認できます。',
    href: '/pros',
    icon: Search,
  },
  {
    title: '診断で見直す',
    text: 'ミス傾向と距離の階段から、優先して直すクラブを整理します。',
    href: '/diagnosis',
    icon: Sparkles,
  },
];

const featuredLinks = [
  {
    label: '最新更新',
    title: 'プロのクラブセッティング一覧',
    text: '掲載版、更新日、使用クラブをまとめて確認',
    href: '/pros',
    image: '/article-visuals/golf-bag-course.jpg',
  },
  {
    label: '悩み解決',
    title: '5番アイアンが苦手なら',
    text: 'UT・7Wで距離を作る考え方',
    href: '/articles/five-iron-hard-ut-7w-womens-pro-setting-2026',
    image: '/article-visuals/iron-ball.jpg',
  },
  {
    label: 'クラブ選び',
    title: 'ドライバー一覧',
    text: '気になるモデルを診断や購入検討へ',
    href: '/clubs/drivers',
    image: '/article-visuals/driver-tee.jpg',
  },
];

const valueRows = [
  ['プロの真似で終わらない', '同じクラブを買う前に、番手構成と役割を読み解きます。'],
  ['自分のバッグに落とし込む', 'キャリー、総距離、シャフト重量、ミス傾向を一緒に見ます。'],
  ['購入前の迷いを減らす', '診断、比較、詳細、購入先確認まで一つの流れで進めます。'],
];

const statItems = [
  { label: 'プロセッティング', value: '掲載中', icon: Trophy },
  { label: 'My Clubs', value: '保存対応', icon: ClipboardList },
  { label: 'AI診断', value: '無料', icon: BarChart3 },
];

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useDiagnosis();

  const goToDiagnosis = (source: 'hero' | 'bottom') => {
    trackEvent('start_ai_diagnosis', {
      source_page: `home_${source}`,
      destination: user.isLoggedIn ? 'diagnosis' : 'create_mypage_then_diagnosis',
    });
    navigate(user.isLoggedIn ? '/diagnosis' : '/mypage/view?auth=register&next=diagnosis');
  };

  const goToMyClubs = () => {
    trackEvent(user.isLoggedIn ? 'open_mybag_from_home' : 'open_register', {
      source_surface: 'home_primary',
      next_destination: 'mypage_clubs',
    });
    navigate(user.isLoggedIn ? '/mypage/clubs' : '/mypage/view?auth=register&next=mypage');
  };

  return (
    <div className="pb-8 md:pb-12">
      <section className="-mx-3 -mt-3 overflow-hidden bg-[#0f1914] text-white md:-mx-6 md:-mt-7">
        <div className="relative min-h-[520px] md:min-h-[600px]">
          <img src={heroImage} alt="ゴルフバッグとクラブ" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,18,14,0.92),rgba(10,18,14,0.72)_42%,rgba(10,18,14,0.18)_100%)]" />
          <div className="relative mx-auto flex min-h-[520px] max-w-[1380px] flex-col justify-end px-4 pb-6 pt-16 md:min-h-[600px] md:px-8 md:pb-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#d8c58b] ring-1 ring-white/14">
                MyBagPro
              </div>
              <h1 className="mt-4 text-[2.2rem] font-black leading-[1.02] tracking-tight md:mt-5 md:text-[4.8rem]">
                プロの14本から、
                <br />
                自分のクラブ選びへ。
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 md:mt-5 md:text-lg md:leading-8">
                MyBagProは、プロや人気ゴルファーのクラブセッティングを見て、自分のバッグ登録、AI診断、購入検討までつなげるゴルフクラブ分析サイトです。
              </p>
              <div className="mt-5 grid gap-2 sm:max-w-xl sm:grid-cols-2 md:mt-7">
                <button
                  onClick={goToMyClubs}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#176534] px-4 text-sm font-black text-white transition hover:bg-[#13542b] md:min-h-[56px] md:text-base"
                >
                  {user.isLoggedIn ? 'マイクラブを開く' : '無料登録してクラブを登録'}
                </button>
                <button
                  onClick={() => goToDiagnosis('hero')}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-4 text-sm font-black text-[#102318] transition hover:bg-[#f3f6f3] md:min-h-[56px] md:text-base"
                >
                  AI診断を始める
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3 md:mt-9 md:max-w-3xl">
              {statItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 border-t border-white/18 py-3">
                    <Icon size={18} className="text-[#d8c58b]" />
                    <div>
                      <div className="text-[10px] font-bold text-white/58">{item.label}</div>
                      <div className="text-sm font-black text-white">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-0 pt-5 md:pt-8">
        <div className="grid gap-2 md:grid-cols-3 md:gap-3">
          {primaryMoves.map((move) => {
            const Icon = move.icon;
            const action = move.href === '/diagnosis' ? () => goToDiagnosis('bottom') : move.href === '/mypage/clubs' ? goToMyClubs : () => navigate(move.href);
            return (
              <button
                key={move.title}
                onClick={action}
                className="group grid min-h-[86px] grid-cols-[40px_minmax(0,1fr)_24px] items-center gap-3 border-b border-slate-200 bg-white px-1 py-3 text-left transition hover:bg-[#f7fbf8] md:min-h-[132px] md:rounded-lg md:border md:px-4 md:py-4 md:shadow-sm md:ring-1 md:ring-slate-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef6ef] text-[#176534]">
                  <Icon size={19} />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-black text-[#111827] md:text-lg">{move.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-600 md:text-sm md:leading-6">{move.text}</div>
                </div>
                <ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#176534]" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-7 grid max-w-[1380px] gap-6 md:mt-10 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="md:pt-1">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#176534]">Why MyBagPro</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] md:text-4xl">クラブ一覧ではなく、選び方まで残す。</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            プロの使用クラブは参考になります。ただし、そのまま真似るだけではヘッドスピード、球筋、距離の階段が合わないこともあります。
            MyBagProでは、プロの14本を自分のバッグに置き換えて考えられるように設計しています。
          </p>
          <button
            onClick={() => navigate('/pros')}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#111827] px-5 text-sm font-black text-white transition hover:bg-[#1f2937]"
          >
            プロ一覧を見る
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="space-y-0 border-y border-slate-200 md:rounded-lg md:border md:bg-white md:shadow-sm">
          {valueRows.map(([title, text]) => (
            <div key={title} className="grid gap-1 border-b border-slate-200 px-1 py-4 last:border-b-0 md:grid-cols-[190px_minmax(0,1fr)] md:px-5 md:py-5">
              <div className="text-sm font-black text-[#111827] md:text-base">{title}</div>
              <div className="text-sm leading-6 text-slate-600">{text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-7 max-w-[1380px] md:mt-10">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#176534]">Start Here</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#111827] md:text-3xl">今すぐ見られるコンテンツ</h2>
          </div>
          <button onClick={() => navigate('/articles')} className="hidden text-sm font-black text-[#176534] md:inline-flex">
            記事一覧へ
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {featuredLinks.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.href)}
              className="group overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="absolute left-3 top-3 rounded-full bg-[#176534] px-2.5 py-1 text-[10px] font-black text-white">
                  {item.label}
                </div>
              </div>
              <div className="p-3 md:p-4">
                <div className="text-base font-black text-[#111827] md:text-lg">{item.title}</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">{item.text}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-7 max-w-[1380px] overflow-hidden rounded-lg bg-[#102318] px-4 py-5 text-white md:mt-10 md:px-7 md:py-7">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-xl font-black tracking-tight md:text-3xl">まずは1本だけでも登録できます。</div>
            <div className="mt-2 text-sm leading-7 text-white/74">
              ドライバー、7I、ウェッジ、ボールからでも大丈夫です。登録した情報は診断とマイクラブに反映されます。
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:min-w-[360px]">
            <button
              onClick={goToMyClubs}
              className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-[#d8c58b] px-5 text-sm font-black text-[#102318]"
            >
              クラブを登録
            </button>
            <button
              onClick={() => navigate('/pros')}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-white/10 px-5 text-sm font-black text-white ring-1 ring-white/16"
            >
              <CheckCircle2 size={16} />
              プロを見る
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
