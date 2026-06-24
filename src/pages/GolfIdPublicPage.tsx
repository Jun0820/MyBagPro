import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, Gauge, Goal, Trophy, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { applySeo } from '../lib/seo';
import {
  defaultGolfIdVisibility,
  normalizeGolfIdUsername,
  type GolfIdRecord,
  type GolfIdVisibilityKey,
} from '../lib/golfId';

const canShow = (record: GolfIdRecord | null, key: GolfIdVisibilityKey) => {
  if (!record) return false;
  return { ...defaultGolfIdVisibility, ...(record.visibility || {}) }[key] !== false;
};

const formatValue = (value?: string | number | null, suffix = '') => {
  if (value === null || value === undefined || value === '') return '-';
  return `${value}${suffix}`;
};

export const GolfIdPublicPage = () => {
  const { username: rawUsername } = useParams();
  const username = useMemo(() => normalizeGolfIdUsername(rawUsername || ''), [rawUsername]);
  const [profile, setProfile] = useState<GolfIdRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabase
        .from('golf_ids')
        .select('*')
        .eq('username', username)
        .eq('is_public', true)
        .maybeSingle();

      if (!mounted) return;
      setLoading(false);
      if (error || !data) {
        setNotFound(true);
        return;
      }
      setProfile(data as GolfIdRecord);
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [username]);

  useEffect(() => {
    const title = profile ? `${profile.nickname}のGolf ID` : '公開Golf ID';
    applySeo({
      title,
      description: profile
        ? `${profile.nickname}さんのスコア、クラブセッティング、ゴルフの悩みをまとめた公開Golf IDです。`
        : 'スコア、クラブセッティング、ゴルフの悩みをまとめた公開Golf IDページです。',
      path: `/u/${username}`,
      image: '/article-visuals/golf-bag-course.jpg',
    });
  }, [profile, username]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-500 shadow-sm ring-1 ring-slate-200">Golf IDを読み込んでいます...</div>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-black text-slate-950">Golf IDが見つかりません</h1>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">URLが間違っているか、公開が停止されています。</p>
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

  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-12">
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-slate-950 p-6 text-white sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Golf ID</p>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{profile.nickname}</h1>
                <p className="mt-2 text-sm font-bold text-slate-300">@{profile.username}</p>
              </div>
              <Link
                to="/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-500"
              >
                自分もGolf IDを作る
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
            {canShow(profile, 'best_score') && (
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <Trophy className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-xs font-black text-slate-500">ベストスコア</p>
                <p className="text-2xl font-black text-slate-950">{formatValue(profile.best_score)}</p>
              </div>
            )}
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <CalendarDays className="h-5 w-5 text-emerald-700" />
              <p className="mt-3 text-xs font-black text-slate-500">平均スコア</p>
              <p className="text-2xl font-black text-slate-950">{formatValue(profile.average_score)}</p>
            </div>
            {canShow(profile, 'target_score') && (
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <Goal className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-xs font-black text-slate-500">目標スコア</p>
                <p className="text-2xl font-black text-slate-950">{formatValue(profile.target_score)}</p>
              </div>
            )}
            {canShow(profile, 'head_speed') && (
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <Gauge className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-xs font-black text-slate-500">ヘッドスピード</p>
                <p className="text-2xl font-black text-slate-950">{formatValue(profile.head_speed, ' m/s')}</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 p-4 pt-0 lg:grid-cols-[1fr_1fr] lg:p-6 lg:pt-0">
            <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
                <UserRound className="h-5 w-5 text-emerald-700" />
                プロフィール
              </h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="font-bold text-slate-500">ゴルフ歴</dt>
                  <dd className="font-black text-slate-900">{formatValue(profile.golf_history)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="font-bold text-slate-500">得意クラブ</dt>
                  <dd className="font-black text-slate-900">{formatValue(profile.favorite_club)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-slate-500">苦手クラブ</dt>
                  <dd className="font-black text-slate-900">{formatValue(profile.weak_club)}</dd>
                </div>
              </dl>
            </section>

            {canShow(profile, 'current_issue') && (
              <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <h2 className="text-lg font-black text-slate-950">今の悩み</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">{formatValue(profile.current_issue)}</p>
              </section>
            )}
          </div>

          {canShow(profile, 'club_setting') && (
            <section className="p-4 pt-0 lg:p-6 lg:pt-0">
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <h2 className="text-lg font-black text-slate-950">クラブセッティング</h2>
                {clubLines.length > 0 ? (
                  <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                    {clubLines.map((line, index) => (
                      <div key={`${line}-${index}`} className="px-4 py-3 text-sm font-bold text-slate-800">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-500">-</p>
                )}
              </div>
            </section>
          )}

          <div className="border-t border-slate-200 bg-slate-50 p-5 text-center">
            <p className="text-sm font-bold text-slate-600">あなたのゴルフも、1ページにまとめられます。</p>
            <Link
              to="/create"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              無料でGolf IDを作る
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};
