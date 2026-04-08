import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Camera, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';
import { getProfileVisuals } from '../lib/profileVisuals';

export const ProsSettingsPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<PublicSettingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      setIsLoading(true);
      const data = await fetchPublishedSettingProfiles();
      if (isMounted) {
        setProfiles(data);
        setIsLoading(false);
      }
    };

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(
    () => ({
      profileCount: profiles.length,
      ballCount: new Set(profiles.map((profile) => profile.ball).filter(Boolean)).size,
    }),
    [profiles]
  );

  return (
    <div className="min-h-screen space-y-8 pb-20">
      <section className="rounded-[2.5rem] border border-slate-200 bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_54%,#f4f8f5_100%)] px-6 py-12 shadow-sm md:px-10 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-black tracking-[0.16em] text-slate-500">
            <BadgeCheck size={14} className="text-golf-700" />
            VERIFIED 14-CLUB SETTINGS
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-trust-navy md:text-6xl">
            見るべき14本を、
            <br />
            静かに選ぶ。
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            確認できたプロフィールだけを並べています。
            まずは気になる1人を選んで、セッティング全体の流れを見てください。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-trust-navy">
              公開プロフィール {summary.profileCount}
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-trust-navy">
              使用ボール {summary.ballCount}
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-trust-navy">
              推定値は非表示
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Camera,
                title: 'まず写真で全体像を見る',
                text: 'クラブやバッグの雰囲気を先に見てから、14本の中身へ入れます。',
              },
              {
                icon: PlayCircle,
                title: '動画があれば優先表示',
                text: 'スイング動画やセッティング動画が確認できる選手から順に見やすく掲載します。',
              },
              {
                icon: BadgeCheck,
                title: '確認できた情報だけ公開',
                text: '参照元と14本がそろったものだけに絞って公開しています。',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-golf-50 text-golf-700">
                    <Icon size={20} />
                  </div>
                  <h2 className="mt-4 text-base font-black text-trust-navy">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {isLoading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
            掲載プロフィールを読み込んでいます...
          </div>
        )}

        {!isLoading && profiles.length === 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
            <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">公開準備中</div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">確認済みプロフィールを準備しています。</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              14本と参照元が確認できた内容から順に公開します。
            </p>
          </div>
        )}

        {profiles.map((setting) => {
          const visuals = getProfileVisuals(setting.slug);

          return (
            <button
              key={setting.slug}
              onClick={() => {
                trackEvent('view_setting_detail', {
                  source_page: 'pros_library',
                  profile_slug: setting.slug,
                  profile_name: setting.name,
                });
                navigate(`/settings/pros/${setting.slug}`);
              }}
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-golf-300 hover:shadow-md"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={visuals.hero} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_0%,rgba(15,23,42,0.72)_100%)]" />

                <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-black tracking-[0.12em] text-white backdrop-blur">
                  <Camera size={13} />
                  セッティングの雰囲気
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-black tracking-[0.12em] text-slate-500">
                    {setting.type}
                  </div>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{setting.name}</h2>
                  <p className="mt-2 max-w-xl text-sm font-bold text-cyan-100">{setting.tagline}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {setting.clubs.slice(0, 3).map((club) => (
                      <span
                        key={`${setting.slug}-hero-${club.category}`}
                        className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur"
                      >
                        {club.category} {club.model}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <p className="text-sm leading-7 text-slate-600">{setting.summary}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                    <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">ヘッドスピード</div>
                    <div className="mt-2 text-sm font-black text-trust-navy">{setting.headSpeed}</div>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                    <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">平均スコア</div>
                    <div className="mt-2 text-sm font-black text-trust-navy">{setting.averageScore}</div>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                    <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">使用ボール</div>
                    <div className="mt-2 text-sm font-black text-trust-navy">{setting.ball}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {setting.strengths.slice(0, 3).map((strength) => (
                    <span
                      key={strength}
                      className="rounded-full border border-golf-200 bg-golf-50 px-3 py-1 text-xs font-bold text-golf-700"
                    >
                      {strength}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {setting.clubs.slice(0, 4).map((club) => (
                    <div
                      key={`${setting.slug}-${club.category}`}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">{club.category}</div>
                      <div className="mt-2 text-sm font-black text-trust-navy">{club.model}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-trust-navy">
                  写真・動画・14本を見る
                  <ArrowRight size={16} />
                </div>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
};
