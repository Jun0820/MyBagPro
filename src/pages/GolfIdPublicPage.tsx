import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronRight, Globe2, ImageIcon, Instagram, Link2, Music2, Share2, Trophy, UserRound, Youtube } from 'lucide-react';
import { applySeo } from '../lib/seo';
import { trackEvent } from '../lib/analytics';
import {
  defaultGolfIdVisibility,
  normalizeGolfIdUsername,
  type GolfIdRecord,
  type GolfIdVisibilityKey,
} from '../lib/golfId';
import { loadOwnGolfIdProfile, loadPublicGolfIdProfile, type GolfIdLoadStatus } from '../lib/golfIdProfileSource';
import { useDiagnosis } from '../context/DiagnosisContext';
import { ShareButtons } from '../components/golfid/SharePanel';

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
  ].filter(Boolean) as Array<{ platform: string; label: string; url: string; icon: typeof Link2 }>;
};

const getCustomLinkItems = (profile: GolfIdRecord | null) => {
  const links = profile?.social_links || {};
  return [links.custom1, links.custom2]
    .filter((link) => link?.url)
    .slice(0, 2)
    .map((link, index) => ({
      platform: `custom${index + 1}`,
      label: link?.label || (index === 0 ? '公式サイト' : 'Link'),
      description: (link as { description?: string } | undefined)?.description || (index === 0 ? '活動・実績' : '詳しく見る'),
      url: link?.url || '',
    }));
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

type PublicClubRow = {
  number?: string | null;
  club_label?: string | null;
  label?: string | null;
  brand?: string | null;
  model?: string | null;
  shaft?: string | null;
  distance?: string | number | null;
  total_distance?: string | number | null;
  carryDistance?: string | number | null;
  carry_distance?: string | number | null;
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

const parseClubRow = (row: PublicClubRow, index: number): ParsedClubLine => {
  const badge = String(row.club_label || row.label || row.number || `#${index + 1}`).toUpperCase().replace('UT', 'U');
  const brand = String(row.brand || '').trim();
  const model = String(row.model || '').trim();
  const shaft = String(row.shaft || '').trim();
  const distanceValue = row.distance ?? row.total_distance ?? row.carryDistance ?? row.carry_distance ?? '';
  const distance = distanceValue === null || distanceValue === undefined || distanceValue === '' ? '-' : String(distanceValue).replace(/y(?:d|ds)?$/i, '');
  const raw = [badge, brand, model, shaft, distance ? `${distance}y` : ''].filter(Boolean).join(' / ');

  return {
    raw,
    badge,
    brand: brand || (badge === 'BALL' ? 'Ball' : badge === 'PT' ? 'Putter' : ''),
    model: model || (badge === 'BALL' ? '登録ボール' : badge === 'PT' ? '登録パター' : '-'),
    shaft,
    distance,
    order: clubOrder(badge),
    kind: clubKind(badge),
  };
};

const clubDistanceSort = (club: ParsedClubLine) => {
  if (club.kind === 'putter') return -1;
  if (club.kind === 'ball') return -2;
  const parsed = Number(club.distance);
  return Number.isFinite(parsed) ? parsed : 0;
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
  if (!profile) return username ? `${username}のGolf ID | Golf ID` : 'Golf ID';
  return `${profileTitleName(profile)}のGolf ID | Golf ID`;
};

const getExtendedProfileValue = (profile: GolfIdRecord, keys: string[]) => {
  const source = profile as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
};

const getBestScores = (profile: GolfIdRecord) => {
  const source = profile as unknown as { best_scores?: Record<string, unknown>; bestScores?: Record<string, unknown> };
  const scores = source.best_scores || source.bestScores || {};
  const items = [
    { key: 'ladies', label: 'レディースティ', dot: 'bg-red-500', value: scores.ladies },
    { key: 'regular', label: 'レギュラーティ', dot: 'bg-white ring-1 ring-slate-300', value: scores.regular ?? profile.best_score },
    { key: 'back', label: 'バックティ', dot: 'bg-blue-500', value: scores.back },
    { key: 'champion', label: 'チャンピオンティ', dot: 'bg-slate-950', value: scores.champion },
  ];
  return items
    .map((item) => ({ ...item, value: item.value === null || item.value === undefined || item.value === '' ? '' : String(item.value) }))
    .filter((item) => item.value);
};

const getClubRows = (profile: GolfIdRecord) => {
  const source = profile as unknown as { clubs?: PublicClubRow[]; bag_items?: PublicClubRow[]; bagItems?: PublicClubRow[] };
  const rows = source.clubs || source.bag_items || source.bagItems || [];
  if (Array.isArray(rows) && rows.length > 0) {
    return rows.map(parseClubRow);
  }
  return (profile.club_setting || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseClubLine);
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
        ? `${profileTitleName(profile)}さんのGolf ID。ベストスコア、Golf Profile、SNSリンク、My Bagをまとめたゴルフプロフィールページです。`
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

  const clubs = getClubRows(profile)
    .sort((a, b) => {
      const distanceDiff = clubDistanceSort(b) - clubDistanceSort(a);
      return distanceDiff !== 0 ? distanceDiff : a.order - b.order;
    });
  const publicUrl = `https://golfid.jp/u/${profile.username}`;
  const shareTitle = `${profile.nickname || profile.username}のGolf ID`;
  const shareText = '自分のGolf IDを作りました。\nスコア・クラブ・SNSリンクをまとめたゴルフ用プロフィールです。';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(publicUrl)}`;
  const socialLinkItems = getSocialLinkItems(profile);
  const customLinkItems = getCustomLinkItems(profile);
  const bestScores = canShow(profile, 'best_score') ? getBestScores(profile) : [];
  const displayName = getExtendedProfileValue(profile, ['display_name', 'displayName']) || profile.nickname || profile.username;
  const bio = getExtendedProfileValue(profile, ['bio', 'comment', 'profile_comment', 'profileComment']) || 'ゴルフをもっとシンプルに、もっと楽しく。';
  const avatarUrl = getExtendedProfileValue(profile, ['avatar_url', 'avatarUrl', 'profile_image_url', 'profileImageUrl']);
  const coverUrl = getExtendedProfileValue(profile, ['cover_image_url', 'coverImageUrl', 'cover_url', 'coverUrl']) || '/article-visuals/golf-bag-course.jpg';
  const newProfileFields = [
    canShow(profile, 'golf_history') ? ['ゴルフ歴', formatValue(profile.golf_history)] : null,
    ['よく行くエリア', getExtendedProfileValue(profile, ['frequent_area', 'frequentArea', 'play_area', 'playArea'])],
    ['ホームコース', getExtendedProfileValue(profile, ['home_course', 'homeCourse'])],
    ['肩書', getExtendedProfileValue(profile, ['title', 'role_title', 'roleTitle', 'profile_title', 'profileTitle'])],
  ].filter(Boolean) as Array<[string, string]>;
  const visibleProfileFields = newProfileFields.filter(([, value]) => value && value !== '-');
  const fallbackProfileFields = [
    canShow(profile, 'favorite_club') ? ['得意クラブ', formatValue(profile.favorite_club)] : null,
    canShow(profile, 'weak_club') ? ['苦手クラブ', formatValue(profile.weak_club)] : null,
    canShow(profile, 'current_issue') ? ['今の悩み', formatValue(profile.current_issue)] : null,
    canShow(profile, 'head_speed') ? ['ヘッドスピード', formatValue(profile.head_speed, 'm/s')] : null,
  ].filter(Boolean) as Array<[string, string]>;
  const publicProfileFields = visibleProfileFields.length > 0
    ? [...visibleProfileFields, ...fallbackProfileFields.filter(([, value]) => value && value !== '-').slice(0, Math.max(0, 4 - visibleProfileFields.length))]
    : fallbackProfileFields.filter(([, value]) => value && value !== '-');

  const handleSignupClick = () => {
    trackEvent('public_page_signup_click', {
      username: profile.username,
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F8F5] text-[#111827]">
      <section className="mx-auto w-full max-w-6xl px-0 pb-8 sm:px-5 sm:py-6 lg:px-8">
        <article className="overflow-hidden bg-white shadow-[0_28px_100px_-78px_rgba(11,15,13,0.72)] ring-1 ring-[#E5E7EB] sm:rounded-[2rem]">
          <header className="relative min-h-[360px] overflow-hidden bg-[#0B0F0D] px-4 pb-7 pt-5 text-white sm:min-h-[430px] sm:px-8 lg:min-h-[460px]">
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-72"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,13,0.18),rgba(11,15,13,0.28)_35%,rgba(11,15,13,0.84))]" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full bg-black/22 px-3 py-1.5 text-[11px] font-black tracking-[0.16em] text-white/86 ring-1 ring-white/15 backdrop-blur">
                GOLF ID
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTopShare((value) => !value)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-white/18 px-3 text-xs font-black text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/24 sm:min-h-11 sm:px-4 sm:text-sm"
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

            <div className="relative z-10 mx-auto mt-16 flex max-w-2xl flex-col items-center text-center sm:mt-24 lg:mt-28">
              <div className="relative">
                <div className="h-28 w-28 overflow-hidden rounded-full bg-white p-1 shadow-2xl ring-1 ring-white/50 sm:h-36 sm:w-36">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#F7F8F5] text-4xl font-black text-[#0B5D36]">
                      {displayName.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="absolute bottom-2 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0F6B3D] text-white ring-4 ring-white">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{displayName}</h1>
              <p className="mt-1 text-base font-black text-white/90">@{profile.username}</p>
              <p className="mt-3 max-w-md text-sm font-bold leading-6 text-white/88 sm:text-base">{bio}</p>
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

          <div className="space-y-5 px-3 py-5 sm:px-6 lg:px-8">
            {bestScores.length > 0 && (
              <section className="rounded-[1.6rem] bg-[#0B5D36] p-4 text-white shadow-[0_22px_60px_-44px_rgba(18,53,31,0.95)] ring-1 ring-white/10 sm:p-5">
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <Trophy className="h-5 w-5 text-[#D7B56D]" />
                  Best Score
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {bestScores.map((score) => (
                    <div key={score.key} className="min-w-0 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                      <p className="flex items-center gap-2 text-[11px] font-black text-white/82">
                        <span className={`h-3 w-3 rounded-full ${score.dot}`} />
                        {score.label}
                      </p>
                      <p className="mt-1 break-words text-3xl font-black tracking-tight text-white sm:text-4xl">{score.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            {publicProfileFields.length > 0 && (
              <section className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h2 className="flex items-center gap-2 text-lg font-black text-emerald-950">
                  <UserRound className="h-5 w-5 text-emerald-700" />
                  Golf Profile
                </h2>
                <dl className="mt-3 grid grid-cols-2 gap-2">
                  {publicProfileFields.map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#F7F8F5] px-4 py-3 shadow-sm ring-1 ring-black/5">
                      <dt className="text-[11px] font-black text-emerald-800">{label}</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm font-black leading-6 text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {(socialLinkItems.length > 0 || customLinkItems.length > 0) && (
              <section className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h2 className="flex items-center gap-2 text-lg font-black text-emerald-950">
                  <Link2 className="h-5 w-5 text-emerald-700" />
                  SNS & Links
                </h2>
                {socialLinkItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
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
                        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-emerald-50"
                        aria-label={item.label}
                      >
                        <Icon className="h-6 w-6 text-emerald-800" />
                      </a>
                    );
                  })}
                </div>
                )}
                {customLinkItems.length > 0 && (
                  <div className="mt-3 grid gap-2">
                    {customLinkItems.map((item) => (
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
                        className="grid grid-cols-[40px_minmax(0,1fr)_18px] items-center gap-3 rounded-2xl bg-[#F7F8F5] p-3 ring-1 ring-black/5 transition hover:bg-emerald-50"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm ring-1 ring-black/5">
                          <Globe2 className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-slate-950">{item.label}</span>
                          <span className="block truncate text-xs font-bold text-slate-500">{item.description}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </a>
                    ))}
                  </div>
                )}
              </section>
            )}
            </div>

            {canShow(profile, 'club_setting') && (
              <section className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
                <h2 className="flex items-center gap-2 text-lg font-black text-emerald-950">
                  <ImageIcon className="h-5 w-5 text-emerald-700" />
                  My Bag
                </h2>
                {clubs.length > 0 ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {clubs.map((club, index) => (
                      <div key={`${club.raw}-${index}`} className="grid min-w-0 grid-cols-[42px_42px_minmax(0,1fr)] items-center gap-2 border-b border-slate-100 px-2 py-2.5 last:border-b-0 sm:grid-cols-[56px_50px_minmax(0,1fr)_88px_22px] sm:px-3">
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

            <section className="rounded-[1.4rem] bg-emerald-950 p-4 text-white shadow-sm ring-1 ring-emerald-900/40 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">MyBagPro</p>
                  <h2 className="mt-2 text-xl font-black">もっと詳しく見るなら、クラブ診断へ。</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">
                    Golf IDは共有プロフィール。番手間ギャップ、シャフト、ロフト、飛距離バランスの分析はMyBagProで確認できます。
                  </p>
                </div>
                <a
                  href="https://www.mybagpro.jp/diagnosis"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent('golfid_to_mybagpro_click', { username: profile.username, destination: 'diagnosis' })}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
                >
                  MyBagProで診断する
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </section>

            <section className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_180px] sm:items-start">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">QR / Share</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">このGolf IDを共有する</h2>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-500">URL・QR・LINE・SNSで、プロフィールリンクとしてすぐ共有できます。</p>
                  <div className="mt-3 rounded-2xl bg-[#F7F8F5] px-3 py-2 ring-1 ring-black/5">
                    <p className="break-all text-sm font-black text-slate-800">{publicUrl}</p>
                  </div>
                  <div className="mt-4">
                    <ShareButtons
                      url={publicUrl}
                      title={shareTitle}
                      text={shareText}
                      username={profile.username}
                      location="public_bottom"
                      mode="full"
                    />
                  </div>
                </div>
                <div className="rounded-[1.3rem] bg-[#F7F8F5] p-3 text-center ring-1 ring-black/5">
                  <img src={qrImageUrl} alt={`${profile.username}のGolf ID QRコード`} className="mx-auto h-36 w-36 rounded-xl sm:h-40 sm:w-40" loading="lazy" />
                  <p className="mt-2 text-xs font-black text-slate-500">QRで見せる</p>
                </div>
              </div>
            </section>

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
      </section>
    </main>
  );
};
