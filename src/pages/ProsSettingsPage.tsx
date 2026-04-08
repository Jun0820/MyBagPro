import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Gauge, ListChecks, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';

const guidanceItems = [
  {
    title: 'まずは使っているドライバーを見る',
    description: '最初は1本ずつ見るより、ドライバーやボールなど分かりやすい軸から入ると比較しやすくなります。',
  },
  {
    title: 'ヘッドスピードと平均スコアも合わせて見る',
    description: '同じプロでも、自分との距離感が分からないと参考にしづらいので、近い層かどうかを先に見ます。',
  },
  {
    title: 'そのまま比較ページへ進む',
    description: '気になる構成を見つけたら、自分のバッグと比べることで真似すべき部分がはっきりします。',
  },
];

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
      typeCount: new Set(profiles.map((profile) => profile.type).filter(Boolean)).size,
    }),
    [profiles],
  );

  return (
    <div className="min-h-screen space-y-10 pb-20">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-10 md:py-10">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-golf-50 px-4 py-2 text-xs font-black text-golf-700">
            <BadgeCheck size={14} />
            確認済みの14本だけを掲載
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-trust-navy md:text-6xl">
            プロや上級者の
            <span className="text-golf-700">14本</span>
            を一覧で見比べる
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
            この一覧では、14本の構成が確認できたプロフィールだけを公開しています。
            ヘッドスピード、平均スコア、使用ボールも合わせて見ながら、自分のバッグ作りの参考になる構成を探せます。
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">公開プロフィール</div>
            <div className="mt-2 text-3xl font-black text-trust-navy">{summary.profileCount}</div>
            <div className="mt-1 text-sm text-slate-600">14本確認済みの掲載人数</div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">使用ボールの種類</div>
            <div className="mt-2 text-3xl font-black text-trust-navy">{summary.ballCount}</div>
            <div className="mt-1 text-sm text-slate-600">掲載プロフィール内で確認済み</div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">掲載タイプ</div>
            <div className="mt-2 text-3xl font-black text-trust-navy">{summary.typeCount}</div>
            <div className="mt-1 text-sm text-slate-600">ツアープロや上級者など</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {guidanceItems.map((item, index) => (
          <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-trust-navy text-sm font-black text-white">
              {index + 1}
            </div>
            <h2 className="mt-4 text-lg font-black text-trust-navy">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="space-y-5">
        {isLoading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
            掲載プロフィールを読み込んでいます...
          </div>
        )}

        {!isLoading && profiles.length === 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
            <div className="text-xs font-black text-slate-400">掲載準備中</div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">公開できる確認済みプロフィールを準備しています。</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              サンプルや推定値は表示しません。14本の構成と参照元が確認できたプロフィールから順に公開します。
            </p>
          </div>
        )}

        {profiles.map((setting) => (
          <article
            key={setting.slug}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-golf-300 hover:shadow-md md:p-8"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
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

              <div className="grid min-w-[260px] gap-3 rounded-[1.5rem] bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                    <Gauge size={14} />
                    ヘッドスピード
                  </div>
                  <div className="mt-1 text-sm font-bold text-trust-navy">{setting.headSpeed}</div>
                </div>
                <div>
                  <div className="text-xs font-black text-slate-400">平均スコア</div>
                  <div className="mt-1 text-sm font-bold text-trust-navy">{setting.averageScore}</div>
                </div>
                {setting.bestScore && (
                  <div>
                    <div className="text-xs font-black text-slate-400">ベストスコア</div>
                    <div className="mt-1 text-sm font-bold text-trust-navy">{setting.bestScore}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-black text-slate-400">使用ボール</div>
                  <div className="mt-1 text-sm font-bold text-trust-navy">{setting.ball}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200">
              <div className="hidden bg-slate-100 md:grid md:grid-cols-[0.8fr_2fr_2fr]">
                {['注目クラブ', 'モデル', 'ひとこと'].map((heading) => (
                  <div key={heading} className="px-4 py-3 text-xs font-black text-slate-500">
                    {heading}
                  </div>
                ))}
              </div>
              <div className="divide-y divide-slate-200">
                {setting.clubs.slice(0, 4).map((club) => (
                  <div key={`${setting.slug}-${club.category}`} className="grid gap-2 px-4 py-4 md:grid-cols-[0.8fr_2fr_2fr] md:items-center">
                    <div>
                      <div className="text-[11px] font-black text-slate-400 md:hidden">注目クラブ</div>
                      <div className="text-sm font-black text-trust-navy">{club.category}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-400 md:hidden">モデル</div>
                      <div className="text-sm font-bold text-trust-navy">{club.model}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-400 md:hidden">ひとこと</div>
                      <div className="text-sm text-slate-600">{club.brand ? `${club.brand} の使用モデル` : '掲載モデルを確認済み'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  trackEvent('view_setting_detail', {
                    source_page: 'pros_library',
                    profile_slug: setting.slug,
                    profile_name: setting.name,
                  });
                  navigate(`/settings/pros/${setting.slug}`);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
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
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
              >
                自分のMy Bagを作る
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-cyan-100 bg-cyan-50 px-6 py-8 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black text-cyan-700">
              <Sparkles size={14} />
              次のステップ
            </div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">気になる構成を見つけたら、そのまま比較や診断へ進めます</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              一覧で終わらせず、個別ページから比較・診断・購入までつなげるのがこのサイトの使い方です。
            </p>
          </div>
          <button
            onClick={() => {
              trackEvent('start_ai_diagnosis', {
                source_page: 'pros_library',
              });
              navigate('/diagnosis');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-3 text-sm font-black text-white"
          >
            AI診断へ進む
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="inline-flex items-center gap-2 text-xs font-black text-slate-400">
            <ListChecks size={14} />
            この一覧の見方
          </div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">真似するより、考え方を参考にする</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            プロのセッティングは、そのまま再現するよりも「どういう並び方で構成しているか」を見るのが大切です。
            ドライバー、アイアン、ウェッジ、ボールの流れを意識すると、自分のバッグにも落とし込みやすくなります。
          </p>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="inline-flex items-center gap-2 text-xs font-black text-slate-400">
            <BadgeCheck size={14} />
            掲載方針
          </div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">確認済みの14本だけを公開します</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            ドライバーだけ分かっている途中データや、推定に近い情報は公開しません。
            14本の構成、使用ボール、参照元が確認できたプロフィールだけを掲載します。
          </p>
        </article>
      </section>
    </div>
  );
};
