import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';
import { profileCategories, type ProfileCategory } from '../lib/profileMetadata';
import { getProfileVisuals } from '../lib/profileVisuals';

const kanaGroups = [
  { id: 'all', label: 'すべて' },
  { id: 'a', label: 'あ' },
  { id: 'ka', label: 'か' },
  { id: 'sa', label: 'さ' },
  { id: 'ta', label: 'た' },
  { id: 'na', label: 'な' },
  { id: 'ha', label: 'は' },
  { id: 'ma', label: 'ま' },
  { id: 'ya', label: 'や' },
  { id: 'ra', label: 'ら' },
  { id: 'wa', label: 'わ' },
  { id: 'latin', label: 'A-Z' },
] as const;

const getKanaGroup = (name: string) => {
  const first = name.trim().charAt(0);
  if (!first) return 'all';
  if (/[A-Za-z]/.test(first)) return 'latin';
  if ('あいうえおぁぃぅぇぉ'.includes(first)) return 'a';
  if ('かがきぎくぐけげこご'.includes(first)) return 'ka';
  if ('さざしじすずせぜそぞ'.includes(first)) return 'sa';
  if ('ただちぢっつづてでとど'.includes(first)) return 'ta';
  if ('なにぬねの'.includes(first)) return 'na';
  if ('はばぱひびぴふぶぷへべぺほぼぽ'.includes(first)) return 'ha';
  if ('まみむめも'.includes(first)) return 'ma';
  if ('やゃゆゅよょ'.includes(first)) return 'ya';
  if ('らりるれろ'.includes(first)) return 'ra';
  if ('わをん'.includes(first)) return 'wa';
  return 'ka';
};

export const ProsSettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<PublicSettingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const activeCategory = (searchParams.get('category') as 'all' | ProfileCategory | null) || 'all';
  const activeKana = searchParams.get('kana') || 'all';

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
    return profiles
      .filter((profile) => {
        if (activeCategory !== 'all' && profile.category !== activeCategory) {
          return false;
        }
        if (activeKana !== 'all' && getKanaGroup(profile.kanaName || profile.name) !== activeKana) {
          return false;
        }
        if (!query) return true;

        const haystack = [profile.name, profile.kanaName || '', profile.categoryLabel, profile.contractDisplay]
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => (a.kanaName || a.name).localeCompare(b.kanaName || b.name, 'ja'));
  }, [activeCategory, activeKana, profiles, searchText]);

  const applyFilters = (next: { search?: string; category?: string; kana?: string }) => {
    setSearchParams(
      {
        ...(next.search ? { search: next.search } : {}),
        ...(next.category && next.category !== 'all' ? { category: next.category } : {}),
        ...(next.kana && next.kana !== 'all' ? { kana: next.kana } : {}),
      },
      { replace: true }
    );
  };

  return (
    <div className="min-h-screen space-y-8 pb-20">
      <section className="rounded-[2.5rem] border border-slate-200 bg-white px-6 py-10 shadow-sm md:px-10 md:py-14">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black tracking-tight text-trust-navy md:text-6xl">
            有名プロの
            <br />
            クラブセッティング一覧
          </h1>
          <p className="mt-4 text-sm font-bold text-slate-500">選手名・クラブ名・カテゴリから絞り込めます。</p>

          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 md:flex-1">
                <Search size={18} className="text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      applyFilters({ search: searchText.trim(), category: activeCategory, kana: activeKana });
                    }
                  }}
                  placeholder="選手名・クラブ名で検索"
                  className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => applyFilters({ search: searchText.trim(), category: activeCategory, kana: activeKana })}
                  className="rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  検索
                </button>
                <button
                  onClick={() => {
                    setSearchText('');
                    applyFilters({ category: activeCategory, kana: activeKana });
                  }}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                >
                  クリア
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {profileCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => applyFilters({ search: searchText.trim(), category: category.id, kana: activeKana })}
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

          <div className="mt-4 flex flex-wrap gap-3">
            {kanaGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => applyFilters({ search: searchText.trim(), category: activeCategory, kana: group.id })}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  activeKana === group.id
                    ? 'bg-golf-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-trust-navy inline-flex">
            該当プロフィール {filteredProfiles.length}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
            掲載プロフィールを読み込んでいます...
          </div>
        )}

        {!isLoading && profiles.length === 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-black text-trust-navy">公開準備中です。</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">公開プロフィールを読み込めませんでした。少し時間を置いて再読み込みしてください。</p>
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
              className="rounded-[2rem] border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-golf-300 hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <img
                    src={visuals.portrait}
                    alt={`${setting.name}のプレースホルダー画像`}
                    className="h-16 w-16 rounded-full border border-slate-200 bg-white object-cover p-2"
                  />
                  <div className="min-w-0">
                    <div className="text-lg font-black text-trust-navy">{setting.name}</div>
                    {setting.kanaName && <div className="mt-1 text-xs font-bold text-slate-500">{setting.kanaName}</div>}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">カテゴリ</div>
                    <div className="mt-1 text-sm font-black text-trust-navy">{setting.categoryLabel}</div>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">契約メーカー</div>
                    <div className="mt-1 text-sm font-black text-trust-navy">{setting.contractDisplay}</div>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-black tracking-[0.12em] text-slate-400">年齢</div>
                    <div className="mt-1 text-sm font-black text-trust-navy">{setting.age ?? '未公開'}</div>
                  </div>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-trust-navy">
                  詳細を見る
                  <ArrowRight size={16} />
                </div>
              </div>
            </button>
          );
        })}

        {!isLoading && filteredProfiles.length === 0 && profiles.length > 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            条件に合うプロフィールが見つかりませんでした。
          </div>
        )}
      </section>
    </div>
  );
};
