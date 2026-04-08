import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';

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
        </div>
      </section>

      <section className="grid gap-4">
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

        {profiles.map((setting) => (
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
            className="rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-golf-300 hover:shadow-md md:p-8"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black tracking-[0.12em] text-slate-500">
                  {setting.type}
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-trust-navy">{setting.name}</h2>
                <p className="mt-3 text-base font-bold text-golf-700">{setting.tagline}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">{setting.summary}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
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

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {setting.clubs.slice(0, 4).map((club) => (
                <div key={`${setting.slug}-${club.category}`} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">{club.category}</div>
                  <div className="mt-2 text-sm font-black text-trust-navy">{club.model}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-trust-navy">
              セッティング詳細を見る
              <ArrowRight size={16} />
            </div>
          </button>
        ))}
      </section>
    </div>
  );
};
