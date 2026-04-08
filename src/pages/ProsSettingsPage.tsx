import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Gauge, ListChecks, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { proRosterGroups, requiredProfileFields, youtubeLessonRoster } from '../data/proRoster';
import { editorialPolicy, launch10Reasoning } from '../data/editorialPolicy';
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

  return (
    <div className="min-h-screen pb-20">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-12 text-white md:px-10 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.22),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.18),_transparent_30%)]" />
        <div className="relative max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-cyan-200">
            <BadgeCheck size={14} />
            Pro Settings Library
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
            プロや上級者の14本を、比較しながら参考にできる一覧へ。
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
            公開するのは、14本の構成が確認できたプロフィールだけです。
            ヘッド、シャフト、使用ボール、確認時点が揃った掲載データだけを並べます。
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-6">
        {isLoading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
            掲載プロフィールを読み込んでいます...
          </div>
        )}
        {profiles.map((setting) => (
          <article
            key={setting.slug}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-8"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {setting.type}
                </div>
                <h2 className="text-2xl font-black tracking-tight text-trust-navy md:text-3xl">{setting.name}</h2>
                <p className="mt-2 text-base font-bold text-golf-700">{setting.tagline}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">{setting.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {setting.strengths.map((strength) => (
                    <span
                      key={strength}
                      className="rounded-full border border-golf-200 bg-golf-50 px-3 py-1 text-xs font-bold text-golf-700"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              <div className="min-w-[220px] rounded-[1.5rem] bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  <Gauge size={14} />
                  Snapshot
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Head Speed</div>
                    <div className="mt-1 font-bold text-trust-navy">{setting.headSpeed}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Average Score</div>
                    <div className="mt-1 font-bold text-trust-navy">{setting.averageScore}</div>
                  </div>
                  {setting.bestScore && (
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Best Score</div>
                      <div className="mt-1 font-bold text-trust-navy">{setting.bestScore}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Ball</div>
                    <div className="mt-1 font-bold text-trust-navy">{setting.ball}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {setting.clubs.slice(0, 4).map((club) => (
                <div key={`${setting.slug}-${club.category}`} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{club.category}</div>
                  <div className="mt-2 text-sm font-bold text-trust-navy">{club.model}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  trackEvent('view_setting_detail', {
                    source_page: 'pros_library',
                    profile_slug: setting.slug,
                    profile_name: setting.name,
                  });
                  navigate(`/settings/pros/${setting.slug}`);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition-all hover:bg-slate-900"
              >
                セッティング詳細を見る
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  trackEvent('begin_mybag_creation', {
                    source_page: 'pros_library',
                    reference_profile_slug: setting.slug,
                  });
                  navigate('/mybag/create');
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:border-golf-400 hover:text-golf-700"
              >
                自分のMy Bagを作る
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-[2rem] border border-cyan-100 bg-cyan-50 px-6 py-8 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-700">
              <Sparkles size={14} />
              Next Layer
            </div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">ここから「比較」「診断」「購入」へつなげます。</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              個別ページでは、似ているセッティング、自分のバッグとの比較、AI診断、購入導線を順番につないでいく構造が相性良いです。
            </p>
          </div>
          <button
            onClick={() => {
              trackEvent('start_ai_diagnosis', {
                source_page: 'pros_library',
              });
              navigate('/diagnosis');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-cyan-700"
          >
            診断導線も確認する
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <ListChecks size={14} />
            Publishing Fields
          </div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">1人あたりの必須掲載項目</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {requiredProfileFields.map((field) => (
              <span key={field} className="rounded-full border border-golf-200 bg-golf-50 px-3 py-2 text-xs font-bold text-golf-700">
                {field}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            公開条件は「14本の構成が確認できていること」です。ドライバーだけの途中データは下書きに留め、公開ページには出しません。
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">YouTube / Lesson</div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">{youtubeLessonRoster.label}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{youtubeLessonRoster.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {youtubeLessonRoster.entries.slice(0, 12).map((entry) => (
              <span key={entry.name} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                {entry.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-amber-100 bg-amber-50 p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">Launch 10</div>
            <h2 className="mt-2 text-2xl font-black text-trust-navy">最初に公開する10名</h2>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-trust-navy">
            2026シーズン優先
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {editorialPolicy.launch10.map((name) => (
            <span key={name} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-amber-200">
              {name}
            </span>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          {launch10Reasoning.map((reason) => (
            <div key={reason} className="text-sm leading-7 text-slate-600">
              {reason}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Publishing Queue</div>
            <h2 className="mt-2 text-2xl font-black text-trust-navy">掲載候補リスト</h2>
          </div>
          <div className="text-sm font-bold text-slate-500">
            合計 {proRosterGroups.reduce((sum, group) => sum + group.entries.length, 0) + youtubeLessonRoster.entries.length} 候補
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {proRosterGroups.map((group) => (
            <div key={group.slug} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</div>
                  <div className="mt-1 text-sm font-bold text-golf-700">{group.description}</div>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-trust-navy">
                  {group.entries.length}名
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.entries.slice(0, 18).map((entry) => (
                  <span key={entry.name} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                    {entry.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
