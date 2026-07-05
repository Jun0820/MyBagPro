import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronRight, Flag, ImageIcon, Instagram, Link2, Music2, Share2, Trophy, UserRound, Youtube } from 'lucide-react';
import { applySeo } from '../lib/seo';
import { trackEvent } from '../lib/analytics';
import { feedbackFormUrl, hasFeedbackForm, trackFeedbackClick } from '../config/feedback';
import {
  defaultGolfIdVisibility,
  normalizeGolfIdUsername,
  type GolfIdRecord,
  type GolfIdVisibilityKey,
} from '../lib/golfId';
import { loadOwnGolfIdProfile, loadPublicGolfIdProfile, type GolfIdLoadStatus } from '../lib/golfIdProfileSource';
import { useDiagnosis } from '../context/DiagnosisContext';
import { ShareButtons, SharePanel } from '../components/golfid/SharePanel';

const canShow = (record: GolfIdRecord | null, key: GolfIdVisibilityKey) => {
  if (!record) return false;
  return { ...defaultGolfIdVisibility, ...(record.visibility || {}) }[key] !== false;
};

const formatValue = (value?: string | number | null, suffix = '') => {
  if (value === null || value === undefined || value === '') return '-';
  return `${value}${suffix}`;
};

const getSocialLinkItems = (profile: GolfIdRecord | null) => {
  const links = profile?.social_links || {};
  return [
    links.youtube ? { platform: 'youtube', label: 'YouTube', url: links.youtube, icon: Youtube } : null,
    links.instagram ? { platform: 'instagram', label: 'Instagram', url: links.instagram, icon: Instagram } : null,
    links.tiktok ? { platform: 'tiktok', label: 'TikTok', url: links.tiktok, icon: Music2 } : null,
    links.x ? { platform: 'x', label: 'X', url: links.x, icon: Share2 } : null,
    links.custom1?.url ? { platform: 'custom1', label: links.custom1.label || 'Link 1', url: links.custom1.url, icon: Link2 } : null,
    links.custom2?.url ? { platform: 'custom2', label: links.custom2.label || 'Link 2', url: links.custom2.url, icon: Link2 } : null,
  ].filter(Boolean) as Array<{ platform: string; label: string; url: string; icon: typeof Link2 }>;
};

const profileTitleName = (profile: GolfIdRecord) => profile.nickname?.trim() || profile.username || 'Golf ID';

const brandNames = [
  'TaylorMade',
  'Titleist',
  'Callaway',
  'Cleveland',
  'Srixon',
  'Dunlop',
  'Bridgestone',
  'Yamaha',
  'PING',
  'Ping',
  'Mizuno',
  'Odyssey',
  'Scotty Cameron',
  'PXG',
  'PRGR',
  'Fourteen',
].sort((a, b) => b.length - a.length);

type ParsedClubLine = {
  raw: string;
  badge: string;
  brand: string;
  model: string;
  shaft: string;
  distance: string;
  order: number;
  kind: 'wood' | 'utility' | 'iron' | 'wedge' | 'putter' | 'ball' | 'other';
};

const clubOrder = (badge: string) => {
  const normalized = badge.toUpperCase();
  if (normalized === 'BALL') return 999;
  if (normalized === 'PT') return 980;
  if (normalized === 'PW') return 460;
  const degree = normalized.match(/^(\d{2})°$/);
  if (degree) return 500 + Number(degree[1]);
  const match = normalized.match(/^(\d+)(W|U|UT|I)$/);
  if (!match) return 700;
  const number = Number(match[1]);
  const type = match[2];
  if (type === 'W') return number * 10;
  if (type === 'U' || type === 'UT') return 100 + number * 10;
  return 300 + number * 10;
};

const clubKind = (badge: string): ParsedClubLine['kind'] => {
  const normalized = badge.toUpperCase();
  if (normalized === 'BALL') return 'ball';
  if (normalized === 'PT') return 'putter';
  if (/^\d{2}°$/.test(normalized)) return 'wedge';
  if (/W$/.test(normalized)) return 'wood';
  if (/(U|UT)$/.test(normalized)) return 'utility';
  if (/I$/.test(normalized) || normalized === 'PW') return 'iron';
  return 'other';
};

const parseClubLine = (line: string, index: number): ParsedClubLine => {
  const clean = line.replace(/\s+/g, ' ').trim();
  const parts = clean.split('/').map((part) => part.trim()).filter(Boolean);
  const headPart = parts[0] || clean;
  const headMatch = headPart.match(/^([0-9]{1,2}(?:W|U|UT|I)|PW|PT|BALL|[0-9]{2}°)\s*(.*)$/i);
  const badge = (headMatch?.[1] || '').toUpperCase().replace('UT', 'U') || `#${index + 1}`;
  const headText = headMatch?.[2]?.trim() || (badge === 'BALL' || badge === 'PT' ? '' : headPart);
  const brand = brandNames.find((name) => headText.toLowerCase().startsWith(name.toLowerCase())) || '';
  const model = brand ? headText.slice(brand.length).trim() : headText;
  const distanceMatch = clean.match(/(?:^|\/|\s)(\d{2,3})\s*y(?:d|ds)?\b/i);

  return {
    raw: clean,
    badge,
    brand: brand || (badge === 'BALL' ? 'Ball' : badge === 'PT' ? 'Putter' : ''),
    model: model || headText || (badge === 'BALL' ? '登録ボール' : badge === 'PT' ? '登録パター' : clean),
    shaft: parts[1] || '',
    distance: distanceMatch ? distanceMatch[1] : '-',
    order: clubOrder(badge),
    kind: clubKind(badge),
  };
};

const clubIconTone: Record<ParsedClubLine['kind'], string> = {
  wood: 'bg-slate-900 text-white',
  utility: 'bg-emerald-800 text-white',
  iron: 'bg-slate-100 text-slate-900',
  wedge: 'bg-stone-100 text-slate-900',
  putter: 'bg-slate-950 text-white',
  ball: 'bg-emerald-50 text-emerald-900',
  other: 'bg-slate-100 text-slate-900',
};

const buildProfileSeoTitle = (profile: GolfIdRecord | null, username: string) => {
  if (!profile) return username ? `${username}のGolf ID` : 'Golf ID';
  const scoreParts = [
    profile.best_score ? `ベスト${profile.best_score}` : '',
    profile.target_score ? `目標${profile.target_score}` : '',
  ].filter(Boolean);
  return `${profileTitleName(profile)}のGolf ID${scoreParts.length > 0 ? `｜${scoreParts.join('・')}` : ''}`;
};

export const GolfIdPublicPage = () => {
  const { username: rawUsername } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useDiagnosis();
  const username = useMemo(() => normalizeGolfIdUsername(rawUsername || ''), [rawUsername]);
  const [profile, setProfile] = useState<GolfIdRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState<GolfIdLoadStatus | null>(null);
  const [loadMessage, setLoadMessage] = useState('');
  const [showTopShare, setShowTopShare] = useState(false);
  const createdJustNow = searchParams.get('created') === '1';

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      setLoading(true);
      setLoadStatus(null);
      setLoadMessage('');
      setProfile(null);
      try {
        let result = await loadPublicGolfIdProfile(username);

        if (result.status === 'not_found' && user.isLoggedIn && user.id) {
          const ownResult = await loadOwnGolfIdProfile(user.id);
          if (ownResult.status === 'ok' && ownResult.profile) {
            result = ownResult;
          }
        }

        if (!mounted) return;
        setLoadStatus(result.status);
        setLoadMessage(result.message || '');
        if (result.status === 'ok' && result.profile) {
          setProfile(result.profile);
          trackEvent('public_page_view', {
            username: result.profile.username || username,
          });
        }
      } catch (error) {
        if (!mounted) return;
        setLoadStatus('connection_error');
        setLoadMessage(error instanceof Error ? error.message : 'Golf IDの読み込み中にエラーが発生しました。');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [username, user.id, user.isLoggedIn]);

  useEffect(() => {
    const title = buildProfileSeoTitle(profile, username);
    const canonicalUsername = profile?.username || username;
    applySeo({
      title,
      description: profile
        ? `${profileTitleName(profile)}さんのGolf ID。ベストスコア、目標、ヘッドスピード、悩み、クラブセッティング、AI上達診断の次の一手をまとめています。`
        : 'スコア、クラブセッティング、ゴルフの悩みをまとめた公開Golf IDページです。',
      path: `/u/${canonicalUsername}`,
      image: '/article-visuals/golf-bag-course.jpg',
    });
  }, [profile, username]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#F5F7F4] px-4">
        <div className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-500 shadow-sm ring-1 ring-black/5">Golf IDを読み込んでいます...</div>
      </main>
    );
  }

  if (loadStatus && loadStatus !== 'ok' && loadStatus !== 'not_found') {
    const errorCopy: Record<Exclude<GolfIdLoadStatus, 'ok' | 'not_found'>, { title: string; body: string }> = {
      connection_error: {
        title: '読み込みに失敗しました',
        body: 'Supabaseへの接続でエラーが発生しました。時間をおいて再度アクセスしてください。',
      },
      permission_error: {
        title: '公開データを読み込めません',
        body: '公開プロフィールの読み取り権限が不足しています。RLS/selectポリシーを確認してください。',
      },
      table_missing: {
        title: 'Golf IDの保存先が未設定です',
        body: 'golf_profilesテーブルがまだ作成されていません。既存プロフィールにも一致するGolf IDが見つかりませんでした。',
      },
      render_error: {
        title: '表示に失敗しました',
        body: 'データは見つかりましたが、公開ページの表示でエラーが発生しました。',
      },
    };
    const copy = errorCopy[loadStatus] || errorCopy.connection_error;
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-black text-slate-950">{copy.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">{copy.body}</p>
          {import.meta.env.DEV && loadMessage && <p className="mt-3 break-all rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500">{loadMessage}</p>}
          <Link to="/explore" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">
            みんなのGolf IDを見る
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  if (loadStatus === 'not_found' || !profile) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-black text-slate-950">このGolf IDはまだ作成されていません</h1>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">新しくGolf IDを作成すると、SNSプロフィールに貼れる公開ページを作れます。</p>
          <Link to="/create" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white">
            自分もGolf IDを作る
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  const clubLines = (profile.club_setting || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const clubs = clubLines
    .map(parseClubLine)
    .sort((a, b) => a.order - b.order);
  const publicUrl = `https://golfid.jp/u/${profile.username}`;
  const diagnosis = profile.diagnosis_result;
  const shareTitle = `${profile.nickname || profile.username}のGolf ID`;
  const shareText = '自分のGolf IDを作りました。\nクラブ・スコア・悩み・目標・SNSリンクをまとめています。';
  const socialLinkItems = getSocialLinkItems(profile);
  const statusCards = [
    canShow(profile, 'best_score') ? { label: 'Best', sub: 'ベスト', value: formatValue(profile.best_score) } : null,
    canShow(profile, 'average_score') ? { label: 'Avg', sub: '平均', value: formatValue(profile.average_score) } : null,
    canShow(profile, 'target_score') ? { label: 'Target', sub: '目標', value: formatValue(profile.target_score) } : null,
    canShow(profile, 'head_speed') ? { label: 'HS', sub: 'ヘッドスピード', value: formatValue(profile.head_speed, 'm/s') } : null,
  ].filter(Boolean) as Array<{ label: string; sub: string; value: string }>;
  const profileFields = [
    canShow(profile, 'golf_history') ? ['ゴルフ歴', formatValue(profile.golf_history)] : null,
    canShow(profile, 'favorite_club') ? ['得意クラブ', formatValue(profile.favorite_club)] : null,
    canShow(profile, 'weak_club') ? ['苦手クラブ', formatValue(profile.weak_club)] : null,
    canShow(profile, 'current_issue') ? ['今の悩み', formatValue(profile.current_issue)] : null,
  ].filter(Boolean) as Array<[string, string]>;

  const handleSignupClick = () => {
    trackEvent('public_page_signup_click', {
      username: profile.username,
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#EEF2EC] text-[#101712]">
      <section className="mx-0 grid w-[calc(100vw-2rem)] max-w-none gap-6 px-0 py-0 sm:mx-auto sm:w-full sm:max-w-7xl sm:px-5 sm:py-4 lg:grid-cols-[minmax(420px,760px)_360px] lg:items-start lg:px-8 lg:py-8">
        <article className="w-full min-w-0 overflow-hidden bg-white shadow-[0_28px_100px_-70px_rgba(11,15,13,0.75)] ring-1 ring-black/5 sm:rounded-[2rem]">
          <header className="relative min-h-[330px] overflow-hidden bg-[#0B0F0D] px-4 pb-6 pt-5 text-white sm:min-h-[390px] sm:px-8">
            <img
              src="/article-visuals/golf-bag-course.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,13,0.3),rgba(11,15,13,0.72)_48%,rgba(11,15,13,0.96))]" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full bg-black/20 px-3 py-1.5 text-[11px] font-black tracking-[0.16em] text-white/80 ring-1 ring-white/15 backdrop-blur">
                GOLF ID
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTopShare((value) => !value)}
                  className="inline-flex min-h-11 -translate-x-5 items-center gap-2 rounded-2xl bg-white/16 px-4 text-sm font-black text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/22 sm:translate-x-0"
                >
                  <Share2 className="h-4 w-4" />
                  シェア
                </button>
                {showTopShare && (
                  <div className="absolute right-0 top-14 z-20 w-72 rounded-[1.4rem] bg-[#0B0F0D]/94 p-3 shadow-2xl ring-1 ring-white/15 backdrop-blur">
                    <ShareButtons
                      url={publicUrl}
                      title={shareTitle}
                      text={shareText}
                      username={profile.username}
                      location="public_top"
                      mode="compact"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-8 flex flex-col items-center text-center">
              <div className="relative">
                <div className="h-28 w-28 overflow-hidden rounded-full bg-white p-1 shadow-2xl ring-1 ring-white/40 sm:h-32 sm:w-32">
                  <img src="/article-visuals/driver-tee.jpg" alt="" className="h-full w-full rounded-full object-cover" />
                </div>
                <span className="absolute bottom-2 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{profile.nickname || profile.username}</h1>
              <p className="mt-1 text-base font-black text-white/90">@{profile.username}</p>
              <p className="mt-3 max-w-md text-sm font-bold leading-6 text-white/84">このGolf IDはSNSプロフィールに貼れます</p>
              <p className="mt-2 break-all rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/76 ring-1 ring-white/12">{publicUrl}</p>
            </div>
          </header>

          {createdJustNow && (
            <section className="px-4 pt-4 sm:px-6">
              <div className="rounded-[1.5rem] bg-[#D7B56D] p-4 text-[#0B0F0D]">
                <p className="text-xs font-black uppercase tracking-[0.16em]">Created</p>
                <h2 className="mt-1 text-xl font-black">Golf IDを作成しました。</h2>
                <p className="mt-1 text-sm font-bold leading-6">このページをSNSプロフィールに貼って共有できます。</p>
              </div>
            </section>
          )}

          {statusCards.length > 0 && (
            <section className="-mt-3 px-3 sm:px-6">
              <div className="relative z-10 rounded-[1.6rem] bg-[#12351F] p-4 text-white shadow-[0_22px_60px_-44px_rgba(18,53,31,0.95)] ring-1 ring-white/10">
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <Trophy className="h-5 w-5 text-[#D7B56D]" />
                  Best Score
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
                  {statusCards.map((card) => (
                    <div key={card.label} className="min-w-0 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                      <p className="text-[11px] font-black text-white/75">{card.sub}</p>
                      <p className="mt-1 break-words text-2xl font-black tracking-tight text-white sm:text-3xl">{card.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="space-y-5 px-3 py-5 sm:px-6">
            {profileFields.length > 0 && (
              <section className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h2 className="flex items-center gap-2 text-lg font-black text-emerald-950">
                  <UserRound className="h-5 w-5 text-emerald-700" />
                  Golf Profile
                </h2>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {profileFields.map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#F7F8F5] px-4 py-3 shadow-sm ring-1 ring-black/5">
                      <dt className="text-[11px] font-black text-emerald-800">{label}</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm font-black leading-6 text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {socialLinkItems.length > 0 && (
              <section className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h2 className="flex items-center gap-2 text-lg font-black text-emerald-950">
                  <Link2 className="h-5 w-5 text-emerald-700" />
                  SNS & Links
                </h2>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {socialLinkItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.platform}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackEvent('social_link_click', {
                            platform: item.platform,
                            username: profile.username,
                          })
                        }
                        className="flex min-h-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-emerald-50"
                        aria-label={item.label}
                      >
                        <Icon className="h-6 w-6 text-emerald-800" />
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {canShow(profile, 'club_setting') && (
              <section className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h2 className="flex items-center gap-2 text-lg font-black text-emerald-950">
                  <Flag className="h-5 w-5 text-emerald-700" />
                  My Bag
                </h2>
                {clubs.length > 0 ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {clubs.map((club, index) => (
                      <div key={`${club.raw}-${index}`} className="grid min-w-0 grid-cols-[36px_38px_minmax(0,1fr)] items-center gap-2 border-b border-slate-100 px-2 py-2.5 last:border-b-0 sm:grid-cols-[56px_48px_minmax(0,1fr)_82px_22px] sm:px-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-black/5 sm:h-12 sm:w-12 sm:rounded-2xl">
                          <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className={`flex h-9 items-center justify-center rounded-xl text-sm font-black shadow-sm ${clubIconTone[club.kind]}`}>
                          {club.badge}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-black text-slate-500">{club.brand || '-'}</p>
                          <div className="flex min-w-0 items-start justify-between gap-2">
                            <p className="truncate text-sm font-black leading-5 text-slate-950">{club.model}</p>
                            <span className="shrink-0 text-right text-base font-black leading-5 text-slate-950 sm:hidden">
                              {club.distance}<span className="ml-0.5 text-[10px] font-bold text-slate-500">y</span>
                            </span>
                          </div>
                          <p className="truncate text-[11px] font-bold text-slate-500">{club.shaft || '-'}</p>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-xl font-black leading-none tracking-tight text-slate-950 sm:text-2xl">{club.distance}</p>
                          <p className="text-[10px] font-bold text-slate-500">yd</p>
                        </div>
                        <ChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">-</p>
                )}
              </section>
            )}

            <Link
              to="/create"
              onClick={handleSignupClick}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#14552B] px-5 text-sm font-black text-white shadow-[0_18px_40px_-28px_rgba(20,85,43,0.95)] transition hover:bg-[#0f4322]"
            >
              あなたもGolf IDを作る
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-center text-sm font-black text-emerald-900">Golf ID <span className="font-bold text-slate-400">Powered by Golf ID</span></p>
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-6">
          {diagnosis && (
            <section className="rounded-[1.7rem] bg-[#0B0F0D] p-5 text-white shadow-[0_22px_70px_-52px_rgba(11,15,13,0.9)] ring-1 ring-black/5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#D7B56D]">Next Action</p>
              <h2 className="mt-2 text-2xl font-black">あなたの次の一手</h2>
              <div className="mt-4 rounded-2xl bg-[#D7B56D] p-4 text-[#0B0F0D]">
                <p className="text-sm font-black">{diagnosis.diagnosisType || 'クラブ見直しタイプ'}</p>
                <p className="mt-2 text-base font-black leading-7">{diagnosis.nextAction || 'クラブ、スコア、悩みを整理して次の改善ポイントを見つけましょう。'}</p>
              </div>
              <div className="mt-4 space-y-3 text-sm font-semibold leading-7 text-white/78">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/12">
                  <p className="text-xs font-black text-[#D7B56D]">今の状態</p>
                  <p className="mt-2">{diagnosis.currentStatus || '-'}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/12">
                  <p className="text-xs font-black text-[#D7B56D]">優先課題</p>
                  <p className="mt-2">{diagnosis.priorityIssue || '-'}</p>
                </div>
              </div>
            </section>
          )}

          <SharePanel
            url={publicUrl}
            title={shareTitle}
            text={shareText}
            username={profile.username}
            variant="full"
            location="public_bottom"
            heading="このGolf IDを共有する"
            description="Instagram・TikTok・X・LINE・プロフィール欄に貼って共有できます。"
          />

          <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-black text-slate-950">あなたのゴルフも、1ページに。</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-600">スコア、目標、クラブ、SNSリンクをまとめて、プロフィールに貼れるGolf IDを作れます。</p>
            <Link
              to="/create"
              onClick={handleSignupClick}
              className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 text-sm font-black text-white transition hover:bg-emerald-900"
            >
              無料でGolf IDを作る
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/explore"
              className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm font-black text-slate-800 ring-1 ring-black/5 transition hover:bg-emerald-50"
            >
              みんなのGolf IDを見る
            </Link>
            <a
              href="https://www.mybagpro.jp/pros"
              className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm font-black text-slate-800 ring-1 ring-black/5 transition hover:bg-emerald-50"
            >
              MyBagProを見る
            </a>
            {hasFeedbackForm && (
              <a
                href={feedbackFormUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackFeedbackClick('public_page')}
                className="mt-3 flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-black text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-50"
              >
                使ってみた感想・改善点を送る
              </a>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
};
