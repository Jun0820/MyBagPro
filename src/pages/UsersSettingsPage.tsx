import { useEffect, useState } from 'react';
import { ArrowRight, Globe, Instagram, Send, UserRound, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { normalizeUserSocialLinks } from '../lib/userSocials';

type PublicProfileCard = {
  id: string;
  name: string;
  headSpeed: number;
  currentBall: string;
  coverPhoto?: string;
  updatedAt?: string;
  sns: ReturnType<typeof normalizeUserSocialLinks>;
};

export const UsersSettingsPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<PublicProfileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      setError(null);

      const { data, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, head_speed, current_ball, cover_photo, sns_links, updated_at')
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      if (profilesError) {
        console.error(profilesError);
        setError('公開プロフィールの読み込みに失敗しました。');
        setLoading(false);
        return;
      }

      setProfiles(
        (data || []).map((profile) => ({
          id: profile.id,
          name: profile.name || 'Anonymous Golfer',
          headSpeed: profile.head_speed || 0,
          currentBall: profile.current_ball || '',
          coverPhoto: profile.cover_photo || undefined,
          updatedAt: profile.updated_at || undefined,
          sns: normalizeUserSocialLinks(profile.sns_links),
        })),
      );
      setLoading(false);
    };

    loadProfiles();
  }, []);

  const publicCount = profiles.length;
  const averageHeadSpeed =
    publicCount > 0 ? Math.round(profiles.reduce((sum, profile) => sum + (profile.headSpeed || 0), 0) / publicCount) : 0;

  return (
    <div className="min-h-screen space-y-8 pb-20">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:py-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-golf-300">
              <UserRound size={14} />
              みんなのMy Bag
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
              自分に近いゴルファーの
              <span className="text-golf-300">リアルな14本</span>
              を見つける。
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">
              プロだけではなく、一般ゴルファーの公開バッグも参考にできる一覧です。ヘッドスピードや使っているボール、SNSリンクを見ながら、自分に近い実例を探せます。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/mybag/create')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-golf-500 px-5 py-3 text-sm font-black text-white"
              >
                自分のMy Bagを作る
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/settings/pros')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-black text-white"
              >
                先にプロのセッティングを見る
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-1">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">公開プロフィール</div>
              <div className="mt-4 text-4xl font-black text-white">{publicCount}</div>
              <p className="mt-2 text-sm text-slate-300">公開設定になっている一般ゴルファーのバッグを一覧で見られます。</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">平均ヘッドスピード</div>
              <div className="mt-4 text-4xl font-black text-white">{averageHeadSpeed}<span className="ml-1 text-base text-slate-400">m/s</span></div>
              <p className="mt-2 text-sm text-slate-300">一覧に出ている公開プロフィールから算出した目安です。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Public User Bags</div>
            <h2 className="mt-2 text-2xl font-black text-trust-navy">公開中のMy Bag一覧</h2>
          </div>
          <p className="text-sm text-slate-500">検索は入れず、参考にしやすい公開バッグだけをそのまま見られる構成にしています。</p>
        </div>

        {loading && (
          <div className="flex min-h-[240px] items-center justify-center text-slate-400">
            <div className="flex items-center gap-3 text-sm font-bold">
              <Loader2 size={18} className="animate-spin text-golf-500" />
              公開バッグを読み込んでいます...
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">{error}</div>
        )}

        {!loading && !error && profiles.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            まだ公開中の My Bag はありません。最初の公開プロフィールを作って、参考にされる側にもなれます。
          </div>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                to={`/settings/users/${profile.id}`}
                className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-40 bg-slate-900">
                  {profile.coverPhoto ? (
                    <img src={profile.coverPhoto} alt={profile.name} className="h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-trust-navy text-slate-500">
                      <UserRound size={44} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xl font-black tracking-tight text-white">{profile.name}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-white/80">
                      {profile.sns.instagram && <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-1"><Instagram size={12} /> @{profile.sns.instagram}</span>}
                      {profile.sns.x && <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-1"><Send size={12} /> @{profile.sns.x}</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Head Speed</div>
                      <div className="mt-2 text-2xl font-black text-trust-navy">{profile.headSpeed || '—'}<span className="ml-1 text-xs text-slate-400">m/s</span></div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ball</div>
                      <div className="mt-2 line-clamp-2 text-sm font-bold text-trust-navy">{profile.currentBall || '未設定'}</div>
                    </div>
                  </div>

                  {(profile.sns.customLinks || []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.sns.customLinks?.slice(0, 2).map((link) => (
                        <span key={link.id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                          <Globe size={12} />
                          {link.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="inline-flex items-center gap-2 text-sm font-black text-golf-700">
                    詳細を見る
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
