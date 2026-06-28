import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ImageIcon, Instagram, Link2, Music2, Share2, UserRound, Youtube } from 'lucide-react';
import { applySeo } from '../lib/seo';
import { trackEvent } from '../lib/analytics';
import { feedbackFormUrl, hasFeedbackForm, trackFeedbackClick } from '../config/feedback';
import {
  defaultGolfIdVisibility,
  normalizeGolfIdUsername,
  type GolfIdRecord,
  type GolfIdVisibilityKey,
} from '../lib/golfId';
import { loadPublicGolfIdProfile, type GolfIdLoadStatus } from '../lib/golfIdProfileSource';
import { golfIdDesign } from '../config/design';
import { GolfIdStatCard, GolfIdSocialBadge } from '../components/golfid/GolfIdUi';
import { SharePanel } from '../components/golfid/SharePanel';

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
  const username = useMemo(() => normalizeGolfIdUsername(rawUsername || ''), [rawUsername]);
  const [profile, setProfile] = useState<GolfIdRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState<GolfIdLoadStatus | null>(null);
  const [loadMessage, setLoadMessage] = useState('');
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const createdJustNow = searchParams.get('created') === '1';

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      setLoading(true);
      setLoadStatus(null);
      setLoadMessage('');
      setProfile(null);
      const result = await loadPublicGolfIdProfile(username);

      if (!mounted) return;
      setLoading(false);
      setLoadStatus(result.status);
      setLoadMessage(result.message || '');
      if (result.status !== 'ok' || !result.profile) {
        return;
      }
      setProfile(result.profile);
      trackEvent('public_page_view', {
        username: result.profile.username || username,
      });
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [username]);

  useEffect(() => {
    const title = buildProfileSeoTitle(profile, username);
    applySeo({
      title,
      description: profile
        ? `${profileTitleName(profile)}さんのGolf ID。ベストスコア、目標、ヘッドスピード、悩み、クラブセッティング、AI上達診断の次の一手をまとめています。`
        : 'スコア、クラブセッティング、ゴルフの悩みをまとめた公開Golf IDページです。',
      path: `/u/${username}`,
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
  const publicUrl = `https://golfid.jp/u/${profile.username}`;
  const diagnosis = profile.diagnosis_result;
  const shareTitle = `${profile.nickname || profile.username}のGolf ID`;
  const shareText = '自分のGolf IDを作りました。\nクラブ・スコア・悩み・目標・SNSリンクをまとめています。';
  const socialLinkItems = getSocialLinkItems(profile);

  const handlePlayerCardGenerate = () => {
    setShowPlayerCard(true);
    trackEvent('player_card_generate', {
      username: profile.username,
      diagnosis_type: diagnosis?.diagnosisType || null,
    });
  };

  const handleSignupClick = () => {
    trackEvent('public_page_signup_click', {
      username: profile.username,
    });
  };

  return (
    <main className="bg-[#F5F7F4] pb-24 md:pb-0">
      <section className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_90px_-62px_rgba(11,15,13,0.75)] ring-1 ring-black/5">
          <div className={`p-6 sm:p-8 ${golfIdDesign.darkPanel}`}>
            <p className={golfIdDesign.badgeDark}>Golf ID</p>
            <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-emerald-100 ring-1 ring-white/12">
              このGolf IDはSNSプロフィールに貼れます
            </p>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{profile.nickname || profile.username}</h1>
                <p className="mt-2 text-sm font-bold text-slate-300">@{profile.username}</p>
              </div>
              <Link
                to="/create"
                onClick={handleSignupClick}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${golfIdDesign.goldButton}`}
              >
                自分もGolf IDを作る
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <SharePanel
              url={publicUrl}
              title={shareTitle}
              text={shareText}
              username={profile.username}
              variant="compact"
              location="public_top"
              description="SNSプロフィールに貼るだけで、スコア・目標・使用クラブ・発信リンクをまとめて見せられます。"
            />
          </div>

          {socialLinkItems.length > 0 && (
            <div className="bg-[#0B0F0D] px-6 pb-6">
              <div className="flex flex-wrap gap-2">
                {socialLinkItems.map((item) => (
                  <GolfIdSocialBadge key={item.platform} label={item.label} platform={item.platform as 'youtube' | 'instagram' | 'tiktok' | 'x' | 'custom1' | 'custom2'} />
                ))}
              </div>
            </div>
          )}

          {createdJustNow && (
            <section className="p-4 lg:p-6">
              <div className="rounded-[1.7rem] bg-[#D7B56D] p-5 text-[#0B0F0D] shadow-[0_18px_60px_-42px_rgba(215,181,109,0.75)]">
                <p className="text-xs font-black uppercase tracking-[0.16em]">Created</p>
                <h2 className="mt-2 text-2xl font-black">Golf IDを作成しました。</h2>
                <p className="mt-2 text-sm font-bold leading-7">このページをSNSプロフィールに貼って共有できます。</p>
                <div className="mt-4">
                  <SharePanel
                    url={publicUrl}
                    title={shareTitle}
                    text={shareText}
                    username={profile.username}
                    variant="full"
                    location="created_modal"
                    heading="作成したGolf IDを共有"
                    description="まずはURLコピーがおすすめです。InstagramやTikTokのプロフィール欄にも貼れます。"
                    publicPageHref={publicUrl}
                  />
                </div>
              </div>
            </section>
          )}

          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
            {canShow(profile, 'best_score') && (
              <GolfIdStatCard label="Best Score" value={profile.best_score} icon="trophy" />
            )}
            {canShow(profile, 'average_score') && (
              <GolfIdStatCard label="Avg Score" value={profile.average_score} icon="goal" />
            )}
            {canShow(profile, 'target_score') && (
              <GolfIdStatCard label="Target" value={profile.target_score} icon="goal" />
            )}
            {canShow(profile, 'head_speed') && (
              <GolfIdStatCard label="Head Speed" value={profile.head_speed} suffix=" m/s" icon="gauge" />
            )}
          </div>

          <div className="grid gap-4 p-4 pt-0 lg:grid-cols-[1fr_1fr] lg:p-6 lg:pt-0">
            <section className="rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
                <UserRound className="h-5 w-5 text-emerald-700" />
                My Golf
              </h2>
              <dl className="mt-4 grid gap-3 text-sm">
                {canShow(profile, 'golf_history') && (
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="font-bold text-slate-500">ゴルフ歴</dt>
                    <dd className="font-black text-slate-900">{formatValue(profile.golf_history)}</dd>
                  </div>
                )}
                {canShow(profile, 'favorite_club') && (
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="font-bold text-slate-500">得意クラブ</dt>
                    <dd className="font-black text-slate-900">{formatValue(profile.favorite_club)}</dd>
                  </div>
                )}
                {canShow(profile, 'weak_club') && (
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-slate-500">苦手クラブ</dt>
                    <dd className="font-black text-slate-900">{formatValue(profile.weak_club)}</dd>
                  </div>
                )}
              </dl>
            </section>

            {canShow(profile, 'current_issue') && (
              <section className="rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5">
                <h2 className="text-lg font-black text-slate-950">今の悩み</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">{formatValue(profile.current_issue)}</p>
              </section>
            )}
          </div>

          {diagnosis && (
            <section className="p-4 pt-0 lg:p-6 lg:pt-0">
              <div className="rounded-[1.7rem] bg-[#0B0F0D] p-5 text-white ring-1 ring-black/5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#D7B56D]">Next Action</p>
                <h2 className="mt-2 text-xl font-black text-white">あなたの次の一手</h2>
                <div className="mt-4 rounded-2xl bg-[#D7B56D] p-4 text-[#0B0F0D]">
                  <p className="text-sm font-black">{diagnosis.diagnosisType || 'クラブ見直しタイプ'}</p>
                  <p className="mt-2 text-base font-black leading-7">{diagnosis.nextAction || 'クラブ、スコア、悩みを整理して次の改善ポイントを見つけましょう。'}</p>
                </div>
                <div className="mt-4 grid gap-3 text-sm font-semibold leading-7 text-white/78 md:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/12">
                    <p className="text-xs font-black text-[#D7B56D]">今の状態</p>
                    <p className="mt-2">{diagnosis.currentStatus || '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/12">
                    <p className="text-xs font-black text-[#D7B56D]">優先課題</p>
                    <p className="mt-2">{diagnosis.priorityIssue || '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/12">
                    <p className="text-xs font-black text-[#D7B56D]">クラブ選びのヒント</p>
                    <p className="mt-2">{diagnosis.gearSuggestion || '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/12">
                    <p className="text-xs font-black text-[#D7B56D]">今はやらなくていいこと</p>
                    <p className="mt-2">{diagnosis.notRecommendedNow || '-'}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {canShow(profile, 'club_setting') && (
            <section className="p-4 pt-0 lg:p-6 lg:pt-0">
              <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">My Bag</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">クラブセッティング</h2>
                {clubLines.length > 0 ? (
                  <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                    {clubLines.map((line, index) => (
                      <div key={`${line}-${index}`} className="grid grid-cols-[48px_1fr] items-center gap-3 px-4 py-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F7F4] text-slate-400 ring-1 ring-black/5">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{line}</p>
                          <p className="mt-0.5 text-[10px] font-bold text-slate-400">クラブ画像は確認済みモデルから順次表示します</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-500">-</p>
                )}
              </div>
            </section>
          )}

          {socialLinkItems.length > 0 && (
            <section className="p-4 pt-0 lg:p-6 lg:pt-0">
              <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Links</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">発信リンク</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
                        className="inline-flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-900 ring-1 ring-slate-200 transition hover:bg-emerald-50 hover:text-emerald-800 hover:ring-emerald-100"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4 text-emerald-700" />
                          {item.label}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="p-4 pt-0 lg:p-6 lg:pt-0">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black">Player Card</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-300">SNSで共有しやすいカード形式で表示できます。</p>
                </div>
                <button
                  type="button"
                  onClick={handlePlayerCardGenerate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-50"
                >
                  <Share2 className="h-4 w-4" />
                  Player Cardを表示
                </button>
              </div>

              {showPlayerCard && (
                <div className="mt-5 rounded-3xl bg-white p-5 text-slate-950">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Golf ID Player Card</p>
                  <h3 className="mt-2 text-2xl font-black">{profile.nickname}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-black text-slate-500">ベスト</p>
                      <p className="text-xl font-black text-emerald-700">{formatValue(profile.best_score)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-black text-slate-500">目標</p>
                      <p className="text-xl font-black text-emerald-700">{formatValue(profile.target_score)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-black text-slate-500">HS</p>
                      <p className="text-xl font-black text-emerald-700">{formatValue(profile.head_speed, ' m/s')}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-black text-slate-500">タイプ</p>
                      <p className="text-sm font-black text-slate-900">{diagnosis?.diagnosisType || '-'}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-700">{diagnosis?.nextAction || 'Golf IDで次の一手を見つけましょう。'}</p>
                  <p className="mt-3 break-all text-xs font-bold text-slate-500">{publicUrl}</p>
                </div>
              )}

            </div>
          </section>

          <section className="p-4 pt-0 lg:p-6 lg:pt-0">
            <SharePanel
              url={publicUrl}
              title={shareTitle}
              text={shareText}
              username={profile.username}
              variant="full"
              location="public_bottom"
              heading="このGolf IDを共有する"
              description="このGolf IDは、Instagram・TikTok・X・LINE・プロフィール欄に貼って共有できます。"
            />
          </section>

          <div className="border-t border-slate-200 bg-slate-50 p-5 text-center">
            <p className="text-sm font-bold text-slate-600">あなたのゴルフも、1ページにまとめられます。</p>
            <Link
              to="/create"
              onClick={handleSignupClick}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              無料でGolf IDを作る
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://www.mybagpro.jp/pros"
              className="ml-0 mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:ml-2"
            >
              MyBagProを見る
            </a>
            <Link
              to="/explore"
              className="ml-0 mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:ml-2"
            >
              みんなのGolf IDを見る
            </Link>
            {hasFeedbackForm && (
              <div className="mt-4">
                <a
                  href={feedbackFormUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackFeedbackClick('public_page')}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-50"
                >
                  使ってみた感想・改善点を送る
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <Link
          to="/create"
          onClick={handleSignupClick}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
        >
          自分もGolf IDを作る
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
};
