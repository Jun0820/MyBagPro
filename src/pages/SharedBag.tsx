import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Globe,
  Instagram,
  Lock,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { decodeBagData } from '../lib/urlData';
import { type ClubSetting, TargetCategory } from '../types/golf';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { normalizeUserSocialLinks } from '../lib/userSocials';

type PublicBagPayload = {
  name: string;
  sns: ReturnType<typeof normalizeUserSocialLinks>;
  setting: ClubSetting;
  headSpeed: number;
  bestScore?: number;
  averageScore?: number;
  coverPhoto?: string;
};

export const SharedBag = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [data, setData] = useState<PublicBagPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const encodedData = query.get('d');
    const queryId = query.get('id');
    const profileId = routeId || queryId;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      if (profileId) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

          if (profileError || !profile) {
            setError('セッティングが見つからないか、非公開に設定されています。');
            setLoading(false);
            return;
          }

          if (!profile.is_public) {
            setError('このセッティングは非公開設定になっています。');
            setLoading(false);
            return;
          }

          const { data: clubs, error: clubsError } = await supabase
            .from('clubs')
            .select('*')
            .eq('user_id', profileId);

          if (clubsError) throw clubsError;

          const sns = normalizeUserSocialLinks(profile.sns_links);

          setData({
            name: profile.name || 'Anonymous Golfer',
            sns,
            headSpeed: profile.head_speed || 0,
            bestScore: sns.profileStats?.bestScore,
            averageScore: sns.profileStats?.averageScore,
            coverPhoto: profile.cover_photo || undefined,
            setting: {
              clubs: (clubs || []).map((club) => ({
                id: club.id,
                category: club.category,
                brand: club.brand || '',
                model: club.model || '',
                number: club.number || '',
                loft: club.loft || '',
                shaft: club.shaft || '',
                flex: club.flex || '',
                distance: club.distance || '',
                worry: club.worry || '',
              })),
              ball: profile.current_ball || '',
            },
          });
        } catch (currentError) {
          console.error(currentError);
          setError('データの読み込み中にエラーが発生しました。');
        }
      } else if (encodedData) {
        const decoded = decodeBagData(encodedData);
        if (decoded) {
          setData({
            ...decoded,
            sns: normalizeUserSocialLinks(decoded.sns),
          });
        } else {
          setError('無効な共有リンクです。');
        }
      } else {
        setError('共有リンクにデータが含まれていません。');
      }

      setLoading(false);
    };

    loadData();
  }, [location.search, routeId]);

  const sortedClubs = useMemo(() => {
    if (!data) return [];

    const categoryOrder = [
      TargetCategory.DRIVER,
      TargetCategory.FAIRWAY,
      TargetCategory.UTILITY,
      TargetCategory.IRON,
      TargetCategory.WEDGE,
      TargetCategory.PUTTER,
    ];

    return [...data.setting.clubs].sort((a, b) => {
      const orderA = categoryOrder.indexOf(a.category as TargetCategory);
      const orderB = categoryOrder.indexOf(b.category as TargetCategory);

      if (orderA !== orderB) return orderA - orderB;
      return (a.number || '').localeCompare(b.number || '');
    });
  }, [data]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case TargetCategory.DRIVER:
        return 'bg-emerald-500';
      case TargetCategory.FAIRWAY:
        return 'bg-emerald-600';
      case TargetCategory.UTILITY:
        return 'bg-teal-500';
      case TargetCategory.IRON:
        return 'bg-blue-500';
      case TargetCategory.WEDGE:
        return 'bg-indigo-500';
      case TargetCategory.PUTTER:
        return 'bg-slate-500';
      default:
        return 'bg-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-slate-400">
        <div className="mb-4 text-2xl text-golf-500">⛳️</div>
        <p className="text-sm font-bold">セッティングを読み込んでいます...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          {error.includes('非公開') ? <Lock size={32} /> : <AlertCircle size={32} />}
        </div>
        <h2 className="mb-2 text-xl font-bold text-trust-navy">読み込めませんでした</h2>
        <p className="mb-8 max-w-xs text-sm text-slate-500">{error}</p>
        <button onClick={() => navigate('/settings/users')} className="rounded-xl bg-slate-900 px-8 py-3 font-bold text-white transition-all hover:bg-black">
          一覧へ戻る
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-5xl animate-fadeIn pb-20">
      <button
        onClick={() => navigate('/settings/users')}
        className="mb-8 flex items-center gap-2 font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={18} />
        みんなのMy Bagへ戻る
      </button>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-trust-navy px-6 py-10 text-white md:px-10 md:py-12">
          <div className="absolute inset-0">
            {data.coverPhoto ? (
              <img src={data.coverPhoto} alt={data.name} className="h-full w-full object-cover opacity-35" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-900 via-trust-navy to-slate-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-trust-navy via-trust-navy/60 to-trust-navy/20" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-golf-300">
              <ShieldCheck size={14} />
              PUBLIC MY BAG
            </div>

            <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white/80 bg-white shadow-xl">
                  {data.coverPhoto ? (
                    <img src={data.coverPhoto} alt={data.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={40} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.2em] text-golf-300">Golfer Profile</div>
                  <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{data.name}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200">
                    自分のバッグを公開している一般ゴルファーのセッティングです。ヘッドスピード、使用ボール、SNSや外部リンクまでまとめて確認できます。
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {data.sns.instagram && (
                  <a
                    href={`https://instagram.com/${data.sns.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
                  >
                    <Instagram size={16} />
                    @{data.sns.instagram}
                  </a>
                )}
                {data.sns.x && (
                  <a
                    href={`https://x.com/${data.sns.x}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
                  >
                    <Send size={16} />
                    @{data.sns.x}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-px border-b border-slate-100 bg-slate-100 md:grid-cols-4">
          <div className="bg-white p-6 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Head Speed</div>
            <div className="mt-2 text-3xl font-black text-trust-navy">{data.headSpeed || '—'}<span className="ml-1 text-xs text-slate-400">m/s</span></div>
          </div>
          <div className="bg-white p-6 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Ball</div>
            <div className="mt-2 text-sm font-bold text-trust-navy">{data.setting.ball || '未設定'}</div>
          </div>
          <div className="bg-white p-6 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Best Score</div>
            <div className="mt-2 text-3xl font-black text-golf-600">{data.bestScore || '—'}</div>
          </div>
          <div className="bg-white p-6 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Average Score</div>
            <div className="mt-2 text-3xl font-black text-trust-navy">{data.averageScore || '—'}</div>
          </div>
        </div>

        {(data.sns.customLinks || []).length > 0 && (
          <div className="border-b border-slate-100 px-6 py-5 md:px-10">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">External Links</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {data.sns.customLinks?.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-trust-navy transition-colors hover:bg-slate-100"
                >
                  <Globe size={14} />
                  {link.label}
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4 md:px-10">Category</th>
                <th className="px-6 py-4">Model / Spec</th>
                <th className="px-6 py-4 text-right md:px-10">Distance</th>
              </tr>
            </thead>
            <tbody>
              {sortedClubs.map((club, index) => (
                <tr key={club.id} className={cn('border-b border-slate-100', index % 2 === 1 && 'bg-slate-50/40')}>
                  <td className="px-6 py-5 md:px-10">
                    <div className="flex items-center gap-3">
                      <span className={cn('inline-flex rounded-md px-2.5 py-1 text-[10px] font-black uppercase text-white', getCategoryColor(club.category))}>
                        {club.number || club.category}
                      </span>
                      {club.loft && <span className="text-xs font-bold text-slate-400">{club.loft}°</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-lg font-black tracking-tight text-trust-navy">
                      {club.brand} {club.model}
                    </div>
                    <div className="mt-1 text-xs font-medium text-slate-400">{club.shaft || 'シャフト未登録'}</div>
                  </td>
                  <td className="px-6 py-5 text-right md:px-10">
                    <div className="text-2xl font-black text-golf-600">{club.distance || '—'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 px-6 py-8 text-center md:px-10">
          <div className="text-sm text-slate-500">自分のセッティングも公開すると、比較や記録がもっとしやすくなります。</div>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/mybag/create" className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white">
              自分のMy Bagを作る
            </Link>
            <Link to="/settings/pros" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700">
              プロのセッティングも見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
