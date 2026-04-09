import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';
import { profileCategories, type ProfileCategory } from '../lib/profileMetadata';
import { getProfileVisuals } from '../lib/profileVisuals';

export const ProsSettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<PublicSettingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const activeCategory = (searchParams.get('category') as 'all' | ProfileCategory | null) || 'all';

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

  useEffect(() => {
    setSearchText(searchParams.get('search') || '');
  }, [searchParams]);

  const filteredProfiles = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return profiles.filter((profile) => {
      if (activeCategory !== 'all' && profile.category !== activeCategory) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        profile.name,
        profile.categoryLabel,
        profile.contractLabel,
        profile.tagline,
        profile.summary,
        profile.ball,
        ...profile.strengths,
        ...profile.clubs.map((club) => `${club.category} ${club.model}`),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [activeCategory, profiles, searchText]);

  const summary = useMemo(
    () => ({
      profileCount: filteredProfiles.length,
      ballCount: new Set(profiles.map((profile) => profile.ball).filter(Boolean)).size,
    }),
    [filteredProfiles, profiles]
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
            有名プロの現在の
            <br />
            クラブセッティングを探す。
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            確認できた14本だけを公開しています。選手名やクラブ名で検索して、気になる1人の詳細へすぐ入れます。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-trust-navy">
              該当プロフィール {summary.profileCount}
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-trust-navy">
              使用ボール {summary.ballCount}
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-trust-navy">
              推定値は非表示
            </div>
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 md:flex-1">
                <Search size={18} className="text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      setSearchParams(searchText.trim() ? { search: searchText.trim() } : {});
                    }
                  }}
                  placeholder="選手名・クラブ名で検索 例: 石川遼 / Qi35 LS"
                  className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setSearchParams(
                      {
                        ...(searchText.trim() ? { search: searchText.trim() } : {}),
                        ...(activeCategory !== 'all' ? { category: activeCategory } : {}),
                      },
                      { replace: true }
                    )
                  }
                  className="rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  検索する
                </button>
                <button
                  onClick={() => {
                    setSearchText('');
                    setSearchParams(activeCategory !== 'all' ? { category: activeCategory } : {}, { replace: true });
                  }}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                >
                  クリア
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {profileCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  const next = {
                    ...(searchText.trim() ? { search: searchText.trim() } : {}),
                    ...(category.id !== 'all' ? { category: category.id } : {}),
                  };
                  setSearchParams(next, { replace: true });
                }}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  activeCategory === category.id
                    ? 'bg-trust-navy text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {category.label}
              </button>
            ))}
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

        {filteredProfiles.map((setting) => {
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
                    {setting.categoryLabel}
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-black tracking-[0.12em] text-slate-500">
                      {setting.contractLabel}
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
                <div className="mb-5 flex items-center gap-4">
                  <img
                    src={visuals.portrait}
                    alt={`${setting.name}のプレースホルダー画像`}
                    className="h-16 w-16 rounded-full border border-slate-200 bg-white object-cover p-2"
                  />
                  <div>
                    <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">選手プロフィール</div>
                    <div className="mt-1 text-lg font-black text-trust-navy">{setting.name}</div>
                  </div>
                </div>
                <p className="text-sm leading-7 text-slate-600">{setting.summary}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                    <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">区分</div>
                    <div className="mt-2 text-sm font-black text-trust-navy">{setting.categoryLabel}</div>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                    <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">契約区分</div>
                    <div className="mt-2 text-sm font-black text-trust-navy">{setting.contractLabel}</div>
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
                  現在の14本を見る
                  <ArrowRight size={16} />
                </div>
              </div>
            </button>
          );
        })}

        {!isLoading && filteredProfiles.length === 0 && profiles.length > 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            条件に合うプロフィールが見つかりませんでした。選手名やクラブ名を変えて検索してください。
          </div>
        )}
      </section>
    </div>
  );
};
