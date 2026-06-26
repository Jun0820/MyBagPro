import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Search,
  Sparkles,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBrandConfig, isExternalHref } from '../config/brand';
import { trackEvent } from '../lib/analytics';
import { useDiagnosis } from '../context/DiagnosisContext';
import { GolfIdPreviewCard } from '../components/golfid/GolfIdUi';

const heroImage = '/articles/golf-clubs-grass-pexels-20808740.jpg';

const getPrimaryMoves = (brand: ReturnType<typeof getBrandConfig>) =>
  brand.brand === 'golfid'
    ? [
        {
          title: 'Golf IDを作る',
          text: 'クラブ、スコア、悩み、目標をまとめて自分のゴルフを見える化します。',
          href: '/create',
          icon: ClipboardList,
        },
        {
          title: 'AI上達診断',
          text: 'ミス傾向と距離の階段から、次に直すクラブを整理します。',
          href: '/diagnosis',
          icon: Sparkles,
        },
        {
          title: '公開ページを見る',
          text: 'ほかのゴルファーのセッティングや公開Golf IDを参考にできます。',
          href: '/explore',
          icon: UsersRound,
        },
      ]
    : [
        {
          title: 'プロの14本を見る',
          text: '日本女子、男子、海外プロのクラブセッティングを確認できます。',
          href: '/pros',
          icon: Trophy,
        },
        {
          title: 'クラブ選びの記事',
          text: '番手構成、UT、7W、ボール選びなどの記事から探せます。',
          href: '/articles',
          icon: Search,
        },
        {
          title: 'Golf IDで診断する',
          text: '気になるクラブ選びを自分のデータとAI診断につなげます。',
          href: 'https://golfid.jp/create',
          icon: Sparkles,
        },
      ];

const featuredLinks = [
  {
    label: '最新更新',
    title: 'プロのクラブセッティング一覧',
    text: '使用確認時期、更新日、使用クラブをまとめて確認',
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

const statItems = [
  { label: 'プロセッティング', value: '掲載中', icon: Trophy },
  { label: 'Golf ID', value: '共有対応', icon: ClipboardList },
  { label: 'AI診断', value: '無料', icon: BarChart3 },
];

const getBrandSections = (brand: ReturnType<typeof getBrandConfig>) =>
  brand.brand === 'golfid'
    ? [
        ['Golf IDでできること', 'クラブ、スコア、悩み、目標をひとつにまとめ、公開範囲を選んで共有できます。'],
        ['AI上達診断でわかること', '飛距離の階段、ミス傾向、クラブ構成から、次に見直すポイントを整理します。'],
        ['公開Golf IDサンプル', 'ほかのゴルファーのセッティングを見て、自分に近い構成を探せます。'],
        ['Player Card共有', 'SNSプロフィールに貼れる公開ページとカードで、自分のゴルフを伝えやすくします。'],
        ['無料作成CTA', 'まずは1本のクラブや使用ボールだけでも登録して始められます。'],
      ]
    : [
        ['プロのクラブセッティング', '日本女子、男子、海外プロの14本を、使用確認時期やソースと一緒に確認できます。'],
        ['インフルエンサーのギア', '人気ゴルファーのリアルなクラブ構成やSNS導線を見られます。'],
        ['みんなのセッティング', '一般ゴルファーの公開セッティングから、自分に近い番手構成を探せます。'],
        ['クラブ選びの記事', '5番アイアン、UT、7W、ボールなど、悩みからクラブ選びを深掘りできます。'],
        ['Golf ID作成CTA', '気になるセッティングを見たら、Golf IDで自分のクラブ診断へ進めます。'],
      ];

const shortcutLinks = [
  { label: '日本女子プロ', href: '/pros?category=japan_women' },
  { label: '日本男子プロ', href: '/pros?category=japan_men' },
  { label: '海外男子', href: '/pros?category=overseas_men' },
  { label: '海外女子', href: '/pros?category=overseas_women' },
  { label: '記事・コラム', href: '/articles' },
  { label: 'ドライバー一覧', href: '/clubs/drivers' },
];

const searchExamples = ['松山英樹', '山下美夢有', 'ピン', '7W', 'ユーティリティ'];

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useDiagnosis();
  const [heroSearch, setHeroSearch] = useState('');
  const brand = getBrandConfig();
  const primaryMoves = getPrimaryMoves(brand);
  const brandSections = getBrandSections(brand);
  const heroTitleLines = brand.mainCopy.includes('、') ? brand.mainCopy.replace('、', '、\n').split('\n') : [brand.mainCopy];

  const openHref = (href: string) => {
    if (isExternalHref(href)) {
      if (brand.brand === 'mybagpro' && href.includes('golfid.jp/create')) {
        trackEvent('mybagpro_to_golfid_click', {
          source_page: 'home',
          destination: href,
        });
      }
      window.location.href = href;
      return;
    }
    if (href === '/create') {
      navigate(user.isLoggedIn ? '/create' : '/create?auth=register&next=create');
      return;
    }
    navigate(href);
  };

  const goToDiagnosis = (source: 'hero' | 'bottom') => {
    trackEvent('start_ai_diagnosis', {
      source_page: `home_${source}`,
      destination: user.isLoggedIn ? 'diagnosis' : 'create_mypage_then_diagnosis',
    });
    navigate(user.isLoggedIn ? '/diagnosis' : '/mypage/view?auth=register&next=diagnosis');
  };

  const submitHeroSearch = (query = heroSearch) => {
    const normalized = query.trim();
    if (!normalized) {
      navigate('/pros');
      return;
    }

    trackEvent('search_from_home', {
      query: normalized,
      destination: 'pros',
    });
    navigate(`/pros?search=${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="pb-8 md:pb-12">
      <section className="-mx-3 -mt-3 overflow-hidden bg-[#0b0f0d] text-white md:-mx-6 md:-mt-7">
        <div className="relative min-h-[520px] md:min-h-[600px]">
          {brand.brand === 'mybagpro' && <img src={heroImage} alt="ゴルフバッグとクラブ" className="absolute inset-0 h-full w-full object-cover" />}
          <div
            className={
              brand.brand === 'golfid'
                ? 'absolute inset-0 bg-[radial-gradient(circle_at_72%_14%,rgba(215,181,109,0.22),transparent_24%),radial-gradient(circle_at_18%_72%,rgba(31,122,77,0.38),transparent_32%),linear-gradient(135deg,#0B0F0D,#102318_58%,#151C17)]'
                : 'absolute inset-0 bg-[linear-gradient(90deg,rgba(10,18,14,0.92),rgba(10,18,14,0.72)_42%,rgba(10,18,14,0.18)_100%)]'
            }
          />
          <div className="relative mx-auto grid min-h-[520px] max-w-[1380px] gap-8 px-4 pb-6 pt-16 md:min-h-[600px] md:grid-cols-[minmax(0,1fr)_420px] md:items-end md:px-8 md:pb-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#d8c58b] ring-1 ring-white/14">
                {brand.name}
              </div>
              {brand.brand === 'golfid' && (
                <div className="mt-3 inline-flex rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-black text-emerald-100 ring-1 ring-emerald-300/20">
                  β版公開中。先行メンバーは無料でGolf IDを作成できます。
                </div>
              )}
              <h1 className="mt-4 text-[2.2rem] font-black leading-[1.02] tracking-tight md:mt-5 md:text-[4.8rem]">
                {heroTitleLines[0]}
                {heroTitleLines[1] && (
                  <>
                    <br />
                    {heroTitleLines[1]}
                  </>
                )}
              </h1>
              <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-white/82 md:mt-5 md:text-lg md:leading-8">
                {brand.brand === 'golfid'
                  ? 'クラブ、スコア、悩み、目標、SNSリンクをまとめると、\nAIがあなたの“次の一手”を提案。\n作ったGolf IDはSNSプロフィールに貼って共有できます。'
                  : brand.description}
              </p>
              {brand.brand === 'mybagpro' && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitHeroSearch();
                  }}
                  className="mt-5 max-w-2xl rounded-xl bg-white/96 p-1.5 text-[#102318] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.8)] ring-1 ring-white/20 md:mt-6 md:rounded-2xl"
                >
                  <div className="grid grid-cols-[1fr_auto] gap-1.5">
                    <label className="flex min-h-[46px] items-center gap-2 px-2 md:min-h-[54px] md:px-3">
                      <Search size={18} className="shrink-0 text-slate-400" />
                      <input
                        value={heroSearch}
                        onChange={(event) => setHeroSearch(event.target.value)}
                        placeholder="選手名・メーカー・番手・クラブ名で検索"
                        className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#102318] outline-none placeholder:text-slate-400 md:text-base"
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-[#176534] px-4 text-sm font-black text-white transition hover:bg-[#13542b] md:min-h-[54px] md:rounded-xl md:px-5"
                    >
                      検索
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-2 pb-1 pt-1 md:px-3">
                    {searchExamples.map((query) => (
                      <button
                        key={query}
                        type="button"
                        onClick={() => submitHeroSearch(query)}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 transition hover:bg-[#eef6ef] hover:text-[#176534] md:text-[11px]"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </form>
              )}
              <div className="mt-5 grid gap-2 sm:max-w-xl sm:grid-cols-2 md:mt-7">
                <button
                  onClick={() => openHref(brand.primaryCtaHref)}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#D7B56D] px-4 text-sm font-black text-[#0B0F0D] transition hover:bg-[#e2c47e] md:min-h-[56px] md:text-base"
                >
                  {user.isLoggedIn && brand.brand === 'golfid' ? `${brand.name}を開く` : brand.primaryCta}
                </button>
                <button
                  onClick={() => openHref(brand.secondaryCtaHref)}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white/15 md:min-h-[56px] md:text-base"
                >
                  {brand.secondaryCta}
                </button>
              </div>
              <div className="mt-3 text-xs font-bold text-white/68 md:text-sm">見せたい項目だけ公開できます。</div>
            </div>

            {brand.brand === 'golfid' && (
              <div className="hidden md:block">
                <GolfIdPreviewCard
                  nickname="Tommy"
                  username="tommy"
                  bestScore="84"
                  targetScore="79"
                  averageScore="92"
                  headSpeed="51"
                  currentIssue="3WとUTの距離差を整理して、右ミスを減らしたい。"
                  favoriteClub="7W"
                  weakClub="3W"
                  clubLines={['1W PING G425 LST', '4U PING G430 Hybrid', '7I Yamaha inpres', 'Ball Titleist Pro V1']}
                  socialLabels={[
                    { label: 'YouTube', platform: 'youtube' },
                    { label: 'Instagram', platform: 'instagram' },
                    { label: 'TikTok', platform: 'tiktok' },
                    { label: 'X', platform: 'x' },
                  ]}
                  nextAction="180〜200yの番手を安定させるため、UTと7Wの役割を分けましょう。"
                />
              </div>
            )}

            <div className="mt-6 grid gap-2 sm:grid-cols-3 md:col-span-2 md:mt-9 md:max-w-3xl">
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
            const action = move.href === '/diagnosis' ? () => goToDiagnosis('bottom') : () => openHref(move.href);
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
        <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-4 md:mt-5 md:border-b-0 md:pb-0">
          {shortcutLinks.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="inline-flex min-h-[34px] items-center rounded-full bg-white px-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-[#eef6ef] hover:text-[#176534] hover:ring-[#b8d8c0] md:min-h-[38px] md:px-4 md:text-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
        {brand.brand === 'mybagpro' && (
          <div className="mt-5 rounded-lg bg-emerald-950 px-4 py-5 text-white shadow-sm ring-1 ring-emerald-900/40 md:px-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">Golf ID</div>
                <h2 className="mt-2 text-xl font-black md:text-2xl">このクラブ、あなたにも合う？</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">
                  Golf IDを作って、AI上達診断を受けると、気になるプロのセッティングを自分の距離・悩みに置き換えて考えられます。
                </p>
              </div>
              <button
                onClick={() => openHref('https://golfid.jp/create')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
              >
                無料でGolf IDを作る
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {brand.brand === 'golfid' && (
        <section className="mx-auto mt-7 grid max-w-[1380px] gap-4 md:mt-10 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#176534]">Public Golf ID</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] md:text-3xl">SNSプロフィールに貼れる形で残す。</h2>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-black text-slate-950">山田 太郎</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">golfid.jp/u/taro-golf</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-800 ring-1 ring-emerald-100">
                  100切り目標
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-[10px] font-black text-slate-500">ベスト</p>
                  <p className="text-xl font-black text-emerald-700">96</p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-[10px] font-black text-slate-500">目標</p>
                  <p className="text-xl font-black text-emerald-700">89</p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-[10px] font-black text-slate-500">HS</p>
                  <p className="text-xl font-black text-emerald-700">41</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">ドライバーが右に出る。180y前後の番手を安定させたい。</p>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-950 p-5 text-white shadow-sm ring-1 ring-emerald-900/40 md:p-6">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">AI Diagnosis</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">次の一手まで、言葉にする。</h2>
            <div className="mt-5 space-y-3">
              {[
                ['今の状態', '右ミスと距離ギャップが同時に出ている状態です。'],
                ['優先課題', 'ドライバーより先に、180〜200yの番手を安定させましょう。'],
                ['次の一手', '5Iを無理に使わず、UTか7Wで高さを作る構成を検討します。'],
              ].map(([label, text]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs font-black text-emerald-100">{label}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/90">{text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => openHref('/create')}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
            >
              無料でGolf IDを作る
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      <section className="mx-auto mt-7 grid max-w-[1380px] gap-6 md:mt-10 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="md:pt-1">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#176534]">{brand.brand === 'golfid' ? 'Why Golf ID' : 'Why MyBagPro'}</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] md:text-4xl">
            {brand.brand === 'golfid' ? '自分のゴルフを、見える形で残す。' : 'クラブ一覧ではなく、選び方まで読み取る。'}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            {brand.brand === 'golfid'
              ? 'クラブ、スコア、悩み、目標をまとめることで、診断、公開ページ、SNS共有まで一つの流れで使えます。見せたい項目だけ公開できます。'
              : 'プロや人気ゴルファーの使用クラブは参考になります。ただし、そのまま真似るだけではヘッドスピード、球筋、距離の階段が合わないこともあります。MyBagProでは、14本の意図を読み取り、自分のクラブ選びに活かせるように整理します。'}
          </p>
          <button
            onClick={() => openHref(brand.brand === 'golfid' ? '/create' : '/pros')}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#111827] px-5 text-sm font-black text-white transition hover:bg-[#1f2937]"
          >
            {brand.brand === 'golfid' ? '無料で作成する' : 'プロ一覧を見る'}
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="space-y-0 border-y border-slate-200 md:rounded-lg md:border md:bg-white md:shadow-sm">
          {brandSections.map(([title, text]) => (
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
              {brand.brand === 'golfid'
                ? 'ドライバー、7I、ウェッジ、ボールからでも大丈夫です。登録した情報は診断とGolf IDに反映されます。'
                : '記事やプロのセッティングを見たら、自分のGolf IDを作ってAI上達診断につなげられます。'}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:min-w-[360px]">
            <button
              onClick={() => openHref(brand.brand === 'golfid' ? '/create' : 'https://golfid.jp/create')}
              className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-[#d8c58b] px-5 text-sm font-black text-[#102318]"
            >
              {brand.brand === 'golfid' ? 'Golf IDを作る' : 'Golf ID作成へ'}
            </button>
            <button
              onClick={() => openHref(brand.brand === 'golfid' ? '/explore' : '/pros')}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-white/10 px-5 text-sm font-black text-white ring-1 ring-white/16"
            >
              <CheckCircle2 size={16} />
              {brand.brand === 'golfid' ? '公開ページを見る' : 'プロを見る'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
