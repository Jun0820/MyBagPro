import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Gauge, Goal, Instagram, Loader2, Music2, Sparkles, Trophy, UserRound, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { feedbackFormUrl, hasFeedbackForm, trackFeedbackClick } from '../config/feedback';
import { defaultGolfIdVisibility, type GolfIdRecord, type GolfIdVisibilityKey } from '../lib/golfId';
import { loadPublicGolfIdProfiles } from '../lib/golfIdProfileSource';
import { golfIdDesign } from '../config/design';

type ExploreGolfId = Pick<
  GolfIdRecord,
  | 'id'
  | 'username'
  | 'nickname'
  | 'best_score'
  | 'target_score'
  | 'head_speed'
  | 'current_issue'
  | 'visibility'
  | 'diagnosis_result'
  | 'social_links'
  | 'updated_at'
>;

type SampleGolfId = {
  label: string;
  nickname: string;
  bestScore: string;
  targetScore: string;
  headSpeed: string;
  issue: string;
};

const samples: SampleGolfId[] = [
  { label: '80切り目標', nickname: 'ショット安定派', bestScore: '82', targetScore: '79', headSpeed: '42', issue: 'アイアンの縦距離をそろえたい' },
  { label: '100切り目標', nickname: '週末ゴルファー', bestScore: '103', targetScore: '99', headSpeed: '39', issue: 'ドライバーの右ミスを減らしたい' },
  { label: '飛距離重視', nickname: '1W強化中', bestScore: '91', targetScore: '85', headSpeed: '45', issue: 'ティーショットの飛距離を伸ばしたい' },
  { label: 'スライス改善', nickname: 'フェード卒業', bestScore: '98', targetScore: '90', headSpeed: '40', issue: 'スライスで右OBが出る' },
  { label: 'パター改善', nickname: '3パット減らし隊', bestScore: '88', targetScore: '84', headSpeed: '38', issue: 'ショートパットを安定させたい' },
];

const canShow = (record: ExploreGolfId, key: GolfIdVisibilityKey) => {
  return { ...defaultGolfIdVisibility, ...(record.visibility || {}) }[key] !== false;
};

const formatValue = (value?: string | number | null, suffix = '') => {
  if (value === null || value === undefined || value === '') return '-';
  return `${value}${suffix}`;
};

const excerpt = (value?: string | null, max = 46) => {
  const text = (value || '').trim();
  if (!text) return '-';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const getSocialBadges = (profile: ExploreGolfId) =>
  [
    profile.social_links?.youtube ? { key: 'youtube', label: 'YouTube', icon: Youtube } : null,
    profile.social_links?.instagram ? { key: 'instagram', label: 'Instagram', icon: Instagram } : null,
    profile.social_links?.tiktok ? { key: 'tiktok', label: 'TikTok', icon: Music2 } : null,
    profile.social_links?.x ? { key: 'x', label: 'X', icon: null } : null,
    profile.social_links?.custom1?.url ? { key: 'custom1', label: profile.social_links.custom1.label || 'Link', icon: null } : null,
    profile.social_links?.custom2?.url ? { key: 'custom2', label: profile.social_links.custom2.label || 'Link', icon: null } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; icon: typeof Youtube | null }>;

export const UsersSettingsPage = () => {
  const [profiles, setProfiles] = useState<ExploreGolfId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProfiles = async () => {
      setLoading(true);
      setError(null);

      let loadedProfiles: GolfIdRecord[] = [];
      let profilesError: unknown = null;
      try {
        loadedProfiles = await loadPublicGolfIdProfiles(30);
      } catch (error) {
        profilesError = error;
      }

      if (!mounted) return;

      if (profilesError) {
        console.error('Failed to load public Golf IDs:', profilesError);
        setError('公開Golf IDの読み込みに失敗しました。時間をおいて再度お試しください。');
        setProfiles([]);
        setLoading(false);
        return;
      }

      setProfiles(loadedProfiles as ExploreGolfId[]);
      setLoading(false);
    };

    loadProfiles();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const visibleHeadSpeeds = profiles
      .filter((profile) => canShow(profile, 'head_speed'))
      .map((profile) => Number(profile.head_speed || 0))
      .filter(Boolean);
    const averageHeadSpeed =
      visibleHeadSpeeds.length > 0 ? Math.round(visibleHeadSpeeds.reduce((sum, speed) => sum + speed, 0) / visibleHeadSpeeds.length) : 0;
    return {
      count: profiles.length,
      averageHeadSpeed,
    };
  }, [profiles]);

  return (
    <div className="min-h-screen bg-[#F5F7F4] pb-20">
      <section className={`-mx-3 -mt-3 px-4 py-8 text-white md:-mx-6 md:-mt-7 md:px-8 md:py-12 ${golfIdDesign.darkPanel}`}>
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#D7B56D] ring-1 ring-white/12">
            <UserRound size={14} />
            Public Golf ID
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_320px] md:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">みんなのGolf IDを見る</h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-300 md:text-base md:leading-8">
                スコア、目標、ヘッドスピード、悩みを公開しているゴルファーのGolf IDです。自分に近い人を見つけると、次に見直すポイントが見えやすくなります。
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link
                  to="/create"
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition ${golfIdDesign.goldButton}`}
                >
                  無料でGolf IDを作る
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/pros"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white/15"
                >
                  プロのセッティングも見る
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                <div className="text-xs font-black text-slate-400">公開Golf ID</div>
                <div className="mt-2 text-3xl font-black">{stats.count}</div>
              </div>
              <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                <div className="text-xs font-black text-slate-400">平均HS</div>
                <div className="mt-2 text-3xl font-black">{stats.averageHeadSpeed || '-'}<span className="ml-1 text-sm text-slate-400">m/s</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-5 max-w-6xl px-0 md:mt-8">
        {loading && (
          <div className="flex min-h-[260px] items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-500 ring-1 ring-slate-200">
            <Loader2 size={18} className="mr-2 animate-spin text-emerald-700" />
            公開Golf IDを読み込んでいます...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                to={`/u/${profile.username}`}
                onClick={() =>
                  trackEvent('explore_profile_click', {
                    username: profile.username,
                  })
                }
                className="group overflow-hidden rounded-[1.7rem] bg-white shadow-[0_18px_60px_-44px_rgba(11,15,13,0.55)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-[#D7B56D]/40"
              >
                <div className="bg-[#0B0F0D] p-4 text-white">
                  <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg font-black text-white">{profile.nickname || 'Golf ID'}</div>
                    <div className="mt-1 text-xs font-bold text-white/55">@{profile.username}</div>
                    {getSocialBadges(profile).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {getSocialBadges(profile).slice(0, 4).map((badge) => {
                          const Icon = badge.icon;
                          return (
                            <span key={badge.key} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-white ring-1 ring-white/12">
                              {Icon ? <Icon size={11} /> : null}
                              {badge.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="rounded-full bg-[#D7B56D] px-2.5 py-1 text-[10px] font-black text-[#0B0F0D]">
                    {profile.diagnosis_result?.diagnosisType || 'Golf ID'}
                  </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-4 pb-0">
                  {canShow(profile, 'best_score') && (
                    <div className="rounded-2xl bg-[#F5F7F4] p-3 ring-1 ring-black/5">
                      <Trophy size={15} className="text-emerald-700" />
                      <div className="mt-2 text-[10px] font-black text-slate-500">ベスト</div>
                      <div className="text-lg font-black text-slate-950">{formatValue(profile.best_score)}</div>
                    </div>
                  )}
                  {canShow(profile, 'target_score') && (
                    <div className="rounded-2xl bg-[#F5F7F4] p-3 ring-1 ring-black/5">
                      <Goal size={15} className="text-emerald-700" />
                      <div className="mt-2 text-[10px] font-black text-slate-500">目標</div>
                      <div className="text-lg font-black text-slate-950">{formatValue(profile.target_score)}</div>
                    </div>
                  )}
                  {canShow(profile, 'head_speed') && (
                    <div className="rounded-2xl bg-[#F5F7F4] p-3 ring-1 ring-black/5">
                      <Gauge size={15} className="text-emerald-700" />
                      <div className="mt-2 text-[10px] font-black text-slate-500">HS</div>
                      <div className="text-lg font-black text-slate-950">{formatValue(profile.head_speed)}</div>
                    </div>
                  )}
                </div>

                {canShow(profile, 'current_issue') && (
                  <p className="px-4 pt-4 text-sm font-semibold leading-6 text-slate-600">{excerpt(profile.current_issue)}</p>
                )}
                <div className="px-4 pb-4 pt-4 inline-flex items-center gap-2 text-sm font-black text-[#1F7A4D]">
                  Golf IDを見る
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && profiles.length === 0 && (
          <div className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-black/5 md:p-10">
            <Sparkles className="mx-auto h-8 w-8 text-emerald-700" />
            <h2 className="mt-4 text-2xl font-black text-slate-950">まだ公開Golf IDがありません。最初の1人になりましょう。</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              まずはスコア、目標、悩みだけでも登録できます。公開する項目は選べます。
            </p>
            <Link
              to="/create"
              className={`mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition ${golfIdDesign.primaryButton}`}
            >
              無料でGolf IDを作る
              <ArrowRight size={16} />
            </Link>

            <div className="mt-7 grid gap-3 text-left md:grid-cols-2 xl:grid-cols-3">
              {samples.map((sample) => (
                <div key={sample.label} className="rounded-2xl bg-[#F5F7F4] p-4 ring-1 ring-black/5">
                  <div className="text-[11px] font-black text-[#1F7A4D]">{sample.label}</div>
                  <div className="mt-2 text-base font-black text-slate-950">{sample.nickname}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-black text-slate-600">
                    <span>Best {sample.bestScore}</span>
                    <span>Goal {sample.targetScore}</span>
                    <span>HS {sample.headSpeed}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{sample.issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasFeedbackForm && (
          <div className="mt-5 text-center">
            <a
              href={feedbackFormUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackFeedbackClick('explore_page')}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-emerald-800 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-50"
            >
              使ってみた感想・改善点を送る
            </a>
          </div>
        )}
      </section>
    </div>
  );
};
